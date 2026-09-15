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
    };
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
      return routineIndex[id] || null;
    },
    async getBoardToday() {
      const s = demoLoad();
      return routineIndex[s.boardToday] || null;
    },
    async getAssignedPlan(userId) {
      const s = demoLoad();
      const planId = s.assignments[userId];
      return planId ? routineIndex[planId] || null : null;
    },
    async listPlans() {
      return FGC.routines.filter((r) => r.kind === "plan");
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
