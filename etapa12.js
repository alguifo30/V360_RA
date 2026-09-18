/* =========================================================================
   Etapa 12 · Un solo ingreso, un stepper que se lee, y el lote sin campaña
   -------------------------------------------------------------------------
   Tres cosas, y la primera es un fallo de marcado, no de gusto:

   1. EL STEPPER. Medido: el paso activo emitía el círculo y su etiqueta como
      hermanos sueltos dentro del <li> —sin envoltura—, así que la regla del
      contenedor (`.paso11 > span`) caía sobre el propio círculo: 26px en vez
      de 22, con el relleno del contenedor encima y la etiqueta pegada sin
      separación. Los pasos ya hechos sí tenían envoltura, porque eran
      <button>. De ahí que solo fallaran unos y otros no.

   2. DOS ENTRADAS PARA UNA MISMA TAREA. "Ingreso de clientes" y "Carga
      masiva" eran dos secciones del menú para lo mismo: dar de alta clientes.
      Ahora es una sección con un control segmentado Individual / Masiva.

   3. EL LOTE NO ES UNA CAMPAÑA. Obligar a elegir una campaña para todo el
      archivo daba por cierto algo que no lo es: un lote trae clientes, y a
      cada uno se le puede ofrecer algo distinto. El archivo admite una
      columna `campana` por fila, la del formulario pasa a ser el valor por
      defecto, y hay un bloque para ver qué se le ofrece a quién.
   ========================================================================= */

/* --- 1. Stepper ----------------------------------------------------------- */

pasosCarga11 = function () {
  const pasos = [
    ["archivo", "Archivo"],
    ["revision", "Validación y reparto"],
    ["resultado", "Resultado y gestión"],
  ];
  const actual = pasos.findIndex((p) => p[0] === pasoCarga11);
  return (
    '<ol class="pasos12" aria-label="Pasos de la carga masiva">' +
    pasos
      .map(([id, t], i) => {
        const estado = i < actual ? "hecho" : i === actual ? "actual" : "futuro",
          alcanzable = i < actual || (id === "revision" && intakeRows.length && i !== actual),
          // Un paso hecho muestra un check: el número ya no informa de nada,
          // y el símbolo distingue el estado también en escala de grises.
          marca =
            estado === "hecho"
              ? '<span class="paso12-n" aria-hidden="true">✓</span>'
              : '<span class="paso12-n" aria-hidden="true">' + (i + 1) + "</span>",
          // La envoltura va SIEMPRE, sea botón o span. Ese era el fallo.
          dentro = marca + '<span class="paso12-t">' + t + "</span>",
          oculto = '<span class="sr-only">Paso ' + (i + 1) + " de 3, " +
            (estado === "hecho" ? "completado" : estado === "actual" ? "en curso" : "pendiente") +
            ": </span>";
        return (
          '<li class="paso12 paso12-' +
          estado +
          '"' +
          (i === actual ? ' aria-current="step"' : "") +
          ">" +
          (alcanzable
            ? '<button type="button" class="paso12-caja" onclick="irACarga11(\'' + id + '\')">' +
              oculto + dentro + "</button>"
            : '<span class="paso12-caja">' + oculto + dentro + "</span>") +
          "</li>"
        );
      })
      .join("") +
    "</ol>"
  );
};

/* --- 2. Ingreso individual y masivo, una sola sección ---------------------- */

let modoIngreso12 = "masiva"; // individual · masiva

MENU_POR_PERFIL.admin = [
  ["inicio", "Panel del canal"],
  ["ingresos", "Ingreso de clientes"],
  ["trazabilidad", "Track de carterizados"],
  ["campanas", "Campañas del canal"],
];

function verModo12(m) {
  modoIngreso12 = m;
  if (m === "masiva") pasoCarga11 = pasoCarga11 || "archivo";
  if (location.hash.slice(1).split("/")[0] !== "ingresos") location.hash = "ingresos";
  else render();
}

