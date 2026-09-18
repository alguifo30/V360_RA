/* ===========================================================================
   Etapa 8 — correcciones sobre la Etapa 7
   ---------------------------------------------------------------------------
   Esta capa sobrescribe vistas completas en vez de parchearlas con
   reemplazos de texto: cuando lo que cambia es qué mide la pantalla, un
   `replace` sobre el HTML anterior esconde la decisión en una expresión
   regular. Aquí se ve.
   =========================================================================== */

/* --- Lo que este CRM mide en realidad --------------------------------------
   El panel decía "Ventas confirmadas". No lo son: aquí se registra la
   INTENCIÓN del cliente —que aceptó la campaña— y la venta se formaliza por
   otro canal. Llamarlo venta infla el indicador y, peor, hace que un
   ejecutivo crea cerrado lo que solo está aceptado.
   Todo el vocabulario del panel pasa a "aceptaciones".                     */
function aceptada8(t) {
  return t.sold || t.status === "Acepta campaña";
}

/* Metas por producto. El dato no existía: lo derivo de la prioridad de la
   campaña y queda en un solo sitio para que negocio lo sustituya por el
   número real. Es una hipótesis de demostración, y la pantalla lo dice. */
const METAS_POR_PRIORIDAD = { Alta: 5, Media: 4, Baja: 3 };

// El catálogo tiene 100 campañas, pero solo 6 productos. La meta y la
// prioridad viven en el producto: "depósitos, 5 al mes" es una frase sobre
// el producto, no sobre "Depósito a plazo · Temporada 016".
function productos8() {
  return [...new Set(campaignRegistry.map((m) => m.product))];
}
function productoDe8(nombreCampana) {
  const m = campaignRegistry.find((x) => x.name === nombreCampana);
  return m ? m.product : nombreCampana;
}
function prioridadProducto8(producto) {
  const i = campaigns.indexOf(producto);
  return (i >= 0 && campaignPriorities[i]) || "Media";
}
function metaDelProducto8(producto) {
  return METAS_POR_PRIORIDAD[prioridadProducto8(producto)] ?? 3;
}
function esVenta8(producto) {
  const m = campaignRegistry.find((x) => x.product === producto);
  return m ? m.kind === "Venta" : campaignKind(producto) === "Venta";
}

/* Paginación reutilizable: 15 filas. Una tabla de 100 campañas con scroll
   infinito obliga a recorrer con el dedo lo que un número resuelve. */
let pagMetas8 = 1,
  pagCampanas8 = 1,
  pagEquipo8 = 1;
const POR_PAGINA8 = 15;

function paginador8(total, pagina, alCambiar, etiqueta) {
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA8));
  if (total <= POR_PAGINA8) return "";
  return (
    '<nav class="paginador8" aria-label="Paginación de ' +
    esc(etiqueta) +
    '"><button ' +
    (pagina === 1 ? "disabled" : "") +
    ' onclick="' +
    alCambiar +
    '(-1)">← Anterior</button>' +
    '<span><b class="num">' +
    ((pagina - 1) * POR_PAGINA8 + 1) +
    "–" +
    Math.min(pagina * POR_PAGINA8, total) +
    '</b> de <b class="num">' +
    total +
    "</b> · página " +
    pagina +
    " de " +
    paginas +
    "</span><button " +
    (pagina >= paginas ? "disabled" : "") +
    ' onclick="' +
    alCambiar +
    '(1)">Siguiente →</button></nav>'
  );
}
function irMetas8(d) {
  pagMetas8 += d;
  render();
}
function irCampanas8(d) {
  pagCampanas8 += d;
  render();
}
function irEquipo8(d) {
  pagEquipo8 += d;
  render();
}

/* --- Panel de avance -------------------------------------------------------
   Dos preguntas, dos bloques: "¿voy a llegar?" (metas por producto) y
   "¿sobre qué actúo?" (detalle por campaña). Nada más.                     */
