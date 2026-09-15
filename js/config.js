/*
 * config.js — Configuración de la app
 * -------------------------------------------------
 * Si supabaseUrl / supabaseAnonKey están vacíos → la app corre en MODO DEMO.
 * Con valores → login real con email + contraseña (producción).
 *
 * ⚠️ La "anon key" de Supabase es pública por diseño (va en el navegador).
 *    La seguridad real la dan las políticas RLS de la base (carpeta supabase/).
 *    NUNCA pongas acá la "service_role key": esa es secreta.
 */
window.FGC = window.FGC || {};

FGC.config = Object.assign(
  {
    // Proyecto de Supabase (Settings → API):
    supabaseUrl: "https://qbfkzuqqxpjwlfwdjahi.supabase.co",
    supabaseAnonKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZmt6dXFxeHBqd2xmd2RqYWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0NzY4NDEsImV4cCI6MjEwNTA1Mjg0MX0.vMbzopjANNurgNr9RSBjf4Bli1_O1ACbuj4vr-PWq-I",
  },
  window.FGC_CONFIG || {}
);

// Está en modo demo si no configuraste Supabase.
FGC.isDemo = !(FGC.config.supabaseUrl && FGC.config.supabaseAnonKey);
