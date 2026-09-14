/*
 * config.local.example.js
 * -------------------------------------------------
 * Copiá este archivo como "config.local.js" y completá tus datos para pasar
 * a PRODUCCIÓN (login con Google + base de datos).
 *
 *   cp config.local.example.js config.local.js
 *
 * config.local.js NO se sube al repo (está en .gitignore).
 * Si no lo creás, la app funciona igual en MODO DEMO.
 */
window.FGC_CONFIG = {
  // Supabase → Settings → API
  supabaseUrl: "https://TU-PROYECTO.supabase.co",
  supabaseAnonKey: "TU_ANON_KEY_PUBLICA",

  // Email(s) de Google que entran como ADMIN (el profe).
  adminEmails: ["joaquin@gmail.com"],
};
