/* =========================================================================
   Etapa 10 · La validación deja de ser un modal flotante
   -------------------------------------------------------------------------
   Reproducido antes de tocar nada (`repro.mjs`): el diálogo "Validación previa
   y propuesta de reparto" sobrevivía a CADA cambio de ruta. Abierto desde el
   ingreso, seguía encima del inicio del supervisor, del track y de la ficha
   del cliente. No era un modal mal diseñado: era el mismo modal, huérfano.

   Dos arreglos, uno estructural y uno de diseño:

   1. Un diálogo pertenece a la vista que lo abrió. Al navegar, se cierra.
   2. Validar y repartir un lote NO es una tarea de diálogo. Tiene parámetros,
      cuatro contadores, tres tablas y una decisión con consecuencias. Eso es
      una pantalla. Y encima estaba anidado dentro de otro diálogo (Carga
      masiva → Validación): dos modales apilados para una sola tarea.

      Ahora: elegir el archivo sigue siendo un diálogo —es una tarea pequeña y
      acotada, que es para lo que sirve un diálogo—; validar y repartir es un
      paso DENTRO de la vista de ingreso, con la navegación a la vista y el
      ancho completo de la página.
   ========================================================================= */

/* --- 1. Un diálogo no sobrevive a la navegación --------------------------- */
const routeBase10 = route;
route = function () {
  // Antes de cambiar de vista: si había un diálogo abierto, pertenecía a la
  // vista anterior. Se va con ella.
  if ($("#dialog") && $("#dialog").open) closeModal();
  routeBase10();
};

/* --- 2. Derivación a Riesgos como gestión, no como frase -------------------
   "Van a Riesgos" era texto en una pantalla que nadie volvía a abrir. Un pase
   sin responsable, sin fecha y sin retorno no es un pase: es una pérdida.
   Cada derivación lleva analista, fecha de envío, plazo y un estado que solo
   cambia cuando alguien responde.                                           */

const analistas10 = ["Paola Icaza", "Renzo Cabrera", "Mirtha Solano"];
const SLA_RIESGOS10 = 3; // días hábiles de demostración
let derivaciones10 = [],
  secuenciaDeriv10 = 0,
  filtroDeriv10 = "Pendientes";

function nuevaDerivacion10(r, lote) {
  return {
    id: "DER-" + String(++secuenciaDeriv10).padStart(4, "0"),
    name: r.name,
    dni: r.dni,
    score: r.score,
    arrears: r.arrears,
    motivo: typeof motivoRevision8 === "function" ? motivoRevision8(r) : "Datos incompletos",
    analista: analistas10[secuenciaDeriv10 % analistas10.length],
    enviado: new Date(),
    dias: 0,
    estado: "Pendiente",
    lote: lote || "—",
    campana: intakeCampaign,
  };
}

function diasEspera10(d) {
  return d.dias + Math.max(0, Math.round((Date.now() - d.enviado.getTime()) / 86400000));
}
function venci10(d) {
  return d.estado === "Pendiente" && diasEspera10(d) > SLA_RIESGOS10;
}

/* Semilla: derivaciones que ya estaban esperando antes de esta sesión. Sin
   ellas la bandeja arranca vacía y no se puede ver cómo se comporta llena. */
(function sembrarDerivaciones10() {
  const pendientes = clients.filter((c) => c.ingesta && c.ingesta.revision === "En revisión");
  pendientes.slice(0, 24).forEach((c, i) => {
    const d = nuevaDerivacion10(
      { name: c.name, dni: c.dni, score: "", arrears: "0" },
      c.ingesta.lote,
    );
    d.lote = lotes9[i % lotes9.length].id;
    // Motivos variados: si la columna repite la misma frase en cada fila, no
    // distingue nada y solo gasta ancho.
    d.motivo = [
      "Score no informado por el originador",
      "Días de mora sin dato en la fuente",
      "Score fuera de rango (>999)",
      "Ingreso declarado sin sustento",
      "Cliente con evaluación vigente en otro canal",
    ][i % 5];
    d.enviado = new Date(Date.now() - (i % 7) * 86400000);
    d.dias = i % 7;
    d.campana = c.campaign;
    if (i % 9 === 3) d.estado = "Aprobado";
    if (i % 9 === 7) d.estado = "Rechazado";
    d.clienteId = c.id;
    derivaciones10.push(d);
  });
})();

