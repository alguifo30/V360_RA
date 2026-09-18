/* =========================================================================
   Etapa 9 · Tres niveles de acceso
   -------------------------------------------------------------------------
   El prototipo tenía dos perfiles y uno de ellos hacía dos trabajos que no se
   parecen: dar de alta clientes en el canal (administración) y mover gente
   entre ejecutivos (supervisión). Separarlos no es cosmética — decide quién
   puede confirmar una carga masiva, y eso es una decisión de control interno.

   Esta capa añade lo que el administrador necesita y que antes no existía:
     · el PANEL DEL CANAL, agregado por supervisor y por producto;
     · el TRACK DE CARTERIZADOS, la trazabilidad completa de la ingesta, con
       las dos revisiones que el negocio distingue y que la interfaz mezclaba:
         – revisión DEL CLIENTE   → ¿el dato entró bien? (apto / Riesgos / no)
         – revisión DE GESTIÓN    → ¿alguien lo trabajó? (gestionado / vencida)
   ========================================================================= */

/* --- 1. La ingesta deja rastro -------------------------------------------
   Antes, un cliente aparecía en una cartera sin decir de dónde vino. Sin
   procedencia no hay auditoría posible: "¿quién cargó esto y cuándo?" era una
   pregunta sin respuesta dentro del sistema. Cada cliente lleva ahora su
   partida de nacimiento.                                                    */

const HOY9 = new Date(2026, 8, 18);
const DIA9 = 86400000;
function fecha9(d) {
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}
function diasDesde9(d) {
  return Math.max(0, Math.round((HOY9 - d) / DIA9));
}

const REVISION_CLIENTE = {
  Apto: "cerrado",
  "En revisión": "curso",
  "No apto": "descartado",
  Duplicado: "descartado",
};

/* Lotes de demostración: la carga inicial del canal más las masivas del mes.
   Determinista a propósito — una auditoría que cambia en cada recarga no es
   una auditoría. */
const lotes9 = [
  { id: "LOTE-2026-0731", origen: "Carga inicial del canal", fecha: new Date(2026, 6, 31) },
  { id: "LOTE-2026-0903", origen: "Campaña · Depósito a plazo", fecha: new Date(2026, 8, 3) },
  { id: "LOTE-2026-0909", origen: "Campaña · Crédito hipotecario", fecha: new Date(2026, 8, 9) },
  { id: "LOTE-2026-0915", origen: "Campaña · Tarjeta Signature", fecha: new Date(2026, 8, 15) },
];

/* Ruido reproducible: hace falta que los datos de demostración varíen sin que
   cambien entre recargas. Una auditoría que no se puede repetir no sirve. */
function azar9(n) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function sembrarIngesta9() {
  clients.forEach((c, i) => {
    if (c.ingesta) return;
    // Reparto realista: algo más de la mitad viene de la carga inicial y el
    // resto de los tres lotes del mes. Si los lotes recientes quedan vacíos,
    // el filtro por lote ofrece opciones que no devuelven nada y el estado
    // "Pendiente" no existe — los tres estados colapsan en dos.
    const r = azar9(c.id * 3.7);
    const lote = r < 0.58 ? lotes9[0] : lotes9[1 + Math.floor(azar9(c.id * 9.1) * 3)];
    const rr = azar9(c.id * 5.3),
      revision =
        rr < 0.022 ? "En revisión" : rr < 0.032 ? "No apto" : rr < 0.037 ? "Duplicado" : "Apto";
    c.ingesta = {
      lote: lote.id,
      origen: lote.origen,
      fecha: lote.fecha,
      revision,
      motivo:
        revision === "En revisión"
          ? "Score o mora incompletos · pendiente de analista de riesgos"
          : revision === "No apto"
            ? "No cumple score mínimo"
            : revision === "Duplicado"
              ? "DNI ya presente en el canal"
              : "",
      canal: "Carga masiva",
    };
  });
}
sembrarIngesta9();

