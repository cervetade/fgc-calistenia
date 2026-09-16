/*
 * seed.js — Datos iniciales de FGC Calistenia
 * -------------------------------------------------
 * Acá viven los datos de ejemplo (ejercicios, pizarrón del día y un plan
 * avanzado real, basado en la planificación de Cerve). Se usan en:
 *   - MODO DEMO: la app los muestra directamente, sin base de datos.
 *   - Referencia para cargar la base de datos real (ver supabase/seed.sql).
 *
 * Todo se cuelga de window.FGC para no depender de módulos ES
 * (así la app también funciona abriendo el archivo con doble clic).
 */
window.FGC = window.FGC || {};

/* =========================================================
 * BIBLIOTECA DE EJERCICIOS
 * Cada ejercicio se reutiliza en varias rutinas.
 * video: por ahora null → la app muestra "video próximamente".
 *        Cuando el profe grabe, se pega el ID o link de YouTube.
 * ========================================================= */
FGC.exercises = [
  { id: "push-ups",        name: "Push ups",                  muscle: "Empuje",   video: null },
  { id: "chin-ups",        name: "Chin ups",                  muscle: "Tracción", video: null },
  { id: "pull-ups",        name: "Pull ups",                  muscle: "Tracción", video: null },
  { id: "fondos",          name: "Fondos en paralelas",       muscle: "Empuje",   video: null },
  { id: "bar-dips",        name: "Bar dips",                  muscle: "Empuje",   video: null },
  { id: "ext-triceps",     name: "Extensiones de tríceps",    muscle: "Empuje",   video: null },
  { id: "muscle-up",       name: "Muscle up",                 muscle: "Tracción", video: null },
  { id: "australianas",    name: "Australianas",              muscle: "Tracción", video: null },
  { id: "pike-push-up",    name: "Pike push up",              muscle: "Hombro",   video: null },
  { id: "pseudo-push-up",  name: "Pseudo push up",            muscle: "Empuje",   video: null },
  { id: "hspu",            name: "Handstand push up",         muscle: "Hombro",   video: null },
  { id: "vertical",        name: "Vertical (handstand)",      muscle: "Estático", video: null },
  { id: "l-sit",           name: "L-sit",                     muscle: "Core",     video: null },
  { id: "tuck-planche",    name: "Tuck planche",              muscle: "Estático", video: null },
  { id: "back-lever",      name: "Back lever",                muscle: "Estático", video: null },
  { id: "front-lever",     name: "Front lever",               muscle: "Estático", video: null },
  { id: "dragon-flag",     name: "Dragon flag",               muscle: "Core",     video: null },
  { id: "abdominales",     name: "Abdominales",               muscle: "Core",     video: null },
  { id: "superman",        name: "Superman",                  muscle: "Espalda",  video: null },
  { id: "canoa",           name: "Canoa",                     muscle: "Espalda",  video: null },
  { id: "bicycle-abs",     name: "Bicycle abs",               muscle: "Core",     video: null },
  { id: "lev-pierna",      name: "Levantamiento de piernas",  muscle: "Core",     video: null },
  { id: "plancha-lateral", name: "Plancha lateral",           muscle: "Core",     video: null },
  { id: "mountain-climber",name: "Mountain climber",          muscle: "Core",     video: null },
  { id: "sentadilla",      name: "Sentadillas",               muscle: "Pierna",   video: null },
  { id: "pistol",          name: "Pistol squat",              muscle: "Pierna",   video: null },
  { id: "shrimp",          name: "Shrimp squat",              muscle: "Pierna",   video: null },
  { id: "estocada",        name: "Estocadas",                 muscle: "Pierna",   video: null },
  { id: "nordica",         name: "Caída nórdica",             muscle: "Pierna",   video: null },
  { id: "pantorrilla",     name: "Pantorrilla",               muscle: "Pierna",   video: null },
];

