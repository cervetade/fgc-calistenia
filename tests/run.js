/*
 * tests/run.js — Suite de tests de FGC Calistenia (sin dependencias)
 * -------------------------------------------------------------------
 * Corre en Node cargando los scripts del navegador con shims mínimos.
 * Uso:  node tests/run.js   (o  npm test)
 *
 * Cubre: sintaxis, integridad del seed, capa de datos (store demo),
 * render de rutinas, parsing de links de YouTube y manejo de eventos de
 * sesión (el caso que degradaba al admin al renovar el token).
 */
"use strict";
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const JSDIR = path.join(__dirname, "..", "js");
let pass = 0,
  fail = 0;
const fails = [];
function ok(name, cond) {
  if (cond) pass++;
  else {
    fail++;
    fails.push(name);
    console.log("  ✗ " + name);
  }
}
function section(t) {
  console.log("\n" + t);
}

/* ---------- 0) Sintaxis de todos los archivos ---------- */
section("Sintaxis (node --check)");
["config.js", "seed.js", "store.js", "ui.js", "auth.js", "app.js"].forEach((f) => {
  try {
    cp.execSync("node --check " + JSON.stringify(path.join(JSDIR, f)), { stdio: "pipe" });
    ok("parsea " + f, true);
  } catch (e) {
    ok("parsea " + f, false);
  }
});

/* ---------- Shims de navegador ---------- */
global.window = global;
const _ls = new Map();
global.localStorage = {
  getItem: (k) => (_ls.has(k) ? _ls.get(k) : null),
  setItem: (k, v) => _ls.set(k, String(v)),
  removeItem: (k) => _ls.delete(k),
  clear: () => _ls.clear(),
};
function load(f) {
  (0, eval)(fs.readFileSync(path.join(JSDIR, f), "utf8"));
}

load("seed.js");
load("store.js");
load("ui.js");
const FGC = global.FGC;

/* ---------- 1) Integridad del seed ---------- */
section("Integridad del seed");
ok("hay ejercicios", FGC.exercises.length > 0);
ok("hay rutinas", FGC.routines.length > 0);
ok("cada ejercicio tiene id y name", FGC.exercises.every((e) => e.id && e.name));
ok("hay 6 categorías definidas", (FGC.exerciseCategories || []).length === 6);
ok("niveles escritos completos", JSON.stringify(FGC.exerciseLevels) === JSON.stringify(["Principiante", "Intermedio", "Avanzado"]));
const catSet = new Set(FGC.exerciseCategories);
const lvlSet = new Set(FGC.exerciseLevels);
ok("cada ejercicio tiene categoría válida", FGC.exercises.every((e) => catSet.has(e.category)));
ok("cada ejercicio tiene nivel válido", FGC.exercises.every((e) => lvlSet.has(e.level)));
ok("ids de ejercicios únicos", new Set(FGC.exercises.map((e) => e.id)).size === FGC.exercises.length);
FGC.exerciseCategories.forEach((c) => ok("categoría con ejercicios: " + c, FGC.exercises.some((e) => e.category === c)));
ok("cada rutina tiene id, kind y title", FGC.routines.every((r) => r.id && r.kind && r.title));
const exIds = new Set(FGC.exercises.map((e) => e.id));
let badRef = null;
function checkBlocks(blocks, where) {
  (blocks || []).forEach((bl) =>
    (bl.items || []).forEach((it) =>
      (it.exercises || []).forEach((x) => {
        if (!exIds.has(x.ex)) badRef = where + " → " + x.ex;
      })
    )
  );
}
FGC.routines.forEach((r) => {
  if (r.kind === "board") checkBlocks(r.content.blocks, r.id);
  else (r.content.days || []).forEach((d) => checkBlocks(d.blocks, r.id));
});
ok("todas las refs de ejercicios existen" + (badRef ? " (falla: " + badRef + ")" : ""), badRef === null);
ok("cada board tiene bloques con items", FGC.routines.filter((r) => r.kind === "board").every((r) => (r.content.blocks || []).length && r.content.blocks.every((b) => (b.items || []).length)));
ok("cada plan tiene días con bloques", FGC.routines.filter((r) => r.kind === "plan").every((r) => (r.content.days || []).length && r.content.days.every((d) => (d.blocks || []).length)));