sales = function () {
  const visibles = esAdmin() ? executives.map((e) => e.id) : equipoDelSupervisor(),
    ids = esAgregado()
      ? reportOwner === ""
        ? visibles
        : [+reportOwner]
      : [activeExecutive],
    tareas = clients.filter((c) => ids.includes(c.owner)).flatMap(ensureTasks),
    ventas = tareas.filter((t) => t.kind === "Venta"),
    aceptadas = ventas.filter(aceptada8).length,
    metaTotal =
      productos8()
        .filter(esVenta8)
        .reduce((s, n) => s + metaDelProducto8(n), 0) * (esAgregado() ? ids.length : 1);

  return (
    head(
      esAgregado() ? "Avance del equipo" : "Mi avance comercial",
      '<b class="num">' +
        aceptadas +
        "</b> de <b class=\"num\">" +
        metaTotal +
        "</b> aceptaciones del mes · " +
        (metaTotal - aceptadas > 0
          ? 'faltan <b class="num">' + (metaTotal - aceptadas) + "</b>"
          : "meta cumplida"),
      esAgregado()
        ? '<select aria-label="Filtrar ejecutivo" onchange="reportOwner=this.value;pagMetas8=1;pagCampanas8=1;render()"><option value="">Todo el equipo</option>' +
          executives
            .filter((e) => visibles.includes(e.id))
            .map(
              (e) =>
                '<option value="' +
                e.id +
                '" ' +
                (reportOwner === String(e.id) ? "selected" : "") +
                ">" +
                esc(e.name) +
                "</option>",
            )
            .join("") +
          "</select>"
        : "",
    ) +
    // Lo primero que se lee: qué mide esta pantalla. Sin esta línea, un
    // ejecutivo lee "aceptaciones" y entiende "ventas".
    '<p class="aviso-alcance8">Aquí se registra la <b>intención</b> del cliente. ' +
    "La venta se formaliza por otro canal y no se cuenta en este panel.</p>" +
    metasPorProducto8(ids) +
    detallePorCampana8(ids) +
    '<p class="small muted">Las metas por producto se derivan de la prioridad de campaña ' +
    "(Alta 5 · Media 4 · Baja 3). Es una hipótesis de demostración: sustituir por la meta real de negocio.</p>"
  );
};

/* Metas por producto priorizado: la tabla que responde "¿voy a llegar?".
   Una fila por producto de venta, con lo que falta explícito — que es el
   número sobre el que se decide a qué dedicar el día. */
function metasPorProducto8(ids) {
  const tareas = clients.filter((c) => ids.includes(c.owner)).flatMap(ensureTasks),
    productos = productos8()
      .filter(esVenta8)
      .map((n) => {
        const delProducto = tareas.filter((t) => productoDe8(t.name) === n),
          meta = metaDelProducto8(n) * (esAgregado() ? ids.length : 1),
          logrado = delProducto.filter(aceptada8).length;
        return {
          n,
          prioridad: prioridadProducto8(n),
          meta,
          logrado,
          falta: Math.max(0, meta - logrado),
          pendientes: delProducto.filter((t) => !contacted9(t)).length,
        };
      })
      // Lo que más falta, arriba: es donde hay que meterse hoy.
      .sort((a, b) => b.falta - a.falta || b.prioridad.localeCompare(a.prioridad));

  const pagina = productos.slice((pagMetas8 - 1) * POR_PAGINA8, pagMetas8 * POR_PAGINA8);
  return (
    '<section class="card"><div class="card-title"><h2>Metas por producto</h2>' +
    '<span class="sub">Ordenado por lo que falta</span></div>' +
    '<div class="table-wrap" tabindex="0" role="region" aria-label="Metas por producto">' +
    '<table class="tabla-metas8"><thead><tr>' +
    "<th scope=col>Producto</th><th scope=col>Prioridad</th>" +
    '<th scope=col class="num-col">Meta mes</th>' +
    '<th scope=col class="num-col">Aceptadas</th>' +
    '<th scope=col class="num-col">Falta</th>' +
    "<th scope=col>Avance</th>" +
    '<th scope=col class="num-col">Sin gestión</th>' +
    "</tr></thead><tbody>" +
    pagina
      .map((p) => {
        const pct = Math.min(100, Math.round((p.logrado / Math.max(1, p.meta)) * 100));
        return (
          "<tr><td>" +
          esc(p.n) +
          "</td><td>" +
          prioridad8(p.prioridad) +
          '</td><td class="num-col" data-col="Meta"><span class="num">' +
          p.meta +
          '</span></td><td class="num-col" data-col="Aceptadas"><span class="num">' +
          p.logrado +
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
          '%</small></td><td class="num-col" data-col="Sin gestión"><span class="num">' +
          p.pendientes +
          "</span></td></tr>"
        );
      })
      .join("") +
    "</tbody></table></div>" +
    paginador8(productos.length, pagMetas8, "irMetas8", "metas por producto") +
    "</section>"
  );
}

