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
  let view = "hoy"; // "hoy" | "plan" | "admin"
  let planDayIndex = 0;
  let authMode = "login"; // "login" | "signup" | "reset" (solo en modo Supabase)

  document.addEventListener("DOMContentLoaded", () => {
    FGC.auth.init(render);
  });

  async function render(user) {
    // Volvió del mail de recuperación: pantalla para poner contraseña nueva.
    if (!FGC.isDemo && FGC.auth.isRecovering()) return renderRecovery();
    if (!user) return renderLogin();
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
    const [users, plans, board] = await Promise.all([
      FGC.store.listUsers(),
      FGC.store.listPlans(),
      FGC.store.getBoardToday(),
    ]);
    const boards = FGC.routines.filter((r) => r.kind === "board");

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
      "<h2>Usuarios (" + users.length + ")</h2>" +
      '<p class="muted">Cambiá el rol o asigná un plan avanzado.</p>' +
      '<div class="tablewrap"><table class="users">' +
      "<thead><tr><th>Usuario</th><th>Rol</th><th>Plan asignado</th></tr></thead>" +
      "<tbody>" + rows + "</tbody></table></div>" +
      "</section>" +
      "</main>";

    wireCommon(user);

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