/* ---------- 2) slug / ids ---------- */
section("Slug e ids");
ok("slugify saca acentos y símbolos", FGC.slugify("Acción Ñandú!") === "accion-nandu");
ok("slugId de board tiene prefijo", FGC.slugId("Tren inferior", "board").indexOf("board-tren-inferior-") === 0);
ok("slugId de plan tiene prefijo", FGC.slugId("Full body", "plan").indexOf("plan-full-body-") === 0);
ok("dos slugId no colisionan", FGC.slugId("x", "board") !== FGC.slugId("x", "board"));

/* ---------- 3) Render de rutinas ---------- */
section("Render de rutinas");
FGC.setExercises(FGC.seedExercises.slice());
const anyBoard = FGC.routines.find((r) => r.kind === "board");
const htmlB = FGC.ui.renderBoard(anyBoard);
ok("renderBoard incluye el título", htmlB.indexOf(anyBoard.title) !== -1);
ok("renderBoard no tiene 'undefined'", htmlB.indexOf("undefined") === -1);
ok("renderBoard marca 'Pizarrón del día'", htmlB.indexOf("Pizarrón del día") !== -1);
const anyPlan = FGC.routines.find((r) => r.kind === "plan");
const htmlP = FGC.ui.renderPlan(anyPlan, 0);
ok("renderPlan incluye el día", htmlP.indexOf(anyPlan.content.days[0].title) !== -1);
ok("renderPlan no tiene 'undefined'", htmlP.indexOf("undefined") === -1);
const superBoard = { title: "t", content: { blocks: [{ name: "x", items: [{ exercises: [{ ex: "push-ups", prescription: "10" }, { ex: "chin-ups", prescription: "8" }] }] }] } };
ok("superserie usa el separador +", FGC.ui.renderBoard(superBoard).indexOf('class="plus"') !== -1);
ok("renderBoard(null) muestra estado vacío", FGC.ui.renderBoard(null).indexOf("empty") !== -1);
// índice vivo: cambiar la biblioteca cambia lo que se muestra
FGC.setExercises([{ id: "push-ups", name: "LAGARTIJAS", muscle: "Empuje", video: null }]);
ok("render usa el índice vivo (FGC.exIndex)", FGC.ui.renderBoard(superBoard).indexOf("LAGARTIJAS") !== -1);
FGC.setExercises(FGC.seedExercises.slice());
ok("esc escapa HTML", FGC.ui.esc("<b>&'\"").indexOf("&lt;") !== -1);

/* ---------- 4) YouTube embed ---------- */
section("YouTube embed");
const yt = FGC.ui.youtubeEmbed;
const ID = "IODxDxX7oi4";
ok("youtu.be/ID", yt("https://youtu.be/" + ID).indexOf("/embed/" + ID) !== -1);
ok("watch?v=ID", yt("https://www.youtube.com/watch?v=" + ID).indexOf("/embed/" + ID) !== -1);
ok("embed/ID", yt("https://www.youtube.com/embed/" + ID).indexOf("/embed/" + ID) !== -1);
ok("usa host nocookie", yt("https://youtu.be/" + ID).indexOf("youtube-nocookie.com") !== -1);
ok("null → null", yt(null) === null);

/* ---------- 5) Capa de datos (store demo) + 6) Auth ---------- */
async function testStore() {
  section("Capa de datos (store demo)");
  localStorage.clear();
  const S = FGC.demoStore;

  const boards0 = await S.listRoutines("board");
  const plans0 = await S.listRoutines("plan");
  ok("listRoutines('board') trae los del seed (≥5)", boards0.length >= 5);
  ok("listRoutines('plan') trae los del seed (≥1)", plans0.length >= 1);
  ok("getBoardToday devuelve un pizarrón", !!(await S.getBoardToday()));

  const id = FGC.slugId("Test board", "board");
  const nb = { id: id, kind: "board", title: "Test board", content: { focus: "x", blocks: [{ name: "B", scheme: "×3", note: "", items: [{ scheme: "", rest: "", note: "", exercises: [{ ex: "push-ups", prescription: "10" }] }] }] } };
  await S.saveRoutine(nb);
  ok("saveRoutine agrega una rutina", (await S.listRoutines("board")).length === boards0.length + 1);
  ok("getRoutine devuelve la nueva", (await S.getRoutine(id)).title === "Test board");
  nb.title = "Test board editado";
  await S.saveRoutine(nb);
  ok("saveRoutine (mismo id) actualiza", (await S.getRoutine(id)).title === "Test board editado");
  await S.deleteRoutine(id);
  ok("deleteRoutine borra", (await S.getRoutine(id)) === null);

  // No se puede borrar una rutina asignada
  await S.assignPlan("u-test", plans0[0].id);
  const del = await S.deleteRoutine(plans0[0].id);
  ok("no borra una rutina asignada", !!del.error);
  await S.assignPlan("u-test", null);
  ok("tras quitar la asignación, sí borra", !(await S.deleteRoutine("plan-inexistente")).error);

  // Ejercicios
  const exN = (await S.listExercises()).length;
  await S.saveExercise({ id: "test-ex-1", name: "Test Ex", muscle: "X", video: "https://youtu.be/" + "abcdefghijk" });
  ok("saveExercise agrega", (await S.listExercises()).length === exN + 1);
  ok("getExercise devuelve el nuevo", (await S.getExercise("test-ex-1")).name === "Test Ex");
  ok("saveExercise guarda el video", (await S.getExercise("test-ex-1")).video.indexOf("youtu.be") !== -1);
  await S.deleteExercise("test-ex-1");
  ok("deleteExercise borra", (await S.getExercise("test-ex-1")) === null);

  // Publicar pizarrón
  await S.setBoardToday(boards0[1].id);
  ok("setBoardToday cambia el pizarrón de hoy", (await S.getBoardToday()).id === boards0[1].id);

  // Roles
  await S.setRole("u-tadeo", "admin");
  const u = (await S.listUsers()).find((x) => x.id === "u-tadeo");
  ok("setRole cambia el rol", u && u.role === "admin");
  localStorage.clear();
}

