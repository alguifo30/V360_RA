/* Etapa 3: hipótesis de experiencia validadas con datos ficticios. Sin integraciones externas. */
let workFilter = "Para hoy",
  workQuery = "",
  workPage = 1,
  contextTask = null;
const baseDashboard = dashboard,
  baseClientView = clientView,
  baseClientTab = clientTab,
  baseSummary = customerSummary,
  baseSales = sales,
  baseAssignment = assignmentView,
  baseOpenActivity = openActivity,
  baseControls = updateActivityControls,
  baseSave = saveActivity;
const auditLog = [];
function logChange(c, action, text) {
  c.notes.unshift({
    result: action,
    channel: esAgregado() ? "Supervisor" : "CRM",
    text,
    time: new Date().toLocaleString("es-PE"),
  });
  auditLog.unshift({
    clientId: c.id,
    action,
    text,
    actor: esAgregado() ? "Supervisor" : executives[activeExecutive].name,
    date: new Date().toISOString(),
  });
}
function journey(t) {
  return t.name.includes("hipotecario") ? "Derivación" : "Cierre directo";
}
function processOf(t) {
  return (
    t.process ||
    (t.process = {
      stage: "Aceptación",
      area: "",
      due: "",
      next: "Completar validaciones",
      docs: "",
      reference: "",
      checks: {},
    })
  );
}
for (const c of clients) {
  c.uniqueCode = "RA-" + String(c.id).padStart(7, "0");
  c.dataState =
    c.id % 17 === 0 ? "Error de actualización" : c.id % 13 === 0 ? "No disponible" : "Disponible";
  c.dataUpdated = new Date().toLocaleString("es-PE");
  ensureTasks(c).forEach((t, i) => {
    if (t.status === "Lo va a pensar") t.next = todayKey;
    if (c.id % 19 === 0 && i === 0) t.incoming = true;
    if (c.id % 23 === 0 && !t.sold && t.status === "Acepta campaña") {
      Object.assign(processOf(t), {
        stage: "En evaluación",
        area: "Equipo hipotecario",
        due: todayKey,
        next: "Revisar documentación",
        docs: "Sustento de ingresos",
        reference: "EXP-DEMO-" + c.id,
      });
    }
  });
}
function reasonFor(c, t) {
  if (t.next && t.next <= todayKey)
    return "Compromiso " + (t.next < todayKey ? "vencido" : "para hoy");
  if (t.incoming) return "Solicitud entrante del cliente";
  if (t.process && t.process.due && t.process.due <= todayKey && t.process.stage !== "Cerrado")
    return "Proceso con plazo por atender";
  if (t.priority === "Alta") return "Campaña priorizada por supervisión";
  if (t.status === "Lo va a pensar") return "Interés pendiente de seguimiento";
  return t.origin === "Calculadora" ? "Oportunidad desde simulación" : "Gestión de cartera";
}
function workItems() {
  return scope()
    .flatMap((c) =>
      ensureTasks(c)
        .filter((t) => !t.sold && !["Rechaza campaña", "Resuelto"].includes(t.status))
        .map((t) => ({ c, t, reason: reasonFor(c, t) })),
    )
    .filter(
      ({ c, t }) =>
        !workQuery || normalized(c.name + c.dni + c.phone + t.name).includes(normalized(workQuery)),
    )
    .filter(({ t }) =>
      workFilter === "Para hoy"
        ? (t.next && t.next <= todayKey) ||
          (t.process && t.process.due && t.process.due <= todayKey)
        : workFilter === "Campañas priorizadas"
          ? t.priority === "Alta"
          : workFilter === "Solicitudes entrantes"
            ? t.incoming
            : workFilter === "Oportunidades en seguimiento"
              ? ["Acepta campaña", "Lo va a pensar"].includes(t.status)
              : !!t.process && t.process.stage !== "Cerrado",
    )
    .sort(
      (a, b) =>
        (a.t.next || a.t.process?.due || "9999").localeCompare(
          b.t.next || b.t.process?.due || "9999",
        ) || a.c.id - b.c.id,
    );
}
function openWork(id, tid) {
  contextTask = tid;
  selected = id;
  view = "cliente";
  tab = "Resumen";
  location.hash = "cliente/" + id;
  render();
}
// Una línea en vez de cuatro tarjetas. Las cifras siguen estando; dejan de
// ocupar la pantalla que hace falta para trabajar.
// Misma gramática de estados que el módulo de campañas: una secuencia con
// glifo, para no aprender dos lenguajes dentro del mismo producto.
const ESTADOS7 = {
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
function estadoPill7(texto) {
  return (
    '<span class="pill estado e-' + (ESTADOS7[texto] || "frio") + '">' + esc(texto) + "</span>"
  );
}

function resumenDelDia7() {
  const tareas = scope().flatMap(ensureTasks),
    hoy = tareas.filter((t) => !t.sold && t.next === todayKey).length,
    entrantes = tareas.filter((t) => t.incoming && !t.sold).length,
    ventas = metrics([activeExecutive], "Hoy").sales.length;
  return (
    '<b class="num">' +
    scope().length +
    "</b> clientes · <b class=\"num\">" +
    hoy +
    (hoy === 1 ? "</b> compromiso hoy · <b class=\"num\">" : "</b> compromisos hoy · <b class=\"num\">") +
    entrantes +
    (entrantes === 1 ? "</b> solicitud entrante · <b class=\"num\">" : "</b> solicitudes entrantes · <b class=\"num\">") +
    ventas +
    (ventas === 1 ? "</b> venta hoy" : "</b> ventas hoy")
  );
}

dashboard = function () {
  if (esAgregado()) return sales();
  const rows = workItems();
  workPage = Math.min(workPage, Math.max(1, Math.ceil(rows.length / 20)));
  return (
    // Cuatro tarjetas de métrica ocupaban 130px de la primera pantalla y
    // ninguna disparaba una decisión: quien abre esto ya sabe cuántos
    // clientes tiene. Bajan a una línea de contexto bajo el título, y la
    // única cifra que sí cambia la conducta —los compromisos de hoy— se
    // dice en el propio título de la bandeja.
    head("Mi día", resumenDelDia7()) +
    '<section class="card"><div class="card-title"><h2>Bandeja de trabajo</h2><button onclick="newIncoming()">+ Solicitud entrante</button></div><div class="tabs">' +
    [
      "Para hoy",
      "Campañas priorizadas",
      "Solicitudes entrantes",
      "Oportunidades en seguimiento",
      "Casos pendientes",
    ]
      .map(
        (f) =>
          '<button class="' +
          (workFilter === f ? "active" : "") +
          '" onclick="workFilter=\'' +
          f +
          "';workPage=1;render()\">" +
          f +
          "</button>",
      )
      .join("") +
    '</div><input type="search" class="busca-bandeja7" aria-label="Buscar gestión" placeholder="Buscar por nombre, DNI, celular o campaña" value="' +
    esc(workQuery) +
    '" oninput="workQuery=this.value;workPage=1;render()"><p class="sub">' +
    rows.length +
    ' gestiones · Orden por fecha comprometida. Criterio propuesto para validación.</p><div class="work-list">' +
    rows
      .slice((workPage - 1) * 20, workPage * 20)
      .map(
        ({ c, t, reason }) =>
                    (() => {
            const vencido = t.next && t.next < todayKey,
              fecha = t.next || t.process?.due || "",
              // "Contactar y registrar resultado" es el paso por defecto:
              // repetirlo en las veinte filas no dice nada. Solo aparece
              // cuando el proceso definió otro.
              paso = t.process?.next;
            return (
              '<article class="work-row"><div class="quien7"><b>' +
              esc(c.name) +
              '</b><small class="dni">DNI ' +
              c.dni +
              "</small><small>" +
              esc(t.name) +
              "</small></div>" +
              '<div class="que7">' +
              estadoPill7(t.status) +
              (paso ? "<small>" + esc(paso) + "</small>" : "") +
              "</div>" +
              '<div class="cuando7">' +
              (vencido
                ? '<b class="vencido7">Vencido ' + esc(fecha) + "</b>"
                : fecha === todayKey
                  ? "<b>Hoy</b>"
                  : fecha
                    ? '<span class="num">' + esc(fecha) + "</span>"
                    : '<span class="muted">Por programar</span>') +
              "</div>" +
              '<button onclick="openWork(' +
              c.id +
              ",'" +
              t.id +
              "')\">Continuar →</button></article>"
            );
          })(),
      )
      .join("") +
    "</div>" +
    (rows.length
      ? ""
      : '<div class="empty">Sin gestiones en esta bandeja. Revisa las campañas priorizadas.</div>') +
    '<div class="pagination"><button ' +
    (workPage === 1 ? "disabled" : "") +
    ' onclick="workPage--;render()">Anterior</button><span>Página ' +
    workPage +
    "</span><button " +
    (workPage * 20 >= rows.length ? "disabled" : "") +
    ' onclick="workPage++;render()">Siguiente</button></div></section>'
  );
};
function newIncoming() {
  if (role !== "exec") return;
  modal(
    "Registrar solicitud entrante",
    '<form id="incoming"><label>DNI del cliente<input name="dni" required pattern="[0-9]{8}"></label><label>Solicitud<textarea name="text" required></textarea></label><label>Canal<select name="channel"><option>WhatsApp</option><option>Llamada</option><option>Correo</option></select></label><p id="incomingError" role="alert"></p><button class="primary">Registrar y abrir cliente</button></form>',
  );
  $("#incoming").onsubmit = (e) => {
    e.preventDefault();
    let d = Object.fromEntries(new FormData(e.target)),
      c = scope().find((c) => c.dni === d.dni);
    if (!c) {
      $("#incomingError").textContent = "El DNI no pertenece a tu cartera.";
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
    logChange(c, "Solicitud entrante", d.channel + ": " + d.text);
    closeModal();
    openWork(c.id, t.id);
  };
}
function dataNotice(c) {
  return (
    '<div class="data-status">' +
    badge(c.dataState || "Pendiente de consulta", c.dataState === "Disponible" ? "" : "orange") +
    " <span>Fuente: " +
    (c.score !== undefined ? "Carga de preevaluación" : "Repositorio de demostración") +
    " · Última actualización: " +
    esc(c.dataUpdated || "Sin consulta") +
    "</span></div>"
  );
}
customerSummary = function (c) {
  const t =
    ensureTasks(c).find((t) => t.id === contextTask) ||
    ensureTasks(c).find((t) => !t.sold) ||
    ensureTasks(c)[0];
  return (
    '<section class="card context-card"><div class="card-title"><h2>' +
    esc(reasonFor(c, t)) +
    "</h2>" +
    badge(t.kind, "blue") +
    "</div><h3>" +
    esc(t.name) +
    "</h3><p>Estado: " +
    esc(t.sold ? "Venta confirmada" : t.status) +
    " · Próxima acción: " +
    esc(t.process?.next || "Contactar y registrar resultado") +
    '</p><div class="actions"><button class="primary" onclick="openActivity(' +
    c.id +
    ",'" +
    t.id +
    "')\">Contactar y gestionar</button>" +
    (t.status === "Acepta campaña" && !t.sold
      ? '<button onclick="openProcess(' +
        c.id +
        ",'" +
        t.id +
        "')\">Continuar " +
        journey(t).toLowerCase() +
        "</button>"
      : "") +
    "<button onclick=\"setTab('Gestiones y casos')\">Ver seguimiento</button></div></section>" +
    dataNotice(c) +
    (c.dataState && c.dataState !== "Disponible"
      ? '<section class="card"><h2>Información bancaria no disponible</h2><p>La ausencia de datos no equivale a saldo cero ni a ausencia de deuda. Confirma la información antes de evaluar una oportunidad.</p></section>'
      : baseSummary(c))
  );
};
clientView = function () {
  let html = baseClientView(),
    c = scope().find((c) => c.id === selected);
  if (!c) return html;
  return html.replace(
    "DNI " + esc(c.dni),
    "Código Único " + esc(c.uniqueCode || "Pendiente de consulta") + " · DNI " + esc(c.dni),
  );
};
clientTab = function (c) {
  if (["Información financiera", "Productos bancarios"].includes(tab)) {
    if (c.dataState && c.dataState !== "Disponible")
      return (
        dataNotice(c) +
        '<section class="card"><h2>' +
        esc(c.dataState) +
        "</h2><p>No se pueden confirmar los valores. No se utilizan ceros como sustitutos de información faltante.</p></section>"
      );
    return dataNotice(c) + baseClientTab(c);
  }
  if (tab === "Gestiones y casos")
    return (
      '<section class="card"><h2>Procesos y derivaciones</h2>' +
      ensureTasks(c)
        .filter((t) => t.process || t.status === "Acepta campaña")
        .map((t) => {
          let p = processOf(t);
          return (
            '<article class="work-row"><div><b>' +
            esc(t.name) +
            "</b><small>" +
            journey(t) +
            " · " +
            esc(p.stage) +
            "</small><small>Responsable: " +
            esc(p.area || executives[c.owner].name) +
            " · Plazo: " +
            esc(p.due || "Por acordar") +
            "</small><small>Siguiente acción: " +
            esc(p.next) +
            "</small><small>Documentos pendientes: " +
            esc(p.docs || "Ninguno registrado") +
            '</small></div><button onclick="openProcess(' +
            c.id +
            ",'" +
            t.id +
            "')\">Ver proceso</button></article>"
          );
        })
        .join("") +
      "</section>" +
      baseClientTab(c)
    );
  if (tab === "Datos personales") return dataNotice(c) + baseClientTab(c);
  return baseClientTab(c);
};
openActivity = function (id, tid) {
  baseOpenActivity(id, tid || contextTask);
  if (role !== "exec") return;
  const c = scope().find((c) => c.id === id);
  if (c)
    $("#activityHint").textContent +=
      " Contacto: " +
      c.phone +
      " · " +
      c.email +
      ". Los canales externos no están conectados en este prototipo.";
};
updateActivityControls = function (c) {
  baseControls(c);
  $("#saleCheckLabel").style.display = "none";
  $("#saleCheck").checked = false;
  $("#saleCheck").disabled = true;
  $("#saleAmountLabel").style.display = "none";
  $("#saleAmount").disabled = true;
  $("#saleAmount").required = false;
};
saveActivity = function (next) {
  const f = $("#activity");
  if (!f.reportValidity()) return;
  const d = Object.fromEntries(new FormData(f)),
    c = scope().find((c) => c.id === +f.dataset.clientId),
    t = c && ensureTasks(c).find((t) => t.id === d.taskId);
  if (!t) return;
  if (d.confirmSale) {
    $("#activityError").textContent = "Confirma el cierre desde el proceso del producto.";
    return;
  }
  baseSave(next);
  t.incoming = false;
  if (d.result === "Acepta campaña" && !t.sold && !next) openProcess(c.id, t.id);
};
function openProcess(id, tid) {
  if (role !== "exec") return;
  const c = scope().find((c) => c.id === id),
    t = c && ensureTasks(c).find((t) => t.id === tid);
  if (!t || t.kind !== "Venta" || t.status !== "Acepta campaña") return;
  const p = processOf(t),
    derived = journey(t) === "Derivación";
  modal(
    journey(t) + " · " + t.name,
    "<p>" +
      esc(c.name) +
      " · " +
      badge(p.stage, "blue") +
      '</p><p class="sub">Simulación de flujo. No realiza validaciones ni envíos a sistemas externos.</p><form id="processForm"><div class="formgrid">' +
      (derived
        ? '<label>Área responsable<select name="area">' +
          opts(["Equipo hipotecario", "Riesgos", "Tasación"], p.area) +
          '</select></label><label>Etapa<select name="stage">' +
          opts(
            [
              "Expediente",
              "Derivado",
              "En evaluación",
              "Garantía y tasación",
              "Pendiente de cliente",
              "Listo para formalizar",
              "No aprobado",
            ],
            p.stage,
          ) +
          '</select></label><label>Documentos pendientes<input name="docs" value="' +
          esc(p.docs) +
          '"></label>'
        : '<input type="hidden" name="stage" value="Formalización">') +
      '<label>Fecha comprometida<input type="date" name="due" required value="' +
      esc(p.due || todayKey) +
      '"></label><label>Siguiente acción<input name="next" required value="' +
      esc(p.next) +
      '"></label><label>Referencia de expediente o constancia<input name="reference" required value="' +
      esc(p.reference) +
      '"></label><label class="full">Nota de seguimiento<textarea name="note" required></textarea></label></div><fieldset><legend>Evidencias de cierre simuladas</legend>' +
      [
        ["identity", "Identidad validada"],
        ["conditions", "Condiciones aceptadas"],
        ["formal", "Formalización completada"],
      ]
        .map(
          ([k, l]) =>
            '<label class="checkline"><input type="checkbox" name="' +
            k +
            '" ' +
            (p.checks[k] ? "checked" : "") +
            "> " +
            l +
            "</label>",
        )
        .join("") +
      '</fieldset><label>Monto confirmado (S/)<input name="amount" type="number" min="0.01" step="0.01" value="' +
      (t.sale?.amount || c.amount || 1) +
      '" required></label><p id="processError" class="form-error" role="alert"></p><div class="modal-actions"><button type="submit" name="action" value="save">Guardar seguimiento</button><button class="primary" type="submit" name="action" value="close" ' +
      (t.sold ? "disabled" : "") +
      ">Confirmar cierre</button></div></form>",
  );
  $("#processForm").onsubmit = (e) => {
    e.preventDefault();
    let d = Object.fromEntries(new FormData(e.target));
    try {
      commitProcess(c, t, d, e.submitter?.value === "close");
      closeModal();
      render();
      toast(t.sold ? "Venta confirmada una sola vez." : "Seguimiento actualizado.");
    } catch (err) {
      $("#processError").textContent = err.message;
    }
  };
}
function commitProcess(c, t, d, close) {
  if (role !== "exec" || c.owner !== activeExecutive) throw Error("Gestión fuera de tu cartera.");
  if (!d.due || !d.next.trim() || !d.reference.trim() || !d.note.trim())
    throw Error("Completa fecha, siguiente acción, referencia y nota.");
  if (close && (!d.identity || !d.conditions || !d.formal || !(Number(d.amount) > 0)))
    throw Error("Completa las tres evidencias y un monto válido.");
  if (close && journey(t) === "Derivación" && d.stage !== "Listo para formalizar")
    throw Error("La derivación debe estar lista para formalizar antes del cierre.");
  if (t.sold) throw Error("La venta ya está registrada.");
  Object.assign(processOf(t), {
    stage: close ? "Cerrado" : d.stage,
    area: d.area || executives[c.owner].name,
    due: d.due,
    next: close ? "Seguimiento posventa" : d.next,
    docs: d.docs || "",
    reference: d.reference,
    checks: { identity: !!d.identity, conditions: !!d.conditions, formal: !!d.formal },
  });
  if (close) {
    t.sold = true;
    t.sale = { owner: c.owner, date: todayKey, amount: Number(d.amount), priority: t.priority };
    workEvents.push({
      clientId: c.id,
      taskId: t.id,
      owner: c.owner,
      date: todayKey,
      kind: t.kind,
      priority: t.priority,
      outcome: "Acepta campaña",
      name: t.name,
    });
  }
  logChange(c, close ? "Venta confirmada" : t.process.stage, t.name + " · " + d.note);
  notify(
    [c.owner, -1],
    "movimiento",
    close ? "Cierre registrado" : "Proceso actualizado",
    t.name + " · " + t.process.stage,
    role === "exec" ? "inicio" : "asignaciones",
  );
}
sales = function () {
  let ids =
      esAgregado()
        ? reportOwner === ""
          ? executives.map((e) => e.id)
          : [+reportOwner]
        : [activeExecutive],
    tasks = clients.filter((c) => ids.includes(c.owner)).flatMap(ensureTasks),
    open = tasks.filter((t) => t.process && t.process.stage !== "Cerrado" && !t.sold),
    late = open.filter((t) => t.process.due && t.process.due < todayKey);
  return (
    baseSales() +
    '<section class="card" style="margin-top:22px"><h2>Continuidad de la gestión</h2>' +
    stats([
      ["Procesos abiertos", open.length, "Pendientes de resolución"],
      ["Plazo vencido", late.length, "Requieren seguimiento"],
      [
        "Compromisos hoy",
        tasks.filter((t) => !t.sold && t.next === todayKey).length,
        "Contactos programados",
      ],
      ["Principalidad", "Por definir", "Sin fórmula ni fuente aprobadas"],
    ]) +
    "<h3>Pendientes por responsable</h3>" +
    ["Equipo hipotecario", "Riesgos", "Tasación", ...executives.map((e) => e.name)]
      .map((a) => {
        let n = open.filter((t) => t.process.area === a).length;
        return n
          ? '<div class="product"><b>' +
              esc(a) +
              "</b><span>" +
              n +
              " procesos abiertos</span></div>"
          : "";
      })
      .join("") +
    '<p class="sub">Actualizado: ' +
    new Date().toLocaleString("es-PE") +
    " · Datos de la sesión. Las proyecciones del panel usan días calendario; validar calendario comercial con negocio.</p></section>"
  );
};
assignmentView = function () {
  return (
    baseAssignment() +
    '<section class="card" style="margin-top:22px"><h2>Balanceo y recaracterización</h2><p>Revisa una propuesta antes de distribuir. Se excluyen coberturas activas y ejecutivos no disponibles.</p><button class="primary" onclick="openBalance()">Proponer balanceo</button><button onclick="openResegment()">Cambiar segmentación</button></section>'
  );
};
function covered(c) {
  return history.some((h) => h.end && !h.restored && h.items.some((x) => x.id === c.id));
}
function makeBalance() {
  const loads = new Map(
    executives
      .filter((e) => e.status === "Disponible")
      .map((e) => [e.id, clients.filter((c) => c.owner === e.id).length]),
  );
  let proposed = [],
    used = new Set();
  for (let i = 0; i < clients.length; i++) {
    let sorted = [...loads].sort((a, b) => a[1] - b[1]),
      lo = sorted[0],
      hi = sorted.at(-1);
    if (!lo || hi[1] - lo[1] <= 1 || lo[1] >= capacity) break;
    let c = clients.find((c) => c.owner === hi[0] && !covered(c) && !used.has(c.id));
    if (!c) break;
    proposed.push({ id: c.id, owner: c.owner, target: lo[0] });
    used.add(c.id);
    loads.set(hi[0], hi[1] - 1);
    loads.set(lo[0], lo[1] + 1);
  }
  return proposed;
}
function openBalance() {
  if (!esSupervisor()) return;
  const plan = makeBalance();
  modal(
    "Revisar distribución equitativa",
    "<p>" +
      plan.length +
      " clientes propuestos. Límite demo: " +
      capacity +
      " clientes por ejecutivo.</p>" +
      details(
        executives.map((e) => [
          e.name,
          clients.filter((c) => c.owner === e.id).length +
            " → " +
            (clients.filter((c) => c.owner === e.id).length -
              plan.filter((x) => x.owner === e.id).length +
              plan.filter((x) => x.target === e.id).length),
        ]),
      ) +
      '<p class="sub">Criterio: cantidad de clientes. La complejidad de casos no pondera esta versión; requiere validación.</p><button id="confirmBalance" class="primary" ' +
      (!plan.length ? "disabled" : "") +
      ">Confirmar y notificar</button>",
  );
  $("#confirmBalance").onclick = () => {
    if (JSON.stringify(plan) !== JSON.stringify(makeBalance())) {
      toast("Cambió la carga. Vuelve a generar la propuesta.");
      return;
    }
    for (const x of plan) {
      let c = clients.find((c) => c.id === x.id);
      c.owner = x.target;
      logChange(c, "Balanceo", executives[x.owner].name + " → " + executives[x.target].name);
    }
    for (const key of [...new Set(plan.map((x) => x.owner + ":" + x.target))]) {
      const [source, target] = key.split(":").map(Number);
      history.unshift({
        reason: "Balanceo",
        source,
        target,
        items: plan.filter((x) => x.target === target && x.owner === source),
        date: new Date().toLocaleDateString("es-PE"),
        restored: false,
        note: "Distribución equitativa",
        start: todayKey,
      });
    }
    notify(
      [...new Set(plan.flatMap((x) => [x.owner, x.target])), -1],
      "movimiento",
      "Balanceo confirmado",
      plan.length + " clientes redistribuidos. Se conservan las gestiones.",
      "inicio",
    );
    closeModal();
    render();
  };
}
function openResegment() {
  if (!esSupervisor()) return;
  modal(
    "Recaracterizar por segmento",
    '<form id="resegment"><label>Ejecutivo<select name="owner">' +
      execOptions(0) +
      '</select></label><label>Segmento actual<select name="from"><option>Select</option><option>Select Plus</option></select></label><label>Nuevo segmento<select name="to"><option>Select Plus</option><option>Select</option></select></label><label>Motivo<textarea name="reason" required></textarea></label><p id="segmentError" role="alert"></p><button>Revisar cambio</button></form>',
  );
  $("#resegment").onsubmit = (e) => {
    e.preventDefault();
    let d = Object.fromEntries(new FormData(e.target)),
      rows = clients.filter(
        (c) => c.owner === +d.owner && (c.segment || "Select") === d.from && !covered(c),
      );
    if (d.from === d.to || !rows.length) {
      $("#segmentError").textContent =
        "Selecciona segmentos distintos con clientes sin cobertura activa.";
      return;
    }
    closeModal();
    modal(
      "Confirmar recaracterización",
      "<p>" +
        rows.length +
        " clientes de " +
        executives[+d.owner].name +
        ": " +
        esc(d.from) +
        " → " +
        esc(d.to) +
        "</p><p>No cambia el responsable. Motivo: " +
        esc(d.reason) +
        '</p><button class="primary" id="confirmSegment">Confirmar y notificar</button>',
    );
    $("#confirmSegment").onclick = () => {
      rows.forEach((c) => {
        c.segment = d.to;
        logChange(c, "Recaracterización", d.from + " → " + d.to + ". " + d.reason);
      });
      notify(
        [+d.owner, -1],
        "movimiento",
        "Segmentación actualizada",
        rows.length + " clientes cambiaron a " + d.to,
        "inicio",
      );
      closeModal();
      render();
    };
  };
}
const baseMovementUpdate = updateMovement;
let movementCount = 25;
movementItems = function () {
  const rows = clients.filter((c) => c.owner === movementSource);
  return wholePortfolio
    ? rows
    : rows
        .filter((c) => !covered(c))
        .sort((a, b) => a.id - b.id)
        .slice(0, movementCount);
};
updateMovement = function (reset = false) {
  baseMovementUpdate(reset);
  $("#modeDescription").textContent = wholePortfolio
    ? "Todos los clientes del origen"
    : "Primeros clientes sin cobertura activa, ordenados por identificador";
  if (!wholePortfolio) {
    $("#movementImpact").innerHTML =
      '<label>Cantidad de clientes a transferir<input type="number" min="1" max="' +
      clients.filter((c) => c.owner === movementSource && !covered(c)).length +
      '" value="' +
      movementCount +
      '" onchange="movementCount=Math.max(1,Math.floor(Number(this.value)||1));updateMovement()"></label>' +
      $("#movementImpact").innerHTML;
  }
};
const baseSimulate = simulateOpportunity,
  baseCalculator = calculatorView;
simulateOpportunity = function (c, d) {
  if (c.dataState && c.dataState !== "Disponible")
    return {
      eligible: false,
      reasons: [
        "Información del cliente no disponible o desactualizada. Confirma la fuente antes de generar una oportunidad.",
      ],
    };
  return baseSimulate(c, d);
};
calculatorView = function () {
  const c = scope().find((c) => c.id === calculatorClientId);
  if (c && c.dataState && c.dataState !== "Disponible")
    return (
      dataNotice(c) +
      '<section class="card"><h2>Evaluación pendiente de información</h2><p>No se genera una oportunidad mientras la fuente no esté disponible.</p></section>'
    );
  return baseCalculator();
};
