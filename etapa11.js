/* =========================================================================
   Etapa 11 · La carga masiva es una sección, no una pila de diálogos
   -------------------------------------------------------------------------
   Quedaba un diálogo más: "Resultado del ingreso". El flujo completo eran
   TRES modales encadenados —elegir archivo → validar y repartir → ver el
   resultado— para una sola tarea de trabajo que además hay que poder retomar,
   auditar y enseñarle a otro.

   Un diálogo sirve para una decisión corta que interrumpe lo que estabas
   haciendo. Cargar 100 clientes no interrumpe nada: ES lo que estabas
   haciendo. Así que la carga masiva pasa a ser su propia sección, con sus
   tres pasos dentro de la página y la gestión del lote debajo del resultado.

   Regla que queda escrita: en esta sección no se abre ningún diálogo.
   ========================================================================= */

/* --- La sección y sus pasos ----------------------------------------------- */

let pasoCarga11 = "archivo", // archivo · revision · resultado
  loteVisto11 = 0,
  avisoArchivo11 = "";

MENU_POR_PERFIL.admin = [
  ["inicio", "Panel del canal"],
  ["ingresos", "Ingreso de clientes"],
  ["carga", "Carga masiva"],
  ["trazabilidad", "Track de carterizados"],
  ["campanas", "Campañas del canal"],
];
RUTAS_POR_PERFIL.admin = ["inicio", "ingresos", "carga", "trazabilidad", "campanas", "notificaciones"];
icons.carga = "M12 3v11 M8 10l4 4 4-4 M4 15v4a2 2 0 002 2h12a2 2 0 002-2v-4";

function irACarga11(paso) {
  pasoCarga11 = paso || "archivo";
  if (paso === "archivo") {
    intakeRows = [];
    intakeResults = [];
    allocation = [];
    avisoArchivo11 = "";
  }
  if (location.hash.slice(1).split("/")[0] !== "carga") location.hash = "carga";
  else render();
  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const h = $("#tituloCarga11");
    if (h) h.focus({ preventScroll: true });
  }, 60);
}

/* Barra de pasos: dice dónde estás y deja volver a un paso ya hecho. Antes
   cada paso era un diálogo distinto, así que "volver" significaba cerrar y
   empezar de cero. */
function pasosCarga11() {
  const pasos = [
    ["archivo", "1", "Archivo"],
    ["revision", "2", "Validación y reparto"],
    ["resultado", "3", "Resultado y gestión"],
  ];
  const orden = pasos.map((p) => p[0]),
    actual = orden.indexOf(pasoCarga11);
  return (
    '<ol class="pasos11" aria-label="Pasos de la carga masiva">' +
    pasos
      .map(([id, n, t], i) => {
        const estado = i < actual ? "hecho" : i === actual ? "actual" : "futuro",
          alcanzable = i < actual || (id === "revision" && intakeRows.length);
        return (
          '<li class="paso11 paso11-' +
          estado +
          '"' +
          (i === actual ? ' aria-current="step"' : "") +
          ">" +
          (alcanzable && i !== actual
            ? '<button type="button" onclick="irACarga11(\'' + id + '\')">' +
              '<span class="paso11-n">' + n + "</span>" + t + "</button>"
            : '<span class="paso11-n">' + n + "</span>" + t) +
          "</li>"
        );
      })
      .join("") +
    "</ol>"
  );
}

function cabeceraCarga11(titulo, descripcion, acciones) {
  return (
    '<div class="heading"><div><div class="eyebrow">RENTA ALTA / ADMINISTRACIÓN DEL CANAL</div>' +
    '<h1 id="tituloCarga11" tabindex="-1">' +
    titulo +
    '</h1><p class="sub">' +
    descripcion +
    '</p></div><div class="actions">' +
    (acciones || "") +
    "</div></div>" +
    pasosCarga11()
  );
}

/* --- Paso 1 · Archivo ------------------------------------------------------ */