/* Prioridad como rango, igual que en el resto del producto. */
function prioridad8(p) {
  const nivel = p === "Alta" ? 3 : p === "Media" ? 2 : 1;
  return (
    '<span class="rank r-' +
    nivel +
    '" title="Prioridad ' +
    esc(p) +
    '"><i></i><i></i><i></i>' +
    esc(p) +
    "</span>"
  );
}

/* Detalle por campaña, paginado. Antes: 100 filas de scroll continuo. */
function detallePorCampana8(ids) {
  const tareas = clients.filter((c) => ids.includes(c.owner)).flatMap(ensureTasks),
    filas = [...new Set(campaigns)]
      .map((n) => {
        const t = tareas.filter((x) => x.name === n);
        return {
          n,
          kind: campaignKind(n),
          gestiones: t.filter(contacted9).length,
          aceptadas: t.filter(aceptada8).length,
          resueltos: t.filter((x) => x.status === "Resuelto").length,
          pendientes: t.filter((x) => !contacted9(x)).length,
        };
      })
      // Las campañas sin ninguna actividad van al final: existen, pero no
      // son sobre lo que se decide hoy.
      .sort((a, b) => b.aceptadas - a.aceptadas || b.gestiones - a.gestiones);

  const pagina = filas.slice((pagCampanas8 - 1) * POR_PAGINA8, pagCampanas8 * POR_PAGINA8);
  return (
    '<section class="card"><div class="card-title"><h2>Detalle por campaña</h2>' +
    '<span class="sub">' +
    filas.length +
    " campañas · las de mayor actividad primero</span></div>" +
    '<div class="table-wrap" tabindex="0" role="region" aria-label="Detalle por campaña">' +
    '<table class="tabla-detalle8"><thead><tr>' +
    "<th scope=col>Campaña</th><th scope=col>Tipo</th>" +
    '<th scope=col class="num-col">Gestiones</th>' +
    '<th scope=col class="num-col">Aceptadas</th>' +
    '<th scope=col class="num-col">Resueltos</th>' +
    '<th scope=col class="num-col">Sin gestión</th>' +
    "</tr></thead><tbody>" +
    pagina
      .map(
        (f) =>
          "<tr><td>" +
          esc(f.n) +
          "</td><td>" +
          esc(f.kind) +
          '</td><td class="num-col" data-col="Gestiones"><span class="num">' +
          f.gestiones +
          '</span></td><td class="num-col" data-col="Aceptadas"><span class="num">' +
          f.aceptadas +
          '</span></td><td class="num-col" data-col="Resueltos"><span class="num">' +
          f.resueltos +
          '</span></td><td class="num-col" data-col="Sin gestión"><span class="num">' +
          f.pendientes +
          "</span></td></tr>",
      )
      .join("") +
    "</tbody></table></div>" +
    paginador8(filas.length, pagCampanas8, "irCampanas8", "detalle por campaña") +
    "</section>"
  );
}

/* --- Supervisión del equipo ------------------------------------------------
   Antes: cuatro tarjetas, una por ejecutivo, con barras de progreso. Con
   cuatro personas cabe; con veinte, no — y no se pueden comparar dos
   ejecutivos que están a dos pantallas de distancia. Una tabla los pone en
   la misma rejilla y deja ver de un vistazo quién va corto.               */