/* --- Calibración de los datos de demostración ------------------------------
   Medido antes de tocar nada: la meta es 17 aceptaciones por ejecutivo al mes
   (5 Alta + 5 Alta + 4 Media + 3 Baja, la regla del negocio) y la semilla
   producía entre 25 y 49 por ejecutivo, creciendo en línea recta con el id.
   Resultado: todos al 100%, "Falta ✓" en cada fila y una columna de avance
   que no distingue a nadie. Un panel donde nadie va corto no enseña cómo se
   ve ir corto, que es justo lo que un panel de metas tiene que enseñar.

   Aquí no se cambia la regla —la puso el negocio— sino el volumen sembrado:
   se rebajan aceptaciones a "Lo va a pensar", que sigue siendo una gestión
   registrada. Las gestiones no bajan; las aceptaciones sí. Determinista.    */
const RITMO_DEMO9 = [0.42, 0.78, 1.18, 0.62, 0.95, 0.3, 1.35, 0.7, 1.05];
function calibrarDemo9() {
  const metaUno = productos8()
    .filter(esVenta8)
    .reduce((s, n) => s + metaDelProducto8(n), 0);
  executives.forEach((e) => {
    const objetivo = Math.round(metaUno * (RITMO_DEMO9[e.id] ?? 1));
    const aceptadas = clients
      .filter((c) => c.owner === e.id)
      .flatMap(ensureTasks)
      .filter((t) => t.kind === "Venta" && aceptada8(t));
    for (let i = objetivo; i < aceptadas.length; i++) {
      aceptadas[i].sold = false;
      aceptadas[i].status = "Lo va a pensar";
    }
  });
}
calibrarDemo9();

/* Revisión de gestión: no es un campo, es una consecuencia. Se deriva de si
   el cliente tiene alguna tipificación y de cuánto lleva esperando. Un estado
   guardado a mano se desincroniza; uno derivado, no. */
const LIMITE_GESTION9 = 10;
function revisionGestion9(c) {
  const tareas = ensureTasks(c);
  if (tareas.some(contacted9)) return "Gestionado";
  if (c.ingesta && diasDesde9(c.ingesta.fecha) > LIMITE_GESTION9) return "Vencida";
  return "Pendiente";
}
const REVISION_GESTION = { Gestionado: "cerrado", Pendiente: "frio", Vencida: "descartado" };

function pildora9(texto, mapa) {
  return '<span class="pill estado e-' + (mapa[texto] || "frio") + '">' + esc(texto) + "</span>";
}

/* --- 2. Track de carterizados ---------------------------------------------
   Una sola tabla que responde la pregunta del administrador: "de todo lo que
   entró, ¿qué pasó con cada cliente?". Los filtros son los cuatro cortes por
   los que realmente se pregunta; el resto sería decoración.                 */

let trackBusca9 = "",
  trackLote9 = "",
  trackRevision9 = "",
  trackGestion9 = "",
  trackSupervisor9 = "",
  trackPagina9 = 1;

function filasTrack9() {
  const q = trackBusca9.trim().toLowerCase();
  return clients
    .filter((c) => {
      const ing = c.ingesta,
        sup = supervisorDe(c.owner);
      if (trackLote9 && ing.lote !== trackLote9) return false;
      if (trackRevision9 && ing.revision !== trackRevision9) return false;
      if (trackSupervisor9 !== "" && String(sup.id) !== trackSupervisor9) return false;
      if (trackGestion9 && revisionGestion9(c) !== trackGestion9) return false;
      if (q && !(c.name.toLowerCase().includes(q) || c.dni.includes(q) || ing.lote.toLowerCase().includes(q)))
        return false;
      return true;
    })
    .map((c) => ({
      c,
      ing: c.ingesta,
      sup: supervisorDe(c.owner),
      gestion: revisionGestion9(c),
      dias: diasDesde9(c.ingesta.fecha),
    }));
}

function irTrack9(p) {
  trackPagina9 = p;
  render();
}