function pasoArchivo11() {
  return (
    cabeceraCarga11(
      "Carga masiva",
      "Los clientes entran a una bolsa común: no se elige ejecutivo. Primero se valida y después se reparte.",
    ) +
    '<section class="card"><div class="card-title"><h2>1 · Archivo del lote</h2>' +
    '<span class="sub">CSV separado por coma o punto y coma · máximo 500 filas</span></div>' +
    '<div class="bloque-archivo11">' +
    '<div class="filebox"><input type="file" id="csvfile" accept=".csv,text/csv" aria-label="Archivo CSV del lote">' +
    '<p class="small muted">Columnas exactas: nombre, dni, correo, celular, score, dias_mora</p></div>' +
    '<label class="campo9">Campaña del lote<select id="bulkCampaign">' +
    opts(campaigns, intakeCampaign) +
    "</select></label>" +
    "</div>" +
    '<div class="descargas11">' +
    '<button class="textbtn" type="button" onclick="downloadTemplate()">↓ Plantilla con ejemplos · 12 filas</button>' +
    '<button class="textbtn" type="button" onclick="loteDePrueba10()">↓ Lote de prueba · 100 clientes</button>' +
    '<p class="small muted">El lote de prueba trae ' +
    MEZCLA_LOTE10.aptos +
    " aptos, " +
    MEZCLA_LOTE10.revision +
    " en revisión, " +
    MEZCLA_LOTE10.noAptos +
    " no aptos, " +
    MEZCLA_LOTE10.duplicados +
    " duplicados y " +
    MEZCLA_LOTE10.errores +
    " con error de formato.</p></div>" +
    '<div class="notice">Score o mora vacíos no se descartan: quedan en revisión y pasan al analista de riesgos.</div>' +
    '<p id="fileFeedback" role="status" class="aviso-archivo11' +
    (avisoArchivo11 && !intakeRows.length ? " es-error11" : "") +
    '">' +
    esc(avisoArchivo11) +
    "</p>" +
    '<div class="barra-decision10"><div class="resumen-decision10">' +
    (intakeRows.length
      ? '<b class="num">' + intakeRows.length + "</b> filas listas para validar"
      : "Elige un archivo para continuar") +
    '</div><div class="acciones-decision10">' +
    '<button type="button" class="primary" id="reviewIntakeButton"' +
    (intakeRows.length ? "" : " disabled") +
    ' onclick="startIntakeReview()">Validar y distribuir →</button>' +
    "</div></div></section>" +
    historialLotes11()
  );
}

function historialLotes11() {
  if (!intakeHistory.length)
    return (
      '<section class="card"><div class="card-title"><h2>Lotes de esta sesión</h2></div>' +
      '<p class="vacio9">Aún no hay lotes procesados. Descarga el lote de prueba para ver el reparto completo.</p></section>'
    );
  return (
    '<section class="card"><div class="card-title"><h2>Lotes de esta sesión</h2>' +
    '<span class="sub">' +
    intakeHistory.length +
    (intakeHistory.length === 1 ? " lote procesado" : " lotes procesados") +
    "</span></div>" +
    '<div class="table-wrap" tabindex="0" role="region" aria-label="Lotes procesados en esta sesión">' +
    '<table class="tabla-track9"><thead><tr><th scope=col>Lote</th>' +
    '<th scope=col class="num-col">Incorporados</th><th scope=col class="num-col">En revisión</th>' +
    '<th scope=col class="num-col">No incorporados</th><th scope=col></th></tr></thead><tbody>' +
    intakeHistory
      .map(
        (h, i) =>
          '<tr><td data-col="Lote"><b>Lote ' +
          (intakeHistory.length - i) +
          "</b><small>" +
          esc(h.date) +
          '</small></td><td class="num-col" data-col="Incorporados"><span class="num">' +
          h.assigned +
          '</span></td><td class="num-col" data-col="En revisión"><span class="num">' +
          h.review +
          '</span></td><td class="num-col" data-col="No incorporados"><span class="num">' +
          (h.excluded + h.unassigned) +
          '</span></td><td class="rowaction"><button type="button" onclick="showIntakeReport(' +
          i +
          ')">Ver resultado</button></td></tr>',
      )
      .join("") +
    "</tbody></table></div></section>"
  );
}

/* --- Paso 3 · Resultado y gestión del lote ---------------------------------
   Lo que antes era el diálogo "Resultado del ingreso", más lo que le faltaba:
   qué pasó después con los que se derivaron. Un resultado que no dice cómo va
   su propia cola obliga a buscarlo en otra pantalla.                         */

