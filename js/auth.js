/*
 * auth.js — Sesión y login
 * -------------------------------------------------
 * MODO DEMO: "entrás" eligiendo un usuario de prueba (alumno o profe).
 * MODO SUPABASE: login real con Google (OAuth).
 *
 * Expone:
 *   FGC.auth.currentUser()        → usuario actual o null
 *   FGC.auth.init(onChange)       → arranca la sesión y avisa cambios
 *   FGC.auth.loginGoogle()        → inicia login con Google (prod)
 *   FGC.auth.loginDemo(userId)    → entra como usuario demo
 *   FGC.auth.logout()
 */
window.FGC = window.FGC || {};

(function () {
  let user = null;
  let onChange = function () {};
  let sb = null; // cliente supabase (solo en prod)

  const DEMO_SESSION_KEY = "fgc_demo_session_v1";

  function isAdminEmail(email) {
    const list = (FGC.config.adminEmails || []).map((e) => e.toLowerCase());
    return email && list.includes(email.toLowerCase());
  }

  const auth = {
    currentUser() {
      return user;
    },

    async init(cb) {
      onChange = cb || onChange;

      if (FGC.isDemo) {
        // Retomamos la última sesión demo si existe.
        try {
          const saved = JSON.parse(localStorage.getItem(DEMO_SESSION_KEY));
          if (saved) user = saved;
        } catch (_) {}
        onChange(user);
        return;
      }

      // ---- Modo Supabase ----
      if (!window.supabase) {
        console.error("No se cargó la librería de Supabase.");
        onChange(null);
        return;
      }
      sb = window.supabase.createClient(FGC.config.supabaseUrl, FGC.config.supabaseAnonKey);
      FGC.store = FGC.makeSupabaseStore(sb);

      // Escucha cambios de sesión (login/logout, retorno de OAuth).
      sb.auth.onAuthStateChange(async (_event, session) => {
        user = await profileFromSession(session);
        onChange(user);
      });

      const { data } = await sb.auth.getSession();
      user = await profileFromSession(data.session);
      onChange(user);
    },

    async loginGoogle() {
      if (!sb) return;
      await sb.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + window.location.pathname },
      });
    },

    loginDemo(userId) {
      const u = FGC.demoUsers.find((x) => x.id === userId);
      if (!u) return;
      user = { ...u };
      try {
        localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user));
      } catch (_) {}
      onChange(user);
    },

    async logout() {
      if (FGC.isDemo) {
        user = null;
        try {
          localStorage.removeItem(DEMO_SESSION_KEY);
        } catch (_) {}
        onChange(user);
        return;
      }
      if (sb) await sb.auth.signOut();
      user = null;
      onChange(user);
    },
  };

  // Convierte la sesión de Supabase en el objeto de usuario que usa la app,
  // asegurando que exista su fila en "profiles" y aplicando admin por email.
  async function profileFromSession(session) {
    if (!session || !session.user) return null;
    const su = session.user;
    const email = su.email;
    const name = su.user_metadata?.full_name || su.user_metadata?.name || email;

    // Trae o crea el perfil.
    let { data: profile } = await sb.from("profiles").select("*").eq("id", su.id).maybeSingle();
    if (!profile) {
      const role = isAdminEmail(email) ? "admin" : "user";
      const insert = { id: su.id, email, full_name: name, role, level: "principiante" };
      const { data } = await sb.from("profiles").insert(insert).select().maybeSingle();
      profile = data || insert;
    } else if (isAdminEmail(email) && profile.role !== "admin") {
      // El profe siempre es admin aunque su fila diga otra cosa.
      await sb.from("profiles").update({ role: "admin" }).eq("id", su.id);
      profile.role = "admin";
    }

    return {
      id: su.id,
      name: profile.full_name || name,
      email,
      role: profile.role,
      level: profile.level || "principiante",
    };
  }

  FGC.auth = auth;
})();