function resolverDerivacion10(id, decision) {
  const d = derivaciones10.find((x) => x.id === id);
  if (!d || d.estado !== "Pendiente") return;
  d.estado = decision;
  d.resuelto = new Date();
  // La decisión del analista se refleja en el track: aprobado entra como apto,
  // rechazado sale del canal. Si no, el track y la bandeja se contradicen.
  const c = clients.find((x) => x.dni === d.dni);
  if (c && c.ingesta) {
    c.ingesta.revision = decision === "Aprobado" ? "Apto" : "No apto";
    c.ingesta.motivo =
      decision === "Aprobado"
        ? "Aprobado por " + d.analista + " tras revisión"
        : "Rechazado por " + d.analista + " tras revisión";
  }
  if (typeof notify === "function")
    notify(
      [c ? c.owner : 0],
      "riesgos",
      "Riesgos resolvió a " + d.name + ": " + decision.toLowerCase(),
      d.motivo + " · Analista: " + d.analista,
      "trazabilidad",
    );
  render();
  toast(d.name + ": " + decision.toLowerCase() + " por " + d.analista + ".");
}

function verDerivaciones10(f) {
  filtroDeriv10 = f;
  render();
}

function bandejaRiesgos10() {
  const pendientes = derivaciones10.filter((d) => d.estado === "Pendiente"),
    vencidas = pendientes.filter(venci10),
    filas =
      filtroDeriv10 === "Pendientes"
        ? pendientes
        : filtroDeriv10 === "Vencidas"
          ? vencidas
          : derivaciones10;

  return (
    '<section class="card"><div class="card-title"><h2>Bandeja del analista de riesgos</h2>' +
    '<span class="sub">' +
    pendientes.length +
    " sin resolver · plazo de " +
    SLA_RIESGOS10 +
    " días · " +
    vencidas.length +
    " fuera de plazo</span></div>" +
    '<p class="sub bandeja-nota10">Un cliente en revisión no entró a ninguna cartera y no está ' +
    "en la meta de nadie. Hasta que el analista responda, no existe comercialmente.</p>" +
    '<div class="vistas vistas-deriv10" role="tablist" aria-label="Estado de las derivaciones">' +
    [
      ["Pendientes", pendientes.length],
      ["Vencidas", vencidas.length],
      ["Todas", derivaciones10.length],
    ]
      .map(
        ([t, n]) =>
          '<button role="tab" type="button" class="' +
          (filtroDeriv10 === t ? "active" : "") +
          '" tabindex="' +
          (filtroDeriv10 === t ? "0" : "-1") +
          '" aria-selected="' +
          (filtroDeriv10 === t) +
          '" onclick="verDerivaciones10(\'' +
          t +
          '\')"><span>' +
          t +
          '</span><b class="num">' +
          n +
          "</b></button>",
      )
      .join("") +
    "</div>" +
    (filas.length
      ? '<div class="table-wrap" tabindex="0" role="region" aria-label="Derivaciones a riesgos">' +
        '<table class="tabla-track9"><thead><tr><th scope=col>Cliente</th>' +
        "<th scope=col>Motivo de la derivación</th><th scope=col>Analista</th>" +
        '<th scope=col class="num-col">Espera</th><th scope=col>Estado</th>' +
        "<th scope=col>Decisión</th></tr></thead><tbody>" +
        filas
          .slice(0, 30)
          .map((d) => {
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
              pildora9(
                d.estado === "Pendiente" && venci10(d) ? "Fuera de plazo" : d.estado,
                {
                  Pendiente: "curso",
                  "Fuera de plazo": "descartado",
                  Aprobado: "cerrado",
                  Rechazado: "descartado",
                },
              ) +
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
          })
          .join("") +
        "</tbody></table></div>" +
        (filas.length > 30
          ? '<p class="small muted pad-lista10">Se muestran 30 de ' + filas.length + ".</p>"
          : "")
      : '<p class="vacio9">No hay derivaciones en este corte.</p>') +
    "</section>"
  );
}

/* --- 3. La validación vive en la página, no en un diálogo ------------------ */

let pasoIngreso10 = "resumen";

reviewIntake = function () {
  intakeResults = evaluateIntake(intakeRows);
  allocation = planAllocation(intakeResults);
  pasoIngreso10 = "revision";
  if (location.hash.slice(1).split("/")[0] !== "ingresos") {
    location.hash = "ingresos";
  } else {
    render();
  }
  // El foco va al encabezado del paso: quien usa teclado o lector de pantalla
  // tiene que enterarse de que la pantalla cambió, no descubrirlo tabulando.
  setTimeout(() => {
    // Arriba del todo: el paso empieza en su encabezado. `scrollIntoView`
    // dejaba el título pegado al borde y las acciones justo por encima del
    // área visible — medido: top -22px en una pantalla de 768.
    window.scrollTo({ top: 0, behavior: "instant" });
    const h = $("#pasoRevision10");
    if (h) h.focus({ preventScroll: true });
  }, 60);
};

