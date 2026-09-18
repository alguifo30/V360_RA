/* Catálogo de 100 campañas y tipificación contextual. Datos de demostración. */
const campaignRegistry = [];
const products9 = [
  "Préstamo personal",
  "Crédito hipotecario",
  "Tarjeta Signature",
  "Depósito a plazo",
  "Seguimiento comercial",
  "Actualización de datos",
];
for (let i = 0; i < 100; i++) {
  const product = products9[i % 6],
    name =
      i < 6
        ? campaigns[i]
        : product +
          " · " +
          ["Renovación", "Vinculación", "Temporada", "Fidelización"][Math.floor(i / 6) % 4] +
          " " +
          String(i + 1).padStart(3, "0");
  if (!campaigns.includes(name)) {
    campaigns.push(name);
    campaignPriorities.push(i % 5 === 0 ? "Alta" : "Media");
  }
  campaignRegistry.push({
    id: "CAM-" + String(i + 1).padStart(3, "0"),
    name,
    product: i < 6 ? name : product,
    kind:
      i < 6
        ? campaignKind(name)
        : i % 6 === 4
          ? "Servicio comercial"
          : i % 6 === 5
            ? "Servicio administrativo"
            : "Venta",
    active: i % 11 !== 10,
  });
}
for (let i = 6; i < 100; i++) {
  const meta = campaignRegistry[i],
    base = offerCatalog[meta.product];
  clients
    .filter((c) => (c.id + i * 7) % 37 === 0)
    .forEach((c) =>
      ensureTasks(c).push({
        id: "catalog-" + i + "-" + c.id,
        name: meta.name,
        kind: meta.kind,
        priority: campaignPriorities[campaigns.indexOf(meta.name)],
        status: meta.kind === "Venta" ? "No contactado" : "Pendiente",
        sold: false,
        offer:
          meta.kind === "Venta"
            ? {
                amount:
                  meta.product === "Crédito hipotecario"
                    ? 220000 + (c.id % 8) * 10000
                    : 20000 + (c.id % 8) * 2000,
                rate: base?.rate ?? 18,
                label: base?.label || "TEA propuesta",
                term: base?.term || "Por definir",
              }
            : undefined,
      }),
    );
}
let listSearch9 = "",
  listPage9 = 1,
  contactFilter9 = "Todos",
  sort9 = "name",
  sortDirection9 = 1,
  sideSearch9 = "",
  sideLimit9 = 15,
  showHigh9 = true,
  showOther9 = false,
  activeOnly9 = false;
const campaignViewBase9 = campaignView,
  activityBase9 = openActivity,
  journeyBase9 = journey;
