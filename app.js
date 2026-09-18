const $ = (s) => document.querySelector(s),
  esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
    );
const money = (n) => "S/ " + Number(n).toLocaleString("es-PE");
const executives = [
  {
    id: 0,
    name: "Camila Mendoza",
    level: "Senior",
    status: "Disponible",
    sales: 186000,
    goal: 240000,
  },
  {
    id: 1,
    name: "Carlos Salazar",
    level: "Middle",
    status: "Vacaciones",
    sales: 142000,
    goal: 200000,
  },
  {
    id: 2,
    name: "Valeria Torres",
    level: "Specialist",
    status: "Disponible",
    sales: 264000,
    goal: 280000,
  },
  { id: 3, name: "Luis Rivas", level: "Junior", status: "Disponible", sales: 98000, goal: 150000 },
  {
    id: 4,
    name: "Andrea Gamarra",
    level: "Senior",
    status: "Disponible",
    sales: 171000,
    goal: 230000,
  },
  { id: 5, name: "Diego Paredes", level: "Middle", status: "Suspendido", sales: 61000, goal: 180000 },
  {
    id: 6,
    name: "Rosa Chávez",
    level: "Specialist",
    status: "Disponible",
    sales: 208000,
    goal: 260000,
  },
  { id: 7, name: "Tomás Rivera", level: "Junior", status: "Disponible", sales: 87000, goal: 140000 },
  { id: 8, name: "Nadia Ocampo", level: "Middle", status: "Vacaciones", sales: 119000, goal: 190000 },
  /* Juniors de cobertura: sin cartera propia. Existen para recibir la cartera
     de un middle o senior que sale —vacaciones, permiso, descanso médico o
     cese— y sostenerla hasta que se redistribuya. No participan del reparto
     de lotes nuevos: si entraran, dejarían de estar libres justo cuando hacen
     falta. */
  { id: 9, name: "Sergio Bravo", level: "Junior", status: "Disponible", cobertura: true, sales: 0, goal: 0 },
  { id: 10, name: "Milena Ruiz", level: "Junior", status: "Disponible", cobertura: true, sales: 0, goal: 0 },
  { id: 11, name: "Joaquín Peña", level: "Junior", status: "Disponible", cobertura: true, sales: 0, goal: 0 },
];
const esCobertura = (e) => !!(e && e.cobertura);
/* --- Supervisión: el nivel intermedio ------------------------------------
   Un canal no es un supervisor con ejecutivos: son varios supervisores, cada
   uno con su célula. El administrador mira por supervisor; el supervisor mira
   por ejecutivo. Sin esta entidad, "alto nivel" no tiene sobre qué agregar.  */
const supervisors = [
  { id: 0, name: "Martín Álvarez", cell: "Célula Lima Norte", team: [0, 1, 3, 9] },
  { id: 1, name: "Rocío Ferrer", cell: "Célula Lima Centro", team: [2, 4, 5, 10] },
  { id: 2, name: "Iván Quiroz", cell: "Célula Lima Sur", team: [6, 7, 8, 11] },
];
supervisors.forEach((s) => s.team.forEach((id) => (executives[id].supervisor = s.id)));
function supervisorDe(execId) {
  return supervisors[executives[execId]?.supervisor ?? 0];
}
const campaigns = ["Depósito a plazo", "Crédito hipotecario", "Tarjeta Signature"];
const names = [
  "Lucía Fernández",
  "Carlos Villanueva",
  "Mariana Paredes",
  "Jorge Benavides",
  "Andrea Castillo",
  "Ricardo Vega",
  "Sofía Morales",
  "Pedro Silva",
  "Gabriela León",
  "Daniel Fuentes",
  "Paola Navarro",
  "Fernando Rojas",
  "Claudia Ramos",
  "Luis Mendoza",
  "Patricia Castro",
  "Miguel Romero",
  "Elena Vargas",
  "Javier Méndez",
  "Ana Cabrera",
  "Rodrigo Santos",
  "Natalia Ponce",
  "Alonso Medina",
  "Mónica Reyes",
  "Sergio Campos",
];
let clients = names.map((name, i) => ({
  id: i + 1,
  name,
  dni: String(42000001 + i),
  email: "cliente" + (i + 1) + "@example.com",
  phone: "900 " + String(100000 + i).replace(/(\d{3})(\d{3})/, "$1 $2"),
  owner: Math.floor(i / 6),
  campaign: campaigns[i % 3],
  priority: i % 3 === 0 ? "Alta" : i % 3 === 1 ? "Media" : "Baja",
  source: i % 4 === 0 ? "Referido" : "Campaña",
  status: ["Por contactar", "Interesado", "En evaluación", "Propuesta enviada"][i % 4],
  balance: 45000 + i * 8700,
  income: 12000 + i * 750,
  debt: 10000 + i * 2700,
  amount: 20000 + i * 6500,
  notes: [],
  cases:
    i % 5 === 0
      ? [
          {
            title: "Solicitud de tasa preferencial",
            owner: "Mesa de tasas",
            due: "18 sep",
            status: "En atención",
          },
        ]
      : [],
}));
let activeExecutive = 0;
let activeSupervisor = 0;
let role = "exec",
  view = "inicio",
  selected = 1,
  tab = "Resumen",
  query = "",
  campaignFilter = "",
  priorityFilter = "",
  ownerFilter = "",
  selectedIds = new Set(),
  history = [],
  period = "Septiembre 2026";
const icons = {
  calculadora: "M5 3h14v18H5z M8 6h8 M8 11h1 M14 11h1 M8 16h1 M14 16h1",
  ingresos: "M12 3v12 M7 10l5 5 5-5 M3 16v5h18v-5",
  notificaciones: "M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4",
  inicio: "M3 10l9-7 9 7v11h-6v-7H9v7H3z",
  cartera: "M3 7h18v14H3z M7 7V3h10v4",
  campanas: "M3 9h5l11-5v16L8 15H3z M8 15l2 6",
  ventas: "M4 20V10 M10 20V4 M16 20v-8 M22 20H2",
  equipo:
    "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8 M17 4a4 4 0 010 7 M22 21v-2a4 4 0 00-3-4",
  asignaciones: "M4 7h16l-4-4 M20 17H4l4 4",
  trazabilidad:
    "M4 5h11l5 5v9a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z M14 5v5h5 M7 14h8 M7 17h5",
};
function icon(id) {
  return (
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="' +
    icons[id] +
    '"/></svg>'
  );
}
function initials(n) {
  return n
    .split(" ")
    .slice(0, 2)
    .map((x) => x[0])
    .join("");
}
/* Tres alcances, no dos. El administrador ve el canal entero; el supervisor,
   solo su célula; el ejecutivo, solo su cartera. Todo lo que cuenta, lista o
   grafica pasa por aquí, así que el permiso se define en un solo sitio.      */
const esAdmin = () => role === "admin",
  esSupervisor = () => role === "sup",
  // "Agregado" = mira un conjunto, no una cartera propia. Lo comparten el
  // administrador y el supervisor; cambia el tamaño del conjunto, no la forma
  // de leerlo. Los permisos de acción sí se separan, uno por uno, más abajo.
  esAgregado = () => role !== "exec";
function equipoDelSupervisor(sid = activeSupervisor) {
  return supervisors[sid] ? supervisors[sid].team : [];
}
function scope() {
  if (role === "admin") return clients;
  if (esAgregado()) {
    const team = equipoDelSupervisor();
    return clients.filter((c) => team.includes(c.owner));
  }
  return clients.filter((c) => c.owner === activeExecutive);
}
function badge(text, type = "") {
  return '<span class="pill ' + type + '">' + esc(text) + "</span>";
}
function priority(c) {
  return badge(
    c.priority,
    c.priority === "Alta" ? "orange" : c.priority === "Media" ? "blue" : "gray",
  );
}
function head(title, desc, actions = "") {
  return (
    '<div class="heading"><div><div class="eyebrow">RENTA ALTA / ' +
    (role === "admin" ? "ADMINISTRACIÓN DEL CANAL" : esAgregado() ? "SUPERVISIÓN" : "GESTIÓN COMERCIAL") +
    "</div><h1>" +
    title +
    '</h1><p class="sub">' +
    desc +
    '</p></div><div class="actions">' +
    actions +
    "</div></div>"
  );
}
function stats(items) {
  return (
    '<div class="stats">' +
    items
      .map(
        ([label, value, sub]) =>
          '<div class="stat"><div class="stat-top">' +
          label +
          '<span class="stat-icon">' +
          (label.includes("venta") ? "↗" : "◷") +
          "</span></div><strong>" +
          value +
          "</strong><small>" +
          sub +
          "</small></div>",
      )
      .join("") +
    "</div>"
  );
}
/* --- Qué ve cada perfil ---------------------------------------------------
   Tres trabajos distintos, tres menús distintos. El administrador da de alta
   y audita la ingesta; el supervisor mueve gente y mira a su célula; el
   ejecutivo gestiona su cartera. Ningún perfil ve secciones que no le tocan:
   una opción inalcanzable es ruido, y una alcanzable pero vacía es peor.     */
