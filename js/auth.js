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
 *   FGC.auth.sendPasswordReset(email)         → { error }   (manda el mail)
 *   FGC.auth.updatePassword(password)         → { error }   (pone la nueva)
 *   FGC.auth.isRecovering()                   → bool        (volvió del mail)
 *   FGC.auth.loginDemo(userId)
 *   FGC.auth.logout()
 */
window.FGC = window.FGC || {};

(function () {
  let user = null;
  let onChange = function () {};
  let sb = null; // cliente supabase (solo en prod)
  let recovering = false; // true cuando el usuario vuelve del mail de recuperación

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
      // Red de seguridad: si el arranque se cuelga (red lenta, Supabase caído),
      // no dejamos la app en "Cargando…" para siempre. A los 7 segundos mostramos
      // el login igual, así el usuario al menos puede intentar entrar.
      const watchdog = setTimeout(() => {
        console.warn("Arranque lento: muestro el login por las dudas.");
        onChange(user); // user sigue null → login
      }, 7000);

      try {
        sb = window.supabase.createClient(FGC.config.supabaseUrl, FGC.config.supabaseAnonKey);
        FGC.store = FGC.makeSupabaseStore(sb);

        sb.auth.onAuthStateChange(async (event, session) => {
          // Al volver del mail de recuperación, Supabase deja una sesión temporal
          // y dispara este evento. Marcamos el modo "recuperación" para mostrar
          // la pantalla de contraseña nueva en vez de entrar directo a la app.
          if (event === "PASSWORD_RECOVERY") recovering = true;

          // Eventos de fondo (renovación de token, actualización de usuario) NO
          // deben re-renderizar la app: si no, te sacan de la pantalla en la que
          // estás (p. ej. el editor) cada vez que Supabase renueva la sesión.
          if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") return;

          // Si ya tenemos cargado a este mismo usuario, no rehacemos nada
          // (evita re-renders innecesarios y que se "pierda" la pantalla).
          const nextId = session && session.user ? session.user.id : null;
          const curId = user ? user.id : null;
          if (nextId && nextId === curId && !recovering) return;

          user = await profileFromSession(session);
          onChange(user);
        });

        const { data } = await sb.auth.getSession();
        user = await profileFromSession(data.session);
        onChange(user);
      } catch (e) {
        console.error("Error al iniciar Supabase:", e);
        onChange(null); // fallback: mostramos el login
      } finally {
        clearTimeout(watchdog);
      }
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

    // Manda el mail con el link para restablecer la contraseña.
    // El link vuelve a esta misma página (hay que autorizar la URL en Supabase,
    // en Authentication → URL Configuration → Redirect URLs).
    async sendPasswordReset(email) {
      if (!sb) return { error: "La app no está conectada a Supabase." };
      const { error } = await sb.auth.resetPasswordForEmail((email || "").trim(), {
        redirectTo: window.location.origin + window.location.pathname,
      });
      return { error: error ? traducir(error) : null };
    },

    // Guarda la contraseña nueva (solo funciona con la sesión de recuperación).
    async updatePassword(password) {
      if (!sb) return { error: "La app no está conectada a Supabase." };
      const { error } = await sb.auth.updateUser({ password: password || "" });
      if (error) return { error: traducir(error) };
      recovering = false; // listo: ya puede seguir usando la app normalmente
      return { error: null };
    },

    isRecovering() {
      return recovering;
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
      recovering = false;
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

  // Corta una promesa si tarda demasiado (así una consulta lenta no cuelga la app).
  function conTimeout(promesa, ms) {
    return Promise.race([
      promesa,
      new Promise((resolve) => setTimeout(() => resolve({ data: null, timedOut: true }), ms)),
    ]);
  }

  // Arma el objeto de usuario a partir de la sesión, leyendo su perfil.
  // El perfil lo crea automáticamente la base (trigger) al registrarse.
  async function profileFromSession(session) {
    if (!session || !session.user) return null;
    const su = session.user;
    let profile = null;
    try {
      const res = await conTimeout(
        sb.from("profiles").select("*").eq("id", su.id).maybeSingle(),
        5000
      );
      if (res.timedOut) console.warn("La consulta del perfil tardó demasiado; uso respaldo.");
      profile = res.data;
    } catch (e) {
      console.error("No se pudo leer el perfil; uso respaldo.", e);
    }
    if (!profile) {
      // Si la consulta falló o tardó pero YA conocíamos a este usuario,
      // mantenemos su rol y datos (así un admin no se "degrada" a alumno por un
      // error puntual). Si es la primera vez, se trata como alumno.
      const prev = user && user.id === su.id ? user : null;
      profile = {
        full_name: (prev && prev.name) || su.user_metadata?.full_name || su.email,
        role: (prev && prev.role) || "user",
        level: (prev && prev.level) || "principiante",
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
    if (m.includes("for security purposes") || m.includes("rate limit"))
      return "Esperá unos segundos antes de volver a intentar.";
    if (m.includes("should be different") || m.includes("different from the old"))
      return "La contraseña nueva tiene que ser distinta a la anterior.";
    if (m.includes("session") && m.includes("missing"))
      return "El link venció o ya se usó. Pedí uno nuevo desde “Olvidé mi contraseña”.";
    return error && error.message ? error.message : "Ocurrió un error. Probá de nuevo.";
  }

  FGC.auth = auth;
})();