journey = function (t) {
  const m = campaignRegistry.find((m) => m.name === t.name);
  return (m?.product || t.name).toLowerCase().includes("hipotecario")
    ? "Derivación"
    : "Cierre directo";
};
function registry9() {
  return campaignRegistry.filter(
    (m) =>
      (!sideSearch9 || normalized(m.name + m.id + m.product).includes(normalized(sideSearch9))) &&
      (!activeOnly9 || m.active) &&
      (!campaignTypeFilter || m.kind === campaignTypeFilter),
  );
}
function high9(m) {
  return campaignPriorities[campaigns.indexOf(m.name)] === "Alta";
}
function side9() {
  const list = registry9(),
    group = (high, open) => {
      const rows = list.filter((m) => high9(m) === high);
      return (
        '<button class="group9" aria-expanded="' +
        open +
        '" onclick="' +
        (high ? "showHigh9" : "showOther9") +
        "=!" +
        (high ? "showHigh9" : "showOther9") +
        ';render()">' +
        (open ? "⌄" : "›") +
        " " +
        (high ? "☆ PRIORIZADAS" : "OTRAS") +
        " (" +
        rows.length +
        ")</button>" +
        (open
          ? rows
              .slice(0, sideLimit9)
              .map(
                (m) =>
                  '<button class="campaign-pick9 ' +
                  (campaignName === m.name ? "selected" : "") +
                  '" onclick="selectCampaign9(' +
                  campaignRegistry.indexOf(m) +
                  ')"><b>' +
                  esc(m.name) +
                  "</b><small>" +
                  m.id +
                  " · " +
                  (m.active ? "Activa" : "Finalizada") +
                  "</small></button>",
              )
              .join("") +
            (rows.length > sideLimit9
              ? '<button class="textbtn" onclick="sideLimit9+=15;render()">Mostrar más</button>'
              : "")
          : "")
      );
    };
  return (
    // Seis controles se interponían entre abrir la pantalla y ver la primera
    // campaña. Ahora: el buscador filtra al escribir (el botón "Buscar" era
    // un paso extra para algo que ya pasa solo), los dos filtros comparten
    // fila, "Limpiar" solo aparece cuando hay algo que limpiar, y "Todas las
    // campañas" es el primer elemento de la lista porque es una opción de la
    // lista, no un control aparte.
    '<section class="catalog9" aria-label="Selector de campañas">' +
    '<div class="catalog-cab9"><h2>Catálogo</h2>' +
    '<span class="num">' + list.length + "</span></div>" +
    '<input type="search" id="buscaCampana9" value="' +
    esc(sideSearch9) +
    '" aria-label="Buscar campaña por nombre, producto o código" placeholder="Buscar campaña…" ' +
    'oninput="sideSearch9=this.value;sideLimit9=15;showHigh9=true;showOther9=true;render()">' +
    '<div class="catalog-filtros9">' +
    '<select aria-label="Tipo de campaña" onchange="campaignTypeFilter=this.value;sideLimit9=15;render()"><option value="">Todos los tipos</option>' +
    opts(["Venta", "Servicio comercial", "Servicio administrativo"], campaignTypeFilter) +
    "</select>" +
    '<label class="checkline"><input type="checkbox" ' +
    (activeOnly9 ? "checked" : "") +
    ' onchange="activeOnly9=this.checked;render()"> Solo activas</label>' +
    "</div>" +
    (sideSearch9 || campaignTypeFilter || activeOnly9
      ? '<button class="textbtn limpiar9" onclick="sideSearch9=\'\';campaignTypeFilter=\'\';activeOnly9=false;render()">Limpiar filtros</button>'
      : "") +
    '<button class="campaign-pick9 todas9 ' +
    (campaignName ? "" : "selected") +
    '" onclick="selectCampaign9(-1)"><b>Todas las campañas</b></button>' +
    group(true, showHigh9) +
    group(false, showOther9) +
    (list.length ? "" : "<p>Sin coincidencias.</p>") +
    "</section>"
  );
}
function selectCampaign9(i) {
  listPage9 = 1;
  contactFilter9 = "Todos";
  listSearch9 = "";
  campaignClient = 0;
  goCampaign6(i < 0 ? "" : campaignRegistry[i].name);
}
function allRows9() {
  return scope()
    .flatMap((c) =>
      ensureTasks(c)
        .filter(
          (t) =>
            campaignRegistry.some((m) => m.name === t.name) &&
            (!campaignName || t.name === campaignName),
        )
        .map((t) => ({ c, t, m: campaignRegistry.find((m) => m.name === t.name) })),
    )
    .filter(
      ({ c, t, m }) =>
        (!prioritizedOnly || high9(m)) &&
        (!listSearch9 ||
          normalized(c.name + c.dni + t.name + m.product).includes(normalized(listSearch9))),
    );
}
function contacted9(t) {
  return Boolean(t.tipifiedAt) || t.sold || !["No contactado", "Pendiente", "No contactado / servicio"].includes(t.status);
}
function rows9() {
  return allRows9()
    .filter(
      ({ t, m }) =>
        contactFilter9 === "Todos" ||
        (contactFilter9 === "Prioritarios" && high9(m) && !contacted9(t)) ||
        (contactFilter9 === "Contactados" && contacted9(t)) ||
        (contactFilter9 === "Pendientes" && !contacted9(t)),
    )
    .sort(
      (a, b) =>
        sortDirection9 *
        (sort9 === "amount"
          ? (Number(offer6(a.t).amount) || 0) - (Number(offer6(b.t).amount) || 0)
          : String(sort9 === "dni" ? a.c.dni : a.c.name).localeCompare(
              String(sort9 === "dni" ? b.c.dni : b.c.name),
            )),
    );
}
function rate9(t) {
  const o = offer6(t);
  if (t.kind !== "Venta") return ["No aplica", "No aplica", "No aplica"];
  const n = Number(o.rate);
  if (o.rate == null || !Number.isFinite(n))
    return ["No disponible", "No disponible", "No disponible"];
  if (o.label?.includes("TREA")) return ["No aplica", "No aplica", n.toFixed(2) + "% TREA"];
  return [
    ((Math.pow(1 + n / 100, 1 / 12) - 1) * 100).toFixed(2) + "%",
    "Por consultar",
    n.toFixed(2) + "% TEA",
  ];
}
function sortColumn9(key) {
  sortDirection9 = sort9 === key ? -sortDirection9 : 1;
  sort9 = key;
  render();
}
// Estados de una gestión, con la misma gramática que el resto del producto:
// una secuencia de frío a cerrado, con un glifo que la hace legible sin
// depender del color.
const ESTADOS9 = {
  "No contactado": "frio",
  Pendiente: "frio",
  "Por contactar": "frio",
  "No contactado / servicio": "frio",
  "Lo va a pensar": "curso",
  "En proceso": "curso",
  "Acepta campaña": "curso",
  "Rechaza campaña": "descartado",
  "Venta confirmada": "cerrado",
  Resuelto: "cerrado",
};
function estado9(texto) {
  return (
    '<span class="pill estado e-' + (ESTADOS9[texto] || "frio") + '">' + esc(texto) + "</span>"
  );
}