team = function () {
  // Solo su célula: el supervisor de Lima Norte no gestiona Lima Sur.
  const filas = ejecutivosVisibles().map((e) => {
      const tareas = clients.filter((c) => c.owner === e.id).flatMap(ensureTasks),
        ventas = tareas.filter((t) => t.kind === "Venta"),
        // Sin cartera no hay meta: un junior de cobertura libre sumaría 17
        // aceptaciones imposibles al total de su célula.
        conCartera = clients.some((c) => c.owner === e.id),
        meta = conCartera
          ? productos8()
              .filter(esVenta8)
              .reduce((s, n) => s + metaDelProducto8(n), 0)
          : 0,
        aceptadas = ventas.filter(aceptada8).length;
      return {
        e,
        cartera: clients.filter((c) => c.owner === e.id).length,
        gestiones: tareas.filter(contacted9).length,
        // Clientes sin gestión, no tareas: la columna de al lado es cartera.
        pendientes: clients.filter((c) => c.owner === e.id && !ensureTasks(c).some(contacted9))
          .length,
        meta,
        aceptadas,
        falta: Math.max(0, meta - aceptadas),
      };
    }),
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
    );

  filas.sort((a, b) => b.falta - a.falta);
  const pagina = filas.slice((pagEquipo8 - 1) * POR_PAGINA8, pagEquipo8 * POR_PAGINA8);

  return (
    head(
      "Avance del equipo",
      '<b class="num">' +
        total.aceptadas +
        "</b> de <b class=\"num\">" +
        total.meta +
        "</b> aceptaciones · faltan <b class=\"num\">" +
        total.falta +
        "</b> · <b class=\"num\">" +
        total.pendientes +
        "</b> sin contactar",
      '<button onclick="openAssign()">Organizar cobertura</button>',
    ) +
    '<p class="aviso-alcance8">Aceptaciones, no ventas: la venta se formaliza por otro canal.</p>' +
    '<section class="card"><div class="card-title"><h2>Avance por ejecutivo</h2>' +
    '<span class="sub">Ordenado por lo que falta para la meta</span></div>' +
    '<div class="table-wrap" tabindex="0" role="region" aria-label="Avance por ejecutivo">' +
    '<table class="tabla-equipo8"><thead><tr>' +
    "<th scope=col>Ejecutivo</th><th scope=col>Estado</th>" +
    '<th scope=col class="num-col">Cartera</th>' +
    '<th scope=col class="num-col">Gestiones</th>' +
    '<th scope=col class="num-col">Sin gestión</th>' +
    '<th scope=col class="num-col">Aceptadas / meta</th>' +
    '<th scope=col class="num-col">Falta</th>' +
    "<th scope=col>Avance</th><th scope=col></th>" +
    "</tr></thead><tbody>" +
    pagina
      .map((f) => {
        const pct = Math.min(100, Math.round((f.aceptadas / Math.max(1, f.meta)) * 100));
        return (
          "<tr><td>" +
          esc(f.e.name) +
          "<small>" +
          esc(f.e.level) +
          '</small></td><td>' +
          estadoEquipo8(f.e.status, f.e) +
          '</td><td class="num-col" data-col="Cartera"><span class="num">' +
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
          '%</small></td><td class="rowaction"><button onclick="viewOwner(' +
          f.e.id +
          ')">Ver panel</button></td></tr>'
        );
      })
      .join("") +
    "</tbody>" +
    // El total en un <tfoot>: es la suma de la tabla, no una fila más.
    '<tfoot><tr><th scope="row">Total del equipo</th><td></td>' +
    '<td class="num-col"><span class="num">' +
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
    "</span></td><td colspan=\"2\"></td></tr></tfoot>" +
    "</table></div>" +
    paginador8(filas.length, pagEquipo8, "irEquipo8", "ejecutivos") +
    "</section>"
  );
};

function estadoEquipo8(s) {
  return (
    '<span class="pill estado e-' + (s === "Disponible" ? "cerrado" : "curso") + '">' + esc(s) + "</span>"
  );
}

/* --- Supervisión de campañas ----------------------------------------------
   El panel de la derecha era un catálogo para *elegir* una campaña y trabajarla
   — una tarea de ejecutivo. El supervisor no tipifica: mira el agregado. Ahí
   ese panel solo robaba 292px y obligaba a mirar en dos sitios. Fuera: el
   buscador y el filtro de priorización viven dentro de la propia tabla,
   que es lo que el supervisor lee.                                         */
let buscaSup8 = "",
  filtroPrioridad8 = "Todas",
  pagSup8 = 1;

function cambiarFiltroPrioridad8(v) {
  filtroPrioridad8 = v;
  pagSup8 = 1;
  render();
}
function irSup8(d) {
  pagSup8 += d;
  render();
}