/* =========================================================
 * RUTINAS
 * kind: "board"  → pizarrón del día (para principiantes, única para todos)
 * kind: "plan"   → planificación avanzada (se asigna a un usuario)
 *
 * Estructura del contenido (content):
 *   board → { focus, blocks: [ { name, scheme, note, items:[ item ] } ] }
 *   plan  → { subtitle, objetivos:[], days:[ { title, blocks:[ ... ] } ] }
 *
 * item = { scheme?, rest?, note?, exercises: [ { ex, prescription } ] }
 *   - varios "exercises" en un item = superserie (se muestran unidos con +)
 *   - ex = id de la biblioteca (para linkear el video)
 * ========================================================= */
FGC.routines = [
  /* ---------- PIZARRÓN DEL DÍA (principiantes) ---------- */
  {
    id: "board-demo",
    kind: "board",
    title: "Pizarrón — Tren superior",
    content: {
      focus: "Tren superior",
      blocks: [
        {
          name: "Zona media",
          scheme: "×3",
          note: "Circuito, con el mínimo descanso posible.",
          items: [
            { exercises: [{ ex: "abdominales", prescription: "20" }] },
            { exercises: [{ ex: "superman",    prescription: "20" }] },
            { exercises: [{ ex: "canoa",       prescription: "30”" }] },
          ],
        },
        {
          name: "Rutina principal (5 ejercicios)",
          scheme: "×3",
          note: "Descanso 1–1:30 min entre rondas.",
          items: [
            { exercises: [{ ex: "push-ups", prescription: "10-12" }, { ex: "chin-ups",    prescription: "20" }] },
            { exercises: [{ ex: "fondos",   prescription: "8-10" },  { ex: "ext-triceps", prescription: "12" }] },
            { exercises: [{ ex: "pike-push-up", prescription: "8-12" }, { ex: "australianas", prescription: "15" }] },
            { exercises: [{ ex: "pseudo-push-up", prescription: "10" }, { ex: "pull-ups", prescription: "6-8" }] },
            { exercises: [{ ex: "l-sit", prescription: "15”" }, { ex: "bicycle-abs", prescription: "30”" }] },
          ],
        },
        {
          name: "Complemento (tren inferior)",
          scheme: "×3",
          note: "Trabajo opuesto al día. Descanso corto.",
          items: [
            { exercises: [{ ex: "sentadilla", prescription: "20" }] },
            { exercises: [{ ex: "estocada",   prescription: "12 x pierna" }] },
            { exercises: [{ ex: "pantorrilla", prescription: "20" }] },
          ],
        },
      ],
    },
  },

  {
    id: "board-piernas",
    kind: "board",
    title: "Pizarrón — Tren inferior",
    content: {
      focus: "Tren inferior (piernas)",
      blocks: [
        {
          name: "Zona media",
          scheme: "×3",
          note: "Circuito, con el mínimo descanso posible.",
          items: [
            { exercises: [{ ex: "abdominales", prescription: "20" }] },
            { exercises: [{ ex: "lev-pierna",  prescription: "15" }] },
            { exercises: [{ ex: "plancha-lateral", prescription: "30” x lado" }] },
          ],
        },
        {
          name: "Rutina principal (5 ejercicios)",
          scheme: "×3",
          note: "Descanso 1–1:30 min entre rondas.",
          items: [
            { exercises: [{ ex: "sentadilla", prescription: "15-20" }, { ex: "pantorrilla", prescription: "20" }] },
            { exercises: [{ ex: "estocada", prescription: "12 x pierna" }, { ex: "mountain-climber", prescription: "40”" }] },
            { exercises: [{ ex: "shrimp", prescription: "6-8 x pierna (asistida)" }, { ex: "sentadilla", prescription: "30” isométrico" }] },
            { exercises: [{ ex: "pistol", prescription: "5 x pierna (asistida)" }, { ex: "nordica", prescription: "5-8" }] },
            { exercises: [{ ex: "estocada", prescription: "12 con salto x pierna" }, { ex: "plancha-lateral", prescription: "20”" }] },
          ],
        },
        {
          name: "Complemento (tren superior)",
          scheme: "×3",
          note: "Trabajo opuesto al día. Descanso corto.",
          items: [
            { exercises: [{ ex: "push-ups",     prescription: "12" }] },
            { exercises: [{ ex: "australianas", prescription: "12" }] },
            { exercises: [{ ex: "fondos",       prescription: "8-10" }] },
          ],
        },
      ],
    },
  },

  {
    id: "board-full",
    kind: "board",
    title: "Pizarrón — Cuerpo completo",
    content: {
      focus: "Cuerpo completo (full body)",
      blocks: [
        {
          name: "Zona media",
          scheme: "×3",
          note: "Circuito, con el mínimo descanso posible.",
          items: [
            { exercises: [{ ex: "bicycle-abs", prescription: "30”" }] },
            { exercises: [{ ex: "superman",    prescription: "20" }] },
            { exercises: [{ ex: "canoa",       prescription: "30”" }] },
          ],
        },
        {
          name: "Rutina principal (5 ejercicios)",
          scheme: "×3",
          note: "Descanso 1–1:30 min entre rondas.",
          items: [
            { exercises: [{ ex: "push-ups", prescription: "10-12" }, { ex: "sentadilla", prescription: "20" }] },
            { exercises: [{ ex: "australianas", prescription: "12-15" }, { ex: "estocada", prescription: "12 x pierna" }] },
            { exercises: [{ ex: "pike-push-up", prescription: "8-10" }, { ex: "lev-pierna", prescription: "12" }] },
            { exercises: [{ ex: "chin-ups", prescription: "6-8" }, { ex: "fondos", prescription: "8-10" }] },
            { exercises: [{ ex: "mountain-climber", prescription: "40”" }, { ex: "plancha-lateral", prescription: "20” x lado" }] },
          ],
        },
        {
          name: "Complemento (movilidad y core)",
          scheme: "×3",
          note: "Descanso corto.",
          items: [
            { exercises: [{ ex: "pantorrilla", prescription: "20" }] },
            { exercises: [{ ex: "abdominales", prescription: "20" }] },
            { exercises: [{ ex: "superman",    prescription: "15" }] },
          ],
        },
      ],
    },
  },

  {
    id: "board-empuje",
    kind: "board",
    title: "Pizarrón — Empuje (push)",
    content: {
      focus: "Empuje (pecho, hombro, tríceps)",
      blocks: [
        {
          name: "Zona media",
          scheme: "×3",
          note: "Circuito, con el mínimo descanso posible.",
          items: [
            { exercises: [{ ex: "abdominales", prescription: "20" }] },
            { exercises: [{ ex: "l-sit",       prescription: "15”" }] },
            { exercises: [{ ex: "plancha-lateral", prescription: "30” x lado" }] },
          ],
        },
        {
          name: "Rutina principal (5 ejercicios)",
          scheme: "×3",
          note: "Descanso 1–1:30 min entre rondas.",
          items: [
            { exercises: [{ ex: "push-ups", prescription: "10-15" }, { ex: "fondos", prescription: "8-10" }] },
            { exercises: [{ ex: "pike-push-up", prescription: "8-12" }, { ex: "ext-triceps", prescription: "12" }] },
            { exercises: [{ ex: "pseudo-push-up", prescription: "10" }, { ex: "bar-dips", prescription: "8-10" }] },
            { exercises: [{ ex: "push-ups", prescription: "máx (diamante)" }, { ex: "mountain-climber", prescription: "40”" }] },
            { exercises: [{ ex: "pike-push-up", prescription: "8” en pared (progresión HSPU)" }, { ex: "abdominales", prescription: "20" }] },
          ],
        },
        {
          name: "Complemento (tracción y pierna)",
          scheme: "×3",
          note: "Trabajo opuesto al día. Descanso corto.",
          items: [
            { exercises: [{ ex: "australianas", prescription: "15" }] },
            { exercises: [{ ex: "sentadilla",   prescription: "20" }] },
            { exercises: [{ ex: "pantorrilla",  prescription: "20" }] },
          ],
        },
      ],
    },
  },

  {
    id: "board-traccion",
    kind: "board",
    title: "Pizarrón — Tracción (espalda y bíceps)",
    content: {
      focus: "Tracción (espalda, dorsal, bíceps)",
      blocks: [
        {
          name: "Zona media",
          scheme: "×3",
          note: "Circuito, con el mínimo descanso posible.",
          items: [
            { exercises: [{ ex: "superman",   prescription: "20" }] },
            { exercises: [{ ex: "canoa",      prescription: "30”" }] },
            { exercises: [{ ex: "lev-pierna", prescription: "12" }] },
          ],
        },
        {
          name: "Rutina principal (5 ejercicios)",
          scheme: "×3",
          note: "Descanso 1–1:30 min entre rondas.",
          items: [
            { exercises: [{ ex: "chin-ups", prescription: "6-8" }, { ex: "australianas", prescription: "12-15" }] },
            { exercises: [{ ex: "pull-ups", prescription: "5-8" }, { ex: "superman", prescription: "20" }] },
            { exercises: [{ ex: "australianas", prescription: "máx (supinado)" }, { ex: "canoa", prescription: "30”" }] },
            { exercises: [{ ex: "chin-ups", prescription: "negativas 5 x 5”" }, { ex: "lev-pierna", prescription: "10" }] },
            { exercises: [{ ex: "pull-ups", prescription: "máx" }, { ex: "plancha-lateral", prescription: "20”" }] },
          ],
        },
        {
          name: "Complemento (empuje y pierna)",
          scheme: "×3",
          note: "Trabajo opuesto al día. Descanso corto.",
          items: [
            { exercises: [{ ex: "push-ups",   prescription: "12" }] },
            { exercises: [{ ex: "sentadilla", prescription: "20" }] },
            { exercises: [{ ex: "fondos",     prescription: "8" }] },
          ],
        },
      ],
    },
  },

  /* ---------- PLAN AVANZADO (basado en el programa de Cerve) ---------- */
  {
    id: "plan-cerve-3dias",
    kind: "plan",
    title: "Programa 3 días — Vertical / Piernas / Espalda",
    content: {
      subtitle: "Semanas 1 a 5 · se repite cada semana (sobrecarga progresiva)",
      objetivos: [
        "Lograr una vertical sólida y aumentar fuerza",
        "Ganar resistencia y acondicionamiento en los básicos",
        "Iniciar en back lever",
        "Fortalecer piernas y ganar músculo",
      ],
      days: [
        {
          title: "Día 1 — Vertical y tren superior",
          blocks: [
            {
              name: "Entrada en calor",
              note: "Movimientos articulares + circuito de abdomen. 2 sets, sin descansar más de 1 min.",
              items: [
                { exercises: [{ ex: "push-ups",   prescription: "5 con aplauso" }] },
                { exercises: [{ ex: "lev-pierna", prescription: "10 en barra" }] },
                { exercises: [{ ex: "lev-pierna", prescription: "10 en suelo" }] },
                { exercises: [{ ex: "bicycle-abs",prescription: "30”" }] },
                { exercises: [{ ex: "back-lever", prescription: "Máx (tuck)" }] },
              ],
            },
            {
              name: "Entrenamiento principal",
              items: [
                { scheme: "×3", rest: "1–1:30 min", exercises: [{ ex: "tuck-planche", prescription: "5”" }, { ex: "l-sit", prescription: "5”" }, { ex: "vertical", prescription: "15”" }] },
                { scheme: "×3", rest: "1–1:30 min", exercises: [{ ex: "muscle-up", prescription: "4-7" }, { ex: "bar-dips", prescription: "10" }, { ex: "l-sit", prescription: "12-20” en paralelas" }] },
                { scheme: "×3", rest: "1–1:30 min", exercises: [{ ex: "pike-push-up", prescription: "7-14 elevadas" }, { ex: "mountain-climber", prescription: "40”" }] },
                { scheme: "×3", rest: "1–1:30 min", exercises: [{ ex: "fondos", prescription: "6-16 (+12 kg)" }, { ex: "ext-triceps", prescription: "6-12 en plancha" }] },
                { scheme: "×3", rest: "1–1:30 min", exercises: [{ ex: "australianas", prescription: "12-20 elevadas" }, { ex: "dragon-flag", prescription: "10” hold a 45°" }] },
              ],
            },
          ],
        },
        {
          title: "Día 2 — Full piernas",
          blocks: [
            {
              name: "Entrada en calor",
              note: "Movimientos articulares + circuito de abdomen. 3 sets, sin descansar más de 1 min.",
              items: [
                { exercises: [{ ex: "sentadilla", prescription: "12 bisagras" }] },
                { exercises: [{ ex: "plancha-lateral", prescription: "12 x lado + 12” hold" }] },
                { exercises: [{ ex: "mountain-climber", prescription: "30" }] },
              ],
            },
            {
              name: "Entrenamiento principal",
              note: "3–4 sets con descanso de 2–3 min por ronda.",
              items: [
                { exercises: [{ ex: "pistol", prescription: "8-12 x pierna" }] },
                { exercises: [{ ex: "sentadilla", prescription: "6-12 ext. cuádriceps + 35” isométrico" }] },
                { exercises: [{ ex: "shrimp", prescription: "8-12 x pierna" }, { ex: "estocada", prescription: "10 c/ salto x pierna" }] },
                { exercises: [{ ex: "estocada", prescription: "20 pasos con carga" }] },
                { exercises: [{ ex: "nordica", prescription: "5-10" }] },
                { exercises: [{ ex: "pantorrilla", prescription: "30-30-30" }] },
              ],
            },
          ],
        },
        {
          title: "Día 3 — Tren superior, espalda y bíceps",
          blocks: [
            {
              name: "Entrada en calor",
              note: "Movimientos articulares + circuito de abdomen. 2 sets, sin descansar más de 1 min.",
              items: [
                { exercises: [{ ex: "plancha-lateral", prescription: "12 brazo extendido" }] },
                { exercises: [{ ex: "canoa", prescription: "30”" }] },
                { exercises: [{ ex: "back-lever", prescription: "Máx (tuck)" }] },
              ],
            },
            {
              name: "Entrenamiento principal",
              items: [
                { scheme: "×3", rest: "1–1:30 min", exercises: [{ ex: "vertical", prescription: "Máx" }, { ex: "l-sit", prescription: "3”" }, { ex: "pseudo-push-up", prescription: "8-15" }] },
                { scheme: "×3", rest: "1–1:30 min", exercises: [{ ex: "pull-ups", prescription: "6-8 (+6 kg)" }, { ex: "back-lever", prescription: "5” hold" }] },
                { scheme: "×3", rest: "1–1:30 min", exercises: [{ ex: "push-ups", prescription: "12-20 espartanas" }] },
                { scheme: "×3", rest: "1–1:30 min", exercises: [{ ex: "l-sit", prescription: "4-6 pull up en tuck" }] },
                { scheme: "×3", rest: "1–1:30 min", exercises: [{ ex: "fondos", prescription: "8-16" }, { ex: "front-lever", prescription: "5 raises + 10” tuck" }] },
              ],
            },
          ],
        },
      ],
    },
  },
];

/* =========================================================
 * USUARIOS DEMO
 * En modo demo podés entrar como alumno o como profe (admin).
 * En producción esto se reemplaza por login con Google (Supabase).
 * ========================================================= */
FGC.demoUsers = [
  { id: "u-tadeo",   name: "Tadeo",   email: "tadeo@demo.fgc",   role: "user",  level: "principiante" },
  { id: "u-cerve",   name: "Cerve",   email: "cerve@demo.fgc",   role: "user",  level: "avanzado" },
  { id: "u-joaquin", name: "Joaquín (profe)", email: "joaquin@demo.fgc", role: "admin", level: "avanzado" },
];

/* Estado inicial: qué pizarrón se muestra hoy y qué plan tiene cada quien. */
FGC.demoState = {
  boardToday: "board-demo",        // pizarrón que ven todos hoy
  assignments: { "u-cerve": "plan-cerve-3dias" }, // planes asignados por usuario
};
