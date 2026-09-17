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
 *   category: patrón de movimiento (una de FGC.exerciseCategories).
 *   level:    Principiante | Intermedio | Avanzado.
 *   muscle:   músculo principal (detalle, se muestra en "cómo se hace").
 *   video:    null → "video próximamente"; si no, link/ID de YouTube.
 * ========================================================= */

// Categorías (orden en que se agrupan) y niveles.
FGC.exerciseCategories = ["Empuje", "Tracción", "Core", "Piernas", "Estáticos / Skills", "Cardio / Movilidad"];
FGC.exerciseLevels = ["Principiante", "Intermedio", "Avanzado"];

FGC.exercises = [
  // ---------- Empuje ----------
  { id: "flex-pared",      name: "Flexiones en pared",        category: "Empuje", level: "Principiante", muscle: "Pecho",    video: null },
  { id: "flex-inclinada",  name: "Flexiones inclinadas",      category: "Empuje", level: "Principiante", muscle: "Pecho",    video: null },
  { id: "flex-rodillas",   name: "Flexiones de rodillas",     category: "Empuje", level: "Principiante", muscle: "Pecho",    video: null },
  { id: "push-ups",        name: "Push ups",                  category: "Empuje", level: "Principiante", muscle: "Pecho",    video: null },
  { id: "fondos-banco",    name: "Fondos en banco",           category: "Empuje", level: "Principiante", muscle: "Tríceps",  video: null },
  { id: "pseudo-push-up",  name: "Pseudo push up",            category: "Empuje", level: "Intermedio",   muscle: "Hombro",   video: null },
  { id: "fondos",          name: "Fondos en paralelas",       category: "Empuje", level: "Intermedio",   muscle: "Pecho",    video: null },
  { id: "bar-dips",        name: "Bar dips",                  category: "Empuje", level: "Intermedio",   muscle: "Pecho",    video: null },
  { id: "ext-triceps",     name: "Extensiones de tríceps",    category: "Empuje", level: "Intermedio",   muscle: "Tríceps",  video: null },
  { id: "flex-diamante",   name: "Flexiones diamante",        category: "Empuje", level: "Intermedio",   muscle: "Tríceps",  video: null },
  { id: "flex-arquera",    name: "Flexiones arqueras",        category: "Empuje", level: "Intermedio",   muscle: "Pecho",    video: null },
  { id: "pike-push-up",    name: "Pike push up",              category: "Empuje", level: "Intermedio",   muscle: "Hombro",   video: null },
  { id: "flex-declinada",  name: "Flexiones declinadas",      category: "Empuje", level: "Intermedio",   muscle: "Pecho",    video: null },
  { id: "hspu",            name: "Handstand push up",         category: "Empuje", level: "Avanzado",     muscle: "Hombro",   video: null },
  { id: "hspu-profundas",  name: "HSPU profundas",            category: "Empuje", level: "Avanzado",     muscle: "Hombro",   video: null },
  { id: "flex-una-mano",   name: "Flexiones a una mano",      category: "Empuje", level: "Avanzado",     muscle: "Pecho",    video: null },

  // ---------- Tracción ----------
  { id: "australianas",    name: "Australianas",              category: "Tracción", level: "Principiante", muscle: "Espalda", video: null },
  { id: "dom-negativas",   name: "Dominadas negativas",       category: "Tracción", level: "Principiante", muscle: "Espalda", video: null },
  { id: "dom-asistidas",   name: "Dominadas asistidas",       category: "Tracción", level: "Principiante", muscle: "Espalda", video: null },
  { id: "chin-ups",        name: "Chin ups",                  category: "Tracción", level: "Intermedio",   muscle: "Bíceps",  video: null },
  { id: "pull-ups",        name: "Pull ups",                  category: "Tracción", level: "Intermedio",   muscle: "Espalda", video: null },
  { id: "remo-anillas",    name: "Remo en anillas",           category: "Tracción", level: "Intermedio",   muscle: "Espalda", video: null },
  { id: "dom-en-l",        name: "Dominadas en L",            category: "Tracción", level: "Intermedio",   muscle: "Espalda", video: null },
  { id: "muscle-up",       name: "Muscle up",                 category: "Tracción", level: "Avanzado",     muscle: "Espalda", video: null },
  { id: "dom-lastre",      name: "Dominadas con lastre",      category: "Tracción", level: "Avanzado",     muscle: "Espalda", video: null },
  { id: "dom-una-mano",    name: "Dominada a una mano (asistida)", category: "Tracción", level: "Avanzado", muscle: "Espalda", video: null },

  // ---------- Core ----------
  { id: "abdominales",     name: "Abdominales",               category: "Core", level: "Principiante", muscle: "Abdomen",  video: null },
  { id: "plancha-frontal", name: "Plancha frontal",           category: "Core", level: "Principiante", muscle: "Abdomen",  video: null },
  { id: "plancha-lateral", name: "Plancha lateral",           category: "Core", level: "Principiante", muscle: "Oblicuos", video: null },
  { id: "superman",        name: "Superman",                  category: "Core", level: "Principiante", muscle: "Lumbar",   video: null },
  { id: "canoa",           name: "Canoa",                     category: "Core", level: "Principiante", muscle: "Lumbar",   video: null },
  { id: "bicycle-abs",     name: "Bicycle abs",               category: "Core", level: "Principiante", muscle: "Abdomen",  video: null },
  { id: "lev-pierna",      name: "Levantamiento de piernas",  category: "Core", level: "Intermedio",   muscle: "Abdomen",  video: null },
  { id: "hollow-hold",     name: "Hollow body hold",          category: "Core", level: "Intermedio",   muscle: "Abdomen",  video: null },
  { id: "toes-to-bar",     name: "Toes to bar",               category: "Core", level: "Intermedio",   muscle: "Abdomen",  video: null },
  { id: "ab-wheel",        name: "Ab wheel",                  category: "Core", level: "Intermedio",   muscle: "Abdomen",  video: null },
  { id: "dragon-flag",     name: "Dragon flag",               category: "Core", level: "Avanzado",     muscle: "Abdomen",  video: null },
  { id: "windshield",      name: "Windshield wipers",         category: "Core", level: "Avanzado",     muscle: "Oblicuos", video: null },

  // ---------- Piernas ----------
  { id: "sentadilla",      name: "Sentadillas",               category: "Piernas", level: "Principiante", muscle: "Cuádriceps",  video: null },
  { id: "estocada",        name: "Estocadas",                 category: "Piernas", level: "Principiante", muscle: "Cuádriceps",  video: null },
  { id: "pantorrilla",     name: "Pantorrilla",               category: "Piernas", level: "Principiante", muscle: "Pantorrilla", video: null },
  { id: "puente-gluteo",   name: "Puente de glúteo",          category: "Piernas", level: "Principiante", muscle: "Glúteo",      video: null },
  { id: "bulgara",         name: "Sentadilla búlgara",        category: "Piernas", level: "Intermedio",   muscle: "Cuádriceps",  video: null },
  { id: "shrimp",          name: "Shrimp squat",              category: "Piernas", level: "Intermedio",   muscle: "Cuádriceps",  video: null },
  { id: "nordica",         name: "Caída nórdica",             category: "Piernas", level: "Intermedio",   muscle: "Isquios",     video: null },
  { id: "step-up",         name: "Step up",                   category: "Piernas", level: "Intermedio",   muscle: "Cuádriceps",  video: null },
  { id: "salto-cajon",     name: "Salto al cajón",            category: "Piernas", level: "Intermedio",   muscle: "Cuádriceps",  video: null },
  { id: "pistol",          name: "Pistol squat",              category: "Piernas", level: "Avanzado",     muscle: "Cuádriceps",  video: null },
  { id: "sissy-squat",     name: "Sissy squat",               category: "Piernas", level: "Avanzado",     muscle: "Cuádriceps",  video: null },

  // ---------- Estáticos / Skills ----------
  { id: "l-sit",           name: "L-sit",                     category: "Estáticos / Skills", level: "Principiante", muscle: "Core",    video: null },
  { id: "vertical",        name: "Vertical (handstand)",      category: "Estáticos / Skills", level: "Intermedio",   muscle: "Hombro",  video: null },
  { id: "tuck-planche",    name: "Tuck planche",              category: "Estáticos / Skills", level: "Intermedio",   muscle: "Hombro",  video: null },
  { id: "back-lever",      name: "Back lever",                category: "Estáticos / Skills", level: "Intermedio",   muscle: "Espalda", video: null },
  { id: "front-lever-tuck",name: "Front lever tuck",          category: "Estáticos / Skills", level: "Intermedio",   muscle: "Espalda", video: null },
  { id: "bandera-tuck",    name: "Bandera tuck",              category: "Estáticos / Skills", level: "Intermedio",   muscle: "Oblicuos",video: null },
  { id: "straddle-planche",name: "Straddle planche",          category: "Estáticos / Skills", level: "Avanzado",     muscle: "Hombro",  video: null },
  { id: "front-lever",     name: "Front lever",               category: "Estáticos / Skills", level: "Avanzado",     muscle: "Espalda", video: null },
  { id: "full-planche",    name: "Full planche",              category: "Estáticos / Skills", level: "Avanzado",     muscle: "Hombro",  video: null },
  { id: "bandera",         name: "Bandera (human flag)",      category: "Estáticos / Skills", level: "Avanzado",     muscle: "Oblicuos",video: null },
  { id: "victorian",       name: "Victorian",                 category: "Estáticos / Skills", level: "Avanzado",     muscle: "Espalda", video: null },

  // ---------- Cardio / Movilidad ----------
  { id: "mountain-climber",name: "Mountain climber",          category: "Cardio / Movilidad", level: "Principiante", muscle: "Core",            video: null },
  { id: "burpees",         name: "Burpees",                   category: "Cardio / Movilidad", level: "Principiante", muscle: "Cuerpo completo", video: null },
  { id: "jumping-jacks",   name: "Jumping jacks",             category: "Cardio / Movilidad", level: "Principiante", muscle: "Cuerpo completo", video: null },
  { id: "rodillas-altas",  name: "Rodillas altas",            category: "Cardio / Movilidad", level: "Principiante", muscle: "Cuerpo completo", video: null },
  { id: "saltos-cuerda",   name: "Saltos de cuerda",          category: "Cardio / Movilidad", level: "Principiante", muscle: "Cuerpo completo", video: null },
  { id: "movilidad-hombro",name: "Movilidad de hombro y muñeca", category: "Cardio / Movilidad", level: "Principiante", muscle: "Movilidad",   video: null },
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
