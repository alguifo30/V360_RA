# Mejoras de interfaz y flujo

## Cambios
- Buscador de clientes separado del borde, con cabecera y búsqueda estables, lista desplazable y selección visible.
- Modales con jerarquía, márgenes y campos de dos columnas; una columna en móvil. Corregido el interruptor de movimiento de cartera.
- Tarjetas de campaña compactas: monto, tasa y plazo en una fila; sin texto repetido de condiciones.
- Tipificación: Acepta campaña y No contactado se guardan desde la selección. Rechaza campaña y Lo va a pensar requieren motivo; detalle opcional. Lo va a pensar conserva próximo contacto obligatorio.
- Resultados de servicio dentro de campañas se guardan directamente. Se conserva el formulario independiente de atención de servicios.
- Toda tipificación guardada aparece en Contactados y reduce Pendientes sin duplicados, conservando su resultado real.
- Conservadas las correcciones anteriores de modales y tabla de campañas.

## Validación
Pruebas en Chrome de guardado directo y con motivo, contadores, tarjetas compactas, campos sin superposición, modales cerradas, dimensiones móviles y 15 combinaciones de pantalla/perfil. Sin errores JavaScript en los recorridos probados.

## Uso
Extraer el ZIP y abrir index.html. Para actualizar el sitio, reemplazar el contenido completo, incluidos ui-refinement.js y ui-refinement.css. No se ha publicado en GitHub.
El prototipo conserva su almacenamiento original de sesión: los cambios se reinician al recargar.
