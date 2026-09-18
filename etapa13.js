/* =========================================================================
   Etapa 13 · Diálogos anclados, tablas paginadas y el panel del ejecutivo
   -------------------------------------------------------------------------
   Medido antes de tocar nada:

   · Con un diálogo abierto, la rueda del ratón desplazaba LA PÁGINA DE
     DETRÁS (scrollY 7 → 807). El diálogo se quedaba quieto y el fondo se iba,
     así que parecía una caja suelta flotando sobre nada. Eso es lo que se ve
     en las capturas donde el pie de página aparece arriba del todo.
   · El propio diálogo tenía 107px de contenido cortado a 640px de alto, sin
     ninguna señal de que hubiera más abajo.

   Un diálogo modal tiene que atrapar el desplazamiento: mientras está
   abierto, lo único que se desplaza es él.
   ========================================================================= */

/* --- 1. El fondo no se mueve mientras hay un diálogo ----------------------- */

let scrollGuardado13 = 0,
  fondoBloqueado13 = false;

function bloquearFondo13() {
  if (fondoBloqueado13) return;
  scrollGuardado13 = window.scrollY;
  // Compensar el ancho de la barra de desplazamiento evita el salto lateral
  // de toda la maqueta al ocultarla.
  const barra = window.innerWidth - document.documentElement.clientWidth;
  document.documentElement.style.overflow = "hidden";
  if (barra > 0) document.documentElement.style.paddingRight = barra + "px";
  fondoBloqueado13 = true;
}
function liberarFondo13() {
  if (!fondoBloqueado13) return;
  document.documentElement.style.overflow = "";
  document.documentElement.style.paddingRight = "";
  window.scrollTo({ top: scrollGuardado13, behavior: "instant" });
  fondoBloqueado13 = false;
}

/* El estado del bloqueo se DERIVA de si hay un diálogo abierto, en vez de
   llevarse a mano con dos llamadas simétricas. Con las dos llamadas había un
   fallo real y reproducible: varios flujos hacen `closeModal(); modal(...)`
   para saltar de paso, y el evento `close` del diálogo llega de forma
   ASÍNCRONA — después de que el segundo ya esté abierto. Ese evento tardío
   desbloqueaba la página con un diálogo delante. A partir de ahí el fondo se
   desplazaba libremente, se iba, y el diálogo quedaba flotando sobre el pie de
   página: las "modales pegadas abajo" de las capturas.

   Derivar el estado hace que un evento fuera de orden no pueda mentir. */
function sincronizarFondo13() {
  const abierto = !!($("#dialog") && $("#dialog").open);
  if (abierto) bloquearFondo13();
  else liberarFondo13();
}

const modalBase13 = modal;
modal = function (titulo, cuerpo) {
  modalBase13(titulo, cuerpo);
  sincronizarFondo13();
};
const closeModalBase13 = closeModal;
closeModal = function () {
  closeModalBase13();
  sincronizarFondo13();
};
// Esc y el clic en el velo cierran el diálogo sin pasar por closeModal().
if ($("#dialog")) $("#dialog").addEventListener("close", sincronizarFondo13);

/* --- 2. Paginación de 15 en cualquier tabla -------------------------------
   En vez de parchear una a una las siete tablas que se pasaban de 15 filas
   —y de que la próxima nazca sin paginar—, el paginado se aplica sobre el DOM
   después de cada render: si una tabla tiene más de 15 filas y no trae ya su
   propio paginador, se le pone uno. Así ninguna tabla futura se escapa.     */

const POR_PAGINA13 = 15;
const paginas13 = new Map();

function claveTabla13(tabla) {
  const sec = tabla.closest("section, .card, .bloque8"),
    titulo = sec ? (sec.querySelector("h1,h2,h3")?.textContent || "").trim() : "",
    cabeceras = [...tabla.querySelectorAll("thead th")].map((t) => t.textContent.trim()).join("|");
  return (view || "") + "::" + titulo + "::" + cabeceras;
}

function irPagina13(clave, n) {
  paginas13.set(clave, n);
  aplicarPaginado13();
}