function salirRevision10() {
  pasoIngreso10 = "resumen";
  render();
}

function descartarLote10() {
  intakeRows = [];
  intakeResults = [];
  allocation = [];
  pasoIngreso10 = "resumen";
  render();
  toast("Lote descartado. No se incorporó ningún cliente.");
}

const intakeViewBase10 = intakeView;
intakeView = function () {
  if (pasoIngreso10 !== "revision" || !intakeRows.length)
    return intakeViewBase10() + bandejaRiesgos10();

  const total = intakeResults.length,
    cuenta = (s) => intakeResults.filter((r) => r.status === s).length;

  return (
    // Mismo encabezado que cualquier otra vista: el paso no es otro sitio, es
    // el mismo sitio más adentro. Por eso hay rastro de vuelta.
    '<div class="heading"><div><div class="eyebrow">RENTA ALTA / ADMINISTRACIÓN DEL CANAL</div>' +
    '<button type="button" class="volver10" onclick="salirRevision10()">← Ingreso de clientes</button>' +
    '<h1 id="pasoRevision10" tabindex="-1">Validación previa y propuesta de reparto</h1>' +
    '<p class="sub">Lote de ' +
    total +
    (total === 1 ? " cliente" : " clientes") +
    " · campaña " +
    esc(intakeCampaign || "sin asignar") +
    "</p></div></div>" +
    '<div class="process-steps"><span>1 Cargar datos</span><span>2 Validar morosidad y score</span>' +
    '<span class="paso-activo10">3 Equilibrar carteras</span><span>4 Confirmar y notificar</span></div>' +
    '<div class="rule-note"><b>Parámetros de demostración · no son política crediticia</b>' +
    "<p>Apto significa elegible para asignación comercial bajo estas reglas. No equivale a " +
    "aprobación de crédito.</p></div>" +
    '<section class="card"><div class="card-title"><h2>Reglas del lote</h2>' +
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
    // Barra de decisión fija: la evidencia son tres tablas y la página mide
    // más de dos pantallas. Con el botón solo arriba, confirmar significaba
    // decidir antes de haber leído, o subir a buscarlo después.
    '<div class="barra-decision10"><div class="resumen-decision10" id="resumenDecision10"></div>' +
    '<div class="acciones-decision10">' +
    '<button type="button" onclick="descartarLote10()">Descartar lote</button>' +
    '<button type="button" class="primary" id="commitIntake" onclick="confirmIntake()">Confirmar ingreso y notificar</button>' +
    "</div></div>"
  );
};

/* Los contadores del paso se dibujan con el mismo componente que el resto de
   indicadores de la aplicación, en vez de con una caja propia. Era eso —y no
   el diálogo— lo que hacía que la pantalla no se pareciera a las demás. */
const renderIntakeReviewBase10 = renderIntakeReview;
renderIntakeReview = function () {
  if (!$("#intakeReview")) return;
  renderIntakeReviewBase10();
  const caja = $("#intakeReview .intake-counts");
  if (caja) caja.classList.add("intake-counts10");
  const btn = $("#commitIntake");
  // Vale para donde esté el paso: desde la Etapa 11 vive en la sección de
  // carga masiva, no en la vista de ingreso.
  if (btn) {
    const asignados = allocation.filter((r) => r.owner !== null).length,
      revision = intakeResults.filter((r) => r.status === "En revisión").length;
    btn.textContent = asignados
      ? "Confirmar " + asignados + (asignados === 1 ? " ingreso" : " ingresos")
      : revision
        ? "Derivar " + revision + " a Riesgos"
        : "Nada que confirmar";
    const resumen = $("#resumenDecision10");
    if (resumen)
      resumen.innerHTML =
        '<b class="num">' +
        asignados +
        '</b> entran a cartera · <b class="num">' +
        revision +
        '</b> a Riesgos · <b class="num">' +
        (intakeResults.length - asignados - revision) +
        "</b> no ingresan";
  }
};

/* Al confirmar, cada cliente en revisión se convierte en una derivación con
   responsable y plazo. Antes se notificaba y se perdía. */
const confirmIntakeBase10 = confirmIntake;
confirmIntake = function () {
  const pendientes = (derivadosRiesgos8 || []).slice(),
    lote = "LOTE-" + new Date().toISOString().slice(0, 10).replace(/-/g, "");
  confirmIntakeBase10();
  pendientes.forEach((r) => derivaciones10.push(nuevaDerivacion10(r, lote)));
  if (pendientes.length) filtroDeriv10 = "Pendientes";
  pasoIngreso10 = "resumen";
  render();
};