function pasoResultado11() {
  const h = intakeHistory[loteVisto11];
  if (!h) return pasoArchivo11();
  const numero = intakeHistory.length - loteVisto11,
    dnis = new Set(h.results.map((r) => r.dni)),
    delLote = derivaciones10.filter((d) => dnis.has(d.dni)),
    pendientes = delLote.filter((d) => d.estado === "Pendiente");

  return (
    cabeceraCarga11(
      "Resultado del lote " + numero,
      esc(h.date) +
        " · reglas aplicadas: score mínimo " +
        h.minScore +
        ", mora máxima " +
        h.maxArrears +
        " días, tope " +
        h.capacity +
        " por ejecutivo.",
      '<button type="button" onclick="irACarga11(\'archivo\')">Cargar otro lote</button>' +
        '<button type="button" class="primary" onclick="location.hash=\'trazabilidad\'">Ver en el track</button>',
    ) +
    '<div class="intake-counts intake-counts10">' +
    [
      ["Incorporados", h.assigned, "entraron a cartera"],
      ["En revisión", h.review, "pasaron a Riesgos"],
      ["No incorporados", h.excluded, "no cumplen o están duplicados"],
      ["Aptos sin capacidad", h.unassigned, "no hubo cartera con espacio"],
    ]
      .map(
        ([t, n, d]) =>
          '<div><strong class="num">' + n + "</strong><span>" + t + "</span><small>" + d + "</small></div>",
      )
      .join("") +
    "</div>" +
    // La gestión que abre este lote: si hay derivados, la cola es parte del
    // resultado, no una pantalla aparte.
    (delLote.length
      ? '<section class="card"><div class="card-title"><h2>Gestión abierta por este lote</h2>' +
        '<span class="sub">' +
        pendientes.length +
        " de " +
        delLote.length +
        " sin resolver</span></div>" +
        '<p class="sub bandeja-nota10">Estos clientes no entraron a ninguna cartera y no están en la meta ' +
        "de nadie hasta que el analista responda.</p>" +
        '<div class="table-wrap" tabindex="0" role="region" aria-label="Derivaciones abiertas por este lote">' +
        '<table class="tabla-track9"><thead><tr><th scope=col>Cliente</th>' +
        "<th scope=col>Motivo</th><th scope=col>Analista</th>" +
        '<th scope=col class="num-col">Espera</th><th scope=col>Estado</th>' +
        "<th scope=col>Decisión</th></tr></thead><tbody>" +
        delLote.map(filaDerivacion10).join("") +
        "</tbody></table></div></section>"
      : "") +
    '<section class="card"><div class="card-title"><h2>Resultado por cliente</h2>' +
    '<span class="sub">' +
    h.results.length +
    " filas del archivo</span></div>" +
    intakeTable(h.results, h.plan) +
    '<p class="sub pad-lista10">Las filas no asignadas quedan en este reporte de sesión. Para corregirlas, ' +
    "vuelve a cargar solo esas filas.</p></section>"
  );
}

/* La fila de una derivación se dibujaba solo dentro de la bandeja. Extraída,
   sirve igual en el resultado del lote: un componente, dos sitios. */
function filaDerivacion10(d) {
  const dias = diasEspera10(d);
  return (
    '<tr><td data-col="Cliente"><b>' +
    esc(d.name) +
    '</b><small class="num">DNI ' +
    esc(d.dni) +
    " · " +
    esc(d.id) +
    '</small></td><td data-col="Motivo">' +
    esc(d.motivo) +
    "<small>" +
    esc(d.lote) +
    '</small></td><td data-col="Analista">' +
    esc(d.analista) +
    '</td><td class="num-col" data-col="Espera"><span class="num ' +
    (venci10(d) ? "falta8" : "") +
    '">' +
    dias +
    (dias === 1 ? " día" : " días") +
    '</span></td><td data-col="Estado">' +
    pildora9(d.estado === "Pendiente" && venci10(d) ? "Fuera de plazo" : d.estado, {
      Pendiente: "curso",
      "Fuera de plazo": "descartado",
      Aprobado: "cerrado",
      Rechazado: "descartado",
    }) +
    '</td><td data-col="Decisión" class="rowaction">' +
    (d.estado === "Pendiente"
      ? '<button type="button" onclick="resolverDerivacion10(\'' +
        d.id +
        '\',\'Aprobado\')">Aprobar</button>' +
        '<button type="button" onclick="resolverDerivacion10(\'' +
        d.id +
        '\',\'Rechazado\')">Rechazar</button>'
      : '<span class="small muted">Resuelto</span>') +
    "</td></tr>"
  );
}

/* --- La vista ------------------------------------------------------------- */

function cargaMasivaView() {
  if (pasoCarga11 === "resultado") return pasoResultado11();
  if (pasoCarga11 === "revision" && intakeRows.length)
    return (
      cabeceraCarga11(
        "Validación previa y propuesta de reparto",
        "Lote de " +
          intakeResults.length +
          (intakeResults.length === 1 ? " cliente" : " clientes") +
          " · campaña " +
          esc(intakeCampaign || "sin asignar"),
      ) + cuerpoRevision11()
    );
  return pasoArchivo11();
}

