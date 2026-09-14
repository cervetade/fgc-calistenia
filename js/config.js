/*
 * config.js — Configuración de la app
 * -------------------------------------------------
 * Para PRODUCCIÓN, completá estos valores con los de tu proyecto de Supabase.
 * Si los dejás vacíos, la app arranca en MODO DEMO (sin base de datos).
 *
 * ⚠️ La "anon key" de Supabase es pública por diseño (va en el navegador).
 *    La seguridad real la dan las políticas RLS de la base (ver supabase/).
 *    NUNCA pongas acá la "service_role key": esa es secreta.
 *
 * Recomendado: en vez de tocar este archivo, definí window.FGC_CONFIG en un
 * archivo aparte no versionado (config.local.js) — ver README.
 */
window.FGC = window.FGC || {};

FGC.config = Object.assign(
  {
    // Pegá acá la URL y anon key de Supabase (Settings → API):
    supabaseUrl: "",
    supabaseAnonKey: "",
    // Emails de Google que entran como ADMIN (el profe). Ej: ["joaquin@gmail.com"]
    adminEmails: [],
  },
  window.FGC_CONFIG || {}
);

// Está en modo demo si no configuraste Supabase.
FGC.isDemo = !(FGC.config.supabaseUrl && FGC.config.supabaseAnonKey);
