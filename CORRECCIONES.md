# Correcciones de campañas

- Modales cerradas ocultas y modales abiertas centradas en la ventana. Se cierran al cambiar de pantalla.
- Pestañas completas, sin degradado; disposición adaptable al ancho disponible.
- Una fila por asociación cliente–campaña, con cliente, DNI, campaña, monto, tasa y Tipificar. Sin columna Respuesta.
- Toda tipificación guardada pasa a Contactados y deja de contar en Pendientes y Prioritarios. El resultado original se conserva, incluido No contactado. Volver a tipificar no duplica el contador.

Verificado en Chrome: guardado desde formulario, conteos, tabla, cierre con Escape, cambio de ruta y tamaño móvil. Sin errores JavaScript en los recorridos probados.

Uso: extraer el ZIP y abrir index.html, o reemplazar los archivos del sitio con el contenido del ZIP. No se ha publicado en GitHub.

Se mantiene el comportamiento original del prototipo: los cambios de datos duran la sesión y se reinician al recargar.