async function testAuth() {
  section("Auth — eventos de sesión (no perder rol/pantalla)");
  global.FGC.config = { supabaseUrl: "https://x.supabase.co", supabaseAnonKey: "k" };
  global.FGC.isDemo = false;

  let authCb = null;
  let curSession = { user: { id: "u1", email: "prof@x", user_metadata: { full_name: "Prof" } } };
  let profilesResult = { data: { full_name: "Prof", role: "admin", level: "avanzado" }, error: null };
  const chain = { maybeSingle: async () => profilesResult, limit: async () => ({ data: [] }) };
  const fakeSb = {
    auth: {
      onAuthStateChange: (cb) => { authCb = cb; return { data: { subscription: { unsubscribe() {} } } }; },
      getSession: async () => ({ data: { session: curSession } }),
      signOut: async () => { curSession = null; },
    },
    from: () => ({ select: () => ({ eq: () => chain }), upsert: async () => ({ error: null }), delete: () => ({ eq: async () => ({ error: null }) }) }),
  };
  global.window.supabase = { createClient: () => fakeSb };
  load("auth.js");

  let calls = 0,
    lastUser = "INIT";
  await FGC.auth.init((u) => { calls++; lastUser = u; });
  ok("login inicial carga rol admin", lastUser && lastUser.role === "admin");
  const c0 = calls;

  await authCb("TOKEN_REFRESHED", curSession);
  ok("TOKEN_REFRESHED no re-renderiza (no te saca de la pantalla)", calls === c0);

  await authCb("USER_UPDATED", curSession);
  ok("USER_UPDATED no re-renderiza", calls === c0);

  await authCb("SIGNED_IN", curSession);
  ok("SIGNED_IN del mismo usuario no re-renderiza", calls === c0);
  ok("el rol sigue siendo admin", lastUser && lastUser.role === "admin");

  // Aunque un evento reconstruya y la consulta falle, no debe degradar el rol.
  profilesResult = { data: null, error: null }; // simula consulta que no trae perfil
  curSession = { user: { id: "u2", email: "a@x", user_metadata: { full_name: "Alu" } } };
  await authCb("SIGNED_IN", curSession);
  ok("login de OTRO usuario sí re-renderiza", calls === c0 + 1 && lastUser && lastUser.id === "u2");

  await authCb("SIGNED_OUT", null);
  ok("SIGNED_OUT deja user en null", lastUser === null && calls === c0 + 2);
}

/* ---------- Correr y resumir ---------- */
(async () => {
  try {
    await testStore();
    await testAuth();
  } catch (e) {
    fail++;
    fails.push("EXCEPCIÓN: " + (e && e.message));
    console.log("\n  ✗ EXCEPCIÓN:", e);
  }
  console.log("\n" + "=".repeat(40));
  console.log("RESULTADO: " + pass + " OK, " + fail + " fallidos");
  if (fail) console.log("Fallaron:\n - " + fails.join("\n - "));
  else console.log("✓ Todo verde 💪");
  process.exit(fail ? 1 : 0);
})();