function segmentado12() {
  return (
    '<div class="vistas vistas-modo12" role="tablist" aria-label="Tipo de ingreso">' +
    [
      ["individual", "Individual", "Un cliente"],
      ["masiva", "Masiva", "Archivo CSV"],
    ]
      .map(
        ([id, t, d]) =>
          '<button role="tab" type="button" class="' +
          (modoIngreso12 === id ? "active" : "") +
          '" tabindex="' +
          (modoIngreso12 === id ? "0" : "-1") +
          '" aria-selected="' +
          (modoIngreso12 === id) +
          '" onclick="verModo12(\'' +
          id +
          '\')"><span>' +
          t +
          "</span><small>" +
          d +
          "</small></button>",
      )
      .join("") +
    "</div>"
  );
}

/* El ingreso individual, en la página: el mismo formulario que estaba en el
   diálogo, sin el diálogo. Así los dos modos se ven igual de "sección". */
function ingresoIndividual12() {
  return (
    '<section class="card"><div class="card-title"><h2>Datos del cliente</h2>' +
    '<span class="sub">Pasa por la misma validación y reparto que una carga masiva</span></div>' +
    '<form id="newclient"><div class="formgrid form12">' +
    "<label>Nombre completo<input name=\"name\" required minlength=\"3\"></label>" +
    '<label>DNI<input name="dni" required pattern="[0-9]{8}" maxlength="8" inputmode="numeric"></label>' +
    '<label>Correo<input name="email" type="email" required></label>' +
    '<label>Celular<input name="phone" required pattern="[0-9]{9}" maxlength="9" inputmode="numeric"></label>' +
    '<label>Score (0–999)<input name="score" type="number" min="0" max="999" step="1" placeholder="Vacío: va a Riesgos"></label>' +
    '<label>Días de mora<input name="arrears" type="number" min="0" step="1" placeholder="Vacío: va a Riesgos"></label>' +
    '<label>Campaña a ofrecer<select name="campana">' +
    opcionesCampana13(intakeCampaign) +
    "</select></label>" +
    '<label>Origen<select name="source">' +
    opts(["Captación", "Referido", "Campaña"], "") +
    "</select></label>" +
    '</div><div class="notice">Datos ficticios. No se consulta ninguna central de riesgo ni se aprueba un crédito.</div>' +
    '<div class="barra-decision10"><div class="resumen-decision10">' +
    "Score o mora vacíos no descartan al cliente: lo derivan al analista.</div>" +
    '<div class="acciones-decision10"><button type="submit" class="primary">Validar y proponer distribución</button>' +
    "</div></div></form></section>"
  );
}

/* --- 3. El lote trae clientes, no una campaña ------------------------------ */

const COLUMNAS12 = "nombre,dni,correo,celular,score,dias_mora";
const COLUMNAS12_CAMPANA = COLUMNAS12 + ",campana";

/* Qué se le ofrece a cada cliente: lo que diga el archivo, y si no lo dice,
   el valor por defecto. Se muestra de dónde salió cada uno, porque no es lo
   mismo un dato que trajo el originador que uno que puso esta pantalla. */
function campanaDe12(r) {
  const propia = (r.campana || "").trim();
  if (propia && campaigns.includes(propia)) return { nombre: propia, origen: "Del archivo" };
  if (propia) return { nombre: intakeCampaign, origen: "No reconocida: «" + propia + "»" };
  return { nombre: intakeCampaign, origen: "Por defecto" };
}