function opcion9(v, actual, etiqueta) {
  return '<option value="' + esc(v) + '"' + (v === actual ? " selected" : "") + ">" + esc(etiqueta) + "</option>";
}

function trackCarterizados() {
  const filas = filasTrack9(),
    todos = clients.length,
    enRiesgos = clients.filter((c) => c.ingesta.revision === "En revisión").length,
    vencidas = clients.filter((c) => revisionGestion9(c) === "Vencida").length,
    fuera = clients.filter((c) => ["No apto", "Duplicado"].includes(c.ingesta.revision)).length;

  if (trackPagina9 > Math.ceil(filas.length / POR_PAGINA8)) trackPagina9 = 1;
  const pagina = filas.slice((trackPagina9 - 1) * POR_PAGINA8, trackPagina9 * POR_PAGINA8);

  return (
    head(
      "Track de carterizados",
      "Trazabilidad de todo lo que entró al canal: de qué lote vino, cómo se revisó y si alguien lo trabajó.",
      '<button onclick="location.hash=\'ingresos\'">Ir a ingreso de clientes</button>',
    ) +
    // Cuatro cifras que son atajos: cada una filtra la tabla de abajo. Un
    // indicador que no lleva a la lista que lo produce obliga a buscar a mano
    // lo que el sistema ya sabe.
    '<div class="stats stats-track9">' +
    [
      ["Carterizados", todos, "Clientes con cartera asignada", "", ""],
      ["En revisión de Riesgos", enRiesgos, "Esperan evaluación del analista", "revision", "En revisión"],
      ["Gestión vencida", vencidas, "Más de " + LIMITE_GESTION9 + " días sin tipificar", "gestion", "Vencida"],
      ["Fuera del canal", fuera, "No aptos y duplicados", "revision", "No apto"],
    ]
      .map(
        ([label, valor, sub, campo, v]) =>
          '<button class="stat stat-boton9" type="button" onclick="filtrarTrack9(\'' +
          campo +
          "','" +
          v +
          '\')"><div class="stat-top">' +
          label +
          '</div><strong class="num">' +
          valor +
          "</strong><small>" +
          sub +
          (campo ? " · filtrar" : "") +
          "</small></button>",
      )
      .join("") +
    "</div>" +
    '<section class="card"><div class="card-title"><h2>Detalle de la ingesta</h2><span class="sub">' +
    filas.length +
    (filas.length === 1 ? " cliente" : " clientes") +
    " en el corte actual</span></div>" +
    // Buscador y filtros dentro de la tarjeta que gobiernan: el mando junto a
    // su efecto (mapeo, Norman), no flotando encima de la pantalla.
    '<div class="filtros-track9">' +
    '<div class="buscador"><input type="search" id="trackBusca" value="' +
    esc(trackBusca9) +
    '" placeholder="Buscar cliente, DNI o lote" aria-label="Buscar en el track de carterizados"></div>' +
    '<label class="campo9">Lote<select id="trackLote">' +
    opcion9("", trackLote9, "Todos los lotes") +
    lotes9.map((l) => opcion9(l.id, trackLote9, l.id + " · " + l.origen)).join("") +
    "</select></label>" +
    '<label class="campo9">Revisión del cliente<select id="trackRevision">' +
    opcion9("", trackRevision9, "Cualquiera") +
    Object.keys(REVISION_CLIENTE).map((k) => opcion9(k, trackRevision9, k)).join("") +
    "</select></label>" +
    '<label class="campo9">Revisión de gestión<select id="trackGestion">' +
    opcion9("", trackGestion9, "Cualquiera") +
    Object.keys(REVISION_GESTION).map((k) => opcion9(k, trackGestion9, k)).join("") +
    "</select></label>" +
    '<label class="campo9">Supervisor<select id="trackSupervisor">' +
    opcion9("", trackSupervisor9, "Todas las células") +
    supervisors.map((s) => opcion9(String(s.id), trackSupervisor9, s.name + " · " + s.cell)).join("") +
    "</select></label>" +
    (trackBusca9 || trackLote9 || trackRevision9 || trackGestion9 || trackSupervisor9
      ? '<button type="button" class="textbtn" onclick="limpiarTrack9()">Quitar filtros</button>'
      : "") +
    "</div>" +
    (filas.length
      ? '<div class="table-wrap" tabindex="0" role="region" aria-label="Detalle de la ingesta">' +
        '<table class="tabla-track9"><thead><tr>' +
        "<th scope=col>Cliente</th><th scope=col>Lote de origen</th>" +
        "<th scope=col>Revisión del cliente</th><th scope=col>Carterizado a</th>" +
        "<th scope=col>Revisión de gestión</th>" +
        '<th scope=col class="num-col">Días</th>' +
        "</tr></thead><tbody>" +
        pagina
          .map(
            (f) =>
              '<tr><td data-col="Cliente"><b>' +
              esc(f.c.name) +
              '</b><small class="num">DNI ' +
              esc(f.c.dni) +
              '</small></td><td data-col="Lote"><span class="num">' +
              esc(f.ing.lote) +
              "</span><small>" +
              esc(f.ing.origen) +
              " · " +
              fecha9(f.ing.fecha) +
              '</small></td><td data-col="Revisión del cliente">' +
              pildora9(f.ing.revision, REVISION_CLIENTE) +
              (f.ing.motivo ? "<small>" + esc(f.ing.motivo) + "</small>" : "") +
              '</td><td data-col="Carterizado a">' +
              esc(executives[f.c.owner].name) +
              "<small>" +
              esc(f.sup.name) +
              " · " +
              esc(f.sup.cell) +
              '</small></td><td data-col="Revisión de gestión">' +
              pildora9(f.gestion, REVISION_GESTION) +
              '</td><td class="num-col" data-col="Días"><span class="num">' +
              f.dias +
              "</span></td></tr>",
          )
          .join("") +
        "</tbody></table></div>" +
        paginador8(filas.length, trackPagina9, "irTrack9", "el track de carterizados")
      : '<p class="vacio9">Ningún cliente coincide con este corte. <button type="button" class="textbtn" onclick="limpiarTrack9()">Quitar filtros</button></p>') +
    "</section>"
  );
}

