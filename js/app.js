/*
 * app.js — Arranque y navegación
 * -------------------------------------------------
 * Une todo: sesión, pantallas (Hoy / Mi plan / Admin) y eventos.
 */
window.FGC = window.FGC || {};

(function () {
  const $app = document.getElementById("app");
  const esc = FGC.ui.esc;

  // Estado de navegación simple.
  let view = "hoy"; // "hoy" | "plan" | "admin" | "editor"
  let planDayIndex = 0;
  let editing = null; // rutina que se está creando/editando en el editor (o null)
  let authMode = "login"; // "login" | "signup" | "reset" (solo en modo Supabase)

  // Si volvés de un link de recuperación vencido/usado, Supabase manda el error
  // en el hash de la URL (#error=...). Lo leemos apenas carga la app para poder
  // avisar con un mensaje claro en el login. (Se lee acá, antes de que el cliente
  // de Supabase toque la URL; un link válido NO trae "error" y no se toca.)
  let loginNotice = readUrlError();

  document.addEventListener("DOMContentLoaded", () => {
    FGC.auth.init(render);
  });

  // Devuelve un mensaje si la URL trae un error de recuperación; si no, null.
  // Solo limpia el hash cuando es un error, para no pisar un link válido.
  function readUrlError() {
    const h = window.location.hash || "";
    if (h.indexOf("error") === -1) return null;
    const p = new URLSearchParams(h.replace(/^#/, ""));
    const code = p.get("error_code") || p.get("error") || "";
    try {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    } catch (_) {}
    if (code.indexOf("expired") !== -1 || code.indexOf("otp") !== -1)
      return "Ese link de recuperación venció o ya se usó. Pedí uno nuevo acá abajo (usá siempre el mail más reciente).";
    return "El link no es válido. Probá pedir uno nuevo desde “¿Olvidaste tu contraseña?”.";
  }

  async function render(user) {
    // Volvió del mail de recuperación: pantalla para poner contraseña nueva.
    if (!FGC.isDemo && FGC.auth.isRecovering()) return renderRecovery();
    if (!user) return renderLogin();
    if (view === "editor" && user.role === "admin") return renderEditor(user);
    if (view === "admin" && user.role === "admin") return renderAdmin(user);
    return renderMain(user);
  }

  /* ---------------- LOGIN ---------------- */
  function renderLogin() {
    const demoButtons = FGC.demoUsers
      .map(
        (u) =>
          '<button class="btn btn--demo" data-demo="' + u.id + '">' +
          '<span class="btn--demo__name">' + esc(u.name) + "</span>" +
          '<span class="btn--demo__role">' + (u.role === "admin" ? "Profe · admin" : "Alumno · " + u.level) + "</span>" +
          "</button>"
      )
      .join("");

    $app.innerHTML =
      '<div class="login">' +
      logoSVG("login__logo") +
      "<h1>FGC Calistenia</h1>" +
      '<p class="login__tagline">Alcanzá tu mejor versión 🔥</p>' +
      (FGC.isDemo
        ? '<div class="login__box">' +
          '<p class="login__demoNote">Modo demo — entrá como:</p>' +
          '<div class="login__demoGrid">' + demoButtons + "</div>" +
          "</div>"
        : loginForm()) +
      '<p class="login__foot">Gimnasio de calistenia · San Francisco, Córdoba</p>' +
      "</div>";

    if (FGC.isDemo) {
      $app.querySelectorAll("[data-demo]").forEach((b) =>
        b.addEventListener("click", () => FGC.auth.loginDemo(b.getAttribute("data-demo")))
      );
    } else {
      wireLoginForm();
    }

    // Aviso pendiente (p. ej. link de recuperación vencido). Se mantiene visible
    // hasta que el usuario haga algo (cambiar de pestaña o enviar el formulario);
    // no se borra acá porque al arrancar la app puede renderizar el login 2 veces.
    if (loginNotice) {
      const err = document.getElementById("authErr");
      if (err) {
        err.hidden = false;
        err.textContent = loginNotice;
        err.classList.remove("login__err--ok");
      }
    }
  }

  // Formulario de email + contraseña (modo Supabase).
  function loginForm() {
    const isSignup = authMode === "signup";
    const isReset = authMode === "reset";

    // Modo "olvidé mi contraseña": solo pide el email para mandar el link.
    if (isReset) {
      return (
        '<div class="login__box">' +
        '<h2 class="authtitle">Recuperar contraseña</h2>' +
        '<p class="muted">Te mandamos un mail con un link para elegir una nueva.</p>' +
        '<form id="authForm" class="authform">' +
        '<input id="afEmail" class="field" type="email" placeholder="Email" autocomplete="email" required />' +
        '<button class="btn" type="submit" id="afSubmit">Enviar mail</button>' +
        "</form>" +
        '<p class="login__err" id="authErr" hidden></p>' +
        '<button type="button" class="linkbtn" data-authmode="login">← Volver a ingresar</button>' +
        "</div>"
      );
    }

    return (
      '<div class="login__box">' +
      '<div class="authtabs">' +
      '<button type="button" class="authtab' + (!isSignup ? " is-active" : "") + '" data-authmode="login">Ingresar</button>' +
      '<button type="button" class="authtab' + (isSignup ? " is-active" : "") + '" data-authmode="signup">Crear cuenta</button>' +
      "</div>" +
      '<form id="authForm" class="authform">' +
      (isSignup
        ? '<input id="afName" class="field" type="text" placeholder="Tu nombre" autocomplete="name" required />'
        : "") +
      '<input id="afEmail" class="field" type="email" placeholder="Email" autocomplete="email" required />' +
      '<input id="afPass" class="field" type="password" placeholder="Contraseña" autocomplete="' +
      (isSignup ? "new-password" : "current-password") + '" required />' +
      '<button class="btn" type="submit" id="afSubmit">' +
      (isSignup ? "Crear cuenta" : "Ingresar") +
      "</button>" +
      "</form>" +
      '<p class="login__err" id="authErr" hidden></p>' +
      (isSignup
        ? ""
        : '<button type="button" class="linkbtn" data-authmode="reset">¿Olvidaste tu contraseña?</button>') +
      "</div>"
    );
  }

  function wireLoginForm() {
    $app.querySelectorAll("[data-authmode]").forEach((b) =>
      b.addEventListener("click", () => {
        authMode = b.getAttribute("data-authmode");
        loginNotice = null; // el usuario ya reaccionó; no repetir el aviso
        renderLogin();
      })
    );
    const form = document.getElementById("authForm");
    const err = document.getElementById("authErr");
    const showErr = (msg, ok) => {
      err.hidden = false;
      err.textContent = msg;
      err.classList.toggle("login__err--ok", !!ok);
    };
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      loginNotice = null; // ya reaccionó; el mensaje del submit manda
      const submit = document.getElementById("afSubmit");
      // Ojo: según el modo, algunos campos no existen (reset no tiene contraseña,
      // login no tiene nombre). Se leen con cuidado para no romper.
      const passEl = document.getElementById("afPass");
      const nameEl = document.getElementById("afName");
      const email = document.getElementById("afEmail").value;
      const pass = passEl ? passEl.value : "";
      const name = nameEl ? nameEl.value : "";
      submit.disabled = true;
      const original = submit.textContent;
      submit.textContent = "Un momento…";
      const res =
        authMode === "reset"
          ? await FGC.auth.sendPasswordReset(email)
          : authMode === "signup"
          ? await FGC.auth.signupEmail(name, email, pass)
          : await FGC.auth.loginEmail(email, pass);
      submit.disabled = false;
      submit.textContent = original;
      if (res.error) return showErr(res.error);
      if (authMode === "reset")
        return showErr("Listo. Si el email existe, te llega un link para cambiar la contraseña.", true);
      if (res.needsConfirm)
        return showErr("Te enviamos un mail para confirmar tu cuenta. Revisalo y después ingresá.", true);
      // Éxito: onAuthStateChange dispara el render de la app.
    });
  }

  /* ---------------- CONTRASEÑA NUEVA (vuelta del mail) ---------------- */
  function renderRecovery() {
    $app.innerHTML =
      '<div class="login">' +
      logoSVG("login__logo") +
      "<h1>FGC Calistenia</h1>" +
      '<div class="login__box">' +
      '<h2 class="authtitle">Elegí tu contraseña nueva</h2>' +
      '<form id="pwForm" class="authform">' +
      '<input id="pwNew" class="field" type="password" placeholder="Contraseña nueva" autocomplete="new-password" required minlength="6" />' +
      '<input id="pwNew2" class="field" type="password" placeholder="Repetí la contraseña" autocomplete="new-password" required minlength="6" />' +
      '<button class="btn" type="submit" id="pwSubmit">Guardar contraseña</button>' +
      "</form>" +
      '<p class="login__err" id="pwErr" hidden></p>' +
      "</div>" +
      '<p class="login__foot">Gimnasio de calistenia · San Francisco, Córdoba</p>' +
      "</div>";

    const form = document.getElementById("pwForm");
    const err = document.getElementById("pwErr");
    const showErr = (msg, ok) => {
      err.hidden = false;
      err.textContent = msg;
      err.classList.toggle("login__err--ok", !!ok);
    };
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const p1 = document.getElementById("pwNew").value;
      const p2 = document.getElementById("pwNew2").value;
      if (p1.length < 6) return showErr("La contraseña debe tener al menos 6 caracteres.");
      if (p1 !== p2) return showErr("Las contraseñas no coinciden.");
      const submit = document.getElementById("pwSubmit");
      submit.disabled = true;
      const original = submit.textContent;
      submit.textContent = "Un momento…";
      const res = await FGC.auth.updatePassword(p1);
      submit.disabled = false;
      submit.textContent = original;
      if (res.error) return showErr(res.error);
      // Listo: ya no está en modo recuperación y tiene sesión válida → entra.
      render(FGC.auth.currentUser());
    });
  }

  /* ---------------- VISTA ALUMNO (Hoy / Mi plan) ---------------- */
  async function renderMain(user) {
    const plan = await FGC.store.getAssignedPlan(user.id);
    const hasPlan = !!plan;

    // Si estaba en "plan" pero no tiene, lo mandamos a "hoy".
    if (view === "plan" && !hasPlan) view = "hoy";

    let body = "";
    if (view === "plan" && hasPlan) {
      body = FGC.ui.renderPlan(plan, planDayIndex);
    } else {
      const board = await FGC.store.getBoardToday();
      body = FGC.ui.renderBoard(board);
      if (hasPlan) {
        body =
          '<div class="hint">Tenés un plan avanzado asignado por el profe. ' +
          'Miralo en <b>Mi plan</b>.</div>' + body;
      }
    }

    $app.innerHTML =
      header(user, hasPlan) +
      '<main class="content">' + body + "</main>";

    wireCommon(user);
    wireRoutine();
  }

  /* ---------------- VISTA ADMIN ---------------- */
  async function renderAdmin(user) {
    const [users, plans, board, boards] = await Promise.all([
      FGC.store.listUsers(),
      FGC.store.listPlans(),
      FGC.store.getBoardToday(),
      FGC.store.listRoutines("board"),
    ]);

    const planOptions = (sel) =>
      '<option value="">— Sin plan —</option>' +
      plans
        .map((p) => '<option value="' + p.id + '"' + (sel === p.id ? " selected" : "") + ">" + esc(p.title) + "</option>")
        .join("");

    const rows = users
      .map(
        (u) =>
          "<tr>" +
          "<td><b>" + esc(u.name) + "</b><br><span class='muted'>" + esc(u.email) + "</span></td>" +
          "<td>" +
          '<select class="mini" data-role-user="' + u.id + '">' +
          '<option value="user"' + (u.role === "user" ? " selected" : "") + ">Alumno</option>" +
          '<option value="admin"' + (u.role === "admin" ? " selected" : "") + ">Admin</option>" +
          "</select>" +
          "</td>" +
          "<td>" +
          '<select class="mini" data-assign-user="' + u.id + '">' + planOptions(u.assignedPlan) + "</select>" +
          "</td>" +
          "</tr>"
      )
      .join("");

    $app.innerHTML =
      header(user, false, true) +
      '<main class="content admin">' +
      '<section class="card">' +
      "<h2>Pizarrón de hoy</h2>" +
      '<p class="muted">Lo que ven todos los alumnos al entrar.</p>' +
      '<div class="row">' +
      '<select id="boardSelect" class="mini">' +
      boards
        .map((b) => '<option value="' + b.id + '"' + (board && board.id === b.id ? " selected" : "") + ">" + esc(b.title) + "</option>")
        .join("") +
      "</select>" +
      '<button class="btn btn--sm" id="btnPublishBoard">Publicar</button>' +
      "</div>" +
      '<p class="ok" id="boardMsg" hidden>✓ Pizarrón actualizado</p>' +
      "</section>" +
      '<section class="card">' +
      "<h2>Editor de rutinas</h2>" +
      '<p class="muted">Creá o editá pizarrones y planes desde acá.</p>' +
      '<button class="btn btn--sm" id="btnEditor">Abrir editor ✏️</button>' +
      "</section>" +
      '<section class="card">' +
      "<h2>Usuarios (" + users.length + ")</h2>" +
      '<p class="muted">Cambiá el rol o asigná un plan avanzado.</p>' +
      '<div class="tablewrap"><table class="users">' +
      "<thead><tr><th>Usuario</th><th>Rol</th><th>Plan asignado</th></tr></thead>" +
      "<tbody>" + rows + "</tbody></table></div>" +
      "</section>" +
      "</main>";

    wireCommon(user);

    // Abrir el editor de rutinas.
    document.getElementById("btnEditor").addEventListener("click", () => {
      editing = null;
      view = "editor";
      render(user);
    });

    // Publicar pizarrón.
    document.getElementById("btnPublishBoard").addEventListener("click", async () => {
      await FGC.store.setBoardToday(document.getElementById("boardSelect").value);
      const msg = document.getElementById("boardMsg");
      msg.hidden = false;
      setTimeout(() => (msg.hidden = true), 2000);
    });

    // Cambiar rol.
    $app.querySelectorAll("[data-role-user]").forEach((sel) =>
      sel.addEventListener("change", async () => {
        await FGC.store.setRole(sel.getAttribute("data-role-user"), sel.value);
      })
    );

    // Asignar plan.
    $app.querySelectorAll("[data-assign-user]").forEach((sel) =>
      sel.addEventListener("change", async () => {
        await FGC.store.assignPlan(sel.getAttribute("data-assign-user"), sel.value || null);
      })
    );
  }

  /* ---------------- EDITOR DE RUTINAS (admin) ---------------- */

  // Estructuras vacías para empezar de cero.
  function newEx() { return { ex: "", prescription: "" }; }
  function newItem() { return { scheme: "", rest: "", note: "", exercises: [newEx()] }; }
  function newBlock() { return { name: "", scheme: "×3", note: "", items: [newItem()] }; }
  function blankBoard() {
    return { _isNew: true, id: null, kind: "board", title: "", content: { focus: "", blocks: [newBlock()] } };
  }

  // Opciones del desplegable de ejercicios (se arma una vez).
  const exOptionsBase =
    '<option value="">— Elegí un ejercicio —</option>' +
    FGC.exercises
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((e) => '<option value="' + esc(e.id) + '">' + esc(e.name) + "</option>")
      .join("");
  function exOptions(selected) {
    return exOptionsBase.replace('value="' + esc(selected) + '"', 'value="' + esc(selected) + '" selected');
  }

  async function renderEditor(user) {
    if (editing) return renderEditorForm(user);
    return renderEditorList(user);
  }

  // Barra superior simple para las pantallas del editor.
  function editorTopbar(backAttr) {
    return (
      '<header class="topbar">' +
      '<div class="topbar__brand">' + logoSVG("topbar__logo") + "<span>FGC</span></div>" +
      '<nav class="tabs"><button class="tab" ' + backAttr + ">← Volver</button></nav>" +
      '<div class="topbar__user">' +
      '<button class="btn btn--ghost btn--sm" id="btnLogout">Salir</button>' +
      "</div>" +
      "</header>"
    );
  }

  // Lista de rutinas con acciones (nuevo / editar / borrar).
  async function renderEditorList(user) {
    const boards = await FGC.store.listRoutines("board");

    const card = (r) =>
      '<div class="rowitem">' +
      '<div class="rowitem__info"><b>' + esc(r.title) + "</b>" +
      '<span class="muted">' + ((r.content && r.content.focus) ? esc(r.content.focus) : "Pizarrón") + "</span></div>" +
      '<div class="rowitem__acts">' +
      '<button class="btn btn--sm btn--ghost" data-edit="' + esc(r.id) + '">Editar</button>' +
      '<button class="btn btn--sm btn--danger" data-del="' + esc(r.id) + '">Borrar</button>' +
      "</div></div>";

    $app.innerHTML =
      editorTopbar('data-view="admin"') +
      '<main class="content admin">' +
      '<section class="card">' +
      '<div class="row row--between">' +
      "<h2>Pizarrones</h2>" +
      '<button class="btn btn--sm" id="btnNewBoard">+ Nuevo pizarrón</button>' +
      "</div>" +
      (boards.length
        ? '<div class="rowlist">' + boards.map(card).join("") + "</div>"
        : '<p class="muted">Todavía no hay pizarrones. Creá el primero 💪</p>') +
      '<p class="ok" id="editorMsg" hidden></p>' +
      "</section>" +
      "</main>";

    wireCommon(user);

    document.getElementById("btnNewBoard").addEventListener("click", () => {
      editing = blankBoard();
      render(user);
    });

    $app.querySelectorAll("[data-edit]").forEach((b) =>
      b.addEventListener("click", async () => {
        const r = await FGC.store.getRoutine(b.getAttribute("data-edit"));
        if (!r) return;
        editing = JSON.parse(JSON.stringify(r)); // copia editable
        editing.content = editing.content || {};
        editing.content.blocks = editing.content.blocks || [newBlock()];
        render(user);
      })
    );

    $app.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", async () => {
        const id = b.getAttribute("data-del");
        if (!confirm("¿Seguro que querés borrar este pizarrón? No se puede deshacer.")) return;
        const res = await FGC.store.deleteRoutine(id);
        if (res.error) return alert(res.error);
        render(user);
      })
    );
  }

  // Formulario de edición de un pizarrón.
  function renderEditorForm(user) {
    const c = editing.content;

    const exRow = (ex, bi, ii, ei, canRemove) =>
      '<div class="exrow">' +
      '<select class="field mini" data-loc="ex" data-b="' + bi + '" data-i="' + ii + '" data-e="' + ei + '" data-k="ex">' +
      exOptions(ex.ex) + "</select>" +
      '<input class="field mini" type="text" placeholder="Reps / tiempo (ej: 10-12, 30”)" value="' + esc(ex.prescription) + '" ' +
      'data-loc="ex" data-b="' + bi + '" data-i="' + ii + '" data-e="' + ei + '" data-k="prescription" />' +
      (canRemove ? '<button type="button" class="iconbtn" title="Quitar ejercicio" data-act="delex" data-b="' + bi + '" data-i="' + ii + '" data-e="' + ei + '">✕</button>' : "") +
      "</div>";

    const itemCard = (item, bi, ii, canRemove) =>
      '<div class="itemcard">' +
      (item.exercises || []).map((ex, ei) => exRow(ex, bi, ii, ei, (item.exercises.length > 1))).join('<div class="supersep">+ superserie</div>') +
      '<button type="button" class="btn btn--xs btn--ghost" data-act="addex" data-b="' + bi + '" data-i="' + ii + '">+ superserie</button>' +
      '<div class="itemmeta">' +
      '<input class="field mini" type="text" placeholder="Series (ej: ×3)" value="' + esc(item.scheme || "") + '" data-loc="item" data-b="' + bi + '" data-i="' + ii + '" data-k="scheme" />' +
      '<input class="field mini" type="text" placeholder="Descanso (ej: 1 min)" value="' + esc(item.rest || "") + '" data-loc="item" data-b="' + bi + '" data-i="' + ii + '" data-k="rest" />' +
      "</div>" +
      '<input class="field mini" type="text" placeholder="Nota (opcional)" value="' + esc(item.note || "") + '" data-loc="item" data-b="' + bi + '" data-i="' + ii + '" data-k="note" />' +
      (canRemove ? '<button type="button" class="linkbtn linkbtn--danger" data-act="delitem" data-b="' + bi + '" data-i="' + ii + '">Quitar línea</button>' : "") +
      "</div>";

    const blockCard = (block, bi, canRemove) =>
      '<section class="blockcard">' +
      '<div class="row row--between">' +
      '<input class="field" type="text" placeholder="Nombre del bloque (ej: Zona media)" value="' + esc(block.name || "") + '" data-loc="block" data-b="' + bi + '" data-k="name" />' +
      (canRemove ? '<button type="button" class="iconbtn" title="Quitar bloque" data-act="delblock" data-b="' + bi + '">🗑</button>' : "") +
      "</div>" +
      '<div class="itemmeta">' +
      '<input class="field mini" type="text" placeholder="Series del bloque (ej: ×3)" value="' + esc(block.scheme || "") + '" data-loc="block" data-b="' + bi + '" data-k="scheme" />' +
      "</div>" +
      '<input class="field mini" type="text" placeholder="Nota del bloque (opcional)" value="' + esc(block.note || "") + '" data-loc="block" data-b="' + bi + '" data-k="note" />' +
      (block.items || []).map((item, ii) => itemCard(item, bi, ii, (block.items.length > 1))).join("") +
      '<button type="button" class="btn btn--sm btn--ghost" data-act="additem" data-b="' + bi + '">+ Agregar línea</button>' +
      "</section>";

    $app.innerHTML =
      editorTopbar("id=\"btnCancelEditor\"") +
      '<main class="content admin editor">' +
      '<section class="card">' +
      "<h2>" + (editing._isNew ? "Nuevo pizarrón" : "Editar pizarrón") + "</h2>" +
      '<input class="field" type="text" placeholder="Título (ej: Pizarrón — Tren superior)" value="' + esc(editing.title || "") + '" data-loc="title" />' +
      '<input class="field" type="text" placeholder="Enfoque (ej: Tren superior)" value="' + esc(c.focus || "") + '" data-loc="focus" />' +
      (c.blocks || []).map((block, bi) => blockCard(block, bi, (c.blocks.length > 1))).join("") +
      '<button type="button" class="btn btn--sm btn--ghost" data-act="addblock">+ Agregar bloque</button>' +
      '<p class="login__err" id="editErr" hidden></p>' +
      '<div class="row row--end">' +
      '<button type="button" class="btn btn--ghost" id="btnCancelEditor2">Cancelar</button>' +
      '<button type="button" class="btn" id="btnSaveRoutine">Guardar</button>' +
      "</div>" +
      "</section>" +
      "</main>";

    wireEditorForm(user);
  }

  function wireEditorForm(user) {
    const logout = document.getElementById("btnLogout");
    if (logout) logout.addEventListener("click", () => FGC.auth.logout());

    // Cambios de texto/desplegables → actualizan el modelo en vivo (sin re-render).
    $app.querySelectorAll("[data-loc]").forEach((el) => {
      const ev = el.tagName === "SELECT" ? "change" : "input";
      el.addEventListener(ev, () => applyInput(el));
    });

    // Botones estructurales (agregar/quitar) → mutan el modelo y re-renderizan.
    $app.querySelectorAll("[data-act]").forEach((el) =>
      el.addEventListener("click", () => {
        const b = +el.dataset.b, i = +el.dataset.i, e = +el.dataset.e;
        const c = editing.content;
        switch (el.dataset.act) {
          case "addblock": c.blocks.push(newBlock()); break;
          case "delblock": c.blocks.splice(b, 1); break;
          case "additem": c.blocks[b].items.push(newItem()); break;
          case "delitem": c.blocks[b].items.splice(i, 1); break;
          case "addex": c.blocks[b].items[i].exercises.push(newEx()); break;
          case "delex": c.blocks[b].items[i].exercises.splice(e, 1); break;
        }
        render(user);
      })
    );

    const cancel = () => { editing = null; render(user); };
    document.getElementById("btnCancelEditor").addEventListener("click", cancel);
    document.getElementById("btnCancelEditor2").addEventListener("click", cancel);
    document.getElementById("btnSaveRoutine").addEventListener("click", () => saveRoutine(user));
  }

  // Lee el valor de un input y lo guarda en el lugar correcto del modelo.
  function applyInput(el) {
    const v = el.value;
    const b = +el.dataset.b, i = +el.dataset.i, e = +el.dataset.e, k = el.dataset.k;
    const c = editing.content;
    switch (el.dataset.loc) {
      case "title": editing.title = v; break;
      case "focus": c.focus = v; break;
      case "block": c.blocks[b][k] = v; break;
      case "item": c.blocks[b].items[i][k] = v; break;
      case "ex": c.blocks[b].items[i].exercises[e][k] = v; break;
    }
  }

  async function saveRoutine(user) {
    const err = document.getElementById("editErr");
    const showErr = (m) => { err.hidden = false; err.textContent = m; };

    if (!editing.title.trim()) return showErr("Ponele un título al pizarrón.");
    const blocks = (editing.content.blocks || []);
    if (!blocks.length) return showErr("Agregá al menos un bloque.");
    for (const bl of blocks) {
      if (!String(bl.name).trim()) return showErr("Cada bloque necesita un nombre.");
      const items = (bl.items || []).filter((it) => (it.exercises || []).some((x) => x.ex));
      if (!items.length) return showErr('El bloque "' + (bl.name || "") + '" necesita al menos una línea con un ejercicio elegido.');
    }

    // Armamos una copia limpia (sin ejercicios sin elegir ni líneas vacías).
    const payload = {
      id: editing._isNew ? FGC.slugId(editing.title, "board") : editing.id,
      kind: "board",
      title: editing.title.trim(),
      content: {
        focus: (editing.content.focus || "").trim(),
        blocks: blocks.map((bl) => ({
          name: bl.name.trim(),
          scheme: (bl.scheme || "").trim(),
          note: (bl.note || "").trim(),
          items: (bl.items || [])
            .map((it) => ({
              scheme: (it.scheme || "").trim(),
              rest: (it.rest || "").trim(),
              note: (it.note || "").trim(),
              exercises: (it.exercises || []).filter((x) => x.ex).map((x) => ({ ex: x.ex, prescription: (x.prescription || "").trim() })),
            }))
            .filter((it) => it.exercises.length),
        })),
      },
    };

    const btn = document.getElementById("btnSaveRoutine");
    btn.disabled = true;
    btn.textContent = "Guardando…";
    const res = await FGC.store.saveRoutine(payload);
    btn.disabled = false;
    btn.textContent = "Guardar";
    if (res.error) return showErr(res.error);

    editing = null;
    await renderEditor(user);
    const msg = document.getElementById("editorMsg");
    if (msg) { msg.hidden = false; msg.textContent = "✓ Pizarrón guardado"; setTimeout(() => (msg.hidden = true), 2500); }
  }

  /* ---------------- PARTES COMPARTIDAS ---------------- */
  function header(user, hasPlan, isAdminView) {
    const tabs = isAdminView
      ? '<button class="tab" data-view="hoy">← Volver</button>'
      : '<button class="tab' + (view === "hoy" ? " is-active" : "") + '" data-view="hoy">Hoy</button>' +
        (hasPlan ? '<button class="tab' + (view === "plan" ? " is-active" : "") + '" data-view="plan">Mi plan</button>' : "") +
        (user.role === "admin" ? '<button class="tab tab--admin" data-view="admin">Panel profe</button>' : "");

    return (
      '<header class="topbar">' +
      '<div class="topbar__brand">' + logoSVG("topbar__logo") + "<span>FGC</span></div>" +
      '<nav class="tabs">' + tabs + "</nav>" +
      '<div class="topbar__user">' +
      '<span class="topbar__name">' + esc(user.name) + "</span>" +
      '<button class="btn btn--ghost btn--sm" id="btnLogout">Salir</button>' +
      "</div>" +
      "</header>"
    );
  }

  function wireCommon(user) {
    const logout = document.getElementById("btnLogout");
    if (logout) logout.addEventListener("click", () => FGC.auth.logout());
    $app.querySelectorAll("[data-view]").forEach((b) =>
      b.addEventListener("click", () => {
        view = b.getAttribute("data-view");
        if (view !== "plan") planDayIndex = 0;
        render(user);
      })
    );
  }

  function wireRoutine() {
    // Click en un ejercicio → abre el video / "próximamente".
    $app.querySelectorAll(".exercise").forEach((b) =>
      b.addEventListener("click", () => FGC.ui.openExerciseModal(b.getAttribute("data-ex")))
    );
    // Pestañas de días del plan.
    $app.querySelectorAll(".daytab").forEach((b) =>
      b.addEventListener("click", () => {
        planDayIndex = parseInt(b.getAttribute("data-day"), 10) || 0;
        render(FGC.auth.currentUser());
      })
    );
  }

  // Logo: usa assets/logo.png si existe; si no, muestra el escudo SVG.
  function logoSVG(cls) {
    return (
      '<img class="' + cls + '" src="assets/logo.png" alt="FGC" ' +
      'onerror="FGC.logoFallback(this)" />'
    );
  }

  // Respaldo si todavía no cargaste assets/logo.png (escudo "FG" en SVG).
  FGC.logoFallback = function (img) {
    var cls = img.className;
    img.outerHTML =
      '<svg class="' + cls + '" viewBox="0 0 48 56" fill="none" aria-hidden="true">' +
      '<path d="M24 2 L44 10 V30 C44 44 34 51 24 54 C14 51 4 44 4 30 V10 Z" ' +
      'stroke="currentColor" stroke-width="2.5" fill="none"/>' +
      '<text x="24" y="34" text-anchor="middle" font-size="20" font-weight="800" ' +
      'font-family="Lato, Arial, sans-serif" fill="currentColor">FG</text>' +
      "</svg>";
  };
})();
