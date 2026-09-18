/* Navegación única: Cartera > cliente; Campañas > producto > clientes > gestión. */
let campaignName = "",
  campaignClient = 0,
  campaignSearch = "",
  campaignResult = "",
  campaignPage = 1,
  prioritizedOnly = false;
const baseRoute6 = route,
  baseDashboard6 = dashboard,
  baseTab6 = setTab,
  baseClientView6 = clientView;
const offerCatalog = {
  "Depósito a plazo": { rate: 5.5, label: "TREA referencial", term: "12 meses", kind: "Venta" },
  "Crédito hipotecario": {
    rate: 8.9,
    label: "TEA propuesta",
    term: "Hasta 240 meses",
    kind: "Venta",
  },
  "Tarjeta Signature": {
    rate: 32,
    label: "TEA propuesta",
    term: "Línea revolvente",
    kind: "Venta",
  },
  "Préstamo personal": { rate: 18, label: "TEA propuesta", term: "Hasta 60 meses", kind: "Venta" },
};
if (!campaigns.includes("Préstamo personal")) {
  campaigns.push("Préstamo personal");
  campaignPriorities.push("Alta");
}
// Asociación de demostración para que préstamos tenga su propia audiencia.
for (const c of clients.filter((c) => c.id % 7 === 0)) {
  if (!ensureTasks(c).some((t) => t.name === "Préstamo personal"))
    ensureTasks(c).push({
      id: "loan-" + c.id,
      name: "Préstamo personal",
      kind: "Venta",
      priority: "Alta",
      status: "No contactado",
      sold: false,
    });
}
for (const c of clients)
  for (const t of ensureTasks(c)) {
    const i = campaigns.indexOf(t.name);
    if (i >= 0) t.priority = campaignPriorities[i] || "Media";
    if (t.kind === "Venta" && !t.offer) {
      const meta = offerCatalog[t.name];
      t.offer = {
        amount:
          t.simulation?.amount ||
          Math.round(
            (t.name === "Crédito hipotecario"
              ? 250000
              : t.name === "Préstamo personal"
                ? 25000
                : c.amount || 20000) +
              (c.id % 9) * 1000,
          ),
        rate: t.simulation?.annualRate ?? meta?.rate ?? null,
        label: meta?.label || "TEA propuesta",
        term: t.simulation?.months ? t.simulation.months + " meses" : meta?.term || "Por definir",
      };
    }
  }