const MENU_POR_PERFIL = {
  admin: [
    ["inicio", "Panel del canal"],
    ["ingresos", "Ingreso de clientes"],
    ["trazabilidad", "Track de carterizados"],
    ["campanas", "Campañas del canal"],
  ],
  sup: [
    ["inicio", "Supervisión"],
    ["equipo", "Mi equipo"],
    ["asignaciones", "Movimientos de cartera"],
    ["campanas", "Campañas"],
  ],
  exec: [
    ["inicio", "Mi día"],
    ["cartera", "Clientes"],
    ["campanas", "Campañas"],
    ["ventas", "Panel de ventas"],
  ],
};
function nav() {
  let list = [...MENU_POR_PERFIL[role]];
  list.push(["notificaciones", "Notificaciones"]);
  $("#nav").innerHTML = list
    .map(
      ([id, label]) =>
        '<a href="#' +
        id +
        '" class="' +
        (view === id || (view === "cliente" && id === "cartera") ? "active" : "") +
        '">' +
        icon(id) +
        label +
        "</a>",
    )
    .join("");
  const quien =
    role === "admin"
      ? { nombre: "Elena Zapata", cargo: "Administradora del canal" }
      : esAgregado()
        ? {
            nombre: supervisors[activeSupervisor].name,
            cargo: "Supervisor · " + supervisors[activeSupervisor].cell,
          }
        : {
            nombre: executives[activeExecutive].name,
            cargo: "Ejecutivo " + executives[activeExecutive].level,
          };
  $("#person").textContent = quien.nombre;
  $("#job").textContent = quien.cargo;
  $(".side-bottom .avatar").textContent = initials(quien.nombre);
  $(".workspace").textContent =
    role === "admin" ? "ADMINISTRACIÓN" : esAgregado() ? "SUPERVISIÓN" : "ESPACIO COMERCIAL";
}
function chart() {
  let mult = period === "Agosto 2026" ? 0.8 : 1;
  return (
    '<div class="legend"><span><i></i>Ventas</span><span><i class="gray"></i>Meta</span></div><div class="chart">' +
    [42, 64, 57, 82, 70, 94]
      .map(
        (v, i) =>
          '<div class="bar-group"><div class="bar" style="height:' +
          v * mult +
          '%" title="Ventas: ' +
          money(v * 2000 * mult) +
          '"></div><div class="bar target" style="height:85%" title="Meta: S/ 170,000"></div><label>' +
          ["Abr", "May", "Jun", "Jul", "Ago", "Sep"][i] +
          "</label></div>",
      )
      .join("") +
    '</div><div class="chart-foot"><span>Evolución de colocaciones · Datos de muestra</span><b>+17.1% vs. mes anterior</b></div>'
  );
}
function opts(values, current) {
  return values
    .map((v) => "<option " + (current === v ? "selected" : "") + ">" + esc(v) + "</option>")
    .join("");
}
function details(items) {
  return (
    '<div class="details">' +
    items
      .map(([l, v]) => '<div class="detail"><small>' + l + "</small><b>" + esc(v) + "</b></div>")
      .join("") +
    "</div>"
  );
}
function clientTab(c) {
  if (tab === "Oportunidades") {
    calculatorClientId = c.id;
    return calculatorView();
  }
  if (tab === "Campañas") return clientCampaigns(c);
  if (c.score !== undefined && ["Productos bancarios", "Información financiera"].includes(tab))
    return (
      '<section class="card"><h2>Información pendiente de consulta</h2><p>Este cliente ingresó mediante preevaluación comercial. No hay productos, saldos ni ingresos bancarios disponibles.</p>' +
      details([
        ["Score de prueba", c.score],
        ["Días de mora de prueba", c.arrears],
        ["Estado", "Preevaluado para asignación comercial"],
      ]) +
      "</section>"
    );
  if (tab === "Datos personales")
    return (
      '<section class="card"><div class="card-title"><h2>Información personal y de contacto</h2>' +
      badge("Datos de muestra") +
      "</div>" +
      details([
        ["Nombre completo", c.name],
        ["Documento", c.dni],
        ["Correo electrónico", c.email],
        ["Celular", c.phone],
        ["Dirección", "Av. de los Olivos 240, San Isidro"],
        ["Ocupación", "Profesional independiente"],
        ["Estado civil", "Casado/a"],
        ["Canal preferido", "Llamada · 16:00 a 18:00"],
        ["Origen", c.source],
        ["Ejecutivo responsable", executives[c.owner].name],
      ]) +
      "</section>"
    );
  if (tab === "Información financiera")
    return (
      '<div class="grid"><section class="card"><div class="card-title"><h2>Perfil financiero</h2>' +
      badge("Soles · PEN") +
      "</div>" +
      details([
        ["Ingreso mensual declarado", money(c.income)],
        ["Saldo consolidado", money(c.balance)],
        ["Deuda bancaria", money(c.debt)],
        ["Cuota mensual estimada", money(Math.round(c.income * 0.22))],
        ["Situación de pagos", "Al día"],
        ["Perfil de inversión", "Moderado"],
      ]) +
      '</section><section class="card"><h2>Distribución de saldos</h2><div class="product"><span>Ahorros</span><b>' +
      money(c.balance * 0.4) +
      '</b></div><div class="product"><span>Depósito a plazo</span><b>' +
      money(c.balance * 0.6) +
      '</b></div><div class="notice">Información financiera ficticia para evaluar la experiencia.</div></section></div>'
    );
  if (tab === "Productos bancarios")
    return (
      '<section class="card"><h2>Productos contratados</h2>' +
      [
        ["Cuenta de ahorros · **** 4821", money(c.balance * 0.4), "Disponible"],
        ["Depósito a plazo · **** 3012", money(c.balance * 0.6), "Vence el 24 sep 2026"],
        ["Tarjeta de crédito · **** 7814", money(c.debt), "Pago al día"],
      ]
        .map(
          (p) =>
            '<div class="product"><div><b>' +
            p[0] +
            '</b><p class="sub">' +
            p[2] +
            "</p></div><b>" +
            p[1] +
            "</b></div>",
        )
        .join("") +
      "</section>"
    );
  if (tab === "Campañas")
    return (
      '<section class="card"><div class="card-title"><h2>' +
      esc(c.campaign) +
      "</h2>" +
      badge(c.status, "blue") +
      '</div><p class="sub">Oferta asociada al cliente · Vigente hasta el 24 sep 2026</p><div class="campaign-number">' +
      money(c.amount) +
      '</div><p class="sub">Monto potencial · Sujeto a evaluación comercial</p><div class="notice">Prioridad ' +
      c.priority.toLowerCase() +
      ": " +
      (c.priority === "Alta"
        ? "la campaña vence dentro de los próximos 7 días."
        : "seguimiento según avance de la oportunidad.") +
      '</div><button class="primary" onclick="openActivity(' +
      c.id +
      ')">Registrar resultado de campaña</button></section>'
    );
  if (tab === "Gestiones y casos")
    return (
      '<div class="grid"><section class="card"><div class="card-title"><h2>Historial de gestiones</h2><button class="textbtn" onclick="openActivity(' +
      c.id +
      ')">+ Registrar</button></div>' +
      c.notes
        .map(
          (n) =>
            '<div class="focus"><div class="info"><b>' +
            esc(n.result) +
            " · " +
            esc(n.channel) +
            "</b><p>" +
            esc(n.text) +
            "</p><p>" +
            esc(n.time) +
            " · Próximo contacto: " +
            esc(n.next || "No programado") +
            "</p></div></div>",
        )
        .join("") +
      '<div class="focus"><div class="info"><b>Cliente incorporado a cartera</b><p>01 sep 2026 · Campaña ' +
      esc(c.campaign) +
      '</p></div></div></section><section class="card"><h2>Casos y solicitudes</h2>' +
      (c.cases.length
        ? c.cases
            .map(
              (k) =>
                '<div class="product"><div><b>' +
                k.title +
                '</b><p class="sub">Responsable: ' +
                k.owner +
                '</p><p class="sub">SLA: ' +
                k.due +
                " 2026</p></div>" +
                badge(k.status, "orange") +
                "</div>",
            )
            .join("")
        : '<div class="empty">Sin casos pendientes.</div>') +
      "</section></div>"
    );
  return (
    '<div class="grid"><section class="card"><div class="card-title"><h2>Lo que debes saber antes del contacto</h2>' +
    priority(c) +
    "</div>" +
    details([
      ["Campaña vigente", c.campaign],
      ["Estado comercial", c.status],
      ["Canal preferido", "Llamada"],
      ["Origen del cliente", c.source],
      ["Correo", c.email],
      ["Celular", c.phone],
    ]) +
    '<div class="notice"><b>Siguiente acción sugerida</b><br>' +
    (c.status === "Por contactar"
      ? "Contactar y explorar interés en la campaña."
      : c.status === "Venta concretada"
        ? "Confirmar satisfacción y dar seguimiento posventa."
        : "Retomar la última gestión y acordar el próximo paso.") +
    '</div></section><section class="card"><div class="card-title"><h2>Alertas y pendientes</h2>' +
    badge(c.cases.length + " casos", "orange") +
    '</div><div class="focus"><div class="info"><b>Campaña vigente</b><p>Vence el 24 sep · ' +
    esc(c.campaign) +
    "</p></div></div>" +
    c.cases
      .map(
        (k) =>
          '<div class="focus"><div class="info"><b>' +
          k.title +
          "</b><p>" +
          k.owner +
          " · SLA " +
          k.due +
          "</p></div></div>",
      )
      .join("") +
    '<button class="textbtn" onclick="setTab(\'Gestiones y casos\')">Ver trazabilidad →</button></section></div>'
  );
}
function team() {
  return (
    head(
      "Seguimiento de ejecutivos",
      "Carga asignada, resultados del mes y ritmo de avance.",
      '<button class="primary" onclick="openAssign(1)">Organizar cobertura</button>',
    ) +
    '<div class="team-grid">' +
    executives
      .map((e) => {
        const m = metrics([e.id], "Mes");
        return (
          '<section class="card"><div class="team-head"><span class="avatar">' +
          initials(e.name) +
          '</span><div class="info"><b>' +
          e.name +
          "</b><p>" +
          e.level +
          "</p></div>" +
          badge(e.status, e.status === "Disponible" ? "" : "orange") +
          '</div><div class="team-metrics"><div><small>Cartera asignada</small><b>' +
          clients.filter((c) => c.owner === e.id).length +
          "</b></div><div><small>Ventas del mes</small><b>" +
          m.sales.length +
          " / 40</b></div><div><small>Priorizadas</small><b>" +
          m.prioritized +
          '</b></div></div><div class="progress"><span style="width:' +
          Math.min(100, (m.sales.length / 40) * 100) +
          '%"></span></div><div class="actions"><button onclick="viewOwner(' +
          e.id +
          ')">Ver panel individual</button><button onclick="assignOwner(' +
          e.id +
          ')">Mover cartera</button></div></section>'
        );
      })
      .join("") +
    "</div>"
  );
}
function render() {
  nav();
  syncHeader();
  $(".workarea").classList.toggle(
    "supervisor",
    role !== "exec" || !["cartera", "cliente", "campanas"].includes(view),
  );
  $("#main").innerHTML = (
    {
      inicio: role === "admin" ? window.panelCanal || dashboard : dashboard,
      trazabilidad: window.trackCarterizados || dashboard,
      carga: window.cargaMasivaView || dashboard,
      cartera: portfolio,
      cliente: clientView,
      campanas: campaignView,
      ventas: sales,
      equipo: team,
      asignaciones: assignmentView,
      notificaciones: notificationView,
      ingresos: intakeView,
      calculadora: calculatorView,
    }[view] || dashboard
  )();
  bind();
  bindCalculator();
  renderRail();
}
function bind() {
  if ($("#search"))
    $("#search").oninput = (e) => {
      query = e.target.value;
      updateRows();
    };
  ["campaignFilter", "priorityFilter", "ownerFilter"].forEach((id) => {
    if ($("#" + id))
      $("#" + id).onchange = (e) => {
        if (id === "campaignFilter") campaignFilter = e.target.value;
        if (id === "priorityFilter") priorityFilter = e.target.value;
        if (id === "ownerFilter") ownerFilter = e.target.value;
        updateRows();
      };
  });
  if ($("#period"))
    $("#period").onchange = (e) => {
      period = e.target.value;
      render();
    };
  bindChecks();
}
/* El menú dice qué se ofrece; esto dice qué se permite. Son cosas distintas:
   la URL se puede escribir a mano, y un prototipo que no lo contempla enseña
   un modelo de permisos que no existe. */
const RUTAS_POR_PERFIL = {
  admin: ["inicio", "ingresos", "trazabilidad", "campanas", "notificaciones"],
  // "ventas" no está en el menú del supervisor: se llega desde su tabla de
  // equipo, al pedir el panel de un ejecutivo concreto.
  sup: ["inicio", "equipo", "asignaciones", "campanas", "ventas", "notificaciones"],
  exec: [
    "inicio",
    "cartera",
    "cliente",
    "campanas",
    "ventas",
    "notificaciones",
    "calculadora",
  ],
};
function route() {
  let parts = location.hash.slice(1).split("/");
  clientPage = 1;
  view = parts[0] || "inicio";
  if (view === "calculadora" && RUTAS_POR_PERFIL[role].includes("calculadora")) {
    parts[1] = String(calculatorClientId);
    view = "cliente";
  }
  // Una sola puerta: si la ruta no pertenece al perfil, vuelve a su inicio.
  if (!RUTAS_POR_PERFIL[role].includes(view)) view = "inicio";
  if (view === "cliente") {
    selected = +parts[1];
    tab = parts[0] === "calculadora" ? "Oportunidades" : "Resumen";
  }
  render();
}
function setTab(t) {
  tab = t;
  render();
}
function filterCampaign(i) {
  campaignFilter = campaigns[i];
  query = "";
  priorityFilter = "";
  ownerFilter = "";
  statusFilter = "";
  clientPage = 1;
  view = "cartera";
  location.hash = "cartera";
  render();
}
function viewOwner(id) {
  if (esAgregado()) {
    reportOwner = String(id);
    view = "ventas";
    location.hash = "ventas";
    render();
    return;
  }
  statusFilter = "";
  clientPage = 1;
  ownerFilter = String(id);
  campaignFilter = "";
  priorityFilter = "";
  query = "";
  location.hash = "cartera";
}
function assignOwner(id) {
  openAssign(id);
}
function toast(t) {
  $("#toast").textContent = t;
  $("#toast").style.display = "block";
  setTimeout(() => ($("#toast").style.display = "none"), 4000);
}
function modal(title, body) {
  $("#dialog").classList.remove("wide-dialog");
  $("#modal").innerHTML =
    '<div class="modal-head"><h2>' +
    title +
    '</h2><button aria-label="Cerrar" onclick="closeModal()">×</button></div>' +
    body;
  $("#dialog").showModal();
}
function closeModal() {
  $("#dialog").close();
}
/* Un supervisor solo puede mover clientes dentro de su propia célula: si el
   desplegable ofrece ejecutivos de otra, el control promete un permiso que no
   existe. La restricción se ve, no se explica. */
function ejecutivosVisibles() {
  return esSupervisor()
    ? executives.filter((e) => equipoDelSupervisor().includes(e.id))
    : executives;
}
function execOptions(selectedOwner = 0) {
  return ejecutivosVisibles()
    .map(
      (e) =>
        '<option value="' +
        e.id +
        '" ' +
        (selectedOwner === e.id ? "selected" : "") +
        ">" +
        e.name +
        "</option>",
    )
    .join("");
}
function addClient(d) {
  clients.push({
    id: Math.max(...clients.map((c) => c.id)) + 1,
    ...d,
    owner: Number(d.owner ?? activeExecutive),
    status: "Por contactar",
    balance: 0,
    income: 0,
    debt: 0,
    amount: 0,
    notes: [],
    cases: [],
  });
}
function restore(i) {
  const h = history[i];
  modal(
    "Finalizar cobertura temporal",
    "<p>Se devolverán " +
      h.items.length +
      ' clientes a sus ejecutivos titulares.</p><div class="modal-actions"><button onclick="closeModal()">Cancelar</button><button class="primary" id="confirmRestore">Devolver cartera</button></div>',
  );
  $("#confirmRestore").onclick = () => {
    h.items.forEach((x) => {
      let c = clients.find((c) => c.id === x.id);
      c.owner = x.owner;
      c.notes.unshift({
        result: "Retorno al titular",
        channel: "Supervisor",
        text: "Cobertura temporal finalizada.",
        time: new Date().toLocaleString("es-PE"),
      });
    });
    h.restored = true;
    notifyReturn(h);
    closeModal();
    render();
    toast("Clientes devueltos a sus ejecutivos titulares.");
  };
}
$("#role").onchange = (e) => {
  role = e.target.value;
  statusFilter = "";
  clientPage = 1;
  selectedIds.clear();
  ownerFilter = "";
  campaignFilter = "";
  priorityFilter = "";
  query = "";
  closeModal();
  location.hash = "inicio";
  view = "inicio";
  render();
};
/* El listener tiene que resolver `route` en el momento de la llamada, no
   quedarse con la referencia que existía al registrarse. Con la referencia
   fija, TODA capa posterior que envuelva route() quedaba muerta al navegar
   por hash: solo corría si alguien llamaba route() a mano. Así se quedaba
   abierto el diálogo de validación al cambiar de sección. */
window.addEventListener("hashchange", () => route());

// Role-specific notifications and supervisory movement workflow.
let notifications = [],
  notificationFilter = "Todas",
  notificationSequence = 0;
