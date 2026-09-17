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
  let exEditing = false; // true cuando estamos en el gestor de ejercicios
  let editingEx = null; // ejercicio que se está creando/editando (o null)
  let exFilter = null; // categoría por la que se filtra el gestor (null = todas)
  let exercisesLoaded = false; // ya cargamos la biblioteca desde la base
  let authMode = "login"; // "login" | "signup" | "reset" (solo en modo Supabase)

  // Si volvés de un link de recuperación vencido/usado, Supabase manda el error
  // en el hash de la URL (#error=...). Lo leemos apenas carga la app para poder
  // avisar con un mensaje claro en el login. (Se lee acá, antes de que el cliente
  // de Supabase toque la URL; un link válido NO trae "error" y no se toca.)
  let loginNotice = readUrlError();

  document.addEventListener("DOMContentLoaded", () => {
    FGC.auth.init(async (user) => {
      // Cargamos la biblioteca de ejercicios desde la base (una sola vez), así
      // los nombres, videos y el desplegable del editor salen de ahí y no del seed.
      if (!exercisesLoaded && FGC.store) {
        exercisesLoaded = true;
        try {
          const list = await FGC.store.listExercises();
          if (list && list.length) FGC.setExercises(list); // si viene vacía, dejamos el seed
        } catch (_) {}
      }
      render(user);
    });
  });

  // Recarga la biblioteca desde la base y actualiza el índice vivo.
  async function refreshExercises() {
    try { FGC.setExercises(await FGC.store.listExercises()); } catch (_) {}
  }

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
    if (view === "feedback" && user.role === "admin") return renderFeedback(user);
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
    let fbRoutineId = null, fbDayIndex = -1, fbExercises = []; // sesión a la que pertenece el RPE
    if (view === "plan" && hasPlan) {
      body = FGC.ui.renderPlan(plan, planDayIndex);
      const days = (plan.content && plan.content.days) || [];
      fbRoutineId = plan.id;
      fbDayIndex = Math.max(0, Math.min(planDayIndex || 0, days.length - 1)); // el día que se ve
      fbExercises = collectExercises((days[fbDayIndex] || {}).blocks);
    } else {
      const board = await FGC.store.getBoardToday();
      body = FGC.ui.renderBoard(board);
      if (hasPlan) {
        body =
          '<div class="hint">Tenés un plan avanzado asignado por el profe. ' +
          'Miralo en <b>Mi plan</b>.</div>' + body;
      }
      if (board) {
        fbRoutineId = board.id;
        fbDayIndex = -1;
        fbExercises = collectExercises(board.content && board.content.blocks);
      }
    }

    // Bloque de RPE ("¿cómo estuvo hoy?"), con lo que ya haya respondido hoy.
    let ratingHTML = "";
    if (fbRoutineId) {
      const existing = await FGC.store.getFeedbackToday(user.id, fbRoutineId, fbDayIndex);
      ratingHTML = ratingBlockHTML(existing, fbExercises);
    }

    $app.innerHTML =
      header(user, hasPlan) +
      '<main class="content">' + body + ratingHTML + "</main>";

    wireCommon(user);
    wireRoutine();
    if (fbRoutineId) wireRating(user, fbRoutineId, fbDayIndex);
  }

  // Junta los ejercicios (únicos, en orden) de una lista de bloques.
  function collectExercises(blocks) {
    const seen = {};
    const out = [];
    (blocks || []).forEach((bl) =>
      (bl.items || []).forEach((it) =>
        (it.exercises || []).forEach((x) => {
          if (x.ex && !seen[x.ex]) {
            seen[x.ex] = 1;
            const e = FGC.exIndex[x.ex];
            out.push({ ex: x.ex, name: e ? e.name : x.ex });
          }
        })
      )
    );
    return out;
  }

  // Tarjeta de esfuerzo percibido (RPE 1-5) al pie de la rutina.
  const RPE_LABELS = [["1", "😌", "Muy fácil"], ["2", "🙂", "Fácil"], ["3", "😐", "Normal"], ["4", "😮‍💨", "Difícil"], ["5", "🥵", "Durísimo"]];
  function ratingBlockHTML(existing, exList) {
    const cur = existing ? String(existing.rating) : "";
    const details = (existing && existing.details) || {};
    const btns = RPE_LABELS.map(
      (l) =>
        '<button type="button" class="rpebtn' + (cur === l[0] ? " is-active" : "") + '" data-rate="' + l[0] + '" title="' + l[2] + '">' +
        '<span class="rpebtn__n">' + l[0] + "</span><span class=\"rpebtn__e\">" + l[1] + "</span></button>"
    ).join("");

    // Sección "Detallar": un selector 1-5 opcional por ejercicio.
    const hasDetails = Object.keys(details).length > 0;
    let detailHTML = "";
    if (exList && exList.length) {
      const opts = (sel) =>
        '<option value="">—</option>' +
        [1, 2, 3, 4, 5].map((n) => '<option value="' + n + '"' + (String(sel) === String(n) ? " selected" : "") + ">" + n + "</option>").join("");
      const rows = exList
        .map(
          (e) =>
            '<div class="fbex"><span class="fbex__name">' + esc(e.name) + "</span>" +
            '<select class="field mini" data-exrate="' + esc(e.ex) + '">' + opts(details[e.ex]) + "</select></div>"
        )
        .join("");
      detailHTML =
        '<button type="button" class="linkbtn" id="fbToggle">Detallar por ejercicio ▾</button>' +
        '<div class="fbdetails"' + (hasDetails ? "" : " hidden") + ' id="fbDetails">' +
        '<p class="muted">Puntuá del 1 al 5 los que quieras (opcional).</p>' + rows +
        "</div>";
    }

    return (
      '<section class="card feedbackcard">' +
      "<h3>¿Cómo estuvo hoy? 💬</h3>" +
      '<p class="muted">Tocá qué tan difícil te resultó. El profe lo ve para ajustar tu progreso.</p>' +
      '<div class="rpe">' + btns + "</div>" +
      detailHTML +
      '<textarea class="field" id="fbNote" rows="2" placeholder="Nota para el profe (opcional)">' + esc(existing && existing.note ? existing.note : "") + "</textarea>" +
      '<div class="row row--between">' +
      '<span class="muted" id="fbState">' + (existing ? "Ya respondiste hoy · podés cambiarlo" : "") + "</span>" +
      '<button class="btn btn--sm" id="fbSave">' + (existing ? "Actualizar" : "Guardar") + "</button>" +
      "</div>" +
      '<p class="ok" id="fbMsg" hidden></p>' +
      "</section>"
    );
  }

  function wireRating(user, routineId, dayIndex) {
    const card = $app.querySelector(".feedbackcard");
    if (!card) return;
    card.querySelectorAll(".rpebtn").forEach((b) =>
      b.addEventListener("click", () => {
        card.querySelectorAll(".rpebtn").forEach((x) => x.classList.remove("is-active"));
        b.classList.add("is-active");
      })
    );
    // Toggle de "Detallar por ejercicio".
    const toggle = document.getElementById("fbToggle");
    if (toggle) {
      const det = document.getElementById("fbDetails");
      toggle.addEventListener("click", () => {
        det.hidden = !det.hidden;
        toggle.textContent = det.hidden ? "Detallar por ejercicio ▾" : "Ocultar detalle ▴";
      });
      if (!det.hidden) toggle.textContent = "Ocultar detalle ▴";
    }

    const save = document.getElementById("fbSave");
    const msg = document.getElementById("fbMsg");
    save.addEventListener("click", async () => {
      const active = card.querySelector(".rpebtn.is-active");
      const show = (t, ok) => { msg.hidden = false; msg.textContent = t; msg.classList.toggle("ok", !!ok); msg.classList.toggle("login__err", !ok); };
      if (!active) return show("Elegí del 1 al 5 primero.", false);
      const rating = parseInt(active.getAttribute("data-rate"), 10);
      const note = document.getElementById("fbNote").value.trim();
      // Detalle por ejercicio (solo los que puntuó).
      const details = {};
      card.querySelectorAll("[data-exrate]").forEach((s) => {
        if (s.value) details[s.getAttribute("data-exrate")] = parseInt(s.value, 10);
      });
      save.disabled = true;
      const orig = save.textContent;
      save.textContent = "Guardando…";
      const res = await FGC.store.saveFeedback(user.id, { routineId, dayIndex, rating, note, details: Object.keys(details).length ? details : null });
      save.disabled = false;
      save.textContent = "Actualizar";
      if (res.error) return show(res.error, false);
      const st = document.getElementById("fbState");
      if (st) st.textContent = "Ya respondiste hoy · podés cambiarlo";
      show("✓ ¡Gracias! Quedó guardado.", true);
    });
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
      "<h2>Feedback de los alumnos</h2>" +
      '<p class="muted">Qué tan difícil les resultó (RPE 1-5), para ajustar cargas.</p>' +
      '<button class="btn btn--sm" id="btnFeedback">Ver feedback 📊</button>' +
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

    // Ver el feedback de los alumnos.
    document.getElementById("btnFeedback").addEventListener("click", () => {
      view = "feedback";
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

  /* ---------------- FEEDBACK / RPE (admin) ---------------- */
  async function renderFeedback(user) {
    const [fbs, users, routines] = await Promise.all([
      FGC.store.listFeedback(),
      FGC.store.listUsers(),
      FGC.store.listRoutines(),
    ]);
    const userName = {};
    users.forEach((u) => (userName[u.id] = u.name));
    const rMap = {};
    routines.forEach((r) => (rMap[r.id] = r));

    const titleOf = (f) => {
      const r = rMap[f.routine_id];
      return r ? r.title : (f.routines && f.routines.title) || "Rutina";
    };
    const sessionLabel = (f) => (f.day_index >= 0 ? titleOf(f) + " · Día " + (f.day_index + 1) : titleOf(f));
    const fmtDate = (d) => {
      const p = String(d).split("-");
      return p.length === 3 ? p[2] + "/" + p[1] : d;
    };
    const chip = (n) => '<span class="rchip r' + n + '">' + n + "</span>";
    const exNombre = (id) => {
      const e = FGC.exIndex[id];
      return e ? e.name : id;
    };
    const detLine = (f) => {
      if (!f.details || !Object.keys(f.details).length) return "";
      const parts = Object.keys(f.details).map((id) => esc(exNombre(id)) + " " + f.details[id]);
      return '<div class="fbdetline muted">🔎 ' + parts.join(" · ") + "</div>";
    };

    // Por alumno (evolución cronológica, más reciente a la derecha).
    const byUser = {};
    fbs.forEach((f) => (byUser[f.user_id] = byUser[f.user_id] || []).push(f));
    const porAlumno = Object.keys(byUser)
      .map((uid) => {
        const list = byUser[uid].slice().sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
        const chips = list.slice(-10).map((f) => chip(f.rating)).join("");
        return (
          '<div class="rowitem"><div class="rowitem__info"><b>' + esc(userName[uid] || "Alumno") + "</b>" +
          '<span class="muted">' + list.length + (list.length === 1 ? " respuesta" : " respuestas") + " · reciente →</span></div>" +
          '<div class="rchips">' + chips + "</div></div>"
        );
      })
      .join("");

    // Promedio de los pizarrones por fecha (señal del grupo).
    const agg = {};
    fbs.filter((f) => f.day_index < 0).forEach((f) => {
      const k = f.routine_id + "|" + f.day;
      agg[k] = agg[k] || { sum: 0, n: 0, routine: f.routine_id, day: f.day };
      agg[k].sum += f.rating;
      agg[k].n++;
    });
    const pizarrones = Object.keys(agg)
      .map((k) => agg[k])
      .sort((a, b) => (a.day < b.day ? 1 : -1))
      .slice(0, 20)
      .map((a) => {
        const avg = (a.sum / a.n).toFixed(1);
        const r = rMap[a.routine];
        return (
          '<div class="rowitem"><div class="rowitem__info"><b>' + esc(r ? r.title : "Pizarrón") + "</b>" +
          '<span class="muted">' + fmtDate(a.day) + " · " + a.n + (a.n === 1 ? " respuesta" : " respuestas") + "</span></div>" +
          '<div class="rchips">' + chip(Math.round(a.sum / a.n)) + '<span class="muted">prom ' + avg + "</span></div></div>"
        );
      })
      .join("");

    // Ejercicios que más cuestan (promedio del detalle por ejercicio).
    const exAgg = {};
    fbs.forEach((f) => {
      if (f.details) Object.keys(f.details).forEach((id) => {
        exAgg[id] = exAgg[id] || { sum: 0, n: 0 };
        exAgg[id].sum += f.details[id];
        exAgg[id].n++;
      });
    });
    const dificiles = Object.keys(exAgg)
      .map((id) => ({ id, avg: exAgg[id].sum / exAgg[id].n, n: exAgg[id].n }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 10)
      .map(
        (x) =>
          '<div class="rowitem"><div class="rowitem__info"><b>' + esc(exNombre(x.id)) + "</b>" +
          '<span class="muted">' + x.n + (x.n === 1 ? " respuesta" : " respuestas") + "</span></div>" +
          '<div class="rchips">' + chip(Math.round(x.avg)) + '<span class="muted">prom ' + x.avg.toFixed(1) + "</span></div></div>"
      )
      .join("");

    // Últimas respuestas (con nota y detalle por ejercicio si lo hay).
    const recientes = fbs
      .slice(0, 25)
      .map(
        (f) =>
          '<div class="rowitem"><div class="rowitem__info"><b>' + esc(userName[f.user_id] || "Alumno") + "</b>" +
          '<span class="muted">' + esc(sessionLabel(f)) + " · " + fmtDate(f.day) + (f.note ? ' · “' + esc(f.note) + "”" : "") + "</span>" +
          detLine(f) + "</div>" +
          '<div class="rchips">' + chip(f.rating) + "</div></div>"
      )
      .join("");

    const card = (titulo, contenido) =>
      '<section class="card"><h2>' + titulo + "</h2>" + '<div class="rowlist">' + contenido + "</div></section>";

    $app.innerHTML =
      editorTopbar('data-view="admin"') +
      '<main class="content admin">' +
      (fbs.length === 0
        ? '<section class="card"><h2>Feedback</h2><p class="muted">Todavía no hay respuestas. Cuando los alumnos terminen su rutina y califiquen, las vas a ver acá.</p></section>'
        : card("Por alumno (evolución)", porAlumno) +
          (dificiles ? card("Ejercicios que más cuestan", dificiles) : "") +
          (pizarrones ? card("Pizarrones — promedio del grupo", pizarrones) : "") +
          card("Últimas respuestas", recientes)) +
      "</main>";

    wireCommon(user);
  }

  /* ---------------- EDITOR DE RUTINAS (admin) ---------------- */

  // Estructuras vacías para empezar de cero.
  function newEx() { return { ex: "", prescription: "" }; }
  function newItem() { return { scheme: "", rest: "", note: "", exercises: [newEx()] }; }
  function newBlock() { return { name: "", scheme: "×3", note: "", items: [newItem()] }; }
  function newDay() { return { title: "", blocks: [newBlock()] }; }
  function blankBoard() {
    return { _isNew: true, id: null, kind: "board", title: "", content: { focus: "", blocks: [newBlock()] } };
  }
  function blankPlan() {
    return { _isNew: true, id: null, kind: "plan", title: "", content: { subtitle: "", objetivos: [""], days: [newDay()] } };
  }

  // Devuelve el array de bloques donde estamos parados: para un plan, los del
  // día "d"; para un pizarrón, los del contenido directo.
  function blocksAt(d) {
    if (editing.kind === "plan") return editing.content.days[d].blocks;
    return editing.content.blocks;
  }
  // atributo data-d solo cuando hay día (planes); vacío para pizarrones.
  function dAttr(d) { return d == null ? "" : ' data-d="' + d + '"'; }

  // Orden de los niveles (para ordenar dentro de cada categoría).
  const LEVEL_ORDER = { Principiante: 0, Intermedio: 1, Avanzado: 2 };

  // Opciones del desplegable de ejercicios: agrupadas por categoría (optgroup) y
  // ordenadas por nivel. Se arma en el momento desde la biblioteca viva.
  function exOptions(selected) {
    let html = '<option value="">— Elegí un ejercicio —</option>';
    const cats = FGC.exerciseCategories || [];
    const byCat = {};
    (FGC.exercises || []).forEach((e) => {
      const c = e.category || "Otros";
      (byCat[c] = byCat[c] || []).push(e);
    });
    // Primero las categorías conocidas en orden; después cualquier otra.
    const order = cats.concat(Object.keys(byCat).filter((c) => cats.indexOf(c) === -1));
    order.forEach((c) => {
      const list = byCat[c];
      if (!list || !list.length) return;
      list.sort((a, b) => ((LEVEL_ORDER[a.level] || 0) - (LEVEL_ORDER[b.level] || 0)) || a.name.localeCompare(b.name));
      html +=
        '<optgroup label="' + esc(c) + '">' +
        list.map((e) => '<option value="' + esc(e.id) + '"' + (e.id === selected ? " selected" : "") + ">" + esc(e.name) + "</option>").join("") +
        "</optgroup>";
    });
    return html;
  }

  async function renderEditor(user) {
    if (editing) return renderEditorForm(user);
    if (editingEx) return renderExerciseForm(user);
    if (exEditing) return renderExerciseManager(user);
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
    const [boards, plans] = await Promise.all([
      FGC.store.listRoutines("board"),
      FGC.store.listRoutines("plan"),
    ]);

    const card = (r, sub) =>
      '<div class="rowitem">' +
      '<div class="rowitem__info"><b>' + esc(r.title) + "</b>" +
      '<span class="muted">' + esc(sub) + "</span></div>" +
      '<div class="rowitem__acts">' +
      '<button class="btn btn--sm btn--ghost" data-edit="' + esc(r.id) + '">Editar</button>' +
      '<button class="btn btn--sm btn--danger" data-del="' + esc(r.id) + '">Borrar</button>' +
      "</div></div>";

    const listOr = (arr, sub, vacio) =>
      arr.length
        ? '<div class="rowlist">' + arr.map((r) => card(r, sub(r))).join("") + "</div>"
        : '<p class="muted">' + vacio + "</p>";

    $app.innerHTML =
      editorTopbar('data-view="admin"') +
      '<main class="content admin">' +
      '<section class="card">' +
      '<div class="row row--between">' +
      "<h2>Pizarrones</h2>" +
      '<button class="btn btn--sm" id="btnNewBoard">+ Nuevo pizarrón</button>' +
      "</div>" +
      listOr(boards, (r) => (r.content && r.content.focus) || "Pizarrón", "Todavía no hay pizarrones. Creá el primero 💪") +
      "</section>" +
      '<section class="card">' +
      '<div class="row row--between">' +
      "<h2>Planes avanzados</h2>" +
      '<button class="btn btn--sm" id="btnNewPlan">+ Nuevo plan</button>' +
      "</div>" +
      listOr(plans, (r) => {
        const n = r.content && r.content.days ? r.content.days.length : 0;
        return n + (n === 1 ? " día" : " días");
      }, "Todavía no hay planes. Creá el primero 💪") +
      "</section>" +
      '<section class="card">' +
      "<h2>Ejercicios y videos</h2>" +
      '<p class="muted">Editá la biblioteca y pegá los links de YouTube.</p>' +
      '<button class="btn btn--sm" id="btnExercises">Gestionar ejercicios 🎬</button>' +
      '<p class="ok" id="editorMsg" hidden></p>' +
      "</section>" +
      "</main>";

    wireCommon(user);

    document.getElementById("btnNewBoard").addEventListener("click", () => {
      editing = blankBoard();
      render(user);
    });
    document.getElementById("btnNewPlan").addEventListener("click", () => {
      editing = blankPlan();
      render(user);
    });
    document.getElementById("btnExercises").addEventListener("click", () => {
      exEditing = true;
      render(user);
    });

    $app.querySelectorAll("[data-edit]").forEach((b) =>
      b.addEventListener("click", async () => {
        const r = await FGC.store.getRoutine(b.getAttribute("data-edit"));
        if (!r) return;
        editing = JSON.parse(JSON.stringify(r)); // copia editable
        editing.content = editing.content || {};
        if (editing.kind === "plan") {
          editing.content.objetivos = editing.content.objetivos || [];
          editing.content.days = (editing.content.days && editing.content.days.length) ? editing.content.days : [newDay()];
        } else {
          editing.content.blocks = editing.content.blocks || [newBlock()];
        }
        render(user);
      })
    );

    $app.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", async () => {
        const id = b.getAttribute("data-del");
        if (!confirm("¿Seguro que querés borrar esta rutina? No se puede deshacer.")) return;
        const res = await FGC.store.deleteRoutine(id);
        if (res.error) return alert(res.error);
        render(user);
      })
    );
  }

  // ---- Render de bloques (compartido por pizarrones y planes) ----
  // d = índice de día (planes) o null (pizarrones).
  function exRowHTML(ex, bi, ii, ei, canRemove, d) {
    const base = ' data-b="' + bi + '" data-i="' + ii + '" data-e="' + ei + '"' + dAttr(d);
    return (
      '<div class="exrow">' +
      '<select class="field mini" data-loc="ex" data-k="ex"' + base + ">" + exOptions(ex.ex) + "</select>" +
      '<input class="field mini" type="text" placeholder="Reps / tiempo (ej: 10-12, 30”)" value="' + esc(ex.prescription) + '" data-loc="ex" data-k="prescription"' + base + " />" +
      (canRemove ? '<button type="button" class="iconbtn" title="Quitar ejercicio" data-act="delex"' + base + ">✕</button>" : "") +
      "</div>"
    );
  }

  function itemCardHTML(item, bi, ii, canRemove, d) {
    const bd = ' data-b="' + bi + '" data-i="' + ii + '"' + dAttr(d);
    return (
      '<div class="itemcard">' +
      (item.exercises || []).map((ex, ei) => exRowHTML(ex, bi, ii, ei, (item.exercises.length > 1), d)).join('<div class="supersep">+ superserie</div>') +
      '<button type="button" class="btn btn--xs btn--ghost" data-act="addex"' + bd + ">+ superserie</button>" +
      '<div class="itemmeta">' +
      '<input class="field mini" type="text" placeholder="Series (ej: ×3)" value="' + esc(item.scheme || "") + '" data-loc="item" data-k="scheme"' + bd + " />" +
      '<input class="field mini" type="text" placeholder="Descanso (ej: 1 min)" value="' + esc(item.rest || "") + '" data-loc="item" data-k="rest"' + bd + " />" +
      "</div>" +
      '<input class="field mini" type="text" placeholder="Nota (opcional)" value="' + esc(item.note || "") + '" data-loc="item" data-k="note"' + bd + " />" +
      (canRemove ? '<button type="button" class="linkbtn linkbtn--danger" data-act="delitem"' + bd + ">Quitar línea</button>" : "") +
      "</div>"
    );
  }

  function blockCardHTML(block, bi, canRemove, d) {
    const bd = ' data-b="' + bi + '"' + dAttr(d);
    return (
      '<section class="blockcard">' +
      '<div class="row row--between">' +
      '<input class="field" type="text" placeholder="Nombre del bloque (ej: Zona media)" value="' + esc(block.name || "") + '" data-loc="block" data-k="name"' + bd + " />" +
      (canRemove ? '<button type="button" class="iconbtn" title="Quitar bloque" data-act="delblock"' + bd + ">🗑</button>" : "") +
      "</div>" +
      '<div class="itemmeta">' +
      '<input class="field mini" type="text" placeholder="Series del bloque (ej: ×3)" value="' + esc(block.scheme || "") + '" data-loc="block" data-k="scheme"' + bd + " />" +
      "</div>" +
      '<input class="field mini" type="text" placeholder="Nota del bloque (opcional)" value="' + esc(block.note || "") + '" data-loc="block" data-k="note"' + bd + " />" +
      (block.items || []).map((item, ii) => itemCardHTML(item, bi, ii, (block.items.length > 1), d)).join("") +
      '<button type="button" class="btn btn--sm btn--ghost" data-act="additem"' + bd + ">+ Agregar línea</button>" +
      "</section>"
    );
  }

  // Cáscara común del formulario (título dinámico + botones guardar/cancelar).
  function editorShell(user, title, bodyHTML) {
    $app.innerHTML =
      editorTopbar('id="btnCancelEditor"') +
      '<main class="content admin editor">' +
      '<section class="card">' +
      "<h2>" + esc(title) + "</h2>" +
      bodyHTML +
      '<p class="login__err" id="editErr" hidden></p>' +
      '<div class="row row--end">' +
      '<button type="button" class="btn btn--ghost" id="btnCancelEditor2">Cancelar</button>' +
      '<button type="button" class="btn" id="btnSaveRoutine">Guardar</button>' +
      "</div>" +
      "</section>" +
      "</main>";
    wireEditorForm(user);
  }

  function renderEditorForm(user) {
    return editing.kind === "plan" ? renderPlanForm(user) : renderBoardForm(user);
  }

  // Formulario de un PIZARRÓN.
  function renderBoardForm(user) {
    const c = editing.content;
    editorShell(
      user,
      editing._isNew ? "Nuevo pizarrón" : "Editar pizarrón",
      '<input class="field" type="text" placeholder="Título (ej: Pizarrón — Tren superior)" value="' + esc(editing.title || "") + '" data-loc="title" />' +
        '<input class="field" type="text" placeholder="Enfoque (ej: Tren superior)" value="' + esc(c.focus || "") + '" data-loc="focus" />' +
        (c.blocks || []).map((block, bi) => blockCardHTML(block, bi, (c.blocks.length > 1), null)).join("") +
        '<button type="button" class="btn btn--sm btn--ghost" data-act="addblock">+ Agregar bloque</button>'
    );
  }

  // Formulario de un PLAN (subtítulo + objetivos + días con bloques).
  function renderPlanForm(user) {
    const c = editing.content;
    const objRow = (o, oi) =>
      '<div class="exrow">' +
      '<input class="field mini" type="text" placeholder="Objetivo del plan" value="' + esc(o) + '" data-loc="obj" data-o="' + oi + '" />' +
      '<button type="button" class="iconbtn" title="Quitar objetivo" data-act="delobj" data-o="' + oi + '">✕</button>' +
      "</div>";
    const dayCard = (day, di, canRemove) =>
      '<section class="daycard">' +
      '<div class="row row--between">' +
      '<input class="field" type="text" placeholder="Título del día (ej: Día 1 — Vertical)" value="' + esc(day.title || "") + '" data-loc="day" data-d="' + di + '" />' +
      (canRemove ? '<button type="button" class="iconbtn" title="Quitar día" data-act="delday" data-d="' + di + '">🗑</button>' : "") +
      "</div>" +
      (day.blocks || []).map((block, bi) => blockCardHTML(block, bi, (day.blocks.length > 1), di)).join("") +
      '<button type="button" class="btn btn--sm btn--ghost" data-act="addblock" data-d="' + di + '">+ Agregar bloque</button>' +
      "</section>";
    editorShell(
      user,
      editing._isNew ? "Nuevo plan" : "Editar plan",
      '<input class="field" type="text" placeholder="Título (ej: Programa 3 días)" value="' + esc(editing.title || "") + '" data-loc="title" />' +
        '<input class="field" type="text" placeholder="Subtítulo (ej: Semanas 1 a 5)" value="' + esc(c.subtitle || "") + '" data-loc="subtitle" />' +
        '<p class="editor__label">Objetivos</p>' +
        (c.objetivos || []).map(objRow).join("") +
        '<button type="button" class="btn btn--xs btn--ghost" data-act="addobj">+ Agregar objetivo</button>' +
        '<p class="editor__label">Días</p>' +
        (c.days || []).map((day, di) => dayCard(day, di, (c.days.length > 1))).join("") +
        '<button type="button" class="btn btn--sm" data-act="addday">+ Agregar día</button>'
    );
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
        const b = +el.dataset.b, i = +el.dataset.i, e = +el.dataset.e, o = +el.dataset.o;
        const d = el.dataset.d !== undefined ? +el.dataset.d : null;
        const c = editing.content;
        switch (el.dataset.act) {
          case "addblock": blocksAt(d).push(newBlock()); break;
          case "delblock": blocksAt(d).splice(b, 1); break;
          case "additem": blocksAt(d)[b].items.push(newItem()); break;
          case "delitem": blocksAt(d)[b].items.splice(i, 1); break;
          case "addex": blocksAt(d)[b].items[i].exercises.push(newEx()); break;
          case "delex": blocksAt(d)[b].items[i].exercises.splice(e, 1); break;
          case "addday": c.days.push(newDay()); break;
          case "delday": c.days.splice(d, 1); break;
          case "addobj": c.objetivos.push(""); break;
          case "delobj": c.objetivos.splice(o, 1); break;
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
    const b = +el.dataset.b, i = +el.dataset.i, e = +el.dataset.e, o = +el.dataset.o, k = el.dataset.k;
    const d = el.dataset.d !== undefined ? +el.dataset.d : null;
    const c = editing.content;
    switch (el.dataset.loc) {
      case "title": editing.title = v; break;
      case "focus": c.focus = v; break;
      case "subtitle": c.subtitle = v; break;
      case "obj": c.objetivos[o] = v; break;
      case "day": c.days[d].title = v; break;
      case "block": blocksAt(d)[b][k] = v; break;
      case "item": blocksAt(d)[b].items[i][k] = v; break;
      case "ex": blocksAt(d)[b].items[i].exercises[e][k] = v; break;
    }
  }

  // Limpia bloques: recorta textos y descarta ejercicios sin elegir y líneas vacías.
  function cleanBlocks(blocks) {
    return (blocks || []).map((bl) => ({
      name: (bl.name || "").trim(),
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
    }));
  }

  // Valida un array de bloques; devuelve un mensaje de error o null.
  function blocksError(blocks, donde) {
    if (!blocks.length) return "Agregá al menos un bloque" + donde + ".";
    for (const bl of blocks) {
      if (!String(bl.name).trim()) return "Cada bloque necesita un nombre" + donde + ".";
      const items = (bl.items || []).filter((it) => (it.exercises || []).some((x) => x.ex));
      if (!items.length) return 'El bloque "' + (bl.name || "") + '" necesita una línea con un ejercicio elegido.';
    }
    return null;
  }

  async function saveRoutine(user) {
    const err = document.getElementById("editErr");
    const showErr = (m) => { err.hidden = false; err.textContent = m; };
    const c = editing.content;
    if (!editing.title.trim()) return showErr("Ponele un título.");

    let payload;
    if (editing.kind === "plan") {
      const days = c.days || [];
      if (!days.length) return showErr("Agregá al menos un día.");
      for (let di = 0; di < days.length; di++) {
        if (!String(days[di].title).trim()) return showErr("El Día " + (di + 1) + " necesita un título.");
        const e = blocksError(days[di].blocks || [], " en " + (days[di].title || ("Día " + (di + 1))));
        if (e) return showErr(e);
      }
      payload = {
        id: editing._isNew ? FGC.slugId(editing.title, "plan") : editing.id,
        kind: "plan",
        title: editing.title.trim(),
        content: {
          subtitle: (c.subtitle || "").trim(),
          objetivos: (c.objetivos || []).map((o) => String(o).trim()).filter(Boolean),
          days: days.map((d) => ({ title: d.title.trim(), blocks: cleanBlocks(d.blocks) })),
        },
      };
    } else {
      const e = blocksError(c.blocks || [], "");
      if (e) return showErr(e);
      payload = {
        id: editing._isNew ? FGC.slugId(editing.title, "board") : editing.id,
        kind: "board",
        title: editing.title.trim(),
        content: { focus: (c.focus || "").trim(), blocks: cleanBlocks(c.blocks) },
      };
    }

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
    if (msg) { msg.hidden = false; msg.textContent = "✓ Guardado"; setTimeout(() => (msg.hidden = true), 2500); }
  }

  // ---- Gestor de ejercicios (biblioteca + videos) ----
  async function renderExerciseManager(user) {
    const all = await FGC.store.listExercises();
    const list = exFilter ? all.filter((e) => e.category === exFilter) : all;

    // Chips de filtro por categoría (Todas + cada categoría).
    const cats = FGC.exerciseCategories || [];
    const chip = (label, value) =>
      '<button class="chipbtn' + ((exFilter === value) ? " is-active" : "") + '" data-filter="' + esc(value == null ? "" : value) + '">' + esc(label) + "</button>";
    const filters = '<div class="chiprow">' + chip("Todas", null) + cats.map((c) => chip(c, c)).join("") + "</div>";

    const row = (e) =>
      '<div class="rowitem">' +
      '<div class="rowitem__info"><b>' + esc(e.name) + "</b>" +
      '<span class="muted">' + esc(e.category || "—") + " · " + esc(e.level || "—") + " · " + (e.video ? "🎬 con video" : "sin video") + "</span></div>" +
      '<div class="rowitem__acts">' +
      '<button class="btn btn--sm btn--ghost" data-editex="' + esc(e.id) + '">Editar</button>' +
      '<button class="btn btn--sm btn--danger" data-delex="' + esc(e.id) + '">Borrar</button>' +
      "</div></div>";

    $app.innerHTML =
      editorTopbar('id="btnBackToEditor"') +
      '<main class="content admin">' +
      '<section class="card">' +
      '<div class="row row--between">' +
      "<h2>Ejercicios (" + list.length + (exFilter ? " de " + all.length : "") + ")</h2>" +
      '<button class="btn btn--sm" id="btnNewEx">+ Nuevo ejercicio</button>' +
      "</div>" +
      filters +
      (list.length ? '<div class="rowlist">' + list.map(row).join("") + "</div>" : '<p class="muted">No hay ejercicios en esta categoría.</p>') +
      '<p class="ok" id="exMsg" hidden></p>' +
      "</section>" +
      "</main>";

    const logout = document.getElementById("btnLogout");
    if (logout) logout.addEventListener("click", () => FGC.auth.logout());
    document.getElementById("btnBackToEditor").addEventListener("click", () => { exEditing = false; exFilter = null; render(user); });
    document.getElementById("btnNewEx").addEventListener("click", () => {
      editingEx = { _isNew: true, id: null, name: "", muscle: "", video: "", category: exFilter || "Empuje", level: "Principiante" };
      render(user);
    });
    $app.querySelectorAll("[data-filter]").forEach((b) =>
      b.addEventListener("click", () => {
        const v = b.getAttribute("data-filter");
        exFilter = v || null;
        render(user);
      })
    );

    $app.querySelectorAll("[data-editex]").forEach((b) =>
      b.addEventListener("click", async () => {
        const e = await FGC.store.getExercise(b.getAttribute("data-editex"));
        if (!e) return;
        editingEx = { _isNew: false, id: e.id, name: e.name || "", muscle: e.muscle || "", video: e.video || "", category: e.category || "Empuje", level: e.level || "Principiante" };
        render(user);
      })
    );
    $app.querySelectorAll("[data-delex]").forEach((b) =>
      b.addEventListener("click", async () => {
        if (!confirm("¿Borrar este ejercicio de la biblioteca? Las rutinas que lo usen mostrarán su código en vez del nombre.")) return;
        const res = await FGC.store.deleteExercise(b.getAttribute("data-delex"));
        if (res.error) return alert(res.error);
        await refreshExercises();
        render(user);
      })
    );
  }

  function renderExerciseForm(user) {
    const e = editingEx;
    $app.innerHTML =
      editorTopbar('id="btnCancelEx"') +
      '<main class="content admin editor">' +
      '<section class="card">' +
      "<h2>" + (e._isNew ? "Nuevo ejercicio" : "Editar ejercicio") + "</h2>" +
      '<input class="field" id="exName" type="text" placeholder="Nombre (ej: Muscle up)" value="' + esc(e.name) + '" />' +
      '<div class="itemmeta">' +
      '<select class="field mini" id="exCategory">' +
      (FGC.exerciseCategories || []).map((c) => '<option value="' + esc(c) + '"' + (c === e.category ? " selected" : "") + ">" + esc(c) + "</option>").join("") +
      "</select>" +
      '<select class="field mini" id="exLevel">' +
      (FGC.exerciseLevels || []).map((l) => '<option value="' + esc(l) + '"' + (l === e.level ? " selected" : "") + ">" + esc(l) + "</option>").join("") +
      "</select>" +
      "</div>" +
      '<input class="field" id="exMuscle" type="text" placeholder="Músculo principal (ej: Espalda)" value="' + esc(e.muscle) + '" />' +
      '<input class="field" id="exVideo" type="text" placeholder="Link de YouTube (opcional)" value="' + esc(e.video) + '" />' +
      '<p class="muted">Pegá el link de YouTube (ej: https://youtu.be/AbC…). Si lo dejás vacío, se muestra “video próximamente”.</p>' +
      '<p class="login__err" id="exErr" hidden></p>' +
      '<div class="row row--end">' +
      '<button type="button" class="btn btn--ghost" id="btnCancelEx2">Cancelar</button>' +
      '<button type="button" class="btn" id="btnSaveEx">Guardar</button>' +
      "</div>" +
      "</section>" +
      "</main>";

    const logout = document.getElementById("btnLogout");
    if (logout) logout.addEventListener("click", () => FGC.auth.logout());
    const cancel = () => { editingEx = null; render(user); };
    document.getElementById("btnCancelEx").addEventListener("click", cancel);
    document.getElementById("btnCancelEx2").addEventListener("click", cancel);
    document.getElementById("btnSaveEx").addEventListener("click", () => saveExercise(user));
  }

  async function saveExercise(user) {
    const err = document.getElementById("exErr");
    const showErr = (m) => { err.hidden = false; err.textContent = m; };
    const name = document.getElementById("exName").value.trim();
    const muscle = document.getElementById("exMuscle").value.trim();
    const video = document.getElementById("exVideo").value.trim();
    const category = document.getElementById("exCategory").value;
    const level = document.getElementById("exLevel").value;
    if (!name) return showErr("Ponele un nombre al ejercicio.");

    const payload = {
      id: editingEx._isNew ? FGC.slugify(name, "ejercicio") + "-" + Math.random().toString(36).slice(2, 6) : editingEx.id,
      name: name,
      muscle: muscle,
      category: category,
      level: level,
      video: video || null,
    };
    const btn = document.getElementById("btnSaveEx");
    btn.disabled = true;
    btn.textContent = "Guardando…";
    const res = await FGC.store.saveExercise(payload);
    btn.disabled = false;
    btn.textContent = "Guardar";
    if (res.error) return showErr(res.error);

    await refreshExercises();
    editingEx = null;
    await renderEditor(user);
    const msg = document.getElementById("exMsg");
    if (msg) { msg.hidden = false; msg.textContent = "✓ Ejercicio guardado"; setTimeout(() => (msg.hidden = true), 2500); }
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