/* --- 4. Cobertura por juniors sin cartera ----------------------------------
   Cuando un middle o senior sale, su cartera tiene que ir a alguien que pueda
   sostenerla entera. Un ejecutivo con 490 clientes no puede recibir otros 480
   —el tope lo impide, y con razón—, así que el movimiento moría en un error
   rojo sin salida. Los juniors de cobertura existen para eso: cartera cero,
   capacidad completa, y aparecen primero en el desplegable de destino.      */

const CUBRIBLES10 = ["Vacaciones", "Permiso", "Descanso médico", "Renuncia", "Cese", "Reemplazo"];

function coberturaDisponible10() {
  return ejecutivosVisibles().filter(
    (e) => esCobertura(e) && e.status === "Disponible" && !clients.some((c) => c.owner === e.id),
  );
}

const updateMovementBase10 = updateMovement;
updateMovement = function (reset = false) {
  if (reset && $("#movementTarget")) {
    const libres = coberturaDisponible10().filter((e) => e.id !== movementSource),
      resto = ejecutivosVisibles().filter(
        (e) => e.id !== movementSource && e.status === "Disponible" && !esCobertura(e),
      );
    $("#movementTarget").innerHTML =
      '<option value="">Selecciona destino</option>' +
      (libres.length
        ? '<optgroup label="Cobertura disponible · sin cartera propia">' +
          libres
            .map(
              (e) =>
                '<option value="' +
                e.id +
                '">' +
                esc(e.name) +
                " · " +
                esc(e.level) +
                ", cartera libre</option>",
            )
            .join("") +
          "</optgroup>"
        : "") +
      (resto.length
        ? '<optgroup label="Ejecutivos con cartera propia">' +
          resto
            .map(
              (e) =>
                '<option value="' +
                e.id +
                '">' +
                esc(e.name) +
                " · " +
                clients.filter((c) => c.owner === e.id).length +
                " clientes</option>",
            )
            .join("") +
          "</optgroup>"
        : "");
    // Preselección: si hay cobertura libre, es el destino que el supervisor
    // iba a elegir de todos modos. Proponerlo ahorra el error de capacidad.
    if (libres.length) $("#movementTarget").value = String(libres[0].id);
  }
  updateMovementBase10(false);
  const aviso = $("#assignhint");
  if (aviso) {
    const destino = executives[+$("#movementTarget").value];
    if (destino && esCobertura(destino))
      aviso.innerHTML =
        "<b>Cobertura temporal.</b> " +
        esc(destino.name) +
        " no tiene cartera propia: sostiene esta hasta que se redistribuya o vuelva el titular. " +
        "Se notificará a ambos.";
  }
};

/* En el equipo, un junior de cobertura no se lee como alguien que va corto de
   meta: no tiene cartera. Se distingue por estado, no por una fila en rojo. */
const estadoEquipo8Base10 = estadoEquipo8;
estadoEquipo8 = function (s, e) {
  if (e && esCobertura(e) && !clients.some((c) => c.owner === e.id))
    return '<span class="pill estado e-frio">Cobertura · libre</span>';
  return estadoEquipo8Base10(s);
};

/* --- 5. Lote de prueba de 100 clientes -------------------------------------
   La plantilla de 12 filas alcanza para ver el formato, no para ver cómo se
   comporta el reparto. Con 100 clientes y una mezcla deliberada de resultados
   se puede probar lo que de verdad importa: que los aptos se repartan parejo,
   que los dudosos se deriven y que los malos no entren.                     */

const MEZCLA_LOTE10 = { aptos: 62, revision: 15, noAptos: 13, duplicados: 6, errores: 4 };