let campaignPriorities = ["Alta", "Media", "Baja"];
const actor = () => (role === "exec" ? activeExecutive : -1);
function notify(recipients, type, title, body, route = "cartera", extra = {}) {
  [...new Set(recipients)].forEach((recipient) =>
    notifications.unshift({
      id: ++notificationSequence,
      recipient,
      type,
      title,
      body,
      route,
      read: false,
      time: new Date().toLocaleString("es-PE"),
      ...extra,
    }),
  );
}
executives.forEach((e) =>
  notify(
    [e.id],
    "campaña",
    "Campaña priorizada: Depósito a plazo",
    "Prioridad alta por vencimiento. Revisa los clientes asociados y registra el siguiente contacto.",
    "cartera",
    { campaign: campaigns[0] },
  ),
);
function inbox() {
  return notifications.filter((n) => n.recipient === actor());
}
function syncHeader() {
  $("#activeExecutive").innerHTML = execOptions(activeExecutive);
  $("#activeExecutive").style.display = role === "exec" ? "block" : "none";
  $("#activeExecutive").onchange = (e) => {
    activeExecutive = +e.target.value;
    statusFilter = "";
    clientPage = 1;
    selectedIds.clear();
    query = "";
    campaignFilter = "";
    priorityFilter = "";
    ownerFilter = "";
    view = "inicio";
    location.hash = "inicio";
    render();
  };
  // El mismo control, un nivel arriba: elegir qué célula se está supervisando.
  const sel = $("#activeSupervisor");
  sel.innerHTML = supervisors
    .map(
      (s) =>
        '<option value="' +
        s.id +
        '"' +
        (s.id === activeSupervisor ? " selected" : "") +
        ">" +
        esc(s.name) +
        " · " +
        esc(s.cell) +
        "</option>",
    )
    .join("");
  // Solo el supervisor elige célula. El administrador ve las tres a la vez,
  // así que un selector de célula ahí prometería un filtro que no existe.
  sel.style.display = esSupervisor() ? "block" : "none";
  sel.onchange = (e) => {
    activeSupervisor = +e.target.value;
    reportOwner = "";
    ownerFilter = "";
    query = "";
    view = "inicio";
    location.hash = "inicio";
    render();
  };
  let unread = inbox().filter((n) => !n.read).length;
  $("#unreadCount").textContent = unread;
  $("#unreadCount").style.display = unread ? "inline-grid" : "none";
  $("#notificationBell").setAttribute("aria-label", "Notificaciones: " + unread + " sin leer");
}
function notificationView() {
  let rows = inbox().filter(
    (n) =>
      notificationFilter === "Todas" ||
      (notificationFilter === "Sin leer" && !n.read) ||
      (notificationFilter === "Movimientos" && n.type === "movimiento") ||
      (notificationFilter === "Campañas" && n.type === "campaña"),
  );
  return (
    head(
      "Notificaciones",
      "Movimientos de cartera y prioridades comerciales, con acceso directo a la gestión.",
      '<button onclick="markAllRead()">Marcar todas como leídas</button>',
    ) +
    '<div class="tabs">' +
    ["Todas", "Sin leer", "Movimientos", "Campañas"]
      .map(
        (t) =>
          '<button class="' +
          (t === notificationFilter ? "active" : "") +
          '" onclick="notificationFilter=\'' +
          t +
          "';render()\">" +
          t +
          "</button>",
      )
      .join("") +
    '</div><section class="card notification-list">' +
    (rows.length
      ? rows
          .map(
            (n) =>
              '<article class="notification ' +
              (n.read ? "" : "unread") +
              '"><span class="notice-symbol">' +
              (n.type === "movimiento" ? "⇄" : "◎") +
              '</span><div class="notification-content"><div class="actions">' +
              badge(
                n.type === "movimiento" ? "Movimiento de cartera" : "Campaña priorizada",
                n.type === "movimiento" ? "blue" : "",
              ) +
              (!n.read ? '<span class="unread-label">Sin leer</span>' : "") +
              "</div><h3>" +
              esc(n.title) +
              "</h3><p>" +
              esc(n.body) +
              "</p><small>" +
              esc(n.time) +
              '</small><div class="actions"><button class="textbtn" onclick="openNotification(' +
              n.id +
              ')">' +
              (n.type === "campaña" ? "Ver clientes de campaña" : "Revisar cartera") +
              " →</button>" +
              (!n.read
                ? '<button class="textbtn muted" onclick="readNotification(' +
                  n.id +
                  ')">Marcar como leída</button>'
                : "") +
              "</div></div></article>",
          )
          .join("")
      : '<div class="empty">No tienes notificaciones en esta categoría.</div>') +
    "</section>"
  );
}
function markAllRead() {
  inbox().forEach((n) => (n.read = true));
  render();
}
function readNotification(id) {
  let n = inbox().find((n) => n.id === id);
  if (n) n.read = true;
  render();
}
function openNotification(id) {
  let n = inbox().find((n) => n.id === id);
  if (!n) return;
  n.read = true;
  query = "";
  priorityFilter = "";
  ownerFilter = "";
  campaignFilter = n.campaign || "";
  location.hash = n.route;
  view = n.route;
  render();
}
function openPriority(i) {
  // Priorizar una campaña fija metas para todo el canal: es del administrador.
  if (!esAdmin()) return;
  modal(
    "Priorizar campaña",
    '<p class="sub">' +
      campaigns[i] +
      '</p><form id="priorityForm"><div class="formgrid"><label>Prioridad<select name="priority">' +
      opts(["Alta", "Media", "Baja"], campaignPriorities[i]) +
      '</select></label><label class="full">Motivo del cambio<textarea name="reason" required placeholder="Ej. campaña próxima a vencer; contactar antes del viernes"></textarea></label></div><div class="notice">Se avisará a todos los ejecutivos con clientes asociados a esta campaña.</div><div class="modal-actions"><button type="button" onclick="closeModal()">Cancelar</button><button class="primary">Actualizar y notificar</button></div></form>',
  );
  $("#priorityForm").onsubmit = (e) => {
    e.preventDefault();
    let d = Object.fromEntries(new FormData(e.target));
    campaignPriorities[i] = d.priority;
    let rows = clients.filter((c) => ensureTasks(c).some((t) => t.name === campaigns[i]));
    rows.forEach((c) => {
      if (c.campaign === campaigns[i]) c.priority = d.priority;
      ensureTasks(c)
        .filter((t) => t.name === campaigns[i])
        .forEach((t) => (t.priority = d.priority));
    });
    let recipients = [...new Set(rows.map((c) => c.owner))];
    notify(
      recipients,
      "campaña",
      "Nueva prioridad " + d.priority.toLowerCase() + ": " + campaigns[i],
      d.reason,
      "cartera",
      { campaign: campaigns[i] },
    );
    notify(
      [-1],
      "campaña",
      "Prioridad comunicada: " + campaigns[i],
      recipients.length + " ejecutivos notificados. " + d.reason,
      "campanas",
    );
    closeModal();
    render();
    toast(
      "Prioridad actualizada y notificaciones creadas para " + recipients.length + " ejecutivos.",
    );
  };
}
/* Los motivos que traen de vuelta al titular llevan fecha de retorno; los que
   no, cierran la cartera en el destino hasta que se redistribuya. */
const MOTIVOS_MOVIMIENTO = [
  "Vacaciones",
  "Permiso",
  "Descanso médico",
  "Reemplazo",
  "Renuncia",
  "Cese",
];
const MOTIVOS_TEMPORALES = ["Vacaciones", "Permiso", "Descanso médico", "Reemplazo"];
let movementSource = 1,
  wholePortfolio = true;
function openAssign(source) {
  if (!esSupervisor()) return;
  movementSource = Number.isInteger(source)
    ? source
    : selectedIds.size
      ? clients.find((c) => selectedIds.has(c.id)).owner
      : (ejecutivosVisibles()[0]?.id ?? 0);
  wholePortfolio = Number.isInteger(source) || !selectedIds.size;
  modal(
    "Mover cartera entre ejecutivos",
    '<p class="sub">1. Configura el movimiento · 2. Revisa el impacto · 3. Confirma y notifica</p><form id="assignment"><div class="toggle-row"><div><b>Mover cartera completa</b><p class="sub" id="modeDescription">Todos los clientes del ejecutivo de origen</p></div><input id="wholePortfolio" type="checkbox" role="switch" aria-label="Mover cartera completa" ' +
      (wholePortfolio ? "checked" : "") +
      '></div><div class="formgrid"><label>Ejecutivo de origen<select id="movementSource">' +
      execOptions(movementSource) +
      '</select></label><label>Nuevo ejecutivo<select id="movementTarget" name="target" required></select></label><label>Motivo<select id="reason" name="reason">' +
      opts(MOTIVOS_MOVIMIENTO, "") +
      '</select></label><label>Inicio<input name="start" type="date" readonly required value="' +
      new Date().toISOString().slice(0, 10) +
      '"></label><label id="endlabel">Fecha de retorno<input id="enddate" name="end" type="date" required min="' +
      new Date().toISOString().slice(0, 10) +
      '"></label><label class="full">Contexto para el nuevo ejecutivo<textarea name="note" required placeholder="Pendientes, compromisos y próximos contactos"></textarea></label></div><div id="movementImpact"></div><div class="notice" id="assignhint">Cobertura temporal. Se notificará al titular y al nuevo ejecutivo. El retorno se confirma desde el historial.</div><p id="assignerror" class="form-error" role="alert"></p><div class="modal-actions"><button type="button" onclick="closeModal()">Cancelar</button><button class="primary" id="reviewMovement">Revisar movimiento →</button></div></form>',
  );
  $("#wholePortfolio").onchange = (e) => {
    wholePortfolio = e.target.checked;
    updateMovement();
  };
  $("#movementSource").onchange = (e) => {
    movementSource = +e.target.value;
    updateMovement(true);
  };
  $("#movementTarget").onchange = () => updateMovement();
  $("#reason").onchange = (e) => {
    let temporary = MOTIVOS_TEMPORALES.includes(e.target.value);
    $("#endlabel").style.display = temporary ? "flex" : "none";
    $("#enddate").required = temporary;
    $("#enddate").disabled = !temporary;
    $("#assignhint").textContent = temporary
      ? "Cobertura temporal. Se notificará al titular y al nuevo ejecutivo. El retorno se confirma desde el historial."
      : "Cambio definitivo. Se notificará a ambos ejecutivos y se conservarán las gestiones y los pendientes.";
  };
  updateMovement(true);
  $("#assignment").onsubmit = (e) => {
    e.preventDefault();
    let d = Object.fromEntries(new FormData(e.target)),
      items = movementItems();
    let error = "";
    if (!items.length)
      error =
        "No hay clientes para mover. Activa cartera completa o selecciona clientes en la cartera.";
    else if (d.target === "" || +d.target === movementSource)
      error = "Selecciona un ejecutivo destino diferente al origen.";
    else if (executives[+d.target].status !== "Disponible")
      error = "El ejecutivo destino no está disponible.";
    else if (clients.filter((c) => c.owner === +d.target).length + items.length > capacity)
      error =
        "El movimiento excede la capacidad configurada. Selecciona una parte de la cartera o distribuye entre varios ejecutivos.";
    else if (d.end && d.end < d.start)
      error = "La fecha de retorno no puede ser anterior al inicio.";
    else if (
      history.some(
        (h) => h.end && !h.restored && h.items.some((x) => items.some((c) => c.id === x.id)),
      )
    )
      error =
        "Hay clientes con cobertura activa. Finaliza esa cobertura antes de crear un nuevo movimiento.";
    if (error) {
      $("#assignerror").textContent = error;
      return;
    }
    const originals = items.map((c) => ({ id: c.id, owner: c.owner })),
      target = +d.target,
      origin = movementSource,
      caseCount = items.reduce((s, c) => s + c.cases.length, 0);
    closeModal();
    modal(
      "Revisar y confirmar movimiento",
      '<div class="transfer-summary"><div><small>DE</small><b>' +
        executives[origin].name +
        "</b></div><span>→</span><div><small>PARA</small><b>" +
        executives[target].name +
        "</b></div></div>" +
        details([
          ["Clientes a mover", items.length],
          ["Modalidad", d.end ? "Cobertura temporal" : "Cambio definitivo"],
          ["Motivo", d.reason],
          ["Retorno", d.end || "No aplica"],
          ["Casos pendientes transferidos", caseCount],
          [
            "Cartera destino resultante",
            clients.filter((c) => c.owner === target).length + items.length + " clientes",
          ],
        ]) +
        '<div class="notice"><b>Notificaciones automáticas dentro del prototipo</b><br>' +
        executives[target].name +
        " recibirá el detalle de la cartera, su vigencia y los pendientes. " +
        executives[origin].name +
        ' recibirá la confirmación del movimiento.</div><p class="sub">Contexto: ' +
        esc(d.note) +
        '</p><div class="modal-actions"><button onclick="closeModal()">Cancelar</button><button class="primary" id="confirmAssign">Confirmar y notificar</button></div>',
    );
    $("#confirmAssign").onclick = () => {
      items.forEach((c) => {
        c.owner = target;
        c.notes.unshift({
          result: "Reasignación por " + d.reason,
          channel: "Supervisor",
          text: d.note,
          time: new Date().toLocaleString("es-PE"),
          next: d.end || "",
        });
      });
      history.unshift({
        ...d,
        target,
        source: origin,
        items: originals,
        date: new Date().toLocaleDateString("es-PE"),
        restored: false,
      });
      const duration = d.end ? "Cobertura hasta " + d.end + "." : "Asignación definitiva.";
      notify(
        [target],
        "movimiento",
        "Recibiste " + items.length + " clientes de " + executives[origin].name,
        d.reason + ". " + duration + " " + caseCount + " casos pendientes. " + d.note,
        "cartera",
      );
      [...new Set(items.filter((c) => c.priority === "Alta").map((c) => c.campaign))].forEach(
        (campaign) =>
          notify(
            [target],
            "campaña",
            "Campaña priorizada en tu nueva cartera: " + campaign,
            "Recibiste clientes de prioridad alta. Revisa sus pendientes antes del próximo contacto.",
            "cartera",
            { campaign },
          ),
      );
      notify(
        [origin],
        "movimiento",
        "Tu cartera fue asignada a " + executives[target].name,
        items.length + " clientes. " + d.reason + ". " + duration,
        "cartera",
      );
      notify(
        [-1],
        "movimiento",
        "Movimiento confirmado: " + executives[origin].name + " → " + executives[target].name,
        items.length + " clientes. Ambos ejecutivos tienen una notificación.",
        "asignaciones",
      );
      selectedIds.clear();
      closeModal();
      view = "asignaciones";
      location.hash = "asignaciones";
      render();
      toast("Cartera movida. Ambos ejecutivos recibieron una notificación interna.");
    };
  };
}
function movementItems() {
  return clients.filter(
    (c) => c.owner === movementSource && (wholePortfolio || selectedIds.has(c.id)),
  );
}
function updateMovement(reset = false) {
  if (reset) {
    $("#movementTarget").innerHTML =
      '<option value="">Selecciona destino</option>' +
      ejecutivosVisibles()
        .filter((e) => e.id !== movementSource && e.status === "Disponible")
        .map((e) => '<option value="' + e.id + '">' + e.name + "</option>")
        .join("");
  }
  $("#movementSource").value = String(movementSource);
  $("#modeDescription").textContent = wholePortfolio
    ? "Todos los clientes del ejecutivo de origen"
    : "Solo los clientes seleccionados previamente en la cartera";
  let rows = movementItems(),
    target = $("#movementTarget").value;
  $("#movementImpact").innerHTML =
    '<div class="impact"><div><strong>' +
    rows.length +
    "</strong><span>clientes a mover</span></div><div><strong>" +
    rows.reduce((s, c) => s + c.cases.length, 0) +
    "</strong><span>casos pendientes</span></div><div><strong>" +
    (target !== "" ? clients.filter((c) => c.owner === +target).length + rows.length : "—") +
    "</strong><span>cartera destino final</span></div></div>" +
    (!rows.length
      ? '<div class="alert">Sin clientes seleccionados de este origen. Activa el toggle o selecciona clientes desde la cartera.</div>'
      : "");
  $("#reviewMovement").disabled = !rows.length;
}
function notifyReturn(h) {
  [...new Set(h.items.map((x) => x.owner))].forEach((owner) =>
    notify(
      [owner],
      "movimiento",
      "Tu cartera regresó a tu gestión",
      h.items.filter((x) => x.owner === owner).length +
        " clientes retornaron desde " +
        executives[h.target].name +
        ". Revisa las gestiones realizadas durante la cobertura.",
      "cartera",
    ),
  );
  notify(
    [h.target],
    "movimiento",
    "Finalizó tu cobertura temporal",
    h.items.length + " clientes regresaron a sus titulares.",
    "cartera",
  );
  notify(
    [-1],
    "movimiento",
    "Retorno de cartera confirmado",
    h.items.length + " clientes devueltos. Ambos ejecutivos fueron notificados.",
    "asignaciones",
  );
}
function assignmentView() {
  return (
    head(
      "Movimientos de cartera",
      "Asegura la continuidad: revisa el impacto, confirma el cambio y mantén informado al equipo.",
      '<button class="primary" onclick="openAssign(1)">⇄ Mover cartera</button>',
    ) +
    stats([
      [
        "Coberturas activas",
        history.filter((h) => h.end && !h.restored).length,
        "Vacaciones o reemplazo",
      ],
      ["Cambios definitivos", history.filter((h) => !h.end).length, "Renuncia o despido"],
      [
        "Clientes en cobertura",
        history.filter((h) => h.end && !h.restored).reduce((s, h) => s + h.items.length, 0),
        "Con titular de origen identificado",
      ],
      ["Retornos completados", history.filter((h) => h.restored).length, "Ejecutivos informados"],
    ]) +
    '<div class="notice">Los movimientos comienzan hoy. Las coberturas temporales conservan al titular y su fecha de retorno; usa “Finalizar cobertura” para devolver la cartera en esta demo.</div><section class="card"><div class="card-title"><h2>Historial y seguimiento</h2>' +
    badge(history.length + " movimientos", "gray") +
    "</div>" +
    (history.length
      ? '<div class="table-wrap" tabindex="0" role="region" aria-label="Tabla con desplazamiento horizontal"><table><thead><tr><th scope=col>Origen → destino</th><th scope=col>Clientes</th><th scope=col>Motivo</th><th scope=col>Vigencia</th><th scope=col>Estado</th><th scope=col>Avisos</th><th scope=col>Acción</th></tr></thead><tbody>' +
        history
          .map(
            (h, i) =>
              "<tr><td><b>" +
              executives[h.source ?? h.items[0].owner].name +
              "</b><small>→ " +
              executives[h.target].name +
              "</small></td><td>" +
              h.items.length +
              "</td><td>" +
              esc(h.reason) +
              "</td><td>" +
              esc(h.start) +
              "<small>" +
              (h.end ? "Retorno: " + esc(h.end) : "Definitiva") +
              "</small></td><td>" +
              badge(
                h.restored ? "Finalizada" : h.end ? "En cobertura" : "Aplicada",
                h.restored ? "gray" : "",
              ) +
              "</td><td>" +
              badge("Ambos notificados", "blue") +
              "</td><td>" +
              (h.end && !h.restored
                ? '<button onclick="restore(' + i + ')">Finalizar cobertura</button>'
                : "—") +
              "</td></tr>",
          )
          .join("") +
        "</tbody></table></div>"
      : '<div class="empty"><h3>Organiza la primera cobertura</h3><p>Carlos está de vacaciones. Puedes organizar una cobertura parcial según la capacidad disponible y revisar la notificación como Luis.</p><button class="primary" onclick="openAssign(1)">Mover cartera de Carlos</button></div>') +
    "</section>"
  );
}