// Una fila completa por asociación cliente–campaña.
function agrupadoPorCliente9(filas) {
  return '<tbody>' + filas.map(({ c, t, m }) => {
    const o = offer6(t), r = rate9(t);
    const mensual = r[0] !== "No aplica" && r[0] !== "No disponible" ? r[0] : null;
    return `<tr>
      <td data-col="Cliente"><a href="#cliente/${c.id}"><b>${esc(c.name)}</b></a><small class="dni">DNI ${esc(c.dni)}</small></td>
      <td class="celda-campana" data-col="Campaña">${esc(t.name)}${m.kind === "Venta" ? "" : "<small>" + esc(m.kind) + "</small>"}</td>
      <td class="num-col" data-col="Monto"><span class="num">${t.kind === "Venta" && o.amount != null ? money(o.amount) : "—"}</span></td>
      <td class="num-col" data-col="Tasa"><span class="num">${r[2] === "No aplica" ? "—" : r[2]}</span>${mensual ? '<small class="num">' + mensual + ' TEM</small>' : ''}</td>
      <td class="rowaction"><button class="tipify9" ${!m.active ? 'disabled title="Campaña finalizada"' : ''} onclick="startTipify9(${c.id},'${t.id}')">Tipificar</button></td>
    </tr>`;
  }).join('') + '</tbody>';
}

