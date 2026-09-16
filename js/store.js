/*
 * store.js — Capa de datos
 * -------------------------------------------------
 * Toda la app pide datos ACÁ, sin saber si vienen del modo demo o de Supabase.
 * Así, el día de mañana, cambiar de uno a otro no toca las pantallas.
 *
 * Métodos (todos devuelven Promesas):
 *   getExercise(id)
 *   getBoardToday()            → rutina "pizarrón" de hoy (o null)
 *   getAssignedPlan(userId)    → plan avanzado asignado (o null)
 *   getRoutine(id)
 *   listPlans()                → planes disponibles (para el admin)
 *   listUsers()                → usuarios (solo admin)
 *   setBoardToday(routineId)   → publica el pizarrón de hoy (admin)
 *   assignPlan(userId, planId) → asigna/quita plan a un usuario (admin)
 *   setRole(userId, role)      → promueve/degrada admin (admin)
 */
window.FGC = window.FGC || {};

(function () {
  // Índice rápido de ejercicios por id.
  const exIndex = {};
  FGC.exercises.forEach((e) => (exIndex[e.id] = e));

  const routineIndex = {};
  FGC.routines.forEach((r) => (routineIndex[r.id] = r));

  // Genera un id legible y único para una rutina nueva.
  // Ej: título "Tren inferior" (board) → "board-tren-inferior-a1b2".
  function slugId(title, kind) {
    const base =
      String(title || kind)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "") // saca acentos
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || kind;
    const rnd = Math.random().toString(36).slice(2, 6);
    return (kind === "plan" ? "plan-" : "board-") + base + "-" + rnd;
  }
  FGC.slugId = slugId;

  /* ============ MODO DEMO (localStorage) ============ */
  const DEMO_KEY = "fgc_demo_state_v1";

  function demoLoad() {
    try {
      const saved = JSON.parse(localStorage.getItem(DEMO_KEY));
      if (saved) return saved;
    } catch (_) {}
    // Copia inicial desde el seed.
    return {
      boardToday: FGC.demoState.boardToday,
      assignments: Object.assign({}, FGC.demoState.assignments),
      roles: {}, // overrides de rol por userId
      customRoutines: {}, // rutinas creadas/editadas desde el editor (id → rutina)
      deletedRoutines: [], // ids de rutinas del seed que se borraron
    };
  }

  // Resuelve una rutina por id en modo demo: primero las custom, después el seed.
  function demoResolveRoutine(s, id) {
    if (!id) return null;
    if ((s.deletedRoutines || []).indexOf(id) !== -1) return null;
    return (s.customRoutines && s.customRoutines[id]) || routineIndex[id] || null;
  }

  // Lista de rutinas (seed + custom, sin las borradas), opcionalmente por kind.
  function demoAllRoutines(s, kind) {
    const map = {};
    FGC.routines.forEach((r) => (map[r.id] = r));
    Object.assign(map, s.customRoutines || {}); // las custom pisan al seed
    (s.deletedRoutines || []).forEach((id) => delete map[id]);
    let list = Object.keys(map).map((k) => map[k]);
    if (kind) list = list.filter((r) => r.kind === kind);
    return list.sort((a, b) => String(a.title).localeCompare(String(b.title)));
  }
  function demoSave(state) {
    try {
      localStorage.setItem(DEMO_KEY, JSON.stringify(state));
    } catch (_) {
      /* modo incógnito: seguimos en memoria, sin persistir */
    }
  }

  const demoStore = {
    async getExercise(id) {
      return exIndex[id] || null;
    },
    async getRoutine(id) {
      return demoResolveRoutine(demoLoad(), id);
    },
    async getBoardToday() {
      const s = demoLoad();
      return demoResolveRoutine(s, s.boardToday);
    },
    async getAssignedPlan(userId) {
      const s = demoLoad();
      const planId = s.assignments[userId];
      return planId ? demoResolveRoutine(s, planId) : null;
    },
    async listPlans() {
      return demoAllRoutines(demoLoad(), "plan");
    },
    async listRoutines(kind) {
      return demoAllRoutines(demoLoad(), kind || null);
    },
    async saveRoutine(routine) {
      const s = demoLoad();
      s.customRoutines = s.customRoutines || {};
      s.customRoutines[routine.id] = routine;
      s.deletedRoutines = (s.deletedRoutines || []).filter((id) => id !== routine.id);
      demoSave(s);
      return { error: null, routine };
    },
    async deleteRoutine(id) {
      const s = demoLoad();
      // No permitir borrar una rutina asignada a algún alumno.
      const asignada = Object.keys(s.assignments || {}).some((u) => s.assignments[u] === id);
      if (asignada) return { error: "No se puede borrar: está asignada a un alumno. Primero quitá la asignación." };
      if (s.customRoutines && s.customRoutines[id]) delete s.customRoutines[id];
      else {
        s.deletedRoutines = s.deletedRoutines || [];
        if (s.deletedRoutines.indexOf(id) === -1) s.deletedRoutines.push(id);
      }
      // Si era el pizarrón de hoy, lo dejamos sin pizarrón.
      if (s.boardToday === id) s.boardToday = null;
      demoSave(s);
      return { error: null };
    },
    async listUsers() {
      const s = demoLoad();
      return FGC.demoUsers.map((u) => ({
        ...u,
        role: s.roles[u.id] || u.role,
        assignedPlan: s.assignments[u.id] || null,
      }));
    },
    async setBoardToday(routineId) {
      const s = demoLoad();
      s.boardToday = routineId;
      demoSave(s);
    },
    async assignPlan(userId, planId) {
      const s = demoLoad();
      if (planId) s.assignments[userId] = planId;
      else delete s.assignments[userId];
      demoSave(s);
    },
    async setRole(userId, role) {
      const s = demoLoad();
      s.roles[userId] = role;
      demoSave(s);
    },
  };

  /* ============ MODO SUPABASE (producción) ============ */
  // Nota: las tablas y políticas están en la carpeta supabase/.
  // Esta implementación asume ese esquema.
  function makeSupabaseStore(sb) {
    return {
      async getExercise(id) {
        const { data } = await sb.from("exercises").select("*").eq("id", id).maybeSingle();
        return data;
      },
      async getRoutine(id) {
        const { data } = await sb.from("routines").select("*").eq("id", id).maybeSingle();
        return data;
      },
      async getBoardToday() {
        // Muestra el pizarrón más reciente publicado hasta hoy (así, si el
        // profe no cargó uno hoy, sigue viéndose el último).
        const today = new Date().toISOString().slice(0, 10);
        const { data } = await sb
          .from("board_schedule")
          .select("routine_id, routines(*)")
          .lte("day", today)
          .order("day", { ascending: false })
          .limit(1)
          .maybeSingle();
        return data ? data.routines : null;
      },
      async getAssignedPlan(userId) {
        const { data } = await sb
          .from("assignments")
          .select("routine_id, routines(*)")
          .eq("user_id", userId)
          .eq("active", true)
          .maybeSingle();
        return data ? data.routines : null;
      },
      async listPlans() {
        const { data } = await sb.from("routines").select("*").eq("kind", "plan").order("title");
        return data || [];
      },
      async listRoutines(kind) {
        let q = sb.from("routines").select("*").order("title");
        if (kind) q = q.eq("kind", kind);
        const { data } = await q;
        return data || [];
      },
      async saveRoutine(routine) {
        // Upsert: crea o actualiza. La política RLS exige que sea admin.
        const row = { id: routine.id, kind: routine.kind, title: routine.title, content: routine.content };
        const { error } = await sb.from("routines").upsert(row);
        return { error: error ? (error.message || "No se pudo guardar.") : null, routine };
      },
      async deleteRoutine(id) {
        // Bloquear si hay un plan asignado activo (borrarlo perdería la asignación).
        const { data: enUso } = await sb
          .from("assignments")
          .select("id")
          .eq("routine_id", id)
          .eq("active", true)
          .limit(1);
        if (enUso && enUso.length)
          return { error: "No se puede borrar: está asignada a un alumno. Primero quitá la asignación." };
        const { error } = await sb.from("routines").delete().eq("id", id);
        return { error: error ? (error.message || "No se pudo borrar.") : null };
      },
      async listUsers() {
        const [{ data: profiles }, { data: active }] = await Promise.all([
          sb.from("profiles").select("*").order("full_name"),
          sb.from("assignments").select("user_id, routine_id").eq("active", true),
        ]);
        const planByUser = {};
        (active || []).forEach((a) => (planByUser[a.user_id] = a.routine_id));
        return (profiles || []).map((p) => ({
          id: p.id,
          name: p.full_name || p.email,
          email: p.email,
          role: p.role,
          level: p.level,
          assignedPlan: planByUser[p.id] || null,
        }));
      },
      async setBoardToday(routineId) {
        const today = new Date().toISOString().slice(0, 10);
        await sb.from("board_schedule").upsert({ day: today, routine_id: routineId });
      },
      async assignPlan(userId, planId) {
        // Desactiva los anteriores y activa el nuevo (o ninguno).
        await sb.from("assignments").update({ active: false }).eq("user_id", userId);
        if (planId) {
          await sb.from("assignments").insert({ user_id: userId, routine_id: planId, active: true });
        }
      },
      async setRole(userId, role) {
        await sb.from("profiles").update({ role }).eq("id", userId);
      },
    };
  }

  // Se decide el store según config. auth.js puede setear FGC.store luego de login.
  FGC.makeSupabaseStore = makeSupabaseStore;
  FGC.demoStore = demoStore;
  FGC.store = demoStore; // por defecto; auth.js lo reemplaza si hay Supabase
})();