// Customer workspace, inspired by the supplied reference.
let railMode = "Clientes",
  railFilter = "Todos",
  railQuery = "";
function renderRail() {
  if (esAgregado() || !["cartera", "cliente", "campanas"].includes(view)) {
    $("#portfolioRail").innerHTML = "";
    return;
  }
  const data = scope(),
    done = data.filter((c) => c.notes.some((n) => n.channel !== "Supervisor")).length;
  $("#portfolioRail").innerHTML =
    '<div class="rail-heading"><h2>Gestión de cartera</h2>' +
    badge(data.length + " clientes", "gray") +
    '</div><div class="segmented">' +
    ["Clientes", "Campañas"]
      .map(
        (x) =>
          '<button class="' +
          (railMode === x ? "active" : "") +
          '" onclick="railMode=\'' +
          x +
          "';renderRail()\">" +
          x +
          " <b>" +
          (x === "Clientes" ? data.length : campaigns.length) +
          "</b></button>",
      )
      .join("") +
    '</div><div class="rail-progress"><div><span>Clientes gestionados</span><strong>' +
    Math.round((done / Math.max(1, data.length)) * 100) +
    '%</strong></div><div class="progress"><span style="width:' +
    (done / Math.max(1, data.length)) * 100 +
    '%"></span></div><p>' +
    done +
    " gestionados <span>" +
    (data.length - done) +
    " pendientes</span></p></div>" +
    (railMode === "Clientes"
      ? '<input id="railSearch" aria-label="Buscar en cartera lateral" placeholder="Buscar cliente o DNI…" value="' +
        esc(railQuery) +
        '"><div class="rail-filters">' +
        ["Todos", "Por hacer", "Hechos"]
          .map(
            (f) =>
              '<button class="' +
              (f === railFilter ? "active" : "") +
              '" onclick="railFilter=\'' +
              f +
              "';renderRail()\">" +
              f +
              "</button>",
          )
          .join("") +
        '</div><div id="railRows"></div>'
      : '<div class="rail-campaigns">' +
        campaigns
          .map(
            (c, i) =>
              '<button onclick="filterCampaign(' +
              i +
              ')"><b>' +
              c +
              "</b><small>" +
              scope().filter((x) => x.campaign === c).length +
              " clientes · Prioridad " +
              campaignPriorities[i] +
              "</small></button>",
          )
          .join("") +
        "</div>");
  if (railMode === "Clientes") {
    $("#railSearch").oninput = (e) => {
      railQuery = e.target.value;
      renderRailRows();
    };
    renderRailRows();
  }
}
function clientView() {
  const c = scope().find((x) => x.id === selected);
  if (!c)
    return head(
      "Cliente fuera de tu cartera",
      "Selecciona un cliente de la lista lateral.",
      '<a class="btn" href="#cartera">Ver cartera</a>',
    );
  const coverage = history.find((h) => h.end && !h.restored && h.items.some((x) => x.id === c.id));
  return (
    '<section class="customer-banner"><div class="profile"><span class="avatar">' +
    initials(c.name) +
    "</span><div><h1>" +
    esc(c.name) +
    "</h1><p>DNI " +
    esc(c.dni) +
    " · " +
    badge("Renta Alta") +
    '</p><p class="sub">' +
    esc(c.phone) +
    " · " +
    esc(c.email) +
    '</p></div></div><div class="customer-actions"><span class="sub">Responsable: <b>' +
    executives[c.owner].name +
    '</b></span><button class="primary" onclick="openActivity(' +
    c.id +
    ')">Registrar atención</button></div></section>' +
    (coverage
      ? '<div class="coverage-note">Cobertura temporal de ' +
        executives[coverage.source].name +
        " · Retorno " +
        coverage.end +
        " · El historial permanece con el cliente.</div>"
      : "") +
    '<div class="tabs customer-tabs">' +
    [
      "Resumen",
      "Datos personales",
      "Información financiera",
      "Productos bancarios",
      "Campañas",
      "Oportunidades",
      "Gestiones y casos",
    ]
      .map(
        (t) =>
          '<button class="' +
          (tab === t ? "active" : "") +
          '" onclick="setTab(\'' +
          t +
          "')\">" +
          t +
          "</button>",
      )
      .join("") +
    "</div>" +
    (tab === "Resumen" ? customerSummary(c) : clientTab(c))
  );
}
function productCard(label, value, desc, state, type = "") {
  return (
    '<article class="bank-product"><div class="product-icon">▤</div><div><h3>' +
    label +
    "</h3><small>" +
    desc +
    "</small>" +
    badge(state, type) +
    "<p>" +
    value +
    "</p></div></article>"
  );
}
function customerSummary(c) {
  if (c.score !== undefined)
    return (
      '<div class="notice"><b>Cliente incorporado por preevaluación comercial</b><br>Score de prueba: ' +
      esc(c.score) +
      " · Mora: " +
      esc(c.arrears) +
      ' días. La información bancaria aún no ha sido consultada.</div><section class="card"><h2>Preparar el primer contacto</h2><p class="sub">Campaña: ' +
      esc(c.campaign) +
      '</p><p>No hay productos ni saldos bancarios cargados para este nuevo cliente.</p><div class="actions"><button class="primary" onclick="openActivity(' +
      c.id +
      ')">Registrar contacto</button><button onclick="setTab(\'Datos personales\')">Ver datos personales</button></div></section>'
    );
  return (
    '<div class="customer-shortcuts">' +
    [
      ["Datos personales", "Contacto y perfil del cliente", "Datos personales"],
      ["Información financiera", "Ingresos, saldos y deuda", "Información financiera"],
      ["Pedidos y reclamos", c.cases.length + " casos pendientes · Ver SLA", "Gestiones y casos"],
      ["Gestión comercial", c.status, "Campañas"],
    ]
      .map(
        ([title, sub, t]) =>
          '<button class="summary-tile" onclick="setTab(\'' +
          t +
          "')\"><div><b>" +
          title +
          "</b><span>→</span></div><p>" +
          esc(sub) +
          "</p><small>Ver detalle</small></button>",
      )
      .join("") +
    '</div><div class="section-label"><h2>Productos del cliente</h2><span>' +
    badge("Información de muestra", "gray") +
    '</span></div><div class="account-strip"><span class="product-icon">▤</span><b>Tarjeta de débito · **** 2982</b>' +
    badge("Activa") +
    '</div><h3 class="category-label">CUENTAS E INVERSIONES</h3><div class="product-grid">' +
    productCard("Cuenta de ahorros", money(c.balance * 0.4), "Cuenta · **** 4821", "Disponible") +
    productCard(
      "Depósito a plazo",
      money(c.balance * 0.6),
      "Depósito · **** 3012",
      "Vence 24 sep",
      "orange",
    ) +
    '</div><h3 class="category-label">TARJETAS Y CRÉDITOS</h3><div class="product-grid">' +
    productCard("Tarjeta de crédito", money(c.debt), "Saldo utilizado · **** 7814", "Pago al día") +
    productCard(
      "Perfil financiero",
      money(c.income),
      "Ingreso mensual declarado",
      "Ver información",
      "blue",
    ) +
    '</div><div class="section-label"><h2>Campañas asociadas</h2>' +
    priority(c) +
    '</div><section class="offer-card"><div><h3>' +
    esc(c.campaign) +
    "</h3><p>Oportunidad comercial</p><strong>" +
    money(c.amount) +
    "</strong></div><div>" +
    badge(c.status, "blue") +
    '<p class="small muted">Vigencia: 24 sep 2026</p></div><div class="actions"><button class="primary" onclick="openActivity(' +
    c.id +
    ')">Tipificar</button><button onclick="setTab(\'Campañas\')">Detalles</button></div></section>'
  );
}

// Intake is a pre-screening simulation, not a credit approval engine.
let intakeRows = [],
  intakeResults = [],
  allocation = [],
  intakeHistory = [],
  intakeCampaign = campaigns[0],
  minScore = 650,
  maxArrears = 0,
  capacity = 800;