function resumenCampanas12() {
  const aptos = allocation.filter((r) => r.owner !== null),
    enRevision = intakeResults.filter((r) => r.status === "En revisión"),
    considerados = [...aptos, ...enRevision];
  if (!considerados.length) return "";

  // Una fila por campaña, no por campaña × procedencia: agrupar por las dos
  // partía "Depósito a plazo" en tres filas seguidas y obligaba a sumarlas a
  // ojo. La procedencia es un desglose DENTRO de la fila, no otra fila.
  const grupos = new Map();
  considerados.forEach((r) => {
    const c = campanaDe12(r);
    if (!grupos.has(c.nombre))
      grupos.set(c.nombre, { nombre: c.nombre, n: 0, archivo: 0, defecto: 0, desconocida: 0 });
    const g = grupos.get(c.nombre);
    g.n++;
    if (c.origen === "Del archivo") g.archivo++;
    else if (c.origen === "Por defecto") g.defecto++;
    else g.desconocida++;
  });
  const filas = [...grupos.values()].sort((a, b) => b.n - a.n),
    sinReconocer = filas.reduce((s, f) => s + f.desconocida, 0);

  const chip = (n, texto, tono) =>
    n
      ? '<span class="proc12 proc12-' + tono + '"><b class="num">' + n + "</b> " + texto + "</span>"
      : "";

  return (
    '<section class="card"><div class="card-title"><h2>Campañas que se van a ofrecer</h2>' +
    '<span class="sub">' +
    considerados.length +
    " clientes · " +
    filas.length +
    (filas.length === 1 ? " campaña" : " campañas") +
    "</span></div>" +
    '<p class="sub bandeja-nota10">Un lote no es una campaña: el archivo puede traer una campaña por fila en la ' +
    "columna <code>campana</code>. Las filas que no la traen reciben la campaña por defecto elegida arriba.</p>" +
    (sinReconocer
      ? '<div class="alert">' +
        sinReconocer +
        " filas traen una campaña que no existe en el catálogo. Reciben la campaña por defecto; " +
        "corrige el archivo si no es lo que quieres.</div>"
      : "") +
    '<div class="envoltura-campanas12">' +
    '<table class="tabla-reparto8 tabla-campanas12"><thead><tr><th scope=col>Campaña</th>' +
    "<th scope=col>Producto</th><th scope=col>Prioridad</th>" +
    '<th scope=col class="num-col">Clientes</th><th scope=col>De dónde sale</th>' +
    "</tr></thead><tbody>" +
    filas
      .map((f) => {
        const pr = prioridadProducto8(productoDe8(f.nombre));
        return (
          '<tr><td data-col="Campaña">' +
          esc(f.nombre) +
          '</td><td data-col="Producto">' +
          esc(productoDe8(f.nombre)) +
          '</td><td data-col="Prioridad">' +
          badge(pr, pr === "Alta" ? "orange" : pr === "Media" ? "blue" : "gray") +
          '</td><td class="num-col" data-col="Clientes"><span class="num">' +
          f.n +
          '</span></td><td data-col="De dónde sale"><div class="procs12">' +
          chip(f.archivo, "del archivo", "archivo") +
          chip(f.defecto, "por defecto", "defecto") +
          chip(f.desconocida, "campaña no reconocida", "mal") +
          "</div></td></tr>"
        );
      })
      .join("") +
    "</tbody></table></div></section>"
  );
}

/* --- Vistas --------------------------------------------------------------- */

const cabeceraCarga11Base12 = cabeceraCarga11;
cabeceraCarga11 = function (titulo, descripcion, acciones) {
  return cabeceraCarga11Base12(titulo, descripcion, acciones);
};

intakeView = function () {
  pasoIngreso10 = "resumen";
  if (modoIngreso12 === "masiva" && pasoCarga11 !== "archivo") {
    // En los pasos 2 y 3 la pantalla es el paso: el segmentado y el resto de
    // bloques serían ruido sobre una decisión en curso.
    return cargaMasivaView();
  }
  const cabecera =
    '<div class="heading"><div><div class="eyebrow">RENTA ALTA / ADMINISTRACIÓN DEL CANAL</div>' +
    '<h1 id="tituloCarga11" tabindex="-1">Ingreso de clientes</h1>' +
    '<p class="sub">Los clientes entran a una bolsa común: no se elige ejecutivo. ' +
    "Primero se valida y después se reparte.</p></div></div>" +
    segmentado12();

  if (modoIngreso12 === "individual")
    return cabecera + ingresoIndividual12() + cargaPorEjecutivo12() + bandejaRiesgos10();

  return cabecera + pasosCarga11() + bloqueArchivo12() + historialLotes11() + bandejaRiesgos10();
};