function aplicarPaginado13() {
  // Los paginadores que puso esta función en el render anterior se retiran
  // primero. Sin esto, el guardia de "ya tiene paginador" encontraba el suyo
  // propio y se saltaba la tabla: pulsar Siguiente no cambiaba nada.
  document.querySelectorAll("#main .paginador13").forEach((n) => n.remove());
  document.querySelectorAll("#main table").forEach((tabla) => {
    // Las tablas agrupadas (un <tbody> por cliente) y las que ya traen su
    // propio paginador se dejan como están: dos paginadores sobre la misma
    // lista es peor que ninguno.
    if (tabla.tBodies.length !== 1) return;
    const sec = tabla.closest("section, .card, .bloque8") || tabla.parentElement;
    if (sec.querySelector(".paginador8, .pager")) return;

    const cuerpo = tabla.tBodies[0],
      filas = [...cuerpo.rows];
    if (filas.length <= POR_PAGINA13) return;

    const clave = claveTabla13(tabla),
      paginas = Math.ceil(filas.length / POR_PAGINA13);
    let pagina = Math.min(paginas13.get(clave) || 1, paginas);
    paginas13.set(clave, pagina);

    const desde = (pagina - 1) * POR_PAGINA13,
      hasta = desde + POR_PAGINA13;
    filas.forEach((f, i) => {
      f.hidden = i < desde || i >= hasta;
    });

    const nav = document.createElement("nav");
    nav.className = "paginador8 paginador13";
    nav.setAttribute("aria-label", "Paginación de la tabla");
    nav.innerHTML =
      '<button type="button"' +
      (pagina <= 1 ? " disabled" : "") +
      ">← Anterior</button>" +
      '<b class="num">' +
      (desde + 1) +
      "–" +
      Math.min(hasta, filas.length) +
      "</b> de <b class=\"num\">" +
      filas.length +
      '</b><button type="button"' +
      (pagina >= paginas ? " disabled" : "") +
      ">Siguiente →</button>";
    const [anterior, siguiente] = nav.querySelectorAll("button");
    anterior.onclick = () => irPagina13(clave, pagina - 1);
    siguiente.onclick = () => irPagina13(clave, pagina + 1);

    const envoltura = tabla.closest(".table-wrap") || tabla;
    envoltura.after(nav);
  });
}

const renderBase13 = render;
render = function () {
  renderBase13();
  aplicarPaginado13();
};
const bindBase13 = bind;
bind = function () {
  bindBase13();
  aplicarPaginado13();
};
// El detalle del lote se dibuja fuera de render(): también se pagina.
const renderIntakeReviewBase13 = renderIntakeReview;
renderIntakeReview = function () {
  renderIntakeReviewBase13();
  aplicarPaginado13();
};

/* --- 3. Un cliente puede entrar sin campaña -------------------------------
   Carterizar y ofrecer no son el mismo momento: un lote puede entrar solo
   para repartir cartera, y la campaña asignarse después. Obligar a elegir una
   fuerza a inventarse un dato, que es peor que no tenerlo.                  */

const SIN_CAMPANA13 = "Sin campaña asignada";

function opcionesCampana13(actual) {
  return (
    '<option value="' +
    SIN_CAMPANA13 +
    '"' +
    (actual === SIN_CAMPANA13 ? " selected" : "") +
    ">Sin campaña · se asigna después</option>" +
    opts(campaigns, actual)
  );
}

campanaDe12 = function (r) {
  const propia = (r.campana || "").trim();
  if (propia === SIN_CAMPANA13) return { nombre: SIN_CAMPANA13, origen: "Sin campaña" };
  if (propia && campaigns.includes(propia)) return { nombre: propia, origen: "Del archivo" };
  if (propia) return { nombre: intakeCampaign, origen: "No reconocida: «" + propia + "»" };
  if (intakeCampaign === SIN_CAMPANA13)
    return { nombre: SIN_CAMPANA13, origen: "Sin campaña" };
  return { nombre: intakeCampaign, origen: "Por defecto" };
};

const esSinCampana13 = (n) => n === SIN_CAMPANA13;

/* --- 4. "Gestionar" abre la ficha del cliente -----------------------------
   Desde la cartera, gestionar a alguien empieza por mirarlo: saldos, campañas
   abiertas, historial. Abrir el diálogo de tipificación directamente obliga a
   responder por el cliente antes de haberlo visto.                          */

function abrirCliente13(id) {
  selected = id;
  location.hash = "cliente/" + id;
}

/* --- 5. El panel del ejecutivo es su panel -------------------------------
   El inicio del ejecutivo repetía dos secciones que ya existen: la bandeja de
   trabajo (que es la cartera filtrada) y un acceso a campañas (que es una
   pestaña). Lo que no estaba en ninguna parte visible era cómo va él. Ahora
   el inicio ES su panel de ventas y gestiones, y "Panel de ventas" deja de
   ser una entrada aparte del menú.                                          */

MENU_POR_PERFIL.exec = [
  ["inicio", "Mi panel"],
  ["cartera", "Mis clientes"],
  ["campanas", "Campañas"],
];