function intakeView() {
  return (
    head(
      "Ingreso y distribución de clientes",
      "Validación previa, revisión de aptitud comercial y reparto equilibrado.",
      '<button onclick="openNew()">+ Ingreso individual</button><button class="primary" onclick="openBulk()">↑ Carga masiva</button>' +
        (intakeRows.length
          ? '<button onclick="reviewIntake()">Retomar lote pendiente</button>'
          : ""),
    ) +
    '<div class="process-steps"><span><b>1</b> Cargar datos</span><span><b>2</b> Validar morosidad y score</span><span><b>3</b> Equilibrar carteras</span><span><b>4</b> Confirmar y notificar</span></div><div class="notice">La carga entra a una bolsa común. Se asigna cada cliente apto al ejecutivo disponible con menos clientes, considerando su carga actual, incluidas las coberturas.</div>' +
    stats([
      ["Lotes procesados", intakeHistory.length, "Solo esta sesión"],
      [
        "Clientes incorporados",
        intakeHistory.reduce((s, h) => s + h.assigned, 0),
        "Validados y distribuidos",
      ],
      [
        "En revisión",
        intakeHistory.reduce((s, h) => s + h.review, 0),
        "Datos crediticios faltantes",
      ],
      [
        "No incorporados",
        intakeHistory.reduce((s, h) => s + h.excluded, 0),
        "Duplicados, formato o criterios demo",
      ],
    ]) +
    '<section class="card"><div class="card-title"><h2>Carga actual por ejecutivo</h2>' +
    badge("Balanceo por cantidad", "blue") +
    '</div><div class="table-wrap" tabindex="0" role="region" aria-label="Tabla con desplazamiento horizontal"><table><thead><tr><th scope=col>Ejecutivo</th><th scope=col>Disponibilidad</th><th scope=col>Clientes actuales</th><th scope=col>Nuevos clientes</th></tr></thead><tbody>' +
    executives
      .map(
        (e) =>
          "<tr><td>" +
          e.name +
          "</td><td>" +
          badge(e.status, e.status === "Disponible" ? "" : "orange") +
          "</td><td>" +
          clients.filter((c) => c.owner === e.id).length +
          "</td><td>" +
          (e.status === "Disponible"
            ? "Participa en la distribución"
            : "Excluido de nuevas asignaciones") +
          "</td></tr>",
      )
      .join("") +
    '</tbody></table></div></section><section class="card" style="margin-top:22px"><h2>Historial de ingresos</h2>' +
    (intakeHistory.length
      ? intakeHistory
          .map(
            (h, i) =>
              '<div class="product"><div><b>Lote ' +
              (intakeHistory.length - i) +
              " · " +
              h.date +
              '</b><p class="sub">' +
              h.assigned +
              " asignados · " +
              h.review +
              " en revisión · " +
              h.excluded +
              ' no incorporados</p></div><button onclick="showIntakeReport(' +
              i +
              ')">Ver resultados</button></div>',
          )
          .join("")
      : '<div class="empty">Aún no hay lotes procesados. Carga la plantilla de prueba para revisar el reparto.</div>') +
    "</section>"
  );
}
function openNew() {
  modal(
    "Ingreso individual a la bolsa común",
    '<p class="sub">El cliente pasará por la misma validación y distribución que una carga masiva.</p><form id="newclient"><div class="formgrid"><label>Nombre completo<input name="name" required minlength="3"></label><label>DNI<input name="dni" required pattern="[0-9]{8}" maxlength="8"></label><label>Correo<input name="email" type="email" required></label><label>Celular<input name="phone" required pattern="[0-9]{9}" maxlength="9"></label><label>Score de prueba (0–999)<input name="score" type="number" min="0" max="999" step="1" placeholder="Vacío: requiere revisión"></label><label>Días de mora<input name="arrears" type="number" min="0" step="1" placeholder="Vacío: requiere revisión"></label><label>Campaña<select name="campaign">' +
      opts(campaigns, intakeCampaign) +
      '</select></label><label>Origen<select name="source">' +
      opts(["Captación", "Referido", "Campaña"], "") +
      '</select></label></div><div class="notice">Datos ficticios. No se consulta ninguna central de riesgo ni se aprueba un crédito.</div><div class="modal-actions"><button type="button" onclick="closeModal()">Cancelar</button><button class="primary">Validar y proponer distribución</button></div></form>',
  );
  $("#newclient").onsubmit = (e) => {
    e.preventDefault();
    let d = Object.fromEntries(new FormData(e.target));
    intakeRows = [{ ...d, line: 2 }];
    intakeCampaign = d.campaign;
    closeModal();
    reviewIntake();
  };
}
function openBulk() {
  intakeRows = [];
  intakeResults = [];
  allocation = [];
  modal(
    "Carga masiva a la bolsa común",
    '<p class="sub">No elijas un ejecutivo. Primero validaremos los clientes y luego calcularemos una distribución equilibrada.</p><div class="process-steps"><span><b>1</b> Carga</span><span><b>2</b> Validación</span><span><b>3</b> Distribución</span></div><button class="textbtn" onclick="downloadTemplate()">↓ Descargar plantilla con ejemplos</button><div class="filebox"><input type="file" id="csvfile" accept=".csv,text/csv" aria-label="Archivo CSV"><p class="small muted">Máximo 500 filas / 500 KB · CSV separado por coma o punto y coma</p></div><label class="standalone-label">Campaña del lote<select id="bulkCampaign">' +
      opts(campaigns, intakeCampaign) +
      '</select></label><div class="notice">Columnas: nombre, dni, correo, celular, score, dias_mora.<br>Score o mora vacíos quedan en revisión y no se distribuyen.</div><p id="fileFeedback" role="status"></p><div class="modal-actions"><button onclick="closeModal()">Cancelar</button><button id="reviewIntakeButton" class="primary" disabled onclick="startIntakeReview()">Validar y distribuir →</button></div>',
  );
  $("#csvfile").onchange = async (e) => {
    intakeRows = [];
    $("#reviewIntakeButton").disabled = true;
    try {
      let file = e.target.files[0];
      if (!file) return;
      if (file.size > 500000) throw Error("El archivo supera 500 KB.");
      let rows = parseCSV(await file.text());
      if (rows.length > 501) throw Error("Máximo 500 clientes por lote.");
      const header = rows.shift().map((x) => x.trim().toLowerCase());
      if (header.join(",") !== "nombre,dni,correo,celular,score,dias_mora")
        throw Error("Los encabezados no coinciden. Usa la plantilla.");
      intakeRows = rows
        .filter((r) => r.some((x) => x.trim()))
        .map((r, i) => ({
          name: r[0]?.trim() || "",
          dni: r[1]?.trim() || "",
          email: r[2]?.trim() || "",
          phone: r[3]?.trim() || "",
          score: r[4]?.trim() ?? "",
          arrears: r[5]?.trim() ?? "",
          line: i + 2,
          formatError: r.length !== 6,
          source: "Campaña",
        }));
      if (!intakeRows.length) throw Error("El archivo no contiene clientes.");
      $("#fileFeedback").textContent = intakeRows.length + " filas listas para validar.";
      $("#reviewIntakeButton").disabled = false;
    } catch (err) {
      $("#fileFeedback").textContent = err.message;
      intakeRows = [];
    }
  };
}
function startIntakeReview() {
  intakeCampaign = $("#bulkCampaign").value;
  closeModal();
  reviewIntake();
}
function parseCSV(raw) {
  raw = raw.replace(/^\uFEFF/, "");
  let delimiter = raw.split(/\r?\n/)[0].includes(";") ? ";" : ",",
    rows = [],
    row = [],
    field = "",
    quoted = false;
  for (let i = 0; i < raw.length; i++) {
    let c = raw[i];
    if (c === '"') {
      if (quoted && raw[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === delimiter && !quoted) {
      row.push(field);
      field = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && raw[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (quoted) throw Error("El CSV tiene comillas sin cerrar.");
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
function downloadTemplate() {
  const rows = ["nombre,dni,correo,celular,score,dias_mora"];
  for (let i = 0; i < 12; i++)
    rows.push(
      "Cliente Demo " +
        (i + 1) +
        "," +
        (56000001 + i) +
        ",demo" +
        i +
        "@example.com," +
        (900111200 + i) +
        "," +
        (i === 9 ? "" : i === 10 ? "520" : String(700 + i)) +
        "," +
        (i === 11 ? "30" : "0"),
    );
  downloadCSV("plantilla_ingreso_clientes.csv", "\uFEFF" + rows.join("\n"));
}
function downloadCSV(name, data) {
  const u = URL.createObjectURL(new Blob([data], { type: "text/csv;charset=utf-8" })),
    a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
function evaluateIntake(rows) {
  const seen = new Set(clients.map((c) => c.dni));
  return rows.map((row) => {
    let r = { ...row },
      status = "Apto",
      reason = "Cumple los parámetros de prueba";
    if (
      r.formatError ||
      !r.name ||
      !/^\d{8}$/.test(r.dni) ||
      !/^\S+@\S+\.\S+$/.test(r.email) ||
      !/^\d{9}$/.test(r.phone)
    ) {
      status = "Error";
      reason = "Formato o datos de contacto inválidos";
    } else if (seen.has(r.dni)) {
      status = "Duplicado";
      reason = "DNI existente en cartera o repetido en el lote";
    } else {
      seen.add(r.dni);
      if (
        (r.score !== "" && (!/^\d+$/.test(String(r.score)) || +r.score > 999)) ||
        (r.arrears !== "" && !/^\d+$/.test(String(r.arrears)))
      ) {
        status = "Error";
        reason = "Score debe ser entero de 0 a 999; mora debe ser un entero no negativo";
      } else if (r.arrears !== "" && +r.arrears > maxArrears) {
        status = "No apto";
        reason = "Días de mora por encima del máximo de prueba";
      } else if (r.score !== "" && +r.score < minScore) {
        status = "No apto";
        reason = "Score por debajo del mínimo de prueba";
      } else if (r.score === "" || r.arrears === "") {
        status = "En revisión";
        reason = "Falta score o información de morosidad";
      }
    }
    return { ...r, status, reason };
  });
}
function planAllocation(results) {
  let loads = new Map(
    executives
      .filter((e) => e.status === "Disponible" && !esCobertura(e))
      .map((e) => [e.id, clients.filter((c) => c.owner === e.id).length]),
  );
  return results
    .filter((r) => r.status === "Apto")
    .map((r) => {
      let options = [...loads]
        .filter(([id, n]) => n < capacity)
        .sort((a, b) => a[1] - b[1] || a[0] - b[0]);
      if (!options.length)
        return { ...r, owner: null, reason: "Sin ejecutivo disponible con capacidad" };
      let [owner, count] = options[0];
      loads.set(owner, count + 1);
      return { ...r, owner };
    });
}
function reviewIntake() {
  intakeResults = evaluateIntake(intakeRows);
  allocation = planAllocation(intakeResults);
  modal(
    "Validación previa y propuesta de reparto",
    '<div class="rule-note"><b>Parámetros de demostración · no son política crediticia</b><p>Apto significa elegible para asignación comercial bajo estas reglas. No equivale a aprobación de crédito.</p></div><div class="formgrid rules"><label>Score mínimo (0–999)<input id="minScore" type="number" min="0" max="999" step="1" value="' +
      minScore +
      '"></label><label>Máximo días de mora<input id="maxArrears" type="number" min="0" step="1" value="' +
      maxArrears +
      '"></label><label>Tope por ejecutivo<input id="capacity" type="number" min="1" step="1" value="' +
      capacity +
      '"></label><div class="rule-action"><button onclick="recalculateIntake()">Recalcular propuesta</button></div></div><p id="ruleError" class="form-error" role="alert"></p><div id="intakeReview"></div><div class="modal-actions"><button onclick="closeModal()">Cancelar</button><button class="primary" id="commitIntake" onclick="confirmIntake()">Confirmar ingreso y notificar</button></div>',
  );
  $("#dialog").classList.add("wide-dialog");
  ["minScore", "maxArrears", "capacity"].forEach(
    (id) =>
      ($("#" + id).oninput = () => {
        $("#commitIntake").disabled = true;
        $("#ruleError").textContent = "Recalcula la propuesta para aplicar los nuevos parámetros.";
      }),
  );
  renderIntakeReview();
}
function recalculateIntake() {
  let m = Number($("#minScore").value),
    a = Number($("#maxArrears").value),
    c = Number($("#capacity").value);
  if (
    !$("#minScore").value ||
    !$("#maxArrears").value ||
    !$("#capacity").value ||
    ![m, a, c].every(Number.isInteger) ||
    m < 0 ||
    m > 999 ||
    a < 0 ||
    c < 1
  ) {
    $("#ruleError").textContent =
      "Ingresa valores enteros válidos: score 0–999, mora ≥ 0 y tope ≥ 1.";
    $("#commitIntake").disabled = true;
    return;
  }
  minScore = m;
  maxArrears = a;
  capacity = c;
  intakeResults = evaluateIntake(intakeRows);
  allocation = planAllocation(intakeResults);
  $("#ruleError").textContent = "";
  renderIntakeReview();
}
function renderIntakeReview() {
  const count = (s) => intakeResults.filter((r) => r.status === s).length,
    planned = allocation.filter((r) => r.owner !== null);
  $("#intakeReview").innerHTML =
    '<div class="intake-counts">' +
    [
      ["Aptos", count("Apto")],
      ["En revisión", count("En revisión")],
      ["No aptos", count("No apto")],
      ["Duplicados / errores", count("Duplicado") + count("Error")],
    ]
      .map(([t, n]) => "<div><strong>" + n + "</strong><span>" + t + "</span></div>")
      .join("") +
    "<h3>Distribución propuesta · " +
    planned.length +
    ' clientes</h3><p class="sub">Cada cliente se asigna a la cartera disponible más pequeña. Empates: orden estable de ejecutivo.</p><div class="table-wrap" tabindex="0" role="region" aria-label="Tabla con desplazamiento horizontal"><table><thead><tr><th scope=col>Ejecutivo</th><th scope=col>Actual</th><th scope=col>Recibe</th><th scope=col>Final</th><th scope=col>Disponibilidad</th></tr></thead><tbody>' +
    executives
      .map((e) => {
        let current = clients.filter((c) => c.owner === e.id).length,
          added = planned.filter((r) => r.owner === e.id).length;
        return (
          "<tr><td>" +
          e.name +
          "</td><td>" +
          current +
          "</td><td><b>+" +
          added +
          "</b></td><td>" +
          (current + added) +
          "</td><td>" +
          badge(e.status, e.status === "Disponible" ? "" : "orange") +
          "</td></tr>"
        );
      })
      .join("") +
    "</tbody></table></div><h3>Resultado por cliente</h3>" +
    intakeTable(intakeResults, allocation) +
    (planned.length < allocation.length
      ? '<div class="alert">' +
        (allocation.length - planned.length) +
        " aptos quedan sin asignar por disponibilidad o capacidad. No se incorporarán.</div>"
      : "") +
    (!esAdmin()
      ? '<div class="alert">La confirmación corresponde al administrador del canal. Cambia de perfil y vuelve a validar el lote para confirmar la distribución.</div>'
      : "");
  $("#commitIntake").disabled = !esAdmin() || !planned.length;
}
function intakeTable(results, plan) {
  return (
    // Región desplazable: necesita foco de teclado propio, o quien no usa ratón
    // no puede llegar al contenido que se sale. Lo detectó axe al sacarla del
    // diálogo (`scrollable-region-focusable`).
    '<div class="table-wrap intake-table" tabindex="0" role="region" aria-label="Resultado por cliente del lote"><table><thead><tr><th scope=col>Cliente / DNI</th><th scope=col>Score</th><th scope=col>Mora</th><th scope=col>Resultado</th><th scope=col>Motivo / destino</th></tr></thead><tbody>' +
    results
      .map((r) => {
        let p = plan.find((x) => x.line === r.line);
        return (
          "<tr><td>" +
          esc(r.name) +
          "<small>" +
          esc(r.dni) +
          '</small></td><td data-col="Score">' +
          esc(r.score || "Sin dato") +
          '</td><td data-col="Mora">' +
          (r.arrears === "" ? "Sin dato" : esc(r.arrears) + " días") +
          '</td><td data-col="Resultado">' +
          badge(
            r.status,
            r.status === "Apto" ? "" : r.status === "En revisión" ? "orange" : "red",
          ) +
          '</td><td data-col="Motivo / destino">' +
          esc(p ? (p.owner === null ? p.reason : executives[p.owner].name) : r.reason) +
          "</td></tr>"
        );
      })
      .join("") +
    "</tbody></table></div>"
  );
}
function confirmIntake() {
  if (!esAdmin()) return;
  const fresh = evaluateIntake(intakeRows),
    plan = planAllocation(fresh);
  if (
    JSON.stringify(fresh) !== JSON.stringify(intakeResults) ||
    JSON.stringify(plan) !== JSON.stringify(allocation)
  ) {
    intakeResults = fresh;
    allocation = plan;
    renderIntakeReview();
    $("#ruleError").textContent =
      "La cartera cambió. Revisa la propuesta actualizada antes de confirmar.";
    return;
  }
  const assigned = plan.filter((r) => r.owner !== null);
  if (!assigned.length) return;
  assigned.forEach((r) =>
    addClient({
      ...r,
      campaign: intakeCampaign,
      priority: campaignPriorities[campaigns.indexOf(intakeCampaign)],
      source: r.source || "Campaña",
    }),
  );
  executives.forEach((e) => {
    let n = assigned.filter((r) => r.owner === e.id).length;
    if (n)
      notify(
        [e.id],
        "movimiento",
        "Recibiste " + n + " nuevos clientes por distribución equilibrada",
        "Clientes preevaluados para " + intakeCampaign + ". Revisa los datos antes del contacto.",
        "cartera",
        { campaign: intakeCampaign },
      );
  });
  let report = {
    date: new Date().toLocaleString("es-PE"),
    assigned: assigned.length,
    review: fresh.filter((r) => r.status === "En revisión").length,
    excluded: fresh.filter((r) => !["Apto", "En revisión"].includes(r.status)).length,
    results: fresh,
    plan,
    unassigned: plan.filter((r) => r.owner === null).length,
    minScore,
    maxArrears,
    capacity,
  };
  intakeHistory.unshift(report);
  notify(
    [-1],
    "movimiento",
    "Carga validada y distribuida",
    assigned.length + " clientes asignados a ejecutivos disponibles.",
    "ingresos",
  );
  intakeRows = [];
  closeModal();
  view = "ingresos";
  location.hash = "ingresos";
  render();
  toast(assigned.length + " clientes incorporados. Ejecutivos notificados.");
  showIntakeReport(0);
}
function showIntakeReport(i) {
  let h = intakeHistory[i];
  modal(
    "Resultado del ingreso · " + h.date,
    '<div class="notice">' +
      h.assigned +
      " clientes incorporados · " +
      h.review +
      " en revisión · " +
      h.excluded +
      " no incorporados · " +
      h.unassigned +
      " aptos sin capacidad.<br>Reglas de prueba: score mínimo " +
      h.minScore +
      ", mora máxima " +
      h.maxArrears +
      " días, tope " +
      h.capacity +
      ".</div>" +
      intakeTable(h.results, h.plan) +
      '<p class="sub">Las filas no asignadas permanecen en este reporte de sesión. Para corregirlas, vuelve a cargar solo esas filas.</p><div class="modal-actions"><button class="primary" onclick="closeModal()">Entendido</button></div>',
  );
  $("#dialog").classList.add("wide-dialog");
}

// Scaled portfolio, separate campaign work items and immutable sales attribution.
const serviceCampaigns = ["Seguimiento comercial", "Actualización de datos"];
campaigns.push(...serviceCampaigns);
campaignPriorities.push("Media", "Alta");
const campaignKind = (name) =>
  name === serviceCampaigns[0]
    ? "Servicio comercial"
    : name === serviceCampaigns[1]
      ? "Servicio administrativo"
      : "Venta";
const demoToday = new Date(),
  todayKey = demoToday.toISOString().slice(0, 10),
  monthKey = todayKey.slice(0, 7),
  daysInMonth = new Date(demoToday.getFullYear(), demoToday.getMonth() + 1, 0).getDate(),
  elapsedDays = demoToday.getDate();
let segmentFilter = "",
  scoreFilter = "";
let clientPage = 1,
  statusFilter = "",
  campaignTypeFilter = "",
  reportRange = "Mes",
  reportOwner = "",
  workEvents = [],
  opportunityDraft = null,
  calculatorClientId = 1,
  railLimit = 30;
const targetSizes = [500, 480, 520, 490, 300, 280, 320, 260, 290, 0, 0, 0],
  firstNames = [
    "Ana",
    "Bruno",
    "Carolina",
    "Diego",
    "Elena",
    "Felipe",
    "Gabriela",
    "Hugo",
    "Isabel",
    "Javier",
    "Karla",
    "Leonardo",
    "María",
    "Nicolás",
    "Olivia",
    "Pablo",
    "Rosa",
    "Santiago",
    "Teresa",
    "Víctor",
  ],
  lastNames = [
    "Acosta",
    "Bermúdez",
    "Cárdenas",
    "Delgado",
    "Espinoza",
    "Flores",
    "García",
    "Herrera",
    "Ibarra",
    "Juárez",
    "López",
    "Molina",
    "Núñez",
    "Ortega",
    "Pérez",
    "Quispe",
    "Ramírez",
    "Soto",
    "Torres",
    "Vargas",
  ];
for (const e of executives) {
  let missing = targetSizes[e.id] - clients.filter((c) => c.owner === e.id).length;
  for (let i = 0; i < missing; i++) {
    let id = clients.length + 1;
    clients.push({
      id,
      name:
        firstNames[i % 20] +
        " " +
        lastNames[Math.floor(i / 20) % 20] +
        " " +
        lastNames[(i + e.id * 3) % 20],
      dni: String(43000000 + id),
      email: "cliente" + id + "@example.com",
      phone: String(910000000 + id),
      owner: e.id,
      campaign: campaigns[i % 3],
      priority: campaignPriorities[i % 3],
      source: i % 7 === 0 ? "Referido" : "Campaña",
      status: "No contactado",
      balance: 35000 + (i % 30) * 4000,
      income: 8000 + (i % 20) * 1000,
      debt: (i % 12) * 2000,
      amount: 10000 + (i % 15) * 5000,
      notes: [],
      cases:
        i % 35 === 0
          ? [
              {
                title: "Actualización de información",
                owner: "Operaciones",
                due: "20 sep",
                status: "Pendiente",
              },
            ]
          : [],
    });
  }
}
function ensureTasks(c) {
  if (!c.tasks) {
    c.tasks = [
      {
        id: "campaign-" + c.id,
        name: c.campaign,
        kind: campaignKind(c.campaign),
        priority: c.priority,
        status: "No contactado",
        sold: false,
      },
    ];
    if (c.id % 4 === 0)
      c.tasks.push({
        id: "service-" + c.id,
        name: serviceCampaigns[c.id % 8 === 0 ? 1 : 0],
        kind: campaignKind(serviceCampaigns[c.id % 8 === 0 ? 1 : 0]),
        priority: c.id % 8 === 0 ? "Alta" : "Media",
        status: "Pendiente",
        sold: false,
      });
  }
  return c.tasks;
}
clients.forEach((c) => {
  c.segment = c.id % 3 === 0 ? "Select Plus" : "Select";
  c.riskScore = 660 + (c.id % 180);
  c.arrearsDays = c.id % 29 === 0 ? 15 : 0;
  ensureTasks(c);
});
// Seed illustrative month-to-date activity. New actions update the same data model.
for (const e of executives) {
  clients
    .filter((c) => c.owner === e.id)
    .slice(0, 100 + e.id * 12)
    .forEach((c, i) => {
      let t = ensureTasks(c)[0],
        day =
          i < 6 && e.status === "Disponible" ? elapsedDays : 1 + (i % Math.max(1, elapsedDays - 1)),
        date = monthKey + "-" + String(day).padStart(2, "0");
      let outcome = ["Acepta campaña", "Lo va a pensar", "Rechaza campaña", "No contactado"][i % 4];
      t.status = outcome;
      c.status = outcome;
      workEvents.push({
        clientId: c.id,
        taskId: t.id,
        owner: e.id,
        date,
        kind: t.kind,
        priority: t.priority,
        outcome,
        name: t.name,
      });
      c.notes.push({
        result: outcome,
        channel: "Llamada",
        text: "Gestión de demostración",
        time: date,
        next: "",
      });
      if (outcome === "Acepta campaña" && i % 8 === 0) {
        t.sold = true;
        t.sale = { owner: e.id, date, amount: c.amount, priority: t.priority };
      }
    });
}
const normalized = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s/g, "");
function matchingTask(c) {
  return (
    ensureTasks(c).find((t) => !campaignFilter || t.name === campaignFilter) || ensureTasks(c)[0]
  );
}
function filtered() {
  return scope()
    .filter(
      (c) =>
        (!query || normalized(c.name + " " + c.dni + " " + c.phone).includes(normalized(query))) &&
        (!campaignFilter || ensureTasks(c).some((t) => t.name === campaignFilter)) &&
        (!priorityFilter ||
          matchingTask(c).priority === priorityFilter ||
          c.source === priorityFilter) &&
        (!ownerFilter || c.owner === Number(ownerFilter)) &&
        (!segmentFilter || (c.segment || "Select") === segmentFilter) &&
        (!scoreFilter ||
          (scoreFilter === "700"
            ? Number(c.score ?? c.riskScore) >= 700
            : scoreFilter === "650"
              ? Number(c.score ?? c.riskScore) >= 650 && Number(c.score ?? c.riskScore) < 700
              : Number(c.score ?? c.riskScore) < 650)) &&
        (!statusFilter || matchingTask(c).status === statusFilter),
    )
    .sort(
      (a, b) =>
        ["Alta", "Media", "Baja"].indexOf(matchingTask(a).priority) -
          ["Alta", "Media", "Baja"].indexOf(matchingTask(b).priority) || a.id - b.id,
    );
}
function pageRows() {
  let data = filtered();
  // 15 por página en toda la aplicación, igual que el resto de tablas.
  clientPage = Math.max(1, Math.min(clientPage, Math.max(1, Math.ceil(data.length / 15))));
  return data.slice((clientPage - 1) * 15, clientPage * 15);
}
function table(data, checks = false) {
  return (
    '<div class="table-wrap" tabindex="0" role="region" aria-label="Tabla con desplazamiento horizontal"><table><thead><tr>' +
    (checks
      ? '<th scope=col><input type="checkbox" id="selectall" aria-label="Seleccionar esta página"></th>'
      : "") +
    "<th scope=col>Cliente</th><th scope=col>Prioridad</th><th scope=col>Campaña / servicio</th><th scope=col>Resultado</th><th scope=col>" +
    (esAgregado() ? "Responsable" : "Próximo contacto") +
    "</th><th scope=col>Gestionar</th></tr></thead><tbody>" +
    data
      .map((c) => {
        let t = matchingTask(c);
        return (
          "<tr>" +
          (checks
            ? '<td><input class="choose" type="checkbox" data-id="' +
              c.id +
              '" aria-label="Seleccionar ' +
              esc(c.name) +
              '" ' +
              (selectedIds.has(c.id) ? "checked" : "") +
              "></td>"
            : "") +
          '<td><a class="namecell" href="#cliente/' +
          c.id +
          '"><span class="avatar">' +
          initials(c.name) +
          "</span><div><b>" +
          esc(c.name) +
          "</b><small>DNI " +
          c.dni +
          " · " +
          esc(c.phone) +
          "</small></div></a></td><td>" +
          badge(t.priority, t.priority === "Alta" ? "orange" : "gray") +
          "</td><td>" +
          esc(t.name) +
          "<small>" +
          t.kind +
          "</small></td><td>" +
          badge(
            t.sold ? "Venta registrada" : t.status,
            t.sold ? "" : t.status === "No contactado" ? "gray" : "blue",
          ) +
          "</td><td>" +
          (esAgregado() ? executives[c.owner].name : esc(t.next || "Sin programar")) +
          // Gestionar empieza por mirar al cliente, no por responder por él:
          // lleva a la ficha 360, donde está el saldo, sus campañas abiertas
          // y el historial. Tipificar es una acción de ahí dentro.
          '</td><td><button class="primary" onclick="abrirCliente13(' +
          c.id +
          ')">Gestionar</button></td></tr>'
        );
      })
      .join("") +
    "</tbody></table>" +
    (data.length
      ? ""
      : '<div class="empty">No hay coincidencias. Prueba con el DNI o quita filtros.</div>') +
    "</div>"
  );
}
function pagination() {
  let n = filtered().length;
  return (
    '<div class="pagination"><span>' +
    n +
    " clientes · Página " +
    clientPage +
    " de " +
    Math.max(1, Math.ceil(n / 25)) +
    '</span><div class="actions"><button ' +
    (clientPage <= 1 ? "disabled" : "") +
    ' onclick="changePage(-1)">← Anterior</button><button ' +
    (clientPage * 15 >= n ? "disabled" : "") +
    ' onclick="changePage(1)">Siguiente →</button></div></div>'
  );
}
function portfolio() {
  let data = scope();
  return (
    head(
      esAgregado() ? "Carteras del equipo" : "Clientes",
      campaignFilter
        ? "Gestión de " + esc(campaignFilter)
        : "Busca por nombre, DNI o celular. Gestiona sin perder el contexto.",
      esAgregado()
        ? '<button onclick="openBulk()">Carga masiva</button><button onclick="openNew()">Nuevo cliente</button>'
        : '<span class="sub">Abre una ficha para evaluar nuevas oportunidades</span>',
    ) +
    '<div class="portfolio-overview"><b>' +
    data.length +
    " clientes</b><span>" +
    data.filter((c) => ensureTasks(c).some((t) => t.status === "No contactado")).length +
    " con campañas sin contactar</span><span>" +
    data.filter((c) => ensureTasks(c).some((t) => t.next === todayKey)).length +
    ' seguimientos hoy</span></div><section class="card"><div class="toolbar"><input id="search" aria-label="Buscar cliente" placeholder="Nombre, DNI o celular…" value="' +
    esc(query) +
    '"><select id="campaignFilter" aria-label="Campaña"><option value="">Todas las campañas y servicios</option>' +
    opts([...campaigns, "Préstamo personal"], campaignFilter) +
    '</select><select id="priorityFilter" aria-label="Prioridad"><option value="">Cualquier prioridad</option>' +
    opts(["Alta", "Media", "Baja", "Referido"], priorityFilter) +
    '</select></div><div class="toolbar"><select id="statusFilter" aria-label="Resultado" onchange="statusFilter=this.value;clientPage=1;updateRows()"><option value="">Todos los resultados</option>' +
    opts(
      [
        "No contactado",
        "Acepta campaña",
        "Lo va a pensar",
        "Rechaza campaña",
        "Pendiente",
        "En proceso",
        "Resuelto",
        "No contactado / servicio",
      ],
      statusFilter,
    ) +
    "</select>" +
    (esAgregado()
      ? '<select id="ownerFilter" aria-label="Ejecutivo"><option value="">Todos los ejecutivos</option>' +
        executives
          .map(
            (e) =>
              '<option value="' +
              e.id +
              '" ' +
              (ownerFilter === String(e.id) ? "selected" : "") +
              ">" +
              e.name +
              "</option>",
          )
          .join("") +
        "</select>"
      : "") +
    '<select aria-label="Segmento" onchange="segmentFilter=this.value;updateRows()"><option value="">Todos los segmentos</option>' +
    opts(["Select", "Select Plus"], segmentFilter) +
    '</select><select aria-label="Score crediticio" onchange="scoreFilter=this.value;updateRows()"><option value="">Cualquier score</option>' +
    [
      ["700", "Score ≥ 700"],
      ["650", "Score 650–699"],
      ["bajo", "Score < 650"],
    ]
      .map(
        ([v, l]) =>
          '<option value="' +
          v +
          '" ' +
          (scoreFilter === v ? "selected" : "") +
          ">" +
          l +
          "</option>",
      )
      .join("") +
    '</select><button onclick="clearClientFilters()">Limpiar filtros</button></div><div class="card-title"><span id="count" class="small muted">' +
    filtered().length +
    " coincidencias</span>" +
    (esAgregado()
      ? '<button onclick="openAssign()">Mover seleccionados (<span id="selectionCount">' +
        selectedIds.size +
        "</span>)</button>"
      : "") +
    '</div><div id="rows">' +
    table(pageRows(), esAgregado()) +
    '</div><div id="pagination">' +
    pagination() +
    "</div></section>"
  );
}
function updateRows() {
  clientPage = 1;
  paintRows();
}
function paintRows() {
  $("#rows").innerHTML = table(pageRows(), esAgregado());
  $("#count").textContent = filtered().length + " coincidencias";
  $("#pagination").innerHTML = pagination();
  if ($("#selectionCount")) $("#selectionCount").textContent = selectedIds.size;
  bindChecks();
}
function changePage(delta) {
  clientPage += delta;
  paintRows();
}
function clearClientFilters() {
  segmentFilter = "";
  scoreFilter = "";
  query = "";
  campaignFilter = "";
  priorityFilter = "";
  statusFilter = "";
  ownerFilter = "";
  clientPage = 1;
  render();
}
function bindChecks() {
  document.querySelectorAll(".choose").forEach(
    (el) =>
      (el.onchange = () => {
        el.checked ? selectedIds.add(+el.dataset.id) : selectedIds.delete(+el.dataset.id);
        $("#selectionCount").textContent = selectedIds.size;
      }),
  );
  if ($("#selectall"))
    $("#selectall").onchange = (e) => {
      pageRows().forEach((c) =>
        e.target.checked ? selectedIds.add(c.id) : selectedIds.delete(c.id),
      );
      paintRows();
    };
}
function renderRailRows() {
  const rows = scope()
    .filter((c) => normalized(c.name + " " + c.dni + " " + c.phone).includes(normalized(railQuery)))
    .filter(
      (c) =>
        railFilter === "Todos" ||
        (railFilter === "Hechos") === c.notes.some((n) => n.channel !== "Supervisor"),
    );
  $("#railRows").innerHTML =
    rows
      .slice(0, railLimit)
      .map(
        (c) =>
          '<a href="#cliente/' +
          c.id +
          '" class="rail-client ' +
          (view === "cliente" && selected === c.id ? "selected" : "") +
          '"><div><b>' +
          esc(c.name) +
          "</b><small>DNI " +
          esc(c.dni) +
          "</small><small>" +
          esc(c.campaign) +
          '</small></div><span class="rail-dot ' +
          (c.priority === "Alta" ? "urgent" : "") +
          '">' +
          (c.priority === "Alta" ? "!" : "✓") +
          "</span></a>",
      )
      .join("") +
      (rows.length > railLimit
        ? '<button class="textbtn" onclick="railLimit+=30;renderRailRows()">Mostrar más (' +
          rows.length +
          ")</button>"
        : "") || '<div class="empty">Sin coincidencias.</div>';
}
function campaignView() {
  return (
    head(
      esAgregado() ? "Seguimiento de campañas" : "Campañas y servicios",
      "Encuentra a los clientes por prioridad y registra el resultado de cada gestión.",
    ) +
    '<div class="tabs">' +
    ["Todas", "Venta", "Servicio comercial", "Servicio administrativo"]
      .map(
        (x) =>
          '<button class="' +
          ((campaignTypeFilter || "Todas") === x ? "active" : "") +
          '" onclick="campaignTypeFilter=\'' +
          (x === "Todas" ? "" : x) +
          "';render()\">" +
          x +
          "</button>",
      )
      .join("") +
    '</div><div class="campaigns">' +
    campaigns
      .map((name, i) => {
        if (campaignTypeFilter && campaignKind(name) !== campaignTypeFilter) return "";
        const tasks = scope().flatMap((c) => ensureTasks(c).filter((t) => t.name === name)),
          done = tasks.filter((t) => !["Pendiente", "No contactado"].includes(t.status)).length,
          sales = tasks.filter((t) => t.sold).length;
        return (
          '<section class="card"><div class="card-title">' +
          badge(
            "Prioridad " + campaignPriorities[i],
            campaignPriorities[i] === "Alta" ? "orange" : "gray",
          ) +
          badge(campaignKind(name), "blue") +
          "</div><h2>" +
          name +
          '</h2><div class="campaign-number">' +
          tasks.length +
          ' <span class="sub">clientes</span></div><div class="progress"><span style="width:' +
          (done / Math.max(1, tasks.length)) * 100 +
          '%"></span></div><p class="sub">' +
          done +
          " gestionados · " +
          (tasks.length - done) +
          " pendientes" +
          (campaignKind(name) === "Venta" ? " · " + sales + " ventas" : "") +
          '</p><div class="actions">' +
          (esAgregado()
            ? '<span class="sub">Avance: ' +
              Math.round((done / Math.max(1, tasks.length)) * 100) +
              "%</span>"
            : '<button class="primary" onclick="filterCampaign(' +
              i +
              ')">Gestionar clientes →</button>') +
          "" +
          (esAgregado() ? '<button onclick="openPriority(' + i + ')">Priorizar</button>' : "") +
          "</div></section>"
        );
      })
      .join("") +
    "</div>"
  );
}
function openActivity(id, taskId) {
  if (esAgregado()) return;
  const c = scope().find((c) => c.id === id);
  if (!c) return;
  const tasks = ensureTasks(c),
    t =
      tasks.find((t) => t.id === taskId) ||
      tasks.find((t) => t.name === campaignFilter) ||
      tasks[0];
  modal(
    "Gestionar cliente",
    '<p class="sub">' +
      esc(c.name) +
      " · DNI " +
      c.dni +
      '</p><form id="activity"><div class="formgrid"><label class="full">Campaña o servicio<select id="activityTask" name="taskId">' +
      tasks
        .map(
          (x) =>
            '<option value="' +
            x.id +
            '" ' +
            (x.id === t.id ? "selected" : "") +
            ">" +
            esc(x.name) +
            " · " +
            x.kind +
            "</option>",
        )
        .join("") +
      '</select></label><label>Canal<select name="channel">' +
      opts(["Llamada", "WhatsApp", "Correo", "Presencial"], "") +
      '</select></label><label>Resultado<select id="activityResult" name="result"></select></label><label class="full">Acuerdos y siguiente paso<textarea name="text" required placeholder="Registra el contexto para el siguiente contacto"></textarea></label><label>Próximo contacto<input id="activityNext" type="date" name="next" min="' +
      todayKey +
      '"></label><label id="saleCheckLabel" class="sale-check"><input type="checkbox" id="saleCheck" name="confirmSale"> Venta concretada y confirmada</label><label id="saleAmountLabel">Monto de venta (S/)<input type="number" min="1" step="0.01" id="saleAmount" name="saleAmount" value="' +
      Math.max(1, c.amount) +
      '"></label></div><div class="notice" id="activityHint"></div><p id="activityError" class="form-error" role="alert"></p><div class="modal-actions"><button type="button" onclick="closeModal()">Cancelar</button><button type="button" onclick="saveActivity(true)">Guardar y siguiente</button><button class="primary">Guardar gestión</button></div></form>',
  );
  $("#activityTask").onchange = () => configureActivity(c);
  $("#activityResult").onchange = () => updateActivityControls(c);
  $("#saleCheck").onchange = () => updateActivityControls(c);
  configureActivity(c);
  $("#activity").onsubmit = (e) => {
    e.preventDefault();
    saveActivity(false);
  };
  $("#activity").dataset.clientId = c.id;
}
function configureActivity(c) {
  let t = ensureTasks(c).find((t) => t.id === $("#activityTask").value);
  if (!t) t = ensureTasks(c)[0];
  $("#activityTask").value = t.id;
  const results =
    t.kind === "Venta"
      ? ["Acepta campaña", "Lo va a pensar", "Rechaza campaña", "No contactado"]
      : ["Pendiente", "En proceso", "Resuelto", "No contactado / servicio"];
  $("#activityResult").innerHTML = opts(results, t.status);
  $("#saleCheck").checked = false;
  $("#activityNext").value = t.next || "";
  updateActivityControls(c);
}
function updateActivityControls(c) {
  let t = ensureTasks(c).find((t) => t.id === $("#activityTask").value),
    accept = t.kind === "Venta" && $("#activityResult").value === "Acepta campaña";
  $("#saleCheckLabel").style.display = accept && !t.sold ? "flex" : "none";
  $("#saleCheck").disabled = !accept || t.sold;
  if (!accept) $("#saleCheck").checked = false;
  const sale = accept && !t.sold && $("#saleCheck").checked;
  $("#saleAmountLabel").style.display = sale ? "flex" : "none";
  $("#saleAmount").disabled = !sale;
  $("#saleAmount").required = sale;
  $("#activityNext").required = $("#activityResult").value === "Lo va a pensar";
  $("#activityHint").textContent = t.sold
    ? "Esta venta ya fue registrada. La nueva gestión no duplicará sus indicadores."
    : t.kind === "Venta"
      ? "Aceptar una campaña no equivale a una venta. Solo marca venta concretada cuando esté confirmada."
      : "Esta gestión de servicio alimenta productividad y resolución, no el contador de ventas.";
}
function saveActivity(next) {
  const form = $("#activity");
  if (!form.reportValidity()) return;
  const c = scope().find((c) => c.id === Number(form.dataset.clientId));
  if (!c) return;
  const d = Object.fromEntries(new FormData(form)),
    t = ensureTasks(c).find((t) => t.id === d.taskId);
  if (!t) return;
  const options =
    t.kind === "Venta"
      ? ["Acepta campaña", "Lo va a pensar", "Rechaza campaña", "No contactado"]
      : ["Pendiente", "En proceso", "Resuelto", "No contactado / servicio"];
  if (!options.includes(d.result)) return;
  let sale =
    d.confirmSale === "on" && d.result === "Acepta campaña" && t.kind === "Venta" && !t.sold;
  if (sale && !(Number(d.saleAmount) > 0)) return;
  if (d.result === "Lo va a pensar" && !d.next) {
    $("#activityError").textContent = "Programa el próximo contacto.";
    return;
  }
  t.status = d.result;
  t.next = d.next || "";
  if (t === ensureTasks(c)[0]) c.status = t.status;
  if (sale) {
    t.sold = true;
    t.sale = { owner: c.owner, date: todayKey, amount: Number(d.saleAmount), priority: t.priority };
  }
  workEvents.push({
    clientId: c.id,
    taskId: t.id,
    owner: c.owner,
    date: todayKey,
    kind: t.kind,
    priority: t.priority,
    outcome: d.result,
    name: t.name,
  });
  c.notes.unshift({
    ...d,
    result: d.result + (sale ? " · Venta confirmada" : ""),
    text: t.name + ": " + d.text,
    time: new Date().toLocaleString("es-PE"),
  });
  const candidates = filtered(),
    index = candidates.findIndex((x) => x.id === c.id),
    following = candidates[index + 1];
  closeModal();
  render();
  toast("Gestión guardada. Indicadores actualizados." + (sale ? " Venta registrada." : ""));
  if (next && following) {
    selected = following.id;
    view = "cliente";
    location.hash = "cliente/" + following.id;
    openActivity(following.id);
  }
}
function reportExecutives() {
  return role === "exec"
    ? [executives[activeExecutive]]
    : reportOwner === ""
      ? executives
      : [executives[+reportOwner]];
}
function metrics(ids, range) {
  let relevantDate = (d) => (range === "Hoy" ? d === todayKey : d.startsWith(monthKey)),
    events = workEvents.filter((e) => ids.includes(e.owner) && relevantDate(e.date)),
    sales = clients.flatMap((c) =>
      ensureTasks(c)
        .filter((t) => t.sale && ids.includes(t.sale.owner) && relevantDate(t.sale.date))
        .map((t) => ({ ...t.sale, name: t.name })),
    );
  return {
    events,
    sales,
    prioritized: sales.filter((s) => s.priority === "Alta").length,
    amount: sales.reduce((s, x) => s + x.amount, 0),
    services: new Set(
      events.filter((e) => e.kind !== "Venta" && e.outcome === "Resuelto").map((e) => e.taskId),
    ).size,
    contacts: new Set(
      events.filter((e) => !e.outcome.startsWith("No contactado")).map((e) => e.clientId),
    ).size,
  };
}
function sales() {
  const es = reportExecutives(),
    ids = es.map((e) => e.id),
    m = metrics(ids, reportRange),
    month = metrics(ids, "Mes"),
    target = es.length * (reportRange === "Hoy" ? 3 : 40),
    monthlyTarget = es.length * 40,
    avg = month.sales.length / elapsedDays,
    projected = avg * daysInMonth,
    required =
      Math.max(0, monthlyTarget - month.sales.length) / Math.max(1, daysInMonth - elapsedDays);
  return (
    head(
      esAgregado() ? "Panel de seguimiento del equipo" : "Mi avance comercial",
      "Datos de demostración · " +
        todayKey +
        " · Las gestiones y ventas confirmadas actualizan este panel.",
      '<select aria-label="Periodo del panel" onchange="reportRange=this.value;render()">' +
        opts(["Hoy", "Mes"], reportRange) +
        "</select>" +
        (esAgregado()
          ? '<select aria-label="Filtrar ejecutivo" onchange="reportOwner=this.value;render()"><option value="">Todo el equipo</option>' +
            executives
              .map(
                (e) =>
                  '<option value="' +
                  e.id +
                  '" ' +
                  (reportOwner === String(e.id) ? "selected" : "") +
                  ">" +
                  e.name +
                  "</option>",
              )
              .join("") +
            "</select>"
          : ""),
    ) +
    stats([
      [
        "Ventas confirmadas",
        m.sales.length,
        "Meta " + (reportRange === "Hoy" ? "diaria" : "mensual") + ": " + target,
      ],
      ["Ventas priorizadas", m.prioritized, "Campaña con prioridad alta al vender"],
      ["Contactos efectivos", m.contacts, m.events.length + " gestiones registradas"],
      ["Servicios resueltos", m.services, "Comerciales y administrativos"],
    ]) +
    '<div class="goal-overview"><div><span>Avance de ventas · ' +
    reportRange +
    "</span><strong>" +
    Math.round((m.sales.length / target) * 100) +
    '%</strong><div class="progress"><span style="width:' +
    Math.min(100, (m.sales.length / target) * 100) +
    '%"></span></div><small>' +
    m.sales.length +
    " de " +
    target +
    " ventas · " +
    money(m.amount) +
    "</small></div><div><span>Promedio diario del mes</span><strong>" +
    avg.toFixed(1) +
    "</strong><small>Ventas / " +
    elapsedDays +
    " días calendario transcurridos</small></div><div><span>Proyección al cierre</span><strong>" +
    projected.toFixed(0) +
    " / " +
    monthlyTarget +
    "</strong><small>" +
    (projected >= monthlyTarget
      ? "Ritmo suficiente para la meta"
      : "Necesitas " + required.toFixed(1) + " ventas/día en los días restantes") +
    '</small></div></div><div class="grid"><section class="card"><div class="card-title"><h2>Ventas durante el mes</h2>' +
    badge("Total / priorizadas", "blue") +
    "</div>" +
    salesChart(ids) +
    '</section><section class="card"><h2>Resultados de gestión · ' +
    reportRange +
    "</h2>" +
    ["Acepta campaña", "Lo va a pensar", "Rechaza campaña", "No contactado", "Resuelto"]
      .map((result) => {
        let n = m.events.filter((e) => e.outcome === result).length;
        return (
          '<div class="result-row"><span>' +
          result +
          "</span><b>" +
          n +
          '</b><div class="progress"><span style="width:' +
          (n / Math.max(1, m.events.length)) * 100 +
          '%"></span></div></div>'
        );
      })
      .join("") +
    "</section></div>" +
    (esAgregado()
      ? '<section class="card"><div class="card-title"><h2>Desempeño por ejecutivo</h2><span class="sub">' +
        reportRange +
        ' · Meta mensual individual: 40</span></div><div class="table-wrap" tabindex="0" role="region" aria-label="Tabla con desplazamiento horizontal"><table><thead><tr><th scope=col>Ejecutivo</th><th scope=col>Cartera</th><th scope=col>Gestiones</th><th scope=col>Ventas</th><th scope=col>Priorizadas</th><th scope=col>Avance mes</th><th scope=col>Proyección</th><th scope=col></th></tr></thead><tbody>' +
        es
          .map((e) => {
            const d = metrics([e.id], reportRange),
              m = metrics([e.id], "Mes");
            return (
              "<tr><td>" +
              e.name +
              "<small>" +
              e.status +
              "</small></td><td>" +
              clients.filter((c) => c.owner === e.id).length +
              "</td><td>" +
              d.events.length +
              "</td><td>" +
              d.sales.length +
              "</td><td>" +
              d.prioritized +
              "</td><td>" +
              Math.round((m.sales.length / 40) * 100) +
              "%</td><td>" +
              Math.round((m.sales.length / elapsedDays) * daysInMonth) +
              ' / 40</td><td><button onclick="viewOwner(' +
              e.id +
              ')">Ver avance</button></td></tr>'
            );
          })
          .join("") +
        "</tbody></table></div></section>"
      : "") +
    '<section class="card" style="margin-top:22px"><h2>Ventas y servicios por campaña · ' +
    reportRange +
    '</h2><div class="table-wrap" tabindex="0" role="region" aria-label="Tabla con desplazamiento horizontal"><table><thead><tr><th scope=col>Campaña</th><th scope=col>Tipo</th><th scope=col>Gestiones</th><th scope=col>Ventas confirmadas</th><th scope=col>Servicios resueltos</th></tr></thead><tbody>' +
    [...campaigns, "Préstamo personal"]
      .map(
        (name) =>
          "<tr><td>" +
          name +
          "</td><td>" +
          campaignKind(name) +
          "</td><td>" +
          m.events.filter((e) => e.name === name).length +
          "</td><td>" +
          m.sales.filter((s) => s.name === name).length +
          "</td><td>" +
          m.events.filter((e) => e.name === name && e.outcome === "Resuelto").length +
          "</td></tr>",
      )
      .join("") +
    '</tbody></table></div></section><p class="small muted">Proyección lineal orientativa: promedio de ventas por día calendario × días del mes. No garantiza el cierre. Las ventas conservan al ejecutivo que las registró aunque el cliente cambie de cartera.</p>'
  );
}
function salesChart(ids) {
  const buckets = Array.from({ length: Math.ceil(daysInMonth / 5) }, (_, i) => ({
      start: i * 5 + 1,
      end: Math.min(daysInMonth, (i + 1) * 5),
    })),
    s = metrics(ids, "Mes").sales,
    values = buckets.map((b) => ({
      label: b.start + "–" + b.end,
      total: s.filter((x) => +x.date.slice(-2) >= b.start && +x.date.slice(-2) <= b.end).length,
      high: s.filter(
        (x) => +x.date.slice(-2) >= b.start && +x.date.slice(-2) <= b.end && x.priority === "Alta",
      ).length,
    })),
    max = Math.max(1, ...values.map((v) => v.total));
  return (
    '<div class="legend"><span><i></i>Total</span><span><i class="gray"></i>Priorizadas</span></div><div class="chart">' +
    values
      .map(
        (v) =>
          '<div class="bar-group"><div class="bar" style="height:' +
          (v.total / max) * 95 +
          '%" title="' +
          v.total +
          ' ventas"><span class="bar-value">' +
          v.total +
          '</span></div><div class="bar target" style="height:' +
          (v.high / max) * 95 +
          '%" title="' +
          v.high +
          ' priorizadas"></div><label>' +
          v.label +
          "</label></div>",
      )
      .join("") +
    '</div><p class="small muted" style="margin-top:38px">Días del mes · Historial de demostración + gestiones de esta sesión</p>'
  );
}
function dashboard() {
  if (esAgregado()) return sales();
  const rows = scope(),
    m = metrics([activeExecutive], "Hoy"),
    follow = rows.filter((c) =>
      ensureTasks(c).some((t) => t.next === todayKey || t.status === "Lo va a pensar"),
    );
  return (
    head(
      "Mi día, " + executives[activeExecutive].name.split(" ")[0],
      "Una cartera de " +
        rows.length +
        " clientes. Empieza por los seguimientos y campañas prioritarias.",
      '<a class="btn primary" href="#cartera">Gestionar clientes →</a>',
    ) +
    stats([
      ["Ventas de hoy", m.sales.length, "Meta diaria: 3"],
      ["Ventas priorizadas", m.prioritized, "Prioridad alta"],
      ["Gestiones de hoy", m.events.length, "Ventas y servicios"],
      ["Servicios resueltos", m.services, "Resultados de atención"],
    ]) +
    '<div class="grid"><section class="card"><div class="card-title"><h2>Continuar seguimientos</h2><a class="textbtn" href="#cartera">Ver clientes →</a></div>' +
    follow
      .slice(0, 4)
      .map(
        (c) =>
          '<div class="focus"><span class="avatar">' +
          initials(c.name) +
          '</span><div class="info"><b>' +
          esc(c.name) +
          "</b><p>" +
          c.campaign +
          ' · Lo va a pensar</p></div><button onclick="openActivity(' +
          c.id +
          ')">Gestionar</button></div>',
      )
      .join("") +
    '</section><section class="card"><h2>Campañas priorizadas</h2>' +
    campaigns
      .filter((n, i) => campaignPriorities[i] === "Alta")
      .map(
        (n) =>
          '<div class="focus"><div class="info"><b>' +
          n +
          "</b><p>" +
          rows.filter((c) => ensureTasks(c).some((t) => t.name === n)).length +
          " clientes · " +
          campaignKind(n) +
          '</p></div><button onclick="filterCampaign(' +
          campaigns.indexOf(n) +
          ')">Abrir</button></div>',
      )
      .join("") +
    '</section></div><a class="btn" href="#ventas">Revisar promedio y proyección mensual →</a>'
  );
}

function calculatorView() {
  const c = scope().find((c) => c.id === calculatorClientId) || scope()[0];
  if (!c) return head("Generar oportunidad", "No hay clientes disponibles para evaluar.");
  calculatorClientId = c.id;
  return (
    '<div class="notice">Simula una oportunidad para este cliente sin salir de su ficha. Parámetros ilustrativos; no aprueba créditos.</div>' +
    '<div class="grid"><section class="card"><h2>Selecciona cliente y simula</h2><form id="calculatorForm"><div class="formgrid"><div class="full notice" id="calcSelected">Cliente seleccionado: <b>' +
    esc(c.name) +
    "</b> · " +
    c.dni +
    '</div><label>Producto<select name="product" id="calcProduct"><option>Préstamo personal</option><option>Tarjeta Signature</option></select></label><label>Score de prueba (0–999)<input id="calcScore" name="score" type="number" min="0" max="999" required value="' +
    esc(c.score ?? c.riskScore ?? "") +
    '"></label><label>Días de mora<input id="calcArrears" name="arrears" type="number" min="0" step="1" required value="' +
    esc(c.arrears ?? c.arrearsDays ?? "") +
    '"></label><label>Ingreso mensual (S/)<input name="income" type="number" min="1" required value="' +
    c.income +
    '"></label><label>Cuotas actuales al mes (S/)<input name="currentPayment" type="number" min="0" required value="' +
    Math.round(c.income * 0.12) +
    '"></label><label>Monto solicitado (S/)<input name="amount" type="number" min="1" required value="15000"></label><label>Plazo (meses)<input name="months" type="number" min="1" max="120" step="1" required value="24"></label><label>Tasa efectiva anual (%)<input name="annualRate" type="number" min="0" max="100" step="0.1" required value="18"></label></div><div class="notice">Regla demo: score ≥ 650, sin mora y cuotas totales ≤ 30% del ingreso. Tasa, plazo y límites son supuestos editables; la cuota no incluye seguros ni comisiones.</div><button class="primary">Calcular elegibilidad y cuota</button></form></section><section class="card"><h2>Resultado de simulación</h2><div id="calcResult"><div class="empty">Completa los datos y calcula para revisar la oportunidad.</div></div></section></div>'
  );
}
function bindCalculator() {
  if (!(view === "cliente" && tab === "Oportunidades")) return;
  opportunityDraft = null;
  $("#calculatorForm").onsubmit = (e) => {
    e.preventDefault();
    calculateOpportunity(Object.fromEntries(new FormData(e.target)));
  };
  $("#calculatorForm").oninput = () => {
    opportunityDraft = null;
    $("#calcResult").innerHTML = '<div class="empty">Los datos cambiaron. Vuelve a calcular.</div>';
  };
}
function searchCalculatorClient(q) {
  opportunityDraft = null;
  const rows = scope()
    .filter((c) => normalized(c.name + " " + c.dni + " " + c.phone).includes(normalized(q)))
    .slice(0, 8);
  $("#calcSearchResults").innerHTML =
    rows
      .map(
        (c) =>
          '<button type="button" class="search-result" onclick="selectCalculatorClient(' +
          c.id +
          ')">' +
          esc(c.name) +
          " · " +
          c.dni +
          "</button>",
      )
      .join("") || '<p class="sub">No hay coincidencias.</p>';
}
function selectCalculatorClient(id) {
  calculatorClientId = id;
  selected = id;
  tab = "Oportunidades";
  render();
}
function simulateOpportunity(c, d) {
  let score = Number(d.score),
    arrears = Number(d.arrears),
    income = Number(d.income),
    current = Number(d.currentPayment),
    amount = Number(d.amount),
    months = Number(d.months),
    rate = Number(d.annualRate),
    reasons = [];
  if (
    [d.score, d.arrears, d.income, d.currentPayment, d.amount, d.months, d.annualRate].some(
      (v) => v === "" || v == null,
    ) ||
    ![score, arrears, income, current, amount, months, rate].every(Number.isFinite) ||
    !Number.isInteger(score) ||
    score < 0 ||
    score > 999 ||
    !Number.isInteger(arrears) ||
    arrears < 0 ||
    income <= 0 ||
    current < 0 ||
    amount <= 0 ||
    !Number.isInteger(months) ||
    months < 1 ||
    months > 120 ||
    rate < 0 ||
    rate > 100
  )
    return { eligible: false, reasons: ["Completa todos los valores con datos válidos."] };
  let monthlyRate = Math.pow(1 + rate / 100, 1 / 12) - 1,
    payment =
      monthlyRate === 0
        ? amount / months
        : (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months)),
    capacity = income * 0.3 - current;
  if (score < 650) reasons.push("Score inferior a 650 (regla de prueba).");
  if (arrears > 0) reasons.push("El cliente registra días de mora.");
  if (payment > capacity) reasons.push("La cuota excede la capacidad mensual de prueba.");
  if (ensureTasks(c).some((t) => t.name === d.product))
    reasons.push("El cliente ya tiene una campaña u oportunidad de este producto.");
  return {
    eligible: !reasons.length,
    reasons,
    payment,
    capacity,
    ratio: ((payment + current) / income) * 100,
  };
}
function calculateOpportunity(d) {
  const c = scope().find((c) => c.id === calculatorClientId);
  if (!c) return;
  const r = simulateOpportunity(c, d);
  opportunityDraft = r.eligible ? { clientId: c.id, data: d, result: r } : null;
  $("#calcResult").innerHTML =
    '<div class="notice ' +
    (r.eligible ? "" : "calc-ineligible") +
    '"><b>' +
    (r.eligible ? "Elegible para crear una oportunidad de prueba" : "No elegible con estos datos") +
    "</b></div>" +
    (r.payment !== undefined
      ? details([
          ["Cuota estimada", money(Math.round(r.payment * 100) / 100)],
          ["Capacidad mensual demo", money(Math.max(0, Math.round(r.capacity)))],
          ["Cuotas / ingresos", r.ratio.toFixed(1) + "%"],
          ["Producto", d.product],
        ])
      : "") +
    (r.reasons.length
      ? "<ul>" + r.reasons.map((x) => "<li>" + esc(x) + "</li>").join("")
      : '<p class="sub" style="margin-top:22px">Se creará una oportunidad para gestionar; no una venta ni una aprobación crediticia.</p><button class="primary" style="margin-top:20px" onclick="createOpportunity()">Crear oportunidad</button>');
}
function createOpportunity() {
  if (!opportunityDraft) return;
  const c = scope().find((c) => c.id === opportunityDraft.clientId);
  if (!c) return;
  let r = simulateOpportunity(c, opportunityDraft.data);
  if (!r.eligible) {
    calculateOpportunity(opportunityDraft.data);
    return;
  }
  let d = opportunityDraft.data,
    t = {
      id: "opportunity-" + c.id + "-" + Date.now(),
      name: d.product,
      kind: "Venta",
      priority: "Media",
      status: "No contactado",
      sold: false,
      origin: "Calculadora",
      simulation: { ...d, payment: r.payment },
    };
  ensureTasks(c).push(t);
  c.notes.unshift({
    result: "Oportunidad generada",
    channel: "Calculadora",
    text: d.product + " · Monto " + money(d.amount) + " · Simulación de prueba",
    time: new Date().toLocaleString("es-PE"),
  });
  notify(
    [c.owner],
    "campaña",
    "Nueva oportunidad: " + d.product,
    c.name + " · Revisa la simulación y registra el contacto.",
    "cartera",
    { campaign: d.product },
  );
  opportunityDraft = null;
  toast("Oportunidad creada. Aún no contabiliza como venta.");
  selected = c.id;
  view = "cliente";
  tab = "Campañas";
  location.hash = "cliente/" + c.id;
  render();
  openActivity(c.id, t.id);
}
function clientCampaigns(c) {
  return (
    '<div class="campaigns">' +
    ensureTasks(c)
      .map(
        (t) =>
          '<section class="card"><div class="card-title">' +
          badge(t.kind, "blue") +
          badge(t.priority, t.priority === "Alta" ? "orange" : "gray") +
          "</div><h2>" +
          esc(t.name) +
          "</h2><p>" +
          badge(t.sold ? "Venta registrada" : t.status, t.sold ? "" : "blue") +
          '</p><p class="sub">' +
          (t.origin === "Calculadora"
            ? "Oportunidad generada desde simulación"
            : "Campaña asociada") +
          "</p>" +
          (t.simulation
            ? "<p>Monto simulado: " +
              money(t.simulation.amount) +
              "<br>Cuota: " +
              money(Math.round(t.simulation.payment)) +
              "</p>"
            : "") +
          '<p class="sub">Próximo contacto: ' +
          esc(t.next || "Por programar") +
          '</p><button class="primary" style="margin-top:15px" onclick="openActivity(' +
          c.id +
          ",'" +
          t.id +
          "')\">Gestionar</button></section>",
      )
      .join("") +
    '</div><button style="margin-top:20px" onclick="calculatorClientId=' +
    c.id +
    ";setTab('Oportunidades')\">+ Evaluar otra oportunidad</button>"
  );
}