function filtrarTrack9(campo, valor) {
  trackRevision9 = "";
  trackGestion9 = "";
  if (campo === "revision") trackRevision9 = valor;
  if (campo === "gestion") trackGestion9 = valor;
  trackPagina9 = 1;
  render();
}
function limpiarTrack9() {
  trackBusca9 = trackLote9 = trackRevision9 = trackGestion9 = trackSupervisor9 = "";
  trackPagina9 = 1;
  render();
}

/* --- 3. Panel del canal ----------------------------------------------------
   El administrador no compara ejecutivos: compara células. Mismo formato que
   la tabla de equipo del supervisor —deliberadamente— para que pasar de un
   nivel a otro no obligue a reaprender a leer. Cambia el sujeto de la fila,
   no la gramática.                                                          */

function metricasDe9(ids) {
  const tareas = clients.filter((c) => ids.includes(c.owner)).flatMap(ensureTasks),
    ventas = tareas.filter((t) => t.kind === "Venta"),
    metaUno = productos8()
      .filter(esVenta8)
      .reduce((s, n) => s + metaDelProducto8(n), 0),
    // Solo cuentan para la meta los ejecutivos que tienen cartera. Un junior
    // de cobertura libre no debe inflar el objetivo de su célula.
    conMeta = ids.filter((id) => clients.some((c) => c.owner === id)),
    meta = metaUno * conMeta.length,
    aceptadas = ventas.filter(aceptada8).length;
  return {
    ejecutivosConMeta: conMeta.length,
    cartera: clients.filter((c) => ids.includes(c.owner)).length,
    gestiones: tareas.filter(contacted9).length,
    // Clientes sin ninguna gestión — misma unidad que "Cartera", para que
    // las dos columnas se puedan comparar sin traducir.
    pendientes: clients.filter((c) => ids.includes(c.owner) && !ensureTasks(c).some(contacted9))
      .length,
    meta,
    aceptadas,
    falta: Math.max(0, meta - aceptadas),
  };
}

