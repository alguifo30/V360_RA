/* Refinamiento visual y tipificación con pasos condicionales. */
const modalUIBase = modal;
modal = function(title, body) {
  $('#dialog').classList.remove('tipify-dialog9');
  modalUIBase(title, body);
};

campaignOffers8 = function(c) {
  return '<h3 class="category-label">Campañas asociadas</h3><div class="compact-offers">' +
    ensureTasks(c).filter(t => t.kind === 'Venta').map(t => {
      const o = offer6(t);
      return `<section class="compact-offer"><div class="offer-heading"><h2>${esc(t.name)}</h2>${badge(t.sold ? 'Venta confirmada' : t.status, t.sold ? '' : 'blue')}</div>
        <dl class="offer-facts"><div><dt>Monto</dt><dd>${o.amount != null ? money(o.amount) : 'Por evaluar'}</dd></div><div><dt>${esc(o.label || 'Tasa')}</dt><dd>${o.rate != null ? Number(o.rate).toFixed(2) + '%' : 'Por consultar'}</dd></div><div><dt>Plazo</dt><dd>${esc(o.term || 'Por definir')}</dd></div></dl>
        <div class="actions"><button class="primary" onclick="startTipify9(${c.id},'${t.id}')">Tipificar</button><button onclick="goCampaign6(ensureTasks(clients.find(c=>c.id===${c.id})).find(t=>t.id==='${t.id}').name,${c.id})">Detalles</button></div></section>`;
    }).join('') + '</div>';
};

function needsReasonUI(result) {
  return ['Lo va a pensar', 'Rechaza campaña'].includes(result);
}
function selectResultUI(result) {
  wizard9.result = result;
  if (needsReasonUI(result)) { wizard9.step = 3; drawWizard9(); }
  else saveResultUI({channel: wizard9.channel || 'Llamada', reason: '', text: '', next: ''});
}
function saveResultUI(data) {
  try {
    commitTipify9(data);
    closeModal();
    render();
    toast('Tipificación guardada. Disponible en Contactados.');
  } catch (error) {
    $('#wizardError9').textContent = error.message;
  }
}
drawWizard9 = function() {
  const w = wizard9, c = scope().find(c => c.id === w?.id);
  const t = c && ensureTasks(c).find(t => t.id === w.tid);
  if (!t) return;
  closeBase7();
  const states = t.kind === 'Venta' ? ['Acepta campaña', 'Rechaza campaña', 'Lo va a pensar', 'No contactado'] : ['Resuelto', 'En proceso', 'No contactado / servicio'];
  const context = `<div class="tipify-context"><span>${esc(c.name)} · DNI ${esc(c.dni)}</span><h3>${esc(t.name)}</h3></div>`;
  let content;
  if (w.step === 1) {
    content = `<label class="ui-field">Campaña<select id="wizardTask9">${ensureTasks(c).filter(t=>campaignRegistry.some(m=>m.name===t.name && m.active)).map(x=>`<option value="${x.id}" ${x.id===t.id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label><div class="modal-actions"><button onclick="wizard9.tid=$('#wizardTask9').value;wizard9.step=2;drawWizard9()" class="primary">Continuar</button></div>`;
  } else if (w.step === 3 && needsReasonUI(w.result)) {
    const reasons = w.result === 'Rechaza campaña' ? ['No necesita el producto', 'Condiciones no convenientes', 'Tiene otra alternativa', 'Otro'] : ['Necesita más información', 'Comparará alternativas', 'Consultará con su familia', 'Otro'];
    content = `<div class="tipify-step"><button class="textbtn" onclick="wizard9.step=2;drawWizard9()">← Cambiar respuesta</button>${badge(w.result)}</div><form id="wizardForm9"><div class="formgrid"><label class="full">Motivo<select name="reason" required><option value="">Selecciona un motivo</option>${opts(reasons,w.reason)}</select></label><label class="full">Detalle y acuerdos <span class="muted">Opcional</span><textarea name="text" placeholder="Agrega información útil para el seguimiento">${esc(w.text || '')}</textarea></label>${w.result === 'Lo va a pensar' ? `<label class="full">Próximo contacto<input name="next" type="date" min="${todayKey}" value="${esc(w.next || '')}" required></label>` : ''}</div><p id="wizardError9" role="alert"></p><div class="modal-actions"><button type="button" onclick="closeModal()">Cancelar</button><button class="primary" type="submit">Guardar tipificación</button></div></form>`;
  } else {
    content = '<p class="tipify-prompt">¿Cuál fue la respuesta del cliente?</p><div class="states9">' + states.map((state,i)=>`<button class="state-pick9" onclick="selectResultUI('${state}')"><span class="state-icon9" aria-hidden="true">${['✓','×','◷','☎'][i]}</span><span class="state-copy"><b>${state}</b><small>${needsReasonUI(state) ? 'Agregar motivo' : 'Guardar tipificación'}</small></span><span aria-hidden="true">${needsReasonUI(state) ? '→' : '✓'}</span></button>`).join('') + '</div><p id="wizardError9" role="alert"></p><div class="tipify-footer"><button class="textbtn" onclick="wizard9.step=1;drawWizard9()">Cambiar campaña</button><button onclick="closeModal()">Cancelar</button></div>';
  }
  modal('Tipificar campaña', context + content);
  $('#dialog').classList.add('tipify-dialog9');
  if ($('#wizardForm9')) {
    $('#wizardForm9').oninput = e => Object.assign(w,Object.fromEntries(new FormData(e.currentTarget)));
    $('#wizardForm9').onsubmit = e => { e.preventDefault(); saveResultUI({...Object.fromEntries(new FormData(e.target)),channel:w.channel || 'Llamada'}); };
  }
};
route();
