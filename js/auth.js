/*
 * auth.js — Sesión y login
 * -------------------------------------------------
 * MODO DEMO: "entrás" eligiendo un usuario de prueba (alumno o profe).
 * MODO SUPABASE: login real con email + contraseña.
 *
 * El ROL (alumno/admin) lo decide la base de datos (trigger handle_new_user),
 * nunca el navegador. Así un alumno no puede hacerse admin solo.
 *
 * Expone:
 *   FGC.auth.currentUser()
 *   FGC.auth.init(onChange)
 *   FGC.auth.loginEmail(email, password)      → { error }
 *   FGC.auth.signupEmail(name, email, pass)   → { error, needsConfirm }
 *   FGC.auth.loginDemo(userId)
 *   FGC.auth.logout()
 */
window.FGC = window.FGC || {};

(function () {
  let user = null;
  let onChange = function () {};
  let sb = null; // cliente supabase (solo en prod)

  const DEMO_SESSION_KEY = "fgc_demo_session_v1";

  const auth = {
    currentUser() {
      return user;
    },

    async init(cb) {
      onChange = cb || onChange;

      if (FGC.isDemo) {
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

      sb.auth.onAuthStateChange(async (_event, session) => {
        user = await profileFromSession(session);
        onChange(user);
      });

      const { data } = await sb.auth.getSession();
      user = await profileFromSession(data.session);
      onChange(user);
    },

    async loginEmail(email, password) {
      if (!sb) return { error: "La app no está conectada a Supabase." };
      const { error } = await sb.auth.signInWithPassword({
        email: (email || "").trim(),
        password: password || "",
      });
      return { error: error ? traducir(error) : null };
    },

    async signupEmail(name, email, password) {
      if (!sb) return { error: "La app no está conectada a Supabase." };
      const { data, error } = await sb.auth.signUp({
        email: (email || "").trim(),
        password: password || "",
        options: { data: { full_name: (name || "").trim() } },
      });
      if (error) return { error: traducir(error) };
      // Si la confirmación por email está desactivada, ya viene la sesión.
      // Si no, no hay sesión hasta confirmar el correo.
      return { error: null, needsConfirm: !data.session };
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

  // Arma el objeto de usuario a partir de la sesión, leyendo su perfil.
  // El perfil lo crea automáticamente la base (trigger) al registrarse.
  async function profileFromSession(session) {
    if (!session || !session.user) return null;
    const su = session.user;
    let { data: profile } = await sb.from("profiles").select("*").eq("id", su.id).maybeSingle();
    if (!profile) {
      // Respaldo por si el perfil aún no está: se trata como alumno.
      profile = {
        full_name: su.user_metadata?.full_name || su.email,
        role: "user",
        level: "principiante",
      };
    }
    return {
      id: su.id,
      name: profile.full_name || su.email,
      email: su.email,
      role: profile.role || "user",
      level: profile.level || "principiante",
    };
  }

  // Pasa los mensajes de error de Supabase a español claro.
  function traducir(error) {
    const m = (error && error.message ? error.message : String(error)).toLowerCase();
    if (m.includes("invalid login")) return "Email o contraseña incorrectos.";
    if (m.includes("already registered") || m.includes("already been registered"))
      return "Ese email ya tiene una cuenta. Probá iniciar sesión.";
    if (m.includes("at least 6")) return "La contraseña debe tener al menos 6 caracteres.";
    if (m.includes("valid email")) return "Ingresá un email válido.";
    if (m.includes("email not confirmed")) return "Falta confirmar tu email. Revisá tu correo.";
    return error && error.message ? error.message : "Ocurrió un error. Probá de nuevo.";
  }

  FGC.auth = auth;
})();