function panelCanal() {
  const filas = supervisors.map((s) => ({ s, ...metricasDe9(s.team) })),
    total = filas.reduce(
      (a, f) => ({
        cartera: a.cartera + f.cartera,
        gestiones: a.gestiones + f.gestiones,
        pendientes: a.pendientes + f.pendientes,
        meta: a.meta + f.meta,
        aceptadas: a.aceptadas + f.aceptadas,
        falta: a.falta + f.falta,
      }),
      { cartera: 0, gestiones: 0, pendientes: 0, meta: 0, aceptadas: 0, falta: 0 },
    ),
    enRiesgos = clients.filter((c) => c.ingesta.revision === "En revisión").length,
    vencidas = clients.filter((c) => revisionGestion9(c) === "Vencida").length;

  // Productos del canal, ordenados por lo que falta: la lista se ordena por la
  // pregunta que se le hace ("¿dónde estoy corto?"), no por el alfabeto.
  const porProducto = productos8()
    .filter(esVenta8)
    .map((n) => {
      const tareas = clients
          .flatMap(ensureTasks)
          .filter((t) => productoDe8(t.name) === n && t.kind === "Venta"),
        meta = metaDelProducto8(n) * executives.length,
        aceptadas = tareas.filter(aceptada8).length;
      return {
        n,
        prioridad: prioridadProducto8(n),
        gestiones: tareas.filter(contacted9).length,
        aceptadas,
        meta,
        falta: Math.max(0, meta - aceptadas),
      };
    })
    .sort((a, b) => b.falta - a.falta);

  // Tipificaciones del canal: el reparto real de respuestas, no solo el total.
  const todas = clients.flatMap(ensureTasks),
    tipificadas = todas.filter(contacted9),
    respuestas = [...new Set(tipificadas.map((t) => t.status))]
      .map((s) => ({ s, n: tipificadas.filter((t) => t.status === s).length }))
      .sort((a, b) => b.n - a.n);
  const maxResp = Math.max(1, ...respuestas.map((r) => r.n));

  return (
    head(
      "Panel del canal",
      '<b class="num">' +
        total.aceptadas +
        '</b> de <b class="num">' +
        total.meta +
        '</b> aceptaciones del mes · <b class="num">' +
        supervisors.length +
        "</b> células · <b class=\"num\">" +
        executives.length +
        "</b> ejecutivos",
      '<button onclick="location.hash=\'trazabilidad\'">Ver track de carterizados</button>',
    ) +
    '<p class="aviso-alcance8">Aceptaciones, no ventas: la venta se formaliza por otro canal.</p>' +
    '<div class="stats">' +
    [
      ["Cartera del canal", total.cartera.toLocaleString("es-PE"), "Clientes carterizados"],
      ["Aceptaciones", total.aceptadas + " / " + total.meta, "Faltan " + total.falta + " para la meta"],
      ["En revisión de Riesgos", enRiesgos, "Ingresos detenidos esperando evaluación"],
      ["Gestión vencida", vencidas, "Sin tipificar tras " + LIMITE_GESTION9 + " días"],
    ]
      .map(
        ([l, v, s]) =>
          '<div class="stat"><div class="stat-top">' +
          l +
          '</div><strong class="num">' +
          v +
          "</strong><small>" +
          s +
          "</small></div>",
      )
      .join("") +
    "</div>" +
    // --- Avance por supervisor ---
    '<section class="card"><div class="card-title"><h2>Avance por célula</h2>' +
    '<span class="sub">Ordenado por lo que falta para la meta</span></div>' +
    '<div class="table-wrap" tabindex="0" role="region" aria-label="Avance por célula">' +
    '<table class="tabla-equipo8"><thead><tr>' +
    "<th scope=col>Supervisor</th>" +
    '<th scope=col class="num-col">Ejecutivos</th>' +
    '<th scope=col class="num-col">Cartera</th>' +
    '<th scope=col class="num-col">Gestiones</th>' +
    '<th scope=col class="num-col">Sin gestión</th>' +
    '<th scope=col class="num-col">Aceptadas / meta</th>' +
    '<th scope=col class="num-col">Falta</th>' +
    "<th scope=col>Avance</th>" +
    "</tr></thead><tbody>" +
    [...filas]
      .sort((a, b) => b.falta - a.falta)
      .map((f) => {
        const pct = Math.min(100, Math.round((f.aceptadas / Math.max(1, f.meta)) * 100));
        return (
          "<tr><td>" +
          esc(f.s.name) +
          "<small>" +
          esc(f.s.cell) +
          '</small></td><td class="num-col" data-col="Ejecutivos"><span class="num">' +
          f.s.team.length +
          '</span></td><td class="num-col" data-col="Cartera"><span class="num">' +
          f.cartera +
          '</span></td><td class="num-col" data-col="Gestiones"><span class="num">' +
          f.gestiones +
          '</span></td><td class="num-col" data-col="Sin gestión"><span class="num">' +
          f.pendientes +
          '</span></td><td class="num-col" data-col="Aceptadas"><span class="num">' +
          f.aceptadas +
          " / " +
          f.meta +
          '</span></td><td class="num-col" data-col="Falta"><span class="num ' +
          (f.falta ? "falta8" : "listo8") +
          '">' +
          (f.falta || "✓") +
          '</span></td><td data-col="Avance"><div class="barra8" role="img" aria-label="' +
          pct +
          '% de la meta"><span style="width:' +
          pct +
          '%"></span></div><small class="num">' +
          pct +
          "%</small></td></tr>"
        );
      })
      .join("") +
    "</tbody>" +
    '<tfoot><tr><th scope="row">Total del canal</th>' +
    '<td class="num-col"><span class="num">' +
    executives.length +
    '</span></td><td class="num-col"><span class="num">' +
    total.cartera +
    '</span></td><td class="num-col"><span class="num">' +
    total.gestiones +
    '</span></td><td class="num-col"><span class="num">' +
    total.pendientes +
    '</span></td><td class="num-col"><span class="num">' +
    total.aceptadas +
    " / " +
    total.meta +
    '</span></td><td class="num-col"><span class="num ' +
    (total.falta ? "falta8" : "listo8") +
    '">' +
    (total.falta || "✓") +
    '</span></td><td></td></tr></tfoot>' +
    "</table></div></section>" +
    // --- Ventas por producto ---
    '<section class="card"><div class="card-title"><h2>Aceptaciones por producto</h2>' +
    '<span class="sub">Meta del canal según la prioridad de cada producto</span></div>' +
    '<div class="table-wrap" tabindex="0" role="region" aria-label="Aceptaciones por producto">' +
    '<table class="tabla-equipo8"><thead><tr>' +
    "<th scope=col>Producto</th><th scope=col>Prioridad</th>" +
    '<th scope=col class="num-col">Gestiones</th>' +
    '<th scope=col class="num-col">Aceptadas / meta</th>' +
    '<th scope=col class="num-col">Falta</th>' +
    "<th scope=col>Avance</th>" +
    "</tr></thead><tbody>" +
    porProducto
      .map((p) => {
        const pct = Math.min(100, Math.round((p.aceptadas / Math.max(1, p.meta)) * 100));
        return (
          "<tr><td>" +
          esc(p.n) +
          '</td><td data-col="Prioridad">' +
          badge(p.prioridad, p.prioridad === "Alta" ? "orange" : p.prioridad === "Media" ? "blue" : "gray") +
          '</td><td class="num-col" data-col="Gestiones"><span class="num">' +
          p.gestiones +
          '</span></td><td class="num-col" data-col="Aceptadas"><span class="num">' +
          p.aceptadas +
          " / " +
          p.meta +
          '</span></td><td class="num-col" data-col="Falta"><span class="num ' +
          (p.falta ? "falta8" : "listo8") +
          '">' +
          (p.falta || "✓") +
          '</span></td><td data-col="Avance"><div class="barra8" role="img" aria-label="' +
          pct +
          '% de la meta"><span style="width:' +
          pct +
          '%"></span></div><small class="num">' +
          pct +
          "%</small></td></tr>"
        );
      })
      .join("") +
    "</tbody></table></div></section>" +
    // --- Tipificaciones ---
    '<section class="card"><div class="card-title"><h2>Tipificaciones del canal</h2>' +
    '<span class="sub">' +
    tipificadas.length.toLocaleString("es-PE") +
    " gestiones registradas sobre " +
    todas.length.toLocaleString("es-PE") +
    " oportunidades</span></div>" +
    '<ul class="tipif9">' +
    respuestas
      .map(
        (r) =>
          '<li><span class="tipif9-nombre">' +
          esc(r.s) +
          '</span><span class="tipif9-barra"><i style="width:' +
          Math.round((r.n / maxResp) * 100) +
          '%"></i></span><b class="num">' +
          r.n +
          "</b></li>",
      )
      .join("") +
    "</ul></section>"
  );
}

