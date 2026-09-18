# Conecta · CRM Renta Alta

Prototipo interactivo, etapa 13. HTML, CSS y JavaScript sin dependencias ni compilación.

## Diseño
Sistema de diseño en `sistema.css`: escala de espaciado de 4px, cinco radios,
cuatro niveles de elevación y dos duraciones de movimiento. Tipografía IBM Plex
auto-alojada en `fonts/` (188KB, sin petición externa). Todo color de texto sale
de un token verificado contra su fondo. Un solo acento: el verde de marca.

Auditado con axe-core: 0 infracciones WCAG 2.1 AA en 20 rutas × 5 anchos,
0 desborde horizontal, 0 objetivos táctiles bajo 24px. Detalle en `QA.md`
y `SISTEMA.md`.

## Perfiles
Tres niveles de acceso: **administrador** (ingreso de clientes, track de
carterizados, panel del canal por célula), **supervisor** (movimientos de
cartera y paneles de su equipo) y **ejecutivo** (gestión de su cartera).
Detalle y matriz de permisos en `PERFILES.md`.

## Contenido
- index.html: entrada del sitio.
- style.css: diseño adaptable.
- app.js: datos ficticios e interacciones base.
- experience.js: bandeja de trabajo, continuidad, datos y administración de cartera.
- campaign-workspace.js: navegación y campañas por producto.
- attention-workspace.js: panel contextual y cierre de atención.
- reference-layout.js: ficha basada en el modelo de referencia y tipificación de servicio.
- campaign-scale.js: catálogo de 100 campañas, tabla y diálogo de tipificación.
- CAMBIOS.md: mejoras, validaciones y límites de esta versión.
- .nojekyll: sirve los archivos como sitio estático.

## Probar en tu computadora
Descomprime el ZIP y abre index.html en tu navegador.

## Subir a GitHub
1. Crea un repositorio en tu cuenta.
2. Usa la opción de subir archivos y agrega el contenido descomprimido, no el ZIP.
3. Deja index.html, style.css, app.js, experience.js, campaign-workspace.js, attention-workspace.js, reference-layout.js y campaign-scale.js en la raíz del repositorio, al mismo nivel que README.md.
4. Confirma los cambios.

## Publicar con GitHub Pages
En la configuración del repositorio, busca Pages y configura la publicación desde la rama que contiene los archivos, usando la carpeta raíz. Guarda y espera a que GitHub muestre el enlace del sitio. La disponibilidad depende de la cuenta y la visibilidad del repositorio. Documentación oficial: https://docs.github.com/en/pages

## Capacidades
- Perfiles de ejecutivo y supervisor.
- Aproximadamente 500 clientes ficticios por ejecutivo.
- Clientes, campañas de venta y servicios comerciales/administrativos.
- Búsqueda y filtros; tipificación y seguimiento.
- Calculadora de oportunidades dentro de la ficha.
- Paneles diarios y mensuales, metas y proyección.
- Reasignación de cartera y notificaciones internas.
- Ingreso individual y masivo con preevaluación y reparto equilibrado.

## Alcance de la demostración
Los cambios se mantienen únicamente durante la sesión y se reinician al recargar. No hay servidor, base de datos, autenticación real ni conexión bancaria. El selector de rol simula vistas; no es un control de acceso. Las notificaciones son internas a la demo, no correos ni avisos externos. Los scores, tasas, metas y reglas son ficticios; la calculadora no aprueba créditos. Los datos iniciales se generan al abrir el sitio.

## Portabilidad
Los recursos usan rutas relativas y funcionan en un repositorio de GitHub Pages. No se incluyen credenciales, historial Git ni configuración del alojamiento original. No necesitas instalar paquetes.

## Navegación actual
Cartera y Campañas se mantienen arriba. El buscador lateral solo aparece durante la atención y puede plegarse. Campañas sigue producto → clientes → oferta y gestión. Para iniciar por prioridades, usa Mi día > Ver campañas priorizadas.

## Probar el espacio de atención
1. Panel del ejecutivo > Iniciar atención > buscar y seleccionar un cliente.
2. La ficha mantiene cabecera, pestañas, accesos rápidos, productos por categoría y campañas.
3. En la barra superior de atención, el icono de documento y lápiz abre la tipificación de servicio. Tiene nombre accesible y descripción al pasar el cursor.
4. Guardar conserva la ficha. Guardar y finalizar atención vuelve al buscador.
5. Para una venta, usa Gestionar campaña en la oferta correspondiente: la tipificación de servicio no incrementa ventas.
6. Buscar o cambiar cliente abre y cierra el panel derecho.

La opción Mostrar al cliente fue retirada. No se incluyen capturas externas dentro de la web. Datos y productos son ficticios; si no hay información disponible, se indica sin inventar estados favorables.

## Campañas con volumen
- Campañas abre una tabla con asociaciones cliente–campaña y selector lateral Priorizadas / Otras.
- Busca una campaña por nombre, producto o código (ejemplo CAM-100). Mostrar más amplía cada grupo.
- Selecciona una campaña para ver sus clientes, o Todas las campañas para ver asociaciones de varios productos.
- Busca por cliente, DNI o producto en la tabla. Filtra Todos, Prioritarios, Contactados o Pendientes. Hay 20 filas por página y orden por cliente, DNI o monto.
- Tipificar abre Campaña → Estado → Motivo. Como la fila ya identifica la campaña, comienza en Estado; Cambiar campaña permite volver al primer paso.
- Motivo y acuerdos son obligatorios. Lo va a pensar exige fecha. Aceptar no crea una venta.
- El supervisor conserva información agregada y controles de priorización, sin tipificación operativa.

Catálogo de 100 campañas ficticias. Un cliente puede tener varias campañas: filas y clientes únicos se cuentan por separado. Las campañas finalizadas no permiten nuevas tipificaciones. TEM se calcula desde TEA; TCEA queda por consultar. La revisión visual en navegador sigue pendiente.

## Publicar en GitHub Pages
Este repositorio es el sitio: no hay compilación ni dependencias. `index.html`
debe quedar en la raíz.

1. Sube todo el contenido de esta carpeta a la raíz del repositorio.
2. Settings → Pages → Source: *Deploy from a branch* → rama `main`, carpeta `/ (root)`.
3. En un par de minutos queda en `https://<usuario>.github.io/<repositorio>/`.

El orden de los `<script>` en `index.html` es funcional: cada etapa sobrescribe
a la anterior, de `app.js` a `etapa13.js`. No renombres ni reordenes esos
archivos. La carpeta `fonts/` es necesaria: la tipografía está auto-alojada y
sin ella el diseño cambia.

Los datos son ficticios y viven en memoria: al recargar la página se reinician.