function names6() {
  return [
    ...new Set([
      ...campaigns,
      ...scope().flatMap((c) =>
        ensureTasks(c)
          .filter((t) => t.kind === "Venta")
          .map((t) => t.name),
      ),
    ]),
  ];
}
function campaignRows6(name) {
  return scope()
    .flatMap((c) =>
      ensureTasks(c)
        .filter((t) => t.name === name)
        .map((t) => ({ c, t })),
    )
    .filter(
      ({ c, t }) =>
        (!campaignSearch ||
          normalized(c.name + c.dni + c.phone).includes(normalized(campaignSearch))) &&
        (!campaignResult ||
          (campaignResult === "Venta confirmada"
            ? t.sold
            : !t.sold && t.status === campaignResult)),
    );
}
function offer6(t) {
  const m = offerCatalog[t.name];
  return (
    t.offer || {
      amount: t.simulation?.amount,
      rate: t.simulation?.annualRate ?? m?.rate,
      label: m?.label || "TEA propuesta",
      term: t.simulation?.months ? t.simulation.months + " meses" : m?.term,
    }
  );
}
function offerDetail6(t) {
  if (t.kind !== "Venta")
    return '<p class="sub">Servicio · ' + esc(t.kind) + " · Sin monto ni tasa comercial.</p>";
  const o = offer6(t);
  return (
    details([
      ["Monto propuesto", o.amount != null ? money(o.amount) : "Pendiente de evaluación"],
      [o.label, o.rate != null ? Number(o.rate).toFixed(2) + "%" : "No disponible"],
      ["Plazo", o.term || "Por definir"],
    ]) +
    '<p class="small muted">Condiciones ficticias para demostrar la campaña. Sujetas a evaluación; no representan una oferta bancaria vigente.</p>'
  );
}
function goCampaign6(name = "", client = 0) {
  campaignName = name;
  campaignClient = client;
  campaignSearch = "";
  campaignResult = "";
  campaignPage = 1;
  contextTask = null;
  view = "campanas";
  location.hash =
    "campanas" + (name ? "/" + encodeURIComponent(name) : "") + (client ? "/" + client : "");
  render();
}
function campaignCards6() {
  const list = names6()
    .filter(
      (n) =>
        !campaignTypeFilter || (offerCatalog[n]?.kind || campaignKind(n)) === campaignTypeFilter,
    )
    .filter((n) => !prioritizedOnly || campaignPriorities[campaigns.indexOf(n)] === "Alta")
    .sort(
      (a, b) =>
        ["Alta", "Media", "Baja"].indexOf(campaignPriorities[campaigns.indexOf(a)] || "Media") -
        ["Alta", "Media", "Baja"].indexOf(campaignPriorities[campaigns.indexOf(b)] || "Media"),
    );
  return (
    '<div class="campaigns">' +
    list
      .map((n) => {
        const rows = scope().flatMap((c) =>
            ensureTasks(c)
              .filter((t) => t.name === n)
              .map((t) => ({ c, t })),
          ),
          i = campaigns.indexOf(n),
          kind = offerCatalog[n]?.kind || campaignKind(n),
          count = new Set(rows.map((r) => r.c.id)).size,
          done = rows.filter(
            (r) =>
              r.t.sold ||
              !["No contactado", "Pendiente", "No contactado / servicio"].includes(r.t.status),
          ).length,
          amounts = rows.map((r) => offer6(r.t).amount).filter(Number.isFinite),
          m = offerCatalog[n];
        return (
          '<section class="card campaign-product"><div class="card-title">' +
          badge(
            "Prioridad " + (campaignPriorities[i] || "Media"),
            campaignPriorities[i] === "Alta" ? "orange" : "gray",
          ) +
          badge(kind, "blue") +
          "</div><h2>" +
          esc(n) +
          '</h2><div class="campaign-number">' +
          count +
          ' <span class="sub">clientes asociados</span></div>' +
          (m
            ? details([
                [
                  "Montos propuestos",
                  amounts.length
                    ? money(Math.min(...amounts)) + " – " + money(Math.max(...amounts))
                    : "Por evaluar",
                ],
                [m.label, m.rate.toFixed(2) + "% referencial"],
                ["Plazo", m.term],
              ])
            : "<p>Gestiones de servicio sin oferta crediticia.</p>") +
          '<div class="progress"><span style="width:' +
          (done / Math.max(1, rows.length)) * 100 +
          '%"></span></div><p class="sub">' +
          done +
          " gestiones avanzadas · " +
          rows.filter((r) => r.t.sold).length +
          ' ventas confirmadas</p><div class="actions">' +
          (esAgregado()
            ? "<span>Seguimiento agregado del equipo</span>"
            : '<button class="primary" onclick="goCampaign6(names6()[' +
              names6().indexOf(n) +
              '])">Ver clientes →</button>') +
          (esAgregado() && i >= 0
            ? '<button onclick="openPriority(' + i + ')">Priorizar producto</button>'
            : "") +
          "</div></section>"
        );
      })
      .join("") +
    "</div>"
  );
}
campaignView = function () {
  if (esAgregado() || !campaignName)
    return (
      head(
        esAgregado() ? "Seguimiento de campañas" : "Campañas",
        "Primero el producto, luego sus clientes y la gestión de cada oferta.",
      ) +
      '<div class="toolbar"><select aria-label="Tipo de campaña" onchange="campaignTypeFilter=this.value;render()"><option value="">Ventas y servicios</option>' +
      opts(["Venta", "Servicio comercial", "Servicio administrativo"], campaignTypeFilter) +
      '</select><label class="checkline"><input type="checkbox" ' +
      (prioritizedOnly ? "checked" : "") +
      ' onchange="prioritizedOnly=this.checked;render()"> Solo priorizadas</label></div>' +
      campaignCards6() +
      '<p class="sub">Montos y tasas ilustrativos. Las condiciones específicas se muestran dentro de cada cliente asociado.</p>'
    );
  const all = scope().flatMap((c) =>
    ensureTasks(c)
      .filter((t) => t.name === campaignName)
      .map((t) => ({ c, t })),
  );
  if (campaignClient) {
    const row = all.find((r) => r.c.id === campaignClient);
    if (!row)
      return head(
        "Cliente no asociado",
        "El cliente no está disponible en esta campaña.",
        '<button onclick="goCampaign6(campaignName)">Volver a clientes</button>',
      );
    const { c, t } = row;
    contextTask = t.id;
    return (
      '<div class="breadcrumb6"><button onclick="goCampaign6()">Campañas</button> / <button onclick="goCampaign6(campaignName)">' +
      esc(campaignName) +
      "</button> / " +
      esc(c.name) +
      "</div>" +
      head(
        c.name,
        "DNI " + c.dni + " · " + c.phone,
        '<a class="btn" href="#cliente/' + c.id + '">Consultar Vista 360</a>',
      ) +
      '<section class="card context-card"><div class="card-title"><h2>' +
      esc(campaignName) +
      "</h2>" +
      badge(t.sold ? "Venta confirmada" : t.status, t.sold ? "" : "blue") +
      "</div>" +
      offerDetail6(t) +
      "<p><b>Siguiente acción:</b> " +
      esc(
        t.sold
          ? "Seguimiento posventa"
          : t.process?.next || "Contactar y registrar respuesta a esta campaña",
      ) +
      '</p><div class="actions"><button class="primary" onclick="openActivity(' +
      c.id +
      ",'" +
      t.id +
      "')\">" +
      (t.sold ? "Registrar seguimiento" : "Gestionar campaña") +
      "</button>" +
      (t.status === "Acepta campaña" && !t.sold
        ? '<button onclick="openProcess(' + c.id + ",'" + t.id + "')\">Continuar proceso</button>"
        : "") +
      '</div></section><section class="card"><h2>Contexto y seguimiento de esta campaña</h2>' +
      details([
        ["Prioridad del producto", t.priority],
        ["Próximo contacto", t.next || "Por programar"],
        ["Responsable", t.process?.area || executives[c.owner].name],
        ["Proceso", t.sold ? "Cerrado" : t.process?.stage || "Por iniciar"],
      ]) +
      "<p>" +
      esc(t.process?.next || "Aún no hay seguimiento de proceso registrado.") +
      "</p></section>"
    );
  }
  const rows = campaignRows6(campaignName);
  campaignPage = Math.min(campaignPage, Math.max(1, Math.ceil(rows.length / 25)));
  return (
    '<div class="breadcrumb6"><button onclick="goCampaign6()">← Todas las campañas</button></div>' +
    head(
      campaignName,
      all.length + " clientes asociados · Las condiciones pertenecen a esta campaña.",
    ) +
    '<section class="card"><form class="toolbar" onsubmit="event.preventDefault();campaignSearch=this.search.value;campaignPage=1;render()"><input name="search" value="' +
    esc(campaignSearch) +
    '" placeholder="Buscar cliente por nombre, DNI o celular" aria-label="Buscar cliente de campaña"><button>Buscar</button><select aria-label="Resultado de campaña" onchange="campaignResult=this.value;campaignPage=1;render()"><option value="">Todos los resultados</option>' +
    opts(
      [
        "No contactado",
        "Acepta campaña",
        "Lo va a pensar",
        "Rechaza campaña",
        "Venta confirmada",
        "Pendiente",
        "En proceso",
        "Resuelto",
      ],
      campaignResult,
    ) +
    '</select><button type="button" onclick="campaignSearch=\'\';campaignResult=\'\';render()">Limpiar</button></form><div class="table-wrap" tabindex="0" role="region" aria-label="Tabla con desplazamiento horizontal"><table><thead><tr><th scope=col>Cliente</th><th scope=col>Monto propuesto</th><th scope=col>Tasa propuesta</th><th scope=col>Resultado</th><th scope=col>Próximo contacto</th><th scope=col>Acción</th></tr></thead><tbody>' +
    rows
      .slice((campaignPage - 1) * 25, campaignPage * 25)
      .map(({ c, t }) => {
        let o = offer6(t);
        return (
          "<tr><td><b>" +
          esc(c.name) +
          "</b><small>DNI " +
          c.dni +
          "</small></td><td>" +
          (t.kind === "Venta" && o.amount != null ? money(o.amount) : "No aplica") +
          "</td><td>" +
          (t.kind === "Venta" && o.rate != null
            ? Number(o.rate).toFixed(2) + "% · " + esc(o.label)
            : "No aplica") +
          "</td><td>" +
          badge(t.sold ? "Venta confirmada" : t.status) +
          "</td><td>" +
          esc(t.next || "Sin programar") +
          '</td><td><button class="primary" onclick="goCampaign6(campaignName,' +
          c.id +
          ')">Ver oferta y gestionar</button></td></tr>'
        );
      })
      .join("") +
    "</tbody></table></div>" +
    (rows.length
      ? ""
      : '<div class="empty">Sin coincidencias. Prueba otro nombre o limpia los filtros.</div>') +
    '<div class="pagination"><button ' +
    (campaignPage === 1 ? "disabled" : "") +
    ' onclick="campaignPage--;render()">Anterior</button><span>' +
    rows.length +
    " clientes · Página " +
    campaignPage +
    "</span><button " +
    (campaignPage * 25 >= rows.length ? "disabled" : "") +
    ' onclick="campaignPage++;render()">Siguiente</button></div></section>'
  );
};
renderRail = function () {
  $("#portfolioRail").innerHTML = "";
  $(".workarea").classList.add("supervisor");
};
// Vista 360 se concentra en información; la gestión por producto vive en Campañas.
customerSummary = function (c) {
  return (
    dataNotice(c) +
    '<section class="card"><h2>Resumen del cliente</h2>' +
    details([
      ["Nombre", c.name],
      ["DNI", c.dni],
      ["Código Único", c.uniqueCode || "Pendiente"],
      ["Segmento", c.segment || "Select"],
      ["Ejecutivo", executives[c.owner].name],
      ["Correo", c.email],
      ["Celular", c.phone],
    ]) +
    '</section><div class="customer-shortcuts" style="margin-top:18px">' +
    [
      ["Información financiera", "Saldos, ingresos y deuda"],
      ["Productos bancarios", "Productos contratados"],
      ["Gestiones y casos", "Historial y solicitudes"],
    ]
      .map(
        ([n, d]) =>
          '<button class="summary-tile" onclick="setTab(\'' +
          n +
          "')\"><b>" +
          n +
          "</b><p>" +
          d +
          "</p></button>",
      )
      .join("") +
    "</div>"
  );
};
clientCampaigns = function (c) {
  return (
    '<section class="card"><h2>Campañas asociadas a ' +
    esc(c.name) +
    "</h2><p>Abre la oferta dentro del módulo de Campañas para continuar su gestión.</p>" +
    ensureTasks(c)
      .map(
        (t) =>
          '<div class="product"><div><b>' +
          esc(t.name) +
          "</b><small>" +
          esc(t.kind) +
          '</small></div><button onclick="goCampaign6(names6()[' +
          names6().indexOf(t.name) +
          "]," +
          c.id +
          ')">Abrir en Campañas →</button></div>',
      )
      .join("") +
    "</section>"
  );
};
const navBase6 = nav;
nav = function () {
  navBase6();
  $("#nav").innerHTML = $("#nav").innerHTML.replace(">Clientes</a>", ">Cartera</a>");
};
filterCampaign = function (i) {
  goCampaign6(campaigns[i]);
};
// Los enlaces desde la agenda conservan la oferta y llevan al único módulo operativo.
openWork = function (id, tid) {
  const c = scope().find((c) => c.id === id),
    t = c && ensureTasks(c).find((t) => t.id === tid);
  if (!t) return;
  if (t.kind === "Venta") goCampaign6(t.name, id);
  else {
    contextTask = tid;
    selected = id;
    view = "cliente";
    tab = "Gestiones y casos";
    location.hash = "cliente/" + id;
    render();
  }
};
dashboard = function () {
  if (esAgregado()) return sales();
  let s = baseDashboard6();
  s = s.replace(
    '<button onclick="newIncoming()">+ Solicitud entrante</button>',
    '<button onclick="newIncoming()">+ Registrar pedido del cliente</button>',
  );
  // "Ver campañas priorizadas ↗" vivía dentro de la tira de pestañas, pero
  // no filtra la bandeja: navega a otro módulo. Un control con forma de
  // pestaña que se lleva a la persona fuera de la pantalla rompe el modelo
  // que la tira promete. Sale de la tira y va junto a la otra acción.
  s = s.replace(
    /<button class="[^"]*" onclick="workFilter='Campañas priorizadas';workPage=1;render\(\)">Campañas priorizadas<\/button>/,
    "",
  );
  return s.replace(
    '<button onclick="newIncoming()">+ Registrar pedido del cliente</button>',
    '<button onclick="prioritizedOnly=true;goCampaign6()">Campañas priorizadas →</button>' +
      '<button onclick="newIncoming()">+ Registrar pedido del cliente</button>',
  );
};
// Sustituye etiquetas y explica el registro reactivo manual.
const incomingBase6 = newIncoming;
newIncoming = function () {
  incomingBase6();
  $("#modal").innerHTML = $("#modal")
    .innerHTML.replace("Registrar solicitud entrante", "Registrar pedido del cliente")
    .replace(
      '<form id="incoming">',
      '<p class="sub">Úsalo cuando un cliente de tu cartera te solicita ayuda por llamada, WhatsApp o correo. Este registro es manual; no importa mensajes ni crea una campaña comercial.</p><form id="incoming">',
    )
    .replace("Solicitud<textarea", "¿Qué necesita el cliente?<textarea");
  $("#incoming").onsubmit = (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target)),
      c = scope().find((c) => c.dni === d.dni);
    if (!c) {
      $("#incomingError").textContent = "Busca el DNI de un cliente de tu cartera.";
      return;
    }
    const t = {
      id: "incoming-" + Date.now(),
      name: d.text,
      kind: "Servicio administrativo",
      priority: "Alta",
      status: "Pendiente",
      incoming: true,
      next: todayKey,
    };
    ensureTasks(c).push(t);
    logChange(c, "Pedido del cliente", d.channel + ": " + d.text);
    closeModal();
    openWork(c.id, t.id);
  };
};
route = function () {
  const p = location.hash.slice(1).split("/");
  if (p[0] === "campanas") {
    try {
      campaignName = decodeURIComponent(p[1] || "");
    } catch {
      campaignName = "";
    }
    campaignClient = Number(p[2]) || 0;
    if (esAgregado()) {
      campaignName = "";
      campaignClient = 0;
    }
    view = "campanas";
    render();
    return;
  }
  baseRoute6();
};
window.removeEventListener("hashchange", baseRoute6);
window.addEventListener("hashchange", route);
const noticeBase6 = openNotification;
openNotification = function (id) {
  const n = inbox().find((n) => n.id === id);
  if (n && n.campaign) {
    n.read = true;
    goCampaign6(n.campaign);
    return;
  }
  noticeBase6(id);
};