/* --- 4. Enganches ---------------------------------------------------------
   Los filtros del track se enlazan igual que el resto de la app: en bind(),
   que corre tras cada render. */
const bindBase9 = bind;
bind = function () {
  bindBase9();
  const enlaza = (id, set) => {
    const el = $("#" + id);
    if (!el) return;
    el.onchange = el.oninput = (e) => {
      set(e.target.value);
      trackPagina9 = 1;
      render();
      const nuevo = $("#" + id);
      if (nuevo && id === "trackBusca") {
        nuevo.focus();
        nuevo.setSelectionRange(nuevo.value.length, nuevo.value.length);
      }
    };
  };
  enlaza("trackBusca", (v) => (trackBusca9 = v));
  enlaza("trackLote", (v) => (trackLote9 = v));
  enlaza("trackRevision", (v) => (trackRevision9 = v));
  enlaza("trackGestion", (v) => (trackGestion9 = v));
  enlaza("trackSupervisor", (v) => (trackSupervisor9 = v));
};

/* Lo que entra por carga masiva también deja rastro, con su lote real. */
const addClientBase9 = addClient;
let loteActual9 = null;
addClient = function (d) {
  addClientBase9(d);
  const c = clients[clients.length - 1];
  c.ingesta = {
    lote: loteActual9 || "LOTE-" + fecha9(HOY9).replace(/[^0-9]/g, ""),
    origen: d.campaign ? "Campaña · " + d.campaign : "Ingreso individual",
    fecha: HOY9,
    revision: "Apto",
    motivo: "",
    canal: loteActual9 ? "Carga masiva" : "Ingreso individual",
  };
};

const confirmIntakeBase9 = confirmIntake;
confirmIntake = function () {
  loteActual9 = "LOTE-" + Date.now().toString().slice(-8);
  if (!lotes9.some((l) => l.id === loteActual9))
    lotes9.push({
      id: loteActual9,
      origen: intakeCampaign ? "Campaña · " + intakeCampaign : "Carga masiva",
      fecha: HOY9,
    });
  confirmIntakeBase9();
  // Los derivados a Riesgos también son ingesta: entraron al track aunque no
  // hayan entrado a una cartera. Perderlos de vista era el punto ciego.
  (derivadosRiesgos8 || []).forEach((r) => {
    const c = clients.find((c) => c.dni === r.dni);
    if (c) {
      c.ingesta.revision = "En revisión";
      c.ingesta.motivo = motivoRevision8(r);
    }
  });
  loteActual9 = null;
};