/* El bloque de archivo, con la campaña ya como valor por defecto. */
function bloqueArchivo12() {
  return (
    '<section class="card"><div class="card-title"><h2>1 · Archivo del lote</h2>' +
    '<span class="sub">CSV separado por coma o punto y coma · máximo 500 filas</span></div>' +
    '<div class="bloque-archivo11">' +
    '<div class="filebox"><input type="file" id="csvfile" accept=".csv,text/csv" aria-label="Archivo CSV del lote">' +
    '<p class="small muted">Columnas: <code>' +
    COLUMNAS12 +
    "</code><br>Opcional al final: <code>campana</code>, una por cliente.</p></div>" +
    '<label class="campo9">Campaña por defecto<select id="bulkCampaign">' +
    opcionesCampana13(intakeCampaign) +
    '</select><small class="ayuda12">Solo para las filas que no traen campaña propia</small></label>' +
    "</div>" +
    '<div class="descargas11">' +
    '<button class="textbtn" type="button" onclick="downloadTemplate()">↓ Plantilla · 12 filas</button>' +
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
    " con error de formato, con campañas variadas por fila.</p></div>" +
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
    "</div></div></section>"
  );
}

function cargaPorEjecutivo12() {
  return (
    '<section class="card"><div class="card-title"><h2>Carga actual por ejecutivo</h2>' +
    '<span class="sub">El reparto asigna a la cartera disponible más pequeña</span></div>' +
    '<div class="table-wrap" tabindex="0" role="region" aria-label="Carga actual por ejecutivo">' +
    '<table class="tabla-reparto8"><thead><tr><th scope=col>Ejecutivo</th><th scope=col>Estado</th>' +
    '<th scope=col class="num-col">Clientes</th><th scope=col>En el reparto</th></tr></thead><tbody>' +
    executives
      .map(
        (e) =>
          '<tr><td data-col="Ejecutivo">' +
          esc(e.name) +
          '</td><td data-col="Estado">' +
          estadoEquipo8(e.status, e) +
          '</td><td class="num-col" data-col="Clientes"><span class="num">' +
          clients.filter((c) => c.owner === e.id).length +
          '</span></td><td data-col="En el reparto">' +
          (esCobertura(e)
            ? "No: reservado para coberturas"
            : e.status === "Disponible"
              ? "Sí"
              : "No: " + esc(e.status.toLowerCase())) +
          "</td></tr>",
      )
      .join("") +
    "</tbody></table></div></section>"
  );
}

/* El paso 2 gana el bloque de campañas ofrecidas. */
cuerpoRevision11 = function () {
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
    resumenCampanas12() +
    '<div class="barra-decision10"><div class="resumen-decision10" id="resumenDecision10"></div>' +
    '<div class="acciones-decision10">' +
    '<button type="button" onclick="irACarga11(\'archivo\')">Descartar lote</button>' +
    '<button type="button" class="primary" id="commitIntake" onclick="confirmIntake()">Confirmar ingreso y notificar</button>' +
    "</div></div>"
  );
};

/* --- Enganches ------------------------------------------------------------ */

// `#carga` sigue siendo una URL válida: abre el ingreso en modo masiva. Romper
// un enlace que ya existía es gratis de evitar.
const routeBase12 = route;
route = function () {
  if (location.hash.slice(1).split("/")[0] === "carga") {
    modoIngreso12 = "masiva";
    location.hash = "ingresos";
    return;
  }
  routeBase12();
};

irACarga11 = function (paso) {
  pasoCarga11 = paso || "archivo";
  modoIngreso12 = "masiva";
  if (paso === "archivo") {
    intakeRows = [];
    intakeResults = [];
    allocation = [];
    avisoArchivo11 = "";
  }
  if (location.hash.slice(1).split("/")[0] !== "ingresos") location.hash = "ingresos";
  else render();
  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const h = $("#tituloCarga11");
    if (h) h.focus({ preventScroll: true });
  }, 60);
};