function table9() {
  const rows = rows9(),
    all = allRows9();
  listPage9 = Math.min(listPage9, Math.max(1, Math.ceil(rows.length / 15)));
  return (
    // El buscador filtra al escribir: "Buscar" y "Limpiar" eran dos botones
    // para algo que ya ocurre solo. Y la etiqueta "ESTADO DE CONTACTO" sobre
    // el segmentado era ruido: los propios segmentos dicen qué son.
    '<section class="campaign-data9">' +
    '<input type="search" class="busca-asociaciones9" value="' +
    esc(listSearch9) +
    '" placeholder="Buscar cliente, DNI, campaña o producto" aria-label="Buscar cliente de campaña" ' +
    'oninput="listSearch9=this.value;listPage9=1;render()">' +
    '<div class="contact-tabs9" role="tablist" aria-label="Estado de contacto">' +
    ["Todos", "Prioritarios", "Contactados", "Pendientes"]
      .map((f) => {
        const n = all.filter(
          ({ t, m }) =>
            f === "Todos" ||
            (f === "Prioritarios" && high9(m) && !contacted9(t)) ||
            (f === "Contactados" && contacted9(t)) ||
            (f === "Pendientes" && !contacted9(t)),
        ).length;
        return (
          '<button role="tab" class="' +
          (contactFilter9 === f ? "active" : "") +
          '" tabindex="' +
          (contactFilter9 === f ? "0" : "-1") +
          '" aria-selected="' +
          (contactFilter9 === f ? "true" : "false") +
          '" onclick="contactFilter9=\'' +
          f +
          "';listPage9=1;render()\">" +
          f +
          ' <b class="num">' +
          n +
          "</b></button>"
        );
      })
      .join("") +
    '</div><div class="table-wrap" tabindex="0" role="region" aria-label="Clientes de campaña">' +
    '<table class="tabla-asociaciones"><thead><tr>' +
    '<th scope=col><button onclick="sortColumn9(\'name\')">Cliente<span aria-hidden="true">↕</span></button></th>' +
    "<th scope=col>Campaña · producto</th>" +
    '<th scope=col class="num-col"><button onclick="sortColumn9(\'amount\')">Monto<span aria-hidden="true">↕</span></button></th>' +
    '<th scope=col class="num-col">Tasa</th>' +
    '<th scope=col><span class="sr">Acciones</span></th>' +
    "</tr></thead>" +
    agrupadoPorCliente9(rows.slice((listPage9 - 1) * 15, listPage9 * 15)) +
    "</table></div>" +
    (rows.length ? "" : '<div class="empty">No hay clientes para estos filtros.</div>') +
    '<div class="pagination pager"><button ' +
    (listPage9 === 1 ? "disabled" : "") +
    ' onclick="listPage9--;render()">Anterior</button><span>' +
    rows.length +
    " asociaciones cliente–campaña · Página " +
    listPage9 +
    " / " +
    Math.max(1, Math.ceil(rows.length / 15)) +
    "</span><button " +
    (listPage9 * 15 >= rows.length ? "disabled" : "") +
    ' onclick="listPage9++;render()">Siguiente</button></div><p class="small muted">Condiciones ficticias. TEM calculada desde TEA; TCEA por consultar porque faltan seguros y comisiones. TREA se usa para depósitos.</p></section>'
  );
}
campaignView = function () {
  if (campaignClient) return campaignViewBase9();
  const meta = campaignRegistry.find((m) => m.name === campaignName),
    rows = allRows9();
  if (esAgregado())
    return (
      head("Seguimiento de campañas", "100 campañas · Vista agregada del equipo.") +
      '<div class="campaign-layout9"><div>' +
      supervisor9() +
      "</div>" +
      side9() +
      "</div>"
    );
  return (
    // Tres tarjetas de métrica ocupaban 130px para decir "hay 100 campañas en
    // el catálogo de demostración" — un dato que no dispara ninguna decisión.
    // Bajan a una línea de contexto bajo el título: se sigue sabiendo, deja
    // de ocupar la primera pantalla.
    '<div class="campaign-layout9"><div><section class="campaign-head9">' +
    "<h1>" +
    esc(campaignName || "Campañas") +
    "</h1>" +
    '<p class="contexto9">' +
    (meta
      ? '<span class="pill estado e-' +
        (meta.active ? "cerrado" : "frio") +
        '">' +
        (meta.active ? "Activa" : "Finalizada") +
        "</span>"
      : '<b class="num">100</b> campañas') +
    ' · <b class="num">' +
    new Set(rows.map((r) => r.c.id)).size +
    "</b> clientes · <b class=\"num\">" +
    rows.filter((r) => !contacted9(r.t)).length +
    "</b> por gestionar</p>" +
    "</section>" +
    (prioritizedOnly
      ? '<div class="notice">Solo campañas priorizadas <button onclick="prioritizedOnly=false;render()">Ver todas</button></div>'
      : "") +
    table9() +
    "</div>" +
    side9() +
    "</div>"
  );
};
function supervisor9() {
  const list = campaignName ? campaignRegistry.filter((m) => m.name === campaignName) : registry9(),
    page = list.slice((listPage9 - 1) * 15, listPage9 * 15);
  return (
    '<section class="card"><h2>' +
    esc(campaignName || "Campañas del equipo") +
    '</h2><div class="table-wrap"><table><thead><tr><th>Campaña</th><th>Clientes</th><th>Contactados</th><th>Ventas</th><th>Prioridad</th></tr></thead><tbody>' +
    page
      .map((m) => {
        const rows = scope().flatMap((c) => ensureTasks(c).filter((t) => t.name === m.name));
        return (
          "<tr><td>" +
          esc(m.name) +
          "</td><td>" +
          rows.length +
          "</td><td>" +
          rows.filter(contacted9).length +
          "</td><td>" +
          rows.filter((t) => t.sold).length +
          '</td><td><button onclick="openPriority(' +
          campaigns.indexOf(m.name) +
          ')">' +
          campaignPriorities[campaigns.indexOf(m.name)] +
          "</button></td></tr>"
        );
      })
      .join("") +
    '</tbody></table></div><div class="pagination"><button ' +
    (listPage9 === 1 ? "disabled" : "") +
    ' onclick="listPage9--;render()">Anterior</button><span>' +
    list.length +
    " campañas</span><button " +
    (listPage9 * 20 >= list.length ? "disabled" : "") +
    ' onclick="listPage9++;render()">Siguiente</button></div></section>'
  );
}
let wizard9 = null;
function startTipify9(id, tid) {
  if (role !== "exec") return;
  const c = scope().find((c) => c.id === id),
    t = c && ensureTasks(c).find((t) => t.id === tid);
  if (!t) return;
  const m = campaignRegistry.find((m) => m.name === t.name);
  if (m && !m.active) {
    toast("Esta campaña está finalizada.");
    return;
  }
  beginAttention(c);
  wizard9 = { id, tid, step: 2, result: "", reason: "", text: "", next: "", channel: "Llamada" };
  drawWizard9();
}
function drawWizard9() {
  const w = wizard9,
    c = scope().find((c) => c.id === w?.id),
    t = c && ensureTasks(c).find((t) => t.id === w.tid);
  if (!t) return;
  closeBase7();
  const states =
    t.kind === "Venta"
      ? ["Acepta campaña", "Rechaza campaña", "Lo va a pensar", "No contactado"]
      : ["Resuelto", "En proceso", "No contactado / servicio"];
  modal(
    "Tipificar campaña",
    '<p class="sub">' +
      esc(c.name) +
      '</p><div class="steps9">' +
      // Los tres pasos salían iguales en verde: no había forma de saber en
      // cuál estabas. Ahora cada uno dice su estado —hecho, actual o
      // pendiente— con forma y texto, no solo con color, y el actual se
      // anuncia con aria-current para quien no ve la pantalla.
      ["Campaña", "Estado", "Motivo"]
        .map((s, i) => {
          const n = i + 1,
            estado = w.step > n ? "hecho" : w.step === n ? "actual" : "pendiente";
          return (
            '<span class="' +
            estado +
            '"' +
            (estado === "actual" ? ' aria-current="step"' : "") +
            '><b>' +
            (estado === "hecho" ? "✓" : n) +
            "</b>" +
            s +
            '<i class="sr">' +
            (estado === "hecho"
              ? " (completado)"
              : estado === "actual"
                ? " (paso actual)"
                : " (pendiente)") +
            "</i></span>"
          );
        })
        .join("") +
      "</div>" +
      (w.step === 1
        ? '<label>Campaña<select id="wizardTask9">' +
          ensureTasks(c)
            .filter(
              (x) =>
                !campaignRegistry.find((m) => m.name === x.name) ||
                campaignRegistry.find((m) => m.name === x.name).active,
            )
            .map(
              (x) =>
                '<option value="' +
                x.id +
                '" ' +
                (x.id === t.id ? "selected" : "") +
                ">" +
                esc(x.name) +
                "</option>",
            )
            .join("") +
          '</select></label><button class="primary" onclick="wizard9.tid=$(\'#wizardTask9\').value;wizard9.step=2;drawWizard9()">Continuar</button>'
        : w.step === 2
          ? "<p><b>" +
            esc(t.name) +
            '</b></p><p class="sub">Selecciona la respuesta del cliente</p><div class="states9">' +
            states
              .map(
                // La etiqueta se envuelve para poder alinearla junto a su
                // icono: una lista de opciones se lee por su nombre, no por
                // un texto centrado que flota entre dos símbolos.
                (state, i) =>
                  "<button class=\"state-pick9\" onclick=\"wizard9.result='" +
                  state +
                  "';wizard9.step=3;drawWizard9()\"><span class=\"state-icon9\" aria-hidden=\"true\">" +
                  ["✓", "×", "◷", "☎"][i] +
                  "</span><b>" +
                  state +
                  "</b><span class=\"state-chevron9\" aria-hidden=\"true\">›</span></button>",
              )
              .join("") +
            '</div><button class="textbtn" onclick="wizard9.step=1;drawWizard9()">Cambiar campaña</button>'
          : "<p><b>" +
            esc(t.name) +
            "</b> · " +
            badge(w.result) +
            '</p><form id="wizardForm9"><label>Motivo<select name="reason" required><option value="">Seleccionar</option>' +
            opts(
              w.result === "Rechaza campaña"
                ? [
                    "No necesita el producto",
                    "Condiciones no convenientes",
                    "Tiene otra alternativa",
                    "Otro",
                  ]
                : w.result.includes("No contactado")
                  ? ["No responde", "Número no disponible", "Solicitó otro horario", "Otro"]
                  : [
                      "Interés en la propuesta",
                      "Necesita más información",
                      "Consulta atendida",
                      "Seguimiento acordado",
                      "Otro",
                    ],
              w.reason,
            ) +
            '</select></label><label>Canal<select name="channel">' +
            opts(["Llamada", "WhatsApp", "Correo", "Presencial"], w.channel) +
            '</select></label><label>Detalle y acuerdos<textarea name="text" required>' +
            esc(w.text) +
            '</textarea></label><label>Próximo contacto<input name="next" type="date" min="' +
            todayKey +
            '" value="' +
            esc(w.next) +
            '" ' +
            (["Lo va a pensar", "En proceso"].includes(w.result) ? "required" : "") +
            '></label><p id="wizardError9" role="alert"></p><p class="small muted">Aceptar registra interés; no confirma una venta.</p><div class="modal-actions"><button type="button" onclick="wizard9.step=2;drawWizard9()">Atrás</button><button class="primary">Guardar tipificación</button></div></form>'),
  );
  $("#dialog").classList.add("tipify-dialog9");
  if (w.step === 3) {
    $("#wizardForm9").oninput = (e) =>
      Object.assign(w, Object.fromEntries(new FormData(e.currentTarget)));
    $("#wizardForm9").onsubmit = (e) => {
      e.preventDefault();
      try {
        const t = commitTipify9(Object.fromEntries(new FormData(e.target)));
        const salioDeLaVista =
          ["Pendientes", "Prioritarios"].includes(contactFilter9) && contacted9(t);
        closeModal();
        render();
        toast(
          salioDeLaVista
            ? "Tipificado. Sale de " + contactFilter9 + " y pasa a Contactados."
            : "Tipificado. Pasa a Contactados.",
        );
      } catch (err) {
        $("#wizardError9").textContent = err.message;
      }
    };
  }
}
function commitTipify9(d) {
  const w = wizard9,
    c = scope().find((c) => c.id === w?.id),
    t = c && ensureTasks(c).find((t) => t.id === w.tid);
  if (role !== "exec" || !t) throw Error("Cliente no disponible.");
  const allowed =
    t.kind === "Venta"
      ? ["Acepta campaña", "Rechaza campaña", "Lo va a pensar", "No contactado"]
      : ["Resuelto", "En proceso", "No contactado / servicio"];
  if (!allowed.includes(w.result) || (needsReasonUI(w.result) && !d.reason))
    throw Error("Completa el motivo y los acuerdos.");
  if (w.result === "Lo va a pensar" && !d.next)
    throw Error("Programa el próximo contacto.");
  if (d.next && d.next < todayKey) throw Error("Selecciona una fecha desde hoy.");
  t.tipifiedAt = new Date().toISOString();
  t.status = w.result;
  t.next = d.next || "";
  t.incoming = false;
  if (t === ensureTasks(c)[0]) c.status = t.status;
  workEvents.push({
    clientId: c.id,
    taskId: t.id,
    owner: c.owner,
    date: todayKey,
    kind: t.kind,
    priority: t.priority,
    outcome: w.result,
    name: t.name,
  });
  c.notes.unshift({
    result: w.result,
    channel: d.channel,
    text: t.name + " · " + w.result + (d.reason ? " · " + d.reason : "") + (d.text?.trim() ? ": " + d.text.trim() : ""),
    next: d.next || "",
    time: new Date().toLocaleString("es-PE"),
  });
  if (w.result === "Acepta campaña" && !t.sold) processOf(t);
  return t;
}
openActivity = function (id, tid) {
  const c = scope().find((c) => c.id === id),
    t = c && ensureTasks(c).find((t) => t.id === (tid || contextTask));
  if (t) {
    startTipify9(id, t.id);
    return;
  }
  activityBase9(id, tid);
};
const offersBase9 = campaignOffers8;
campaignOffers8 = function (c) {
  return offersBase9(c).replace(
    /<button class="primary" onclick="goCampaign6\('([^']+)',(\d+)\)">Gestionar campaña<\/button>/g,
    (match, name, id) => {
      const t = ensureTasks(c).find((t) => t.name === name);
      return t
        ? '<button class="primary" onclick="startTipify9(' +
            c.id +
            ",'" +
            t.id +
            "')\">Tipificar</button>"
        : match;
    },
  );
};
const routeBase9 = route;
route = function () {
  const p = location.hash.slice(1).split("/");
  if (esAgregado() && p[0] === "campanas") {
    try {
      campaignName = decodeURIComponent(p[1] || "");
    } catch {
      campaignName = "";
    }
    campaignClient = 0;
    view = "campanas";
    render();
    return;
  }
  routeBase9();
};
window.removeEventListener("hashchange", routeBase9);
window.addEventListener("hashchange", route);
route();