function cuerpoRevision11() {
  return (
    '<div class="rule-note"><b>Parámetros de demostración · no son política crediticia</b>' +
    "<p>Apto significa elegible para asignación comercial bajo estas reglas. No equivale a " +
    "aprobación de crédito.</p></div>" +
    '<section class="card"><div class="card-title"><h2>2 · Reglas del lote</h2>' +
    '<span class="sub">Cambiar un parámetro obliga a recalcular antes de confirmar</span></div>' +
    '<div class="reglas10">' +
    '<label class="campo9">Score mínimo (0–999)<input id="minScore" type="number" min="0" max="999" step="1" value="' +
    minScore +
    '"></label>' +
    '<label class="campo9">Máximo días de mora<input id="maxArrears" type="number" min="0" step="1" value="' +
    maxArrears +
    '"></label>' +
    '<label class="campo9">Tope por ejecutivo<input id="capacity" type="number" min="1" step="1" value="' +
    capacity +
    '"></label>' +
    '<button type="button" onclick="recalculateIntake()">Recalcular propuesta</button>' +
    '</div><p id="ruleError" class="form-error" role="alert"></p></section>' +
    '<div id="intakeReview"></div>' +
    '<div class="barra-decision10"><div class="resumen-decision10" id="resumenDecision10"></div>' +
    '<div class="acciones-decision10">' +
    '<button type="button" onclick="irACarga11(\'archivo\')">Descartar lote</button>' +
    '<button type="button" class="primary" id="commitIntake" onclick="confirmIntake()">Confirmar ingreso y notificar</button>' +
    "</div></div>"
  );
}

/* --- Enganches ------------------------------------------------------------ */

// La sección está registrada en la tabla de vistas de `render()`, igual que
// las demás: `carga: window.cargaMasivaView`.

// Sin diálogos en este flujo: los tres puntos de entrada llevan a la sección.
openBulk = function () {
  irACarga11("archivo");
};

reviewIntake = function () {
  intakeResults = evaluateIntake(intakeRows);
  allocation = planAllocation(intakeResults);
  pasoIngreso10 = "resumen";
  irACarga11("revision");
};

showIntakeReport = function (i) {
  loteVisto11 = i || 0;
  irACarga11("resultado");
};

// Al confirmar, el resultado es un paso más, no un modal encima de todo.
const confirmIntakeBase11 = confirmIntake;
confirmIntake = function () {
  const antes = intakeHistory.length;
  confirmIntakeBase11();
  if (intakeHistory.length > antes) {
    loteVisto11 = 0;
    irACarga11("resultado");
  }
};

/* El lector del archivo, en la página. Se reengancha tras cada render porque
   la vista se reconstruye entera, igual que los parámetros del paso 2. */
const bindBase11 = bind;
bind = function () {
  bindBase11();
  if ($("#bulkCampaign"))
    $("#bulkCampaign").onchange = (e) => {
      intakeCampaign = e.target.value;
    };
  if (pasoCarga11 === "revision" && $("#intakeReview") && view === "carga") {
    renderIntakeReview();
    ["minScore", "maxArrears", "capacity"].forEach((id) => {
      const el = $("#" + id);
      if (!el) return;
      el.oninput = () => {
        const b = $("#commitIntake");
        if (b) b.disabled = true;
        $("#ruleError").textContent = "Recalcula la propuesta para aplicar los nuevos parámetros.";
      };
    });
  }
  const f = $("#csvfile");
  if (!f) return;
  f.onchange = async (e) => {
    intakeRows = [];
    try {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 500000) throw Error("El archivo supera 500 KB.");
      const rows = parseCSV(await file.text());
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
      avisoArchivo11 = intakeRows.length + " filas listas para validar.";
    } catch (err) {
      avisoArchivo11 = err.message;
      intakeRows = [];
    }
    render();
  };
};

/* La vista de ingreso deja de ser el sitio de la carga masiva: su botón
   navega a la sección. Y el paso de validación en página de la Etapa 10
   desaparece de ahí, porque ahora vive en su propia sección. */
const intakeViewBase11 = intakeView;
intakeView = function () {
  pasoIngreso10 = "resumen";
  return intakeViewBase11().replace(
    '<button class="primary" onclick="openBulk()">↑ Carga masiva</button>',
    '<button class="primary" onclick="location.hash=\'carga\'">↑ Ir a carga masiva</button>',
  );
};

/* `startIntakeReview` leía la campaña del diálogo y lo cerraba. Sin diálogo,
   lee el selector de la página si está, y respeta el valor ya fijado si la
   llamada viene de una prueba o de un enlace. */
startIntakeReview = function () {
  const sel = $("#bulkCampaign");
  if (sel) intakeCampaign = sel.value;
  reviewIntake();
};