const campaignViewBase8 = campaignView;
campaignView = function () {
  if (!esAgregado()) return campaignViewBase8();

  const tareasPorCampana = new Map();
  for (const c of scope())
    for (const t of ensureTasks(c)) {
      if (!tareasPorCampana.has(t.name)) tareasPorCampana.set(t.name, []);
      tareasPorCampana.get(t.name).push(t);
    }

  const todas = campaignRegistry.map((m) => {
      const t = tareasPorCampana.get(m.name) || [],
        prioritaria = prioridadProducto8(m.product) === "Alta";
      return {
        m,
        prioritaria,
        clientes: t.length,
        contactados: t.filter(contacted9).length,
        aceptadas: t.filter(aceptada8).length,
        pendientes: t.filter((x) => !contacted9(x)).length,
      };
    }),
    filtradas = todas
      .filter(
        (f) =>
          filtroPrioridad8 === "Todas" ||
          (filtroPrioridad8 === "Priorizadas" && f.prioritaria) ||
          (filtroPrioridad8 === "No priorizadas" && !f.prioritaria),
      )
      .filter(
        (f) =>
          !buscaSup8 ||
          normalized(f.m.name + " " + f.m.id + " " + f.m.product).includes(normalized(buscaSup8)),
      )
      // Lo que más queda por trabajar, arriba.
      .sort((a, b) => b.pendientes - a.pendientes || b.clientes - a.clientes);

  const conteo = (v) =>
    todas.filter(
      (f) =>
        v === "Todas" ||
        (v === "Priorizadas" && f.prioritaria) ||
        (v === "No priorizadas" && !f.prioritaria),
    ).length;

  const pagina = filtradas.slice((pagSup8 - 1) * POR_PAGINA8, pagSup8 * POR_PAGINA8);

  return (
    head(
      "Seguimiento de campañas",
      '<b class="num">' +
        todas.length +
        "</b> campañas · <b class=\"num\">" +
        todas.filter((f) => f.prioritaria).length +
        "</b> priorizadas · vista agregada del equipo",
    ) +
    '<p class="aviso-alcance8">Aceptaciones, no ventas: la venta se formaliza por otro canal.</p>' +
    '<section class="card cartera-panel"><div class="panel-cab">' +
    // Buscador y filtro dentro de la tabla que gobiernan, no en un panel aparte.
    '<div class="vistas" role="tablist" aria-label="Priorización">' +
    ["Todas", "Priorizadas", "No priorizadas"]
      .map(
        (v) =>
          '<button role="tab" class="' +
          (filtroPrioridad8 === v ? "active" : "") +
          '" tabindex="' +
          (filtroPrioridad8 === v ? "0" : "-1") +
          '" aria-selected="' +
          (filtroPrioridad8 === v ? "true" : "false") +
          '" onclick="cambiarFiltroPrioridad8(' +
          JSON.stringify(v).replace(/"/g, "&quot;") +
          ')"><span>' +
          v +
          '</span><b class="num">' +
          conteo(v) +
          "</b></button>",
      )
      .join("") +
    "</div>" +
    '<span class="panel-conteo"><b class="num">' +
    filtradas.length +
    '</b> de <span class="num">' +
    todas.length +
    "</span></span></div>" +
    '<div class="buscador"><input type="search" value="' +
    esc(buscaSup8) +
    '" aria-label="Buscar campaña por nombre, código o producto" placeholder="Buscar campaña por nombre, código o producto" ' +
    'oninput="buscaSup8=this.value;pagSup8=1;render()"></div>' +
    '<div class="table-wrap" tabindex="0" role="region" aria-label="Campañas del equipo">' +
    '<table class="tabla-sup8"><thead><tr>' +
    "<th scope=col>Campaña</th><th scope=col>Producto</th><th scope=col>Priorización</th>" +
    '<th scope=col class="num-col">Clientes</th>' +
    '<th scope=col class="num-col">Contactados</th>' +
    '<th scope=col class="num-col">Aceptadas</th>' +
    '<th scope=col class="num-col">Sin gestión</th>' +
    "<th scope=col>Prioridad</th></tr></thead><tbody>" +
    (pagina.length
      ? pagina
          .map(
            (f) =>
              "<tr><td>" +
              esc(f.m.name) +
              '<small class="dni">' +
              esc(f.m.id) +
              " · " +
              (f.m.active ? "Activa" : "Finalizada") +
              '</small></td><td data-col="Producto">' +
              esc(f.m.product) +
              '</td><td data-col="Priorización">' +
              (f.prioritaria
                ? '<span class="pill estado e-cerrado">Priorizada</span>'
                : '<span class="pill estado e-frio">No priorizada</span>') +
              '</td><td class="num-col" data-col="Clientes"><span class="num">' +
              f.clientes +
              '</span></td><td class="num-col" data-col="Contactados"><span class="num">' +
              f.contactados +
              '</span></td><td class="num-col" data-col="Aceptadas"><span class="num">' +
              f.aceptadas +
              '</span></td><td class="num-col" data-col="Sin gestión"><span class="num">' +
              f.pendientes +
              '</span></td><td class="rowaction"><button onclick="openPriority(' +
              campaigns.indexOf(f.m.product) +
              ')">' +
              esc(prioridadProducto8(f.m.product)) +
              " →</button></td></tr>",
          )
          .join("")
      : '<tr><td colspan="8"><div class="empty">Ninguna campaña coincide con la búsqueda o el filtro.</div></td></tr>') +
    "</tbody></table></div>" +
    paginador8(filtradas.length, pagSup8, "irSup8", "campañas") +
    "</section>"
  );
};

/* --- Carga masiva: quién pasa y quién no ----------------------------------
   La distribución ya excluía a los "En revisión" —solo reparte aptos—, pero
   la pantalla no decía a dónde van: quedaban como un número en un contador y
   desaparecían del flujo. Un cliente que entra al lote y no sale por ningún
   lado es un cliente perdido.

   Ahora la revisión tiene una salida explícita: se deriva al analista de
   riesgos, con el motivo por el que no pudo evaluarse automáticamente, y esa
   derivación se registra al confirmar.                                     */
let derivadosRiesgos8 = [];

function motivoRevision8(r) {
  if (r.score === "" && r.arrears === "") return "Sin score ni días de mora";
  if (r.score === "") return "Sin score crediticio";
  if (r.arrears === "") return "Sin días de mora";
  return r.reason || "Requiere evaluación manual";
}

renderIntakeReview = function () {
  const cuenta = (s) => intakeResults.filter((r) => r.status === s).length,
    asignados = allocation.filter((r) => r.owner !== null),
    enRevision = intakeResults.filter((r) => r.status === "En revisión"),
    noAptos = intakeResults.filter((r) => r.status === "No apto");

  $("#intakeReview").innerHTML =
    '<div class="intake-counts">' +
    [
      ["Aptos", cuenta("Apto"), "entran a cartera"],
      ["En revisión", cuenta("En revisión"), "van a Riesgos"],
      ["No aptos", cuenta("No apto"), "no ingresan"],
      ["Duplicados / errores", cuenta("Duplicado") + cuenta("Error"), "se descartan"],
    ]
      .map(
        ([t, n, d]) =>
          '<div><strong class="num">' +
          n +
          "</strong><span>" +
          t +
          "</span><small>" +
          d +
          "</small></div>",
      )
      .join("") +
    "</div>" +
    // La derivación a riesgos, con nombre y motivo: es una salida del flujo,
    // no un residuo del contador.
    (enRevision.length
      ? '<section class="bloque8 derivacion8"><h3>Derivación a Riesgos · ' +
        enRevision.length +
        (enRevision.length === 1 ? " cliente" : " clientes") +
        "</h3>" +
        '<p class="sub">No pudieron evaluarse con las reglas automáticas. No entran a cartera ' +
        "en este lote: quedan en la bandeja del analista de riesgos, que decide si ingresan.</p>" +
        '<ul class="lista-derivados8">' +
        enRevision
          .map(
            (r) =>
              "<li><b>" +
              esc(r.name) +
              '</b><span class="dni">' +
              esc(r.dni) +
              '</span><span class="motivo8">' +
              esc(motivoRevision8(r)) +
              "</span></li>",
          )
          .join("") +
        "</ul></section>"
      : "") +
    '<section class="bloque8"><h3>Distribución propuesta · ' +
    asignados.length +
    (asignados.length === 1 ? " cliente" : " clientes") +
    "</h3>" +
    '<p class="sub">Cada cliente se asigna a la cartera disponible más pequeña. ' +
    "Empates: orden estable de ejecutivo.</p>" +
    '<table class="tabla-reparto8"><thead><tr><th scope=col>Ejecutivo</th>' +
    '<th scope=col class="num-col">Actual</th><th scope=col class="num-col">Recibe</th>' +
    '<th scope=col class="num-col">Final</th><th scope=col>Disponibilidad</th>' +
    "</tr></thead><tbody>" +
    executives
      .map((e) => {
        const actual = clients.filter((c) => c.owner === e.id).length,
          suma = asignados.filter((r) => r.owner === e.id).length;
        return (
          "<tr><td>" +
          esc(e.name) +
          '</td><td class="num-col" data-col="Actual"><span class="num">' +
          actual +
          '</span></td><td class="num-col" data-col="Recibe"><span class="num ' +
          (suma ? "suma8" : "") +
          '">' +
          (suma ? "+" + suma : "—") +
          '</span></td><td class="num-col" data-col="Final"><span class="num">' +
          (actual + suma) +
          '</span></td><td data-col="Disponibilidad">' +
          estadoEquipo8(e.status, e) +
          "</td></tr>"
        );
      })
      .join("") +
    "</tbody></table></section>" +
    '<section class="bloque8"><h3>Resultado por cliente</h3>' +
    '<table class="tabla-reparto8"><thead><tr><th scope=col>Cliente</th>' +
    '<th scope=col class="num-col">Score</th><th scope=col class="num-col">Mora</th>' +
    "<th scope=col>Resultado</th><th scope=col>Destino</th></tr></thead><tbody>" +
    intakeResults
      .map((r) => {
        const p = allocation.find((x) => x.line === r.line),
          destino =
            r.status === "En revisión"
              ? "Analista de riesgos"
              : p
                ? p.owner === null
                  ? p.reason
                  : executives[p.owner].name
                : r.reason || "No ingresa";
        return (
          "<tr><td>" +
          esc(r.name) +
          '<small class="dni">' +
          esc(r.dni) +
          '</small></td><td class="num-col" data-col="Score"><span class="num">' +
          esc(r.score || "—") +
          '</span></td><td class="num-col" data-col="Mora"><span class="num">' +
          (r.arrears === "" ? "—" : esc(r.arrears)) +
          '</span></td><td data-col="Resultado">' +
          resultadoLote8(r.status) +
          '</td><td data-col="Destino">' +
          esc(destino) +
          "</td></tr>"
        );
      })
      .join("") +
    "</tbody></table></section>" +
    (asignados.length < allocation.length
      ? '<div class="alert">' +
        (allocation.length - asignados.length) +
        " aptos quedan sin asignar por disponibilidad o capacidad. No se incorporarán.</div>"
      : "") +
    (noAptos.length
      ? '<p class="small muted">Los ' +
        noAptos.length +
        " no aptos no ingresan ni se derivan: no cumplen el score o la mora mínimos configurados arriba.</p>"
      : "") +
    (!esAdmin()
      ? '<div class="alert">La confirmación corresponde al administrador del canal. Cambia de perfil y vuelve a validar el lote.</div>'
      : "");

  derivadosRiesgos8 = enRevision;
  $("#commitIntake").disabled = !esAdmin() || (!asignados.length && !enRevision.length);
};

function resultadoLote8(s) {
  const mapa = {
    Apto: "cerrado",
    "En revisión": "curso",
    "No apto": "descartado",
    Duplicado: "descartado",
    Error: "descartado",
  };
  return '<span class="pill estado e-' + (mapa[s] || "frio") + '">' + esc(s) + "</span>";
}

/* Al confirmar, la derivación deja rastro: sin un aviso, "va a Riesgos" es
   una frase en una pantalla que nadie vuelve a abrir. */
const confirmIntakeBase8 = confirmIntake;
confirmIntake = function () {
  const derivados = derivadosRiesgos8.slice();
  confirmIntakeBase8();
  if (derivados.length && typeof notify === "function") {
    notify(
      executives.map((e) => e.id),
      "riesgos",
      derivados.length + (derivados.length === 1 ? " cliente derivado" : " clientes derivados") + " a Riesgos",
      derivados.map((r) => r.name + " (" + r.dni + "): " + motivoRevision8(r)).join(" · "),
      "ingresos",
    );
  }
};