dashboard = function () {
  if (esAgregado()) return sales();
  return sales();
};

// `#ventas` sigue siendo una URL válida y lleva al panel, que ahora es el
// inicio: no se rompe ningún enlace anterior.
const routeBase13 = route;
route = function () {
  if (role === "exec" && location.hash.slice(1).split("/")[0] === "ventas") {
    location.hash = "inicio";
    return;
  }
  routeBase13();
};

/* Un cliente sin campaña entra a cartera igual, pero su hueco de campaña
   queda marcado como pendiente en vez de inventarse una venta: si el marcador
   fuese una campaña cualquiera, contaría en las metas de alguien. */
const confirmIntakeBase13 = confirmIntake;
confirmIntake = function () {
  const antes = clients.length;
  confirmIntakeBase13();
  clients.slice(antes).forEach((c) => {
    if (!esSinCampana13(c.campaign)) return;
    c.sinCampana = true;
    c.tasks = [
      {
        id: "pendiente-" + c.id,
        name: SIN_CAMPANA13,
        // Ni "Venta" ni servicio: no cuenta para ninguna meta hasta que se le
        // asigne una campaña de verdad.
        kind: "Sin asignar",
        priority: c.priority || "Media",
        status: "Sin campaña",
        sold: false,
      },
    ];
    if (c.ingesta) c.ingesta.origen = "Sin campaña · pendiente de asignar";
  });
};

/* Asignar la campaña después: el paso que hace útil poder entrar sin ella. */
function asignarCampana13(id) {
  const c = clients.find((x) => x.id === id);
  if (!c) return;
  modal(
    "Asignar campaña a " + esc(c.name),
    '<p class="sub">Este cliente entró a cartera sin campaña. Al asignarla se abre la ' +
      "oportunidad y empieza a contar para la meta del producto.</p>" +
      '<form id="asignar13"><label class="campo9">Campaña<select name="campana">' +
      opts(campaigns, campaigns[0]) +
      "</select></label>" +
      '<div class="modal-actions"><button type="button" onclick="closeModal()">Cancelar</button>' +
      '<button class="primary" type="submit">Asignar campaña</button></div></form>',
  );
  $("#asignar13").onsubmit = (e) => {
    e.preventDefault();
    const nombre = new FormData(e.target).get("campana");
    c.campaign = nombre;
    c.sinCampana = false;
    c.priority = campaignPriorities[campaigns.indexOf(nombre)] || c.priority;
    c.tasks = [
      {
        id: "campaign-" + c.id,
        name: nombre,
        kind: campaignKind(nombre),
        priority: c.priority,
        status: "No contactado",
        sold: false,
      },
    ];
    if (c.ingesta) c.ingesta.origen = "Campaña · " + nombre;
    closeModal();
    render();
    toast(esc(c.name) + ": campaña " + nombre + " asignada.");
  };
}

/* En la ficha del cliente, el aviso y el botón. Va arriba del todo porque es
   lo primero que hay que resolver antes de llamar a nadie. */
const clientViewBase13 = clientView;
clientView = function () {
  const html = clientViewBase13(),
    c = clients.find((x) => x.id === selected);
  if (!c || !esSinCampana13(c.campaign)) return html;
  const aviso =
    '<div class="alert alert-sincampana13"><b>Sin campaña asignada.</b> ' +
    "Entró a cartera por reparto, no por una campaña. No cuenta para ninguna meta " +
    'hasta que se le asigne una. <button type="button" class="primary" onclick="asignarCampana13(' +
    c.id +
    ')">Asignar campaña</button></div>';
  const corte = html.indexOf("</div>", html.indexOf('class="heading"'));
  return corte < 0 ? aviso + html : html.slice(0, corte + 6) + aviso + html.slice(corte + 6);
};

/* Y una lista donde encontrarlos: sin esto, "se asigna después" se convierte
   en "no se asigna nunca". */