openBulk = function () {
  verModo12("masiva");
};
openNew = function () {
  verModo12("individual");
};

/* El lector del archivo acepta la columna opcional de campaña. */
const bindBase12 = bind;
bind = function () {
  bindBase12();
  // El paso de validación dejó de ser la vista "carga" para ser un estado de
  // "ingresos": la comprobación por nombre de vista dejaba el detalle sin
  // pintar y, con él, sin calcular los derivados a Riesgos.
  if (pasoCarga11 === "revision" && $("#intakeReview")) {
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
  const form = $("#newclient");
  if (form)
    form.onsubmit = (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(e.target));
      intakeRows = [{ ...d, line: 2 }];
      reviewIntake();
    };
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
      const header = rows.shift().map((x) => x.trim().toLowerCase()),
        firma = header.join(","),
        conCampana = firma === COLUMNAS12_CAMPANA;
      if (firma !== COLUMNAS12 && !conCampana)
        throw Error(
          "Los encabezados no coinciden. Se esperaba «" +
            COLUMNAS12 +
            "», con «campana» opcional al final.",
        );
      const ancho = conCampana ? 7 : 6;
      intakeRows = rows
        .filter((r) => r.some((x) => x.trim()))
        .map((r, i) => ({
          name: r[0]?.trim() || "",
          dni: r[1]?.trim() || "",
          email: r[2]?.trim() || "",
          phone: r[3]?.trim() || "",
          score: r[4]?.trim() ?? "",
          arrears: r[5]?.trim() ?? "",
          campana: conCampana ? (r[6]?.trim() ?? "") : "",
          line: i + 2,
          formatError: r.length !== ancho,
          source: "Campaña",
        }));
      if (!intakeRows.length) throw Error("El archivo no contiene clientes.");
      avisoArchivo11 =
        intakeRows.length +
        " filas listas para validar" +
        (conCampana ? ", con campaña por fila." : ". Todas recibirán la campaña por defecto.");
    } catch (err) {
      avisoArchivo11 = err.message;
      intakeRows = [];
    }
    render();
  };
};

/* Al incorporar, cada cliente lleva SU campaña, no la del lote. */
const confirmIntakeBase12 = confirmIntake;
confirmIntake = function () {
  const porDni = new Map(intakeResults.map((r) => [r.dni, campanaDe12(r).nombre]));
  const antes = clients.length;
  confirmIntakeBase12();
  clients.slice(antes).forEach((c) => {
    const camp = porDni.get(c.dni);
    if (camp) {
      c.campaign = camp;
      c.priority = campaignPriorities[campaigns.indexOf(camp)] || c.priority;
      if (c.ingesta) c.ingesta.origen = "Campaña · " + camp;
    }
  });
};

/* El lote de prueba trae campañas variadas por fila: sin eso, la columna
   nueva no se puede probar con el archivo que se ofrece para probar. */
const loteDePrueba10Base12 = loteDePrueba10;
loteDePrueba10 = function () {
  let csv = null;
  const orig = downloadCSV;
  downloadCSV = (n, d) => (csv = d);
  loteDePrueba10Base12();
  downloadCSV = orig;
  const lineas = csv.replace(/^﻿/, "").split("\n"),
    catalogo = campaigns.filter((c) => esVenta8(productoDe8(c))).slice(0, 8);
  lineas[0] = COLUMNAS12_CAMPANA;
  for (let i = 1; i < lineas.length; i++) {
    if (!lineas[i].trim()) continue;
    // Una de cada seis filas sin campaña: así se ve en pantalla la mezcla de
    // "Del archivo" y "Por defecto", que es lo que hay que poder revisar.
    lineas[i] += "," + (i % 6 === 0 ? "" : catalogo[i % catalogo.length]);
  }
  downloadCSV("lote_prueba_100_clientes.csv", "﻿" + lineas.join("\n"));
};