function loteDePrueba10() {
  const nombres = [
      "Adriana", "Bruno", "Cecilia", "Damián", "Eduardo", "Fiorella", "Gonzalo",
      "Helena", "Ignacio", "Julia", "Kevin", "Lorena", "Manuel", "Norma",
      "Óscar", "Patricia", "Quintín", "Raúl", "Silvana", "Tadeo",
    ],
    apellidos = [
      "Aguirre", "Bustamante", "Calderón", "Dávila", "Echevarría", "Figueroa",
      "Gutiérrez", "Huamán", "Izquierdo", "Jiménez", "Lazo", "Meléndez",
      "Nolasco", "Obregón", "Paredes", "Quiroga", "Rivas", "Salcedo",
      "Tello", "Ugarte",
    ],
    existentes = clients.slice(0, MEZCLA_LOTE10.duplicados).map((c) => c.dni),
    filas = ["nombre,dni,correo,celular,score,dias_mora"];

  let i = 0;
  const agrega = (tipo) => {
    const nombre = nombres[i % 20] + " " + apellidos[(i * 7) % 20],
      dni = String(58100001 + i),
      correo = "prueba" + (i + 1) + "@example.com",
      celular = String(921000000 + i);
    let campos;
    switch (tipo) {
      // Aptos: score por encima del mínimo y sin mora.
      case "apto":
        campos = [nombre, dni, correo, celular, String(660 + (i % 32) * 10), "0"];
        break;
      // En revisión: falta el score o falta la mora. No se pueden evaluar con
      // la regla automática, así que van al analista.
      case "revision":
        campos =
          i % 2 === 0
            ? [nombre, dni, correo, celular, "", "0"]
            : [nombre, dni, correo, celular, String(700 + (i % 20)), ""];
        break;
      // No aptos: score bajo o mora por encima del máximo.
      case "noApto":
        campos =
          i % 2 === 0
            ? [nombre, dni, correo, celular, String(380 + (i % 24) * 5), "0"]
            : [nombre, dni, correo, celular, String(720 + (i % 10)), String(15 + (i % 45))];
        break;
      // Duplicados: DNI que ya está en el canal.
      case "duplicado":
        campos = [nombre, existentes[i % existentes.length] || dni, correo, celular, "760", "0"];
        break;
      // Errores de formato: correo sin dominio, celular corto, DNI de 7
      // dígitos y score fuera de rango.
      default:
        campos =
          i % 4 === 0
            ? [nombre, dni, "prueba" + i + "@sin-dominio", celular, "700", "0"]
            : i % 4 === 1
              ? [nombre, dni, correo, "9210", "700", "0"]
              : i % 4 === 2
                ? [nombre, String(5810001 + i), correo, celular, "700", "0"]
                : [nombre, dni, correo, celular, "1450", "0"];
    }
    filas.push(campos.join(","));
    i++;
  };

  // Intercalados, no en bloques: un lote donde los 62 aptos van primero y los
  // errores al final no se parece a un archivo real, y deja la tabla de
  // resultados ordenada por casualidad.
  const plan = [];
  Object.entries({
    apto: MEZCLA_LOTE10.aptos,
    revision: MEZCLA_LOTE10.revision,
    noApto: MEZCLA_LOTE10.noAptos,
    duplicado: MEZCLA_LOTE10.duplicados,
    error: MEZCLA_LOTE10.errores,
  }).forEach(([t, n]) => {
    for (let k = 0; k < n; k++) plan.push(t);
  });
  plan.sort((a, b) => azar9(plan.indexOf(a) + a.length) - azar9(plan.indexOf(b) + b.length));
  // Barajado determinista por posición, estable entre recargas.
  plan
    .map((t, idx) => ({ t, k: azar9(idx * 2.7 + t.length) }))
    .sort((a, b) => a.k - b.k)
    .forEach((x) => agrega(x.t));

  downloadCSV("lote_prueba_100_clientes.csv", "﻿" + filas.join("\n"));
  toast("Lote de prueba descargado: 100 clientes con resultados variados.");
}

/* El botón vive junto a la plantilla, dentro del diálogo de carga: es donde
   alguien se pregunta "¿y con qué archivo pruebo esto?". */
const openBulkBase10 = openBulk;
openBulk = function () {
  openBulkBase10();
  const plantilla = $("#modal .textbtn");
  if (plantilla)
    plantilla.insertAdjacentHTML(
      "afterend",
      '<button class="textbtn" type="button" onclick="loteDePrueba10()">↓ Descargar lote de prueba · 100 clientes</button>' +
        '<p class="small muted nota-lote10">' +
        MEZCLA_LOTE10.aptos +
        " aptos · " +
        MEZCLA_LOTE10.revision +
        " en revisión · " +
        MEZCLA_LOTE10.noAptos +
        " no aptos · " +
        MEZCLA_LOTE10.duplicados +
        " duplicados · " +
        MEZCLA_LOTE10.errores +
        " con error de formato</p>",
    );
};

/* --- 6. El paso se redibuja con la vista -----------------------------------
   Cuando esto vivía en un diálogo, `reviewIntake()` pintaba el contenido una
   vez y ahí se quedaba. Como paso de la página, la vista se reconstruye en
   cada render, así que el detalle y el enlace de los parámetros tienen que
   reengancharse después de cada uno. */
const bindBase10 = bind;
bind = function () {
  bindBase10();
  if (pasoIngreso10 !== "revision" || !$("#intakeReview")) return;
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
};
