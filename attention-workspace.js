/* Espacio de atención: buscador contextual, cierre y vista para mostrar. */
let drawerOpen = false,
  drawerSearch = "",
  drawerLimit = 20,
  drawerScope = "Cartera",
  presenting = false;
let attentionClient = 0,
  attentionOwner = -1,
  attentionStart = 0,
  attentionBaseline = 0;
const completedAttention = new Set(),
  attentionJournal = [],
  attentionDrafts = new Map();
let draftKey = "",
  draftInitial = "",
  restoreFocus = null;
const modalBase7 = modal;
const renderBase7 = render,
  routeBase7 = route,
  navBase7 = nav,
  activityBase7 = openActivity,
  saveBase7 = saveActivity,
  closeBase7 = closeModal,
  processBase7 = openProcess;
function attentionContext() {
  if (role !== "exec") return null;
  if (view === "cliente") return scope().find((c) => c.id === selected) || null;
  if (view === "campanas" && campaignClient)
    return scope().find((c) => c.id === campaignClient) || null;
  return null;
}
function attentionArea() {
  return role === "exec" && (view === "atencion" || !!attentionContext());
}
function attentionKey(c, tid) {
  return activeExecutive + ":" + c.id + ":" + tid;
}
function beginAttention(c) {
  if (!c) return;
  if (attentionClient !== c.id || attentionOwner !== activeExecutive) {
    attentionClient = c.id;
    attentionOwner = activeExecutive;
    attentionStart = Date.now();
    attentionBaseline = c.notes.length;
  }
}
modal = function (title, body) {
  syncDraft();
  draftKey = "";
  draftInitial = "";
  modalBase7(title, body);
};
function syncDraft() {
  const f = $("#activity");
  if (!draftKey || !f) return;
  const d = Object.fromEntries(new FormData(f));
  if (JSON.stringify(d) !== draftInitial) attentionDrafts.set(draftKey, d);
}
function restoreActivityDraft() {
  const f = $("#activity");
  if (!f) return;
  const c = scope().find((c) => c.id === +f.dataset.clientId),
    tid = $("#activityTask").value;
  if (!c) return;
  draftKey = attentionKey(c, tid);
  const draft = attentionDrafts.get(draftKey);
  if (draft) {
    for (const [k, v] of Object.entries(draft)) {
      const el = f.elements.namedItem(k);
      if (el && el.type !== "checkbox") el.value = v;
    }
    updateActivityControls(c);
  }
  draftInitial = JSON.stringify(Object.fromEntries(new FormData(f)));
  f.addEventListener("input", syncDraft);
  f.addEventListener("change", syncDraft);
}
function drawerRows() {
  const context =
    drawerScope === "Campaña" && campaignName
      ? scope().filter((c) => ensureTasks(c).some((t) => t.name === campaignName))
      : scope();
  return context.filter(
    (c) => !drawerSearch || normalized(c.name + c.dni + c.phone).includes(normalized(drawerSearch)),
  );
}
function drawerBody() {
  const rows = drawerRows();
  return (
    '<div class="drawer7-head"><div><h2>Buscar o cambiar cliente</h2><p class="sub">Solo tu cartera · ' +
    scope().length +
    ' clientes</p></div><button aria-label="Cerrar buscador" onclick="toggleDrawer(false)">×</button></div>' +
    (campaignName
      ? '<label>Buscar en<select aria-label="Alcance del buscador" onchange="drawerScope=this.value;drawerLimit=20;paintDrawer()">' +
        opts(["Campaña", "Cartera"], drawerScope) +
        '</select></label><p class="small muted">Campaña actual: ' +
        esc(campaignName) +
        "</p>"
      : "") +
    '<label class="drawer-search">Nombre, DNI o celular<input id="attentionSearch" value="' +
    esc(drawerSearch) +
    '" autocomplete="off" placeholder="Ej. Lucía o 42000001" oninput="drawerSearch=this.value;drawerLimit=20;paintDrawerResults()"></label><div id="drawerResults">' +
    drawerResultsHTML(rows) +
    "</div>"
  );
}
function drawerResultsHTML(rows) {
  return (
    '<p class="small muted" aria-live="polite">' +
    rows.length +
    " coincidencias</p>" +
    rows
      .slice(0, drawerLimit)
      .map(
        (c) =>
          '<button class="drawer7-client ' +
          (c.id === attentionClient ? "current" : "") +
          '" onclick="switchAttention(' +
          c.id +
          ')"><span class="avatar">' +
          initials(c.name) +
          "</span><span><b>" +
          esc(c.name) +
          "</b><small>DNI " +
          c.dni +
          "</small><small>" +
          (completedAttention.has(activeExecutive + ":" + c.id)
            ? "Atendido en esta sesión"
            : c.id === attentionClient
              ? "En atención"
              : "Disponible para atender") +
          '</small></span><span aria-hidden="true">→</span></button>',
      )
      .join("") +
    (rows.length > drawerLimit
      ? '<button class="textbtn" onclick="drawerLimit+=20;paintDrawerResults()">Mostrar más</button>'
      : "") +
    (rows.length
      ? ""
      : '<div class="empty">No hay coincidencias en este grupo. Revisa el DNI o cambia el alcance de búsqueda.</div>')
  );
}
function paintDrawer() {
  $("#attentionDrawer").innerHTML = drawerBody();
}
function paintDrawerResults() {
  $("#drawerResults").innerHTML = drawerResultsHTML(drawerRows());
}
function toggleDrawer(open) {
  if (!attentionArea() || presenting) return;
  drawerOpen = open === undefined ? !drawerOpen : open;
  if (drawerOpen) restoreFocus = document.activeElement;
  render();
  if (drawerOpen) $("#attentionSearch")?.focus();
  else $("#toggleClients")?.focus();
}
function openAttention() {
  drawerOpen = true;
  drawerSearch = "";
  drawerScope = "Cartera";
  campaignName = "";
  campaignClient = 0;
  selected = 0;
  attentionClient = 0;
  view = "atencion";
  location.hash = "atencion";
  render();
}
function switchAttention(id) {
  const c = scope().find((c) => c.id === id);
  if (!c) return;
  const current = attentionContext();
  if (current && current.id !== id) {
    modal(
      "Cambiar de cliente",
      "<p>¿Quieres finalizar la atención de " +
        esc(current.name) +
        " antes de abrir a " +
        esc(c.name) +
        '?</p><p class="sub">Las gestiones guardadas se conservan. Puedes cambiar sin finalizar y retomar después.</p><div class="modal-actions"><button onclick="closeModal()">Cancelar</button><button onclick="closeModal();navigateAttention(' +
        id +
        ')">Cambiar sin finalizar</button><button class="primary" onclick="finishForSwitch(' +
        id +
        ')">Finalizar y cambiar</button></div>',
    );
    return;
  }
  navigateAttention(id);
}
function navigateAttention(id) {
  const c = scope().find((c) => c.id === id);
  if (!c) return;
  drawerOpen = false;
  presenting = false;
  if (
    drawerScope === "Campaña" &&
    campaignName &&
    ensureTasks(c).some((t) => t.name === campaignName)
  ) {
    goCampaign6(campaignName, id);
  } else {
    contextTask = null;
    campaignClient = 0;
    selected = id;
    view = "cliente";
    tab = "Resumen";
    location.hash = "cliente/" + id;
    render();
  }
  beginAttention(c);
}
function finishForSwitch(id) {
  const c = attentionContext();
  if (c && c.notes.length <= attentionBaseline) {
    closeModal();
    finishAttentionPrompt(id);
    return;
  }
  if (c) recordAttentionEnd(c, "Gestión guardada");
  closeModal();
  navigateAttention(id);
}
function recordAttentionEnd(c, result) {
  attentionJournal.unshift({
    clientId: c.id,
    owner: activeExecutive,
    started: attentionStart,
    ended: Date.now(),
    result,
  });
  completedAttention.add(activeExecutive + ":" + c.id);
  attentionClient = 0;
  attentionStart = 0;
  attentionBaseline = 0;
  contextTask = null;
}
function finishAttentionPrompt(nextId = 0) {
  const c = attentionContext();
  if (!c) return;
  const saved = c.notes.length > attentionBaseline;
  modal(
    "Terminar atención",
    "<p><b>" +
      esc(c.name) +
      "</b></p><p>" +
      (saved
        ? "Las gestiones registradas ya están guardadas. Al finalizar se cerrará la ficha."
        : "Aún no registraste una gestión en esta atención. Puedes registrarla ahora o cerrar como consulta informativa.") +
      '</p><p class="sub">Terminar la atención no cierra un expediente ni confirma una venta.</p><div class="modal-actions"><button onclick="closeModal()">Continuar atención</button>' +
      (!saved
        ? '<button onclick="closeModal();openService8(' + c.id + ')">Registrar gestión</button>'
        : "") +
      '<button class="primary" onclick="completeAttention(' +
      nextId +
      ')">' +
      (saved ? "Finalizar atención" : "Finalizar consulta sin gestión") +
      "</button></div>",
  );
}
function completeAttention(nextId = 0) {
  const c =
    attentionContext() ||
    scope().find((c) => c.id === attentionClient && c.owner === activeExecutive);
  if (c)
    recordAttentionEnd(
      c,
      c.notes.length > attentionBaseline ? "Gestión guardada" : "Consulta sin gestión",
    );
  closeModal();
  selected = 0;
  campaignClient = 0;
  presenting = false;
  if (nextId) {
    navigateAttention(nextId);
    return;
  }
  drawerOpen = true;
  drawerSearch = "";
  view = "atencion";
  location.hash = "atencion";
  render();
  $("#attentionSearch")?.focus();
}
function blankAttention() {
  return (
    '<section class="attention-empty"><div class="eyebrow">ESPACIO DE ATENCIÓN</div><h1>¿A quién atenderás ahora?</h1><p>Selecciona un cliente para consultar su ficha y gestionar su atención.</p><button class="primary" onclick="toggleDrawer(true)">Buscar cliente</button><p class="sub">' +
    (attentionJournal.length
      ? "La atención anterior finalizó. Sus registros están guardados."
      : "Tu avance y tus metas permanecen en el Panel del ejecutivo.") +
    "</p></section>"
  );
}
render = function () {
  const c = attentionContext();
  beginAttention(c);
  if (role !== "exec") presenting = false;
  document.body.classList.toggle("show-client7", presenting && !!c);
  renderBase7();
  if (view === "atencion" && role === "exec") $("#main").innerHTML = blankAttention();
  const area = attentionArea();
  $(".workarea").classList.toggle("drawer-open7", area && drawerOpen);
  if (area) {
    $("#main").insertAdjacentHTML(
      "afterbegin",
      '<div class="attention-toolbar7"><div><b>Atención al cliente</b><small>Espacio interno del ejecutivo</small></div><div class="actions">' +
        (c
          ? serviceButton8(c) +
            '<button onclick="finishAttentionPrompt()">Terminar atención</button>'
          : "") +
        '<button id="toggleClients" class="primary" aria-controls="attentionDrawer" aria-expanded="' +
        drawerOpen +
        '" onclick="toggleDrawer()">' +
        (drawerOpen ? "Ocultar buscador" : "Buscar o cambiar cliente") +
        "</button></div></div>",
    );
    if (drawerOpen)
      $("#main").insertAdjacentHTML(
        "beforeend",
        '<section id="attentionDrawer" aria-label="Buscador de clientes" class="drawer7">' +
          drawerBody() +
          "</section>",
      );
  }
  if (role === "exec" && view === "inicio")
    $("#main").insertAdjacentHTML(
      "afterbegin",
      // El banner repetía como título lo que el menú ya dice y lo que el h1 de
      // abajo vuelve a decir: tres veces la misma etiqueta antes del primer
      // dato. Queda solo lo que no estaba en ninguna otra parte: empezar.
      '<div class="workspace-intro7"><button class="primary" onclick="openAttention()">Iniciar atención →</button></div>',
    );
};
nav = function () {
  navBase7();
  if (role === "exec")
    $("#nav").innerHTML = $("#nav").innerHTML.replace(">Mi día</a>", ">Panel del ejecutivo</a>");
};
openActivity = function (id, tid) {
  activityBase7(id, tid);
  if (role !== "exec" || !$("#activity")) return;
  const c = scope().find((c) => c.id === id);
  beginAttention(c);
  restoreActivityDraft();
  $("#activity .modal-actions").insertAdjacentHTML(
    "beforeend",
    '<button class="primary" type="button" onclick="saveAndEndAttention()">Guardar y finalizar atención</button>',
  );
  $("#activityHint").textContent +=
    " Guardar mantiene la ficha abierta. Guardar y finalizar cierra la atención y vuelve al buscador.";
  $("#activityTask").addEventListener("change", restoreActivityDraft);
};
closeModal = function () {
  syncDraft();
  closeBase7();
  draftKey = "";
  draftInitial = "";
};
function saveCurrentAttention() {
  const f = $("#activity");
  if (!f || !f.reportValidity()) return false;
  const id = +f.dataset.clientId,
    c = scope().find((c) => c.id === id);
  if (!c) return false;
  const count = c.notes.length,
    key = draftKey;
  draftKey = "";
  saveBase7(false);
  if (c.notes.length === count) {
    draftKey = key;
    return false;
  }
  attentionDrafts.delete(key);
  return true;
}
function saveAndEndAttention() {
  if (!saveCurrentAttention()) return;
  completeAttention();
}
saveActivity = function (next) {
  const c =
    attentionContext() ||
    scope().find((c) => c.id === attentionClient && c.owner === activeExecutive);
  if (!saveCurrentAttention()) return;
  if (!next) return;
  const rows = drawerRows(),
    index = rows.findIndex((x) => x.id === c?.id),
    following = rows
      .slice(index + 1)
      .find((x) => !completedAttention.has(activeExecutive + ":" + x.id));
  if (c) recordAttentionEnd(c, "Gestión guardada");
  closeBase7();
  if (following) {
    navigateAttention(following.id);
    openActivity(
      following.id,
      drawerScope === "Campaña"
        ? ensureTasks(following).find((t) => t.name === campaignName)?.id
        : undefined,
    );
  } else {
    selected = 0;
    campaignClient = 0;
    drawerOpen = true;
    view = "atencion";
    location.hash = "atencion";
    render();
  }
};
route = function () {
  presenting = false;
  const p = location.hash.slice(1).split("/");
  if (p[0] === "atencion") {
    view = role === "exec" ? "atencion" : "inicio";
    render();
    return;
  }
  if (p[0] === "campanas" && p[2]) drawerScope = "Campaña";
  if (p[0] === "cliente" && view !== "atencion") drawerScope = "Cartera";
  routeBase7();
};
window.removeEventListener("hashchange", routeBase7);
window.addEventListener("hashchange", route);
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && drawerOpen && !$("#dialog").open) {
    toggleDrawer(false);
  }
});
$("#dialog").addEventListener("cancel", () => {
  syncDraft();
  draftKey = "";
});
