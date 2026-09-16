/*
 * ui.js — Helpers de interfaz y render de rutinas
 * -------------------------------------------------
 * Funciones puras que arman HTML. No hablan con la base: reciben datos ya
 * cargados. El objetivo es que board y plan compartan el mismo dibujo.
 */
window.FGC = window.FGC || {};

(function () {
  // Escapa texto para evitar romper el HTML (o inyecciones).
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  // Índice de ejercicios: usamos el índice VIVO (FGC.exIndex), que se actualiza
  // cuando la biblioteca se carga desde Supabase o el profe edita un ejercicio.
  function exFind(id) {
    return (FGC.exIndex && FGC.exIndex[id]) || null;
  }

  // Convierte un link/id de YouTube en URL embebible sin cookies.
  function youtubeEmbed(video) {
    if (!video) return null;
    let id = video;
    const m = String(video).match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
    if (m) id = m[1];
    return "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id);
  }

  // Un ejercicio dentro de un item (con botón de "cómo se hace").
  function renderExercise(e) {
    const ex = exFind(e.ex) || { name: e.ex, video: null };
    const hasVideo = !!ex.video;
    return (
      '<button class="exercise" data-ex="' + esc(e.ex) + '" ' +
      (hasVideo ? "" : 'data-novideo="1" ') +
      'title="' + (hasVideo ? "Ver cómo se hace" : "Video próximamente") + '">' +
      '<span class="exercise__reps">' + esc(e.prescription || "") + "</span>" +
      '<span class="exercise__name">' + esc(ex.name) + "</span>" +
      '<span class="exercise__play">' + (hasVideo ? "▶" : "🎬") + "</span>" +
      "</button>"
    );
  }

  // Un item = una línea (puede ser superserie: varios ejercicios con +).
  function renderItem(item) {
    const parts = (item.exercises || []).map(renderExercise).join('<span class="plus">+</span>');
    const meta = [];
    if (item.scheme) meta.push('<span class="chip chip--scheme">' + esc(item.scheme) + "</span>");
    if (item.rest) meta.push('<span class="chip">⏱ ' + esc(item.rest) + "</span>");
    return (
      '<li class="item">' +
      '<div class="item__ex">' + parts + "</div>" +
      (meta.length ? '<div class="item__meta">' + meta.join("") + "</div>" : "") +
      (item.note ? '<div class="item__note">' + esc(item.note) + "</div>" : "") +
      "</li>"
    );
  }

  // Un bloque (Zona media, Principal, Complemento, Entrada en calor...).
  function renderBlock(block) {
    return (
      '<section class="block">' +
      '<header class="block__head">' +
      "<h3>" + esc(block.name) + "</h3>" +
      (block.scheme ? '<span class="chip chip--scheme">' + esc(block.scheme) + "</span>" : "") +
      "</header>" +
      (block.note ? '<p class="block__note">' + esc(block.note) + "</p>" : "") +
      '<ul class="items">' + (block.items || []).map(renderItem).join("") + "</ul>" +
      "</section>"
    );
  }

  // Render del PIZARRÓN.
  function renderBoard(routine) {
    if (!routine) {
      return '<div class="empty">Todavía no hay pizarrón cargado para hoy. Volvé más tarde 💪</div>';
    }
    const c = routine.content;
    return (
      '<article class="routine">' +
      '<div class="routine__head">' +
      '<span class="tag tag--board">Pizarrón del día</span>' +
      "<h2>" + esc(routine.title) + "</h2>" +
      (c.focus ? '<p class="routine__focus">Enfoque: ' + esc(c.focus) + "</p>" : "") +
      "</div>" +
      (c.blocks || []).map(renderBlock).join("") +
      "</article>"
    );
  }

  // Render de un PLAN (con navegación por días).
  function renderPlan(routine, dayIndex) {
    if (!routine) return "";
    const c = routine.content;
    const days = c.days || [];
    const idx = Math.max(0, Math.min(dayIndex || 0, days.length - 1));
    const day = days[idx];

    const tabs = days
      .map(
        (d, i) =>
          '<button class="daytab' + (i === idx ? " is-active" : "") + '" data-day="' + i + '">' +
          "Día " + (i + 1) + "</button>"
      )
      .join("");

    return (
      '<article class="routine">' +
      '<div class="routine__head">' +
      '<span class="tag tag--plan">Mi planificación</span>' +
      "<h2>" + esc(routine.title) + "</h2>" +
      (c.subtitle ? '<p class="routine__focus">' + esc(c.subtitle) + "</p>" : "") +
      "</div>" +
      (c.objetivos && c.objetivos.length
        ? '<details class="objetivos"><summary>Objetivos del plan</summary><ul>' +
          c.objetivos.map((o) => "<li>" + esc(o) + "</li>").join("") +
          "</ul></details>"
        : "") +
      '<nav class="daytabs">' + tabs + "</nav>" +
      (day
        ? '<h3 class="day__title">' + esc(day.title) + "</h3>" +
          (day.blocks || []).map(renderBlock).join("")
        : "") +
      "</article>"
    );
  }

  // Modal para ver "cómo se hace" (video del profe).
  function openExerciseModal(exId) {
    const ex = exFind(exId);
    if (!ex) return;
    const embed = youtubeEmbed(ex.video);
    const body = embed
      ? '<div class="video"><iframe src="' + embed + '" title="' + esc(ex.name) +
        '" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>'
      : '<div class="video video--soon"><span>🎬</span><p>Video próximamente.<br>El profe lo va a subir acá.</p></div>';

    const overlay = document.createElement("div");
    overlay.className = "modal";
    overlay.innerHTML =
      '<div class="modal__card">' +
      '<button class="modal__close" aria-label="Cerrar">✕</button>' +
      "<h3>" + esc(ex.name) + "</h3>" +
      '<p class="modal__muscle">' + esc(ex.muscle || "") + "</p>" +
      body +
      "</div>";
    function close() {
      overlay.remove();
      document.removeEventListener("keydown", onKey);
    }
    function onKey(e) {
      if (e.key === "Escape") close();
    }
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target.classList.contains("modal__close")) close();
    });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(overlay);
  }

  FGC.ui = { esc, renderBoard, renderPlan, renderBlock, openExerciseModal, youtubeEmbed };
})();