function sinCampana13() {
  return scope().filter((c) => esSinCampana13(c.campaign));
}
const salesBase13 = sales;
sales = function () {
  const pendientes = sinCampana13();
  if (!pendientes.length) return salesBase13();
  return (
    salesBase13() +
    '<section class="card"><div class="card-title"><h2>Clientes sin campaña</h2>' +
    '<span class="sub">' +
    pendientes.length +
    " en cartera, sin oportunidad abierta</span></div>" +
    '<p class="sub bandeja-nota10">Entraron por reparto de cartera. No cuentan para ninguna meta ' +
    "hasta que se les asigne una campaña.</p>" +
    '<div class="table-wrap" tabindex="0" role="region" aria-label="Clientes sin campaña">' +
    '<table class="tabla-reparto8"><thead><tr><th scope=col>Cliente</th>' +
    "<th scope=col>Lote de origen</th><th scope=col>Responsable</th>" +
    "<th scope=col></th></tr></thead><tbody>" +
    pendientes
      .map(
        (c) =>
          '<tr><td data-col="Cliente"><b>' +
          esc(c.name) +
          '</b><small class="dni">' +
          esc(c.dni) +
          '</small></td><td data-col="Lote">' +
          esc(c.ingesta ? c.ingesta.lote : "—") +
          '</td><td data-col="Responsable">' +
          esc(executives[c.owner] ? executives[c.owner].name : "—") +
          '</td><td class="rowaction"><button type="button" onclick="asignarCampana13(' +
          c.id +
          ')">Asignar campaña</button></td></tr>',
      )
      .join("") +
    "</tbody></table></div></section>"
  );
};

/* Quitar la bandeja de trabajo del inicio se llevó por delante un dato que no
   está en ninguna otra pantalla: qué tiene comprometido HOY. La bandeja no
   vuelve —era la cartera filtrada, duplicada— pero el dato sí, en una línea
   que lleva a la cartera ya filtrada por esa fecha. */
function comprometidoHoy13() {
  // Un compromiso para hoy es, por definición, un seguimiento de alguien a
  // quien YA se contactó: filtrar por "sin contactar" lo dejaba en cero.
  return scope().filter((c) => ensureTasks(c).some((t) => t.next === todayKey && !t.sold));
}
function verComprometidos13() {
  statusFilter = "";
  campaignFilter = "";
  priorityFilter = "";
  query = "";
  clientPage = 1;
  soloHoy13 = true;
  location.hash = "cartera";
}
let soloHoy13 = false;

const filteredBase13 = filtered;
filtered = function () {
  const base = filteredBase13();
  if (!soloHoy13) return base;
  return base.filter((c) => ensureTasks(c).some((t) => t.next === todayKey && !t.sold));
};
// El filtro de "hoy" es de un solo uso: se suelta al salir de la cartera, para
// que nadie se quede mirando una cartera recortada sin saber por qué.
const routeHoy13 = route;
route = function () {
  if (location.hash.slice(1).split("/")[0] !== "cartera") soloHoy13 = false;
  routeHoy13();
};

const salesHoy13 = sales;
sales = function () {
  const html = salesHoy13();
  if (esAgregado()) return html;
  const hoy = comprometidoHoy13();
  if (!hoy.length) return html;
  const tira =
    '<div class="tira-hoy13"><div><b class="num">' +
    hoy.length +
    "</b> " +
    (hoy.length === 1 ? "cliente comprometido" : "clientes comprometidos") +
    " para hoy</div>" +
    '<button type="button" class="primary" onclick="verComprometidos13()">Ver en mis clientes →</button></div>';
  // Justo debajo del encabezado: es lo que hay que hacer hoy, antes de mirar
  // cómo va el mes.
  const corte = html.indexOf("</div>", html.indexOf('class="heading"'));
  return corte < 0 ? tira + html : html.slice(0, corte + 6) + tira + html.slice(corte + 6);
};

/* En la cartera, decir que está filtrada y cómo salir. Un filtro invisible es
   una lista equivocada. */
const portfolioBase13 = portfolio;
portfolio = function () {
  const html = portfolioBase13();
  if (!soloHoy13) return html;
  const aviso =
    '<div class="alert alert-hoy13"><b>Solo lo comprometido para hoy.</b> ' +
    '<button type="button" class="textbtn" onclick="soloHoy13=false;render()">Ver toda mi cartera</button></div>';
  const corte = html.indexOf("</div>", html.indexOf('class="heading"'));
  return corte < 0 ? aviso + html : html.slice(0, corte + 6) + aviso + html.slice(corte + 6);
};


/* --- 6. Repintar una vez cargadas todas las capas --------------------------
   Medido: `app.js` hace su primer `route()` al cargarse, y las capas
   posteriores (etapas 8 a 13) se cargan DESPUÉS. La primera pantalla que veía
   quien abría el archivo era la de app.js —menú viejo, "Mi día", bandeja de
   trabajo— y solo se corregía al pulsar cualquier cosa. El menú no se
   actualizaba nunca por sí solo: a los 1.500ms seguía siendo el anterior.

   Esta es la última capa: cuando termina, la aplicación se pinta entera una
   vez con todo ya definido. */
route();
