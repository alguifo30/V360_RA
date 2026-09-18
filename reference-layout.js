/* Ajuste de la ficha al modelo de referencia. */
function serviceButton8(c) {
  return (
    '<button class="service-icon8" title="Registrar tipificación de servicio" aria-label="Registrar tipificación de servicio" onclick="openService8(' +
    c.id +
    ')"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M13 3H5v18h14v-9M8 8h4M8 12h3M8 16h2M14 15l-1 4 4-1 6-6-3-3z"/></svg></button>'
  );
}
clientView = function () {
  const c = scope().find((c) => c.id === selected);
  if (!c) return head("Selecciona un cliente", "Abre el buscador para comenzar una atención.");
  const coverage = history.find((h) => h.end && !h.restored && h.items.some((x) => x.id === c.id));
  return (
    '<section class="customer-banner reference-banner8"><div class="profile"><span class="avatar">' +
    initials(c.name) +
    "</span><div><h1>" +
    esc(c.name) +
    "</h1><p>DNI " +
    c.dni +
    " · " +
    badge(c.segment || "Select") +
    '</p><p class="sub">' +
    esc(c.phone) +
    " · " +
    esc(c.email) +
    '</p></div></div><div class="reference-profile8"><span class="small muted">Código Único ' +
    esc(c.uniqueCode || "Pendiente") +
    "</span><button onclick=\"setTab('Datos personales')\">Ver perfil completo del cliente</button></div></section>" +
    (coverage
      ? '<div class="coverage-note">Cobertura de ' +
        esc(executives[coverage.source].name) +
        " · Retorno " +
        esc(coverage.end) +
        "</div>"
      : "") +
    '<div class="tabs customer-tabs">' +
    [
      ["Resumen", "⌂"],
      ["Datos personales", "Datos personales"],
      ["Productos bancarios", "Productos del cliente"],
      ["Cliente digital", "Cliente digital"],
      ["Gestiones y casos", "Gestión de la atención"],
      ["Beneficios", "Beneficios"],
      ["Campañas", "Gestión de campañas"],
      ["Información financiera", "Información financiera"],
      ["Oportunidades", "Oportunidades"],
    ]
      .map(
        ([id, label]) =>
          '<button title="' +
          id +
          '" aria-label="' +
          id +
          '" class="' +
          (tab === id ? "active" : "") +
          '" onclick="setTab(\'' +
          id +
          "')\">" +
          label +
          "</button>",
      )
      .join("") +
    "</div>" +
    (tab === "Resumen" ? customerSummary(c) : clientTab(c))
  );
};
const tabBase8 = clientTab;
clientTab = function (c) {
  if (tab === "Cliente digital")
    return '<section class="card"><h2>Cliente digital</h2><p>Estado de afiliación, clave web y clave SMS: pendiente de consulta.</p><p class="sub">No hay una fuente de canales digitales conectada en esta demostración.</p></section>';
  if (tab === "Beneficios")
    return '<section class="card"><h2>Beneficios</h2><p>No hay beneficios confirmados en los datos de esta demostración.</p><p class="sub">La disponibilidad de beneficios debe consultarse en la fuente correspondiente.</p></section>';
  return tabBase8(c);
};
function campaignOffers8(c) {
  return (
    '<h3 class="category-label">CAMPAÑAS ASOCIADAS</h3><div class="campaigns">' +
    ensureTasks(c)
      .filter((t) => t.kind === "Venta")
      .map(
        (t) =>
          '<section class="card"><h2>' +
          esc(t.name) +
          "</h2>" +
          offerDetail6(t) +
          badge(t.sold ? "Venta confirmada" : t.status, t.sold ? "" : "blue") +
          '<div class="actions" style="margin-top:16px"><button class="primary" onclick="goCampaign6(\'' +
          esc(t.name) +
          "'," +
          c.id +
          ')">Gestionar campaña</button><button onclick="goCampaign6(\'' +
          esc(t.name) +
          "'," +
          c.id +
          ')">Detalles</button></div></section>',
      )
      .join("") +
    "</div>"
  );
}
customerSummary = function (c) {
  const available = c.dataState === "Disponible" && c.score === undefined;
  return (
    '<div class="reference-shortcuts8">' +
    [
      ["Datos personales", "Contacto y perfil", "Datos personales"],
      ["Beneficios", "Pendiente de consulta", "Beneficios"],
      ["Pedidos y reclamos", c.cases.length + " casos registrados", "Gestiones y casos"],
      ["Cliente digital", "Afiliación por consultar", "Cliente digital"],
    ]
      .map(
        ([title, desc, target]) =>
          '<button class="summary-tile" onclick="setTab(\'' +
          target +
          "')\"><div><b>" +
          title +
          '</b><span aria-hidden="true">' +
          (target === "Datos personales" ? "✓" : "→") +
          "</span></div><p>" +
          esc(desc) +
          "</p><small>Ver detalle</small></button>",
      )
      .join("") +
    '</div><section class="reference-products8"><div class="section-label"><h2>Productos del cliente</h2>' +
    badge("Datos ficticios", "gray") +
    "</div>" +
    dataNotice(c) +
    (available
      ? '<div class="account-strip"><span class="product-icon">▤</span><b>Tarjeta de débito Visa · **** 2982</b>' +
        badge("Activa") +
        '</div><h3 class="category-label">CUENTAS E INVERSIONES</h3><div class="product-grid">' +
        productCard(
          "Cuenta de ahorros",
          money(c.balance * 0.4),
          "Cuenta · **** 4821",
          "Disponible",
        ) +
        productCard("Depósito a plazo", money(c.balance * 0.6), "Cuenta · **** 3012", "Vigente") +
        '</div><h3 class="category-label">TARJETAS</h3><div class="product-grid">' +
        productCard("Tarjeta de crédito", money(c.debt), "Saldo utilizado · **** 7814", "Activa") +
        '</div><h3 class="category-label">PRÉSTAMOS Y CRÉDITOS</h3><section class="card"><p>No hay préstamos contratados confirmados en este conjunto de datos.</p><p class="sub">Las propuestas de préstamo e hipotecario se muestran debajo como campañas.</p></section>'
      : '<section class="card"><h2>Información de productos pendiente</h2><p>No se muestran saldos ni productos que no estén disponibles en la fuente.</p></section>') +
    campaignOffers8(c) +
    "</section>"
  );
};
function openService8(id) {
  if (role !== "exec") return;
  const c = scope().find((c) => c.id === id);
  if (!c) return;
  beginAttention(c);
  modal(
    "Tipificación de servicio",
    '<p class="sub">' +
      esc(c.name) +
      " · DNI " +
      c.dni +
      '</p><form id="serviceForm8"><div class="formgrid"><label>Tipo de servicio<select name="kind"><option>Servicio administrativo</option><option>Servicio comercial</option></select></label><label>Motivo<select name="reason"><option>Consulta de productos</option><option>Actualización de datos</option><option>Seguimiento de solicitud</option><option>Consulta de beneficios</option><option>Asistencia digital</option><option>Otro servicio</option></select></label><label>Canal<select name="channel">' +
      opts(["Llamada", "WhatsApp", "Correo", "Presencial"], "") +
      '</select></label><label>Resultado<select name="result"><option>Resuelto</option><option>En proceso</option><option>No contactado / servicio</option></select></label><label class="full">Detalle y acuerdos<textarea name="text" required></textarea></label><label>Próximo contacto<input name="next" type="date" min="' +
      todayKey +
      '"></label></div><p class="sub">Este registro corresponde al servicio brindado. No tipifica una campaña de venta ni registra una venta.</p><p id="serviceError8" class="form-error" role="alert"></p><div class="modal-actions"><button type="button" onclick="closeModal()">Cancelar</button><button type="submit" name="action" value="save">Guardar</button><button class="primary" type="submit" name="action" value="finish">Guardar y finalizar atención</button></div></form>',
  );
  $("#serviceForm8").onsubmit = (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    try {
      saveService8(c, d);
      closeModal();
      if (e.submitter?.value === "finish") completeAttention();
      else render();
      toast("Tipificación de servicio guardada.");
    } catch (err) {
      $("#serviceError8").textContent = err.message;
    }
  };
}
function saveService8(c, d) {
  if (role !== "exec" || c.owner !== activeExecutive)
    throw Error("El cliente no pertenece a tu cartera.");
  if (
    !["Servicio administrativo", "Servicio comercial"].includes(d.kind) ||
    !["Resuelto", "En proceso", "No contactado / servicio"].includes(d.result) ||
    !d.text?.trim()
  )
    throw Error("Completa los datos del servicio.");
  if (d.result === "En proceso" && !d.next)
    throw Error("Programa el próximo contacto para continuar el servicio.");
  if (d.next && d.next < todayKey) throw Error("El próximo contacto no puede estar en el pasado.");
  const t = {
    id: "service-" + c.id + "-" + Date.now() + "-" + workEvents.length,
    name: d.reason,
    kind: d.kind,
    priority: "Media",
    status: d.result,
    next: d.next || "",
    sold: false,
  };
  ensureTasks(c).push(t);
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
    result: d.result,
    channel: d.channel,
    text: d.reason + ": " + d.text,
    next: d.next || "",
    time: new Date().toLocaleString("es-PE"),
  });
  return t;
}
