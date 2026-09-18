# QA de diseño — CRM Renta Alta · Etapa 13.1

Auditoría con evidencia medida sobre los tres perfiles. Fecha: 2026-09-18.

## Qué medí

- **Herramientas:** axe-core 4.x sobre Playwright (Chromium 1194), servido por HTTP.
- **Anchos:** 390, 720, 834, 1050 y 1440 px.
- **Rutas:** 20 vistas en los tres perfiles → **100 combinaciones**.
  Incluye la pantalla de validación con 100 clientes cargados y la bandeja
  del analista de riesgos: un paso que no se audita es un paso que nadie mira.
- **Reglas:** WCAG 2.0 A/AA y WCAG 2.1 A/AA.
- **Además:** desborde horizontal, objetivos táctiles bajo 24px, anillo de
  foco, recorrido de teclado, errores de consola y 25 pruebas funcionales.

## Resultado

| Medida | Resultado |
|---|---|
| Infracciones WCAG 2.1 AA | **0** en 100 combinaciones |
| Desborde horizontal | **0 px** |
| Objetivos táctiles bajo 24px | **0** |
| Elementos sin anillo de foco | **0** |
| Errores de consola / JS | **0** |
| Recorrido completo de diálogos (`dialogos.mjs`) | **8 de 8** |
| Pruebas funcionales de diálogos, paginación y panel (Etapa 13) | **17 de 17** |
| Pruebas funcionales del stepper, modo y campaña (Etapa 12) | **14 de 14** |
| Pruebas funcionales de la carga masiva (Etapa 11) | **11 de 11** |
| Pruebas funcionales del flujo de ingreso (Etapa 10) | **17 de 17** |
| Pruebas funcionales de permisos (Etapa 9) | **15 de 15** |
| Pruebas funcionales heredadas (Etapa 8) | **10 de 10** |

Comandos:

```bash
node audit-rutas.mjs . ./qa 390,720,834,1050,1440   # accesibilidad y medidas
node repro.mjs                                      # el bug del diálogo huérfano
node dialogos.mjs                                   # los 8 diálogos, de principio a fin
node humo13.mjs                                     # diálogos, paginación, panel
node humo12.mjs                                     # stepper, modo de ingreso, campañas
node humo11.mjs                                     # carga masiva sin diálogos
node humo10.mjs                                     # ingreso, riesgos y cobertura
node humo9.mjs                                      # separación de perfiles
node humo.mjs                                       # no regresión Etapa 8
node teclado9.mjs                                   # distancia de teclado
node medir9.mjs                                     # calibración de datos
```

## El bug que ninguna auditoría iba a encontrar

Las 75 combinaciones de la Etapa 9 salieron en verde con un diálogo que
**sobrevivía a cada cambio de ruta**. axe audita el DOM que encuentra; no
navega. El fallo solo aparece cuando alguien abre el modal y después pulsa otra
sección — que es exactamente lo que pasó en uso real.

Causa raíz: `window.addEventListener("hashchange", route)` captura la
referencia a `route` en el momento de registrarse. Cualquier capa posterior que
envolviera `route()` quedaba muerta al navegar por hash. Había una de la Etapa 9
que llevaba tiempo sin ejecutarse y nadie lo había notado. Corregido a
`() => route()`, y con `repro.mjs` como prueba de regresión.

**La lección para el resto del prototipo:** una prueba que solo mira una
pantalla no ve los errores de transición entre pantallas. Las pruebas nuevas
navegan.

## Lo que la auditoría automática NO encontró

Las 75 combinaciones salieron en verde **y la pantalla estaba mal**. Vale la
pena dejarlo escrito, porque es el límite real de este tipo de auditoría: axe
mide contraste, roles y foco; no mide si un número tiene sentido.

Encontrado mirando la captura, no el informe:

1. **`333 de 153 aceptaciones`** — el total superaba la meta en un 218%. La
   semilla generaba entre 25 y 49 aceptaciones por ejecutivo contra una meta
   de 17, y además **crecía en línea recta con el id del ejecutivo**. Todas
   las filas marcaban `Falta ✓` y 100%: la columna de avance no distinguía a
   nadie. Corregido calibrando el volumen sembrado, sin tocar la regla de
   negocio. Ahora: 125 de 153, con seis ejecutivos por debajo de su meta.

2. **Mezcla de unidades** — `Sin contactar` contaba **tareas** (12,532) en la
   columna de al lado de `Cartera`, que cuenta **clientes** (3,440). Dos
   unidades distintas en columnas contiguas invitan a restarlas. Ambas cuentan
   clientes ahora, y la columna se llama `Sin gestión`.

3. **Dos lotes vacíos** — el filtro por lote ofrecía `LOTE-2026-0909` y
   `LOTE-2026-0915`, que no devolvían nada, y el estado `Pendiente` no existía:
   los tres estados de gestión colapsaban en dos. Corregido el reparto de la
   ingesta. Ahora: 999 gestionados, 650 pendientes, 1,791 vencidas.

4. **Selector de célula visible para el administrador** — prometía un filtro
   que no existe: el administrador ve las tres células a la vez.

5. **21px de desborde a 390px** en las tablas del reparto, que fuera del
   diálogo ya no heredaban sus reglas: los bloques quedaban como texto suelto
   sobre el lienzo y la tabla de cinco columnas no cabía. Ahora son tarjetas y
   se apilan, igual que el resto.

6. **El anillo de foco sobre el título del paso.** El encabezado recibe el foco
   al entrar para que un lector de pantalla anuncie el cambio, pero no es un
   control: el anillo dice "aquí actúas", y ahí no se actúa.

7. **El botón de confirmar fuera de la ventana** — medido: `top: -22px` en una
   pantalla de 768. `scrollIntoView` dejaba el título pegado al borde y las
   acciones justo por encima. Además de corregir el desplazamiento, la decisión
   se movió a una barra fija al pie: la página mide 2.147px y confirmar desde
   arriba es decidir antes de leer.

8. **Región desplazable sin acceso de teclado** (`scrollable-region-focusable`,
   impacto serio). La tabla de resultado por cliente se desplaza en horizontal,
   y fuera del diálogo quedó sin `tabindex`: con ratón se alcanzaba, con
   teclado no. Es el único hallazgo que axe sí encontró en esta etapa, y solo
   porque la pantalla nueva entró al auditor. Una pantalla que no se audita es
   una pantalla que nadie mira.

9. **En móvil, el número de lote partido en dos líneas** y el DNI alineado a
   la derecha bajo el nombre. Las celdas con valor + subtítulo no caben en el
   formato etiqueta-izquierda / valor-derecha; se apilan, y las cortas
   (píldoras, días) se quedan en línea, que es donde ese formato sí funciona.

## Lo que arreglé mal la primera vez

La Etapa 13 bloqueó el fondo con dos llamadas simétricas —bloquear al abrir,
desbloquear al cerrar— y eso **introdujo** el fallo que el usuario siguió
viendo. Varios flujos hacen `closeModal(); modal(...)` para saltar de paso, y
el evento `close` de un `<dialog>` es asíncrono: llega después de que el
segundo ya esté abierto y desbloquea la página con un diálogo delante.

| Momento | `html.overflow` | Debía ser |
|---|---|---|
| Primer diálogo abierto | `hidden` | `hidden` |
| Justo tras el salto de paso | **vacío** | `hidden` |
| 900 ms después | **vacío** | `hidden` |

La lección, y queda escrita en el código: **derivar el estado de la realidad en
vez de llevarlo a mano**. El bloqueo se calcula ahora de si hay un diálogo
abierto; un evento fuera de orden ya no puede mentir.

La otra lección es de método: la prueba de la Etapa 13 medía **un** diálogo
abierto una vez. El fallo solo aparece al encadenar dos. `dialogos.mjs` recorre
los ocho de principio a fin, con la página desplazada, y comprueba también qué
queda al terminar el flujo.

## Diálogos: medido antes de rediseñar

El síntoma era "las modales se ven sueltas en la parte de abajo". La medición
dio otra cosa:

| Medida (1366×640) | Antes | Después |
|---|---|---|
| Desplazamiento del fondo con un diálogo abierto | **scrollY 7 → 807** | **0** (bloqueado) |
| Contenido cortado dentro del diálogo | **107px** sin señal | **0px** |
| Alto de cada opción de respuesta | 66px | 44px (mínimo táctil: 24px) |
| La página tras cerrar con `Esc` | quedaba bloqueada | vuelve a su posición |

El diálogo siempre estuvo centrado y con su velo. Lo que fallaba era que **la
página de detrás se desplazaba**: al girar la rueda para ver el resto del
asistente, se iba el fondo en vez del contenido, y el diálogo acababa flotando
sobre una zona vacía. Ninguna auditoría de accesibilidad mira eso.

## El stepper: medido antes de rediseñar

El círculo del paso activo se solapaba con su etiqueta y el de los pasos ya
hechos no. No era una cuestión de gusto: medido, el activo emitía el círculo y
el texto como hermanos sueltos dentro del `<li>`, sin envoltura, así que la
regla del contenedor caía sobre el círculo — **26px en vez de 22, con el
relleno del contenedor encima**. Los alcanzables eran `<button>` y sí tenían
envoltura.

La prueba de regresión mide tres cosas que una captura no garantiza:

| Medida | Antes | Después |
|---|---|---|
| Solapamiento círculo ↔ etiqueta | hasta **+8px** en el paso activo | **0** en los tres |
| Ancho del círculo | 26px activo / 22px el resto | **26px** en los tres |
| Alto de la caja del paso | tres valores distintos | **uno** |

## Bug encontrado al probar el paginador genérico

El paginador nuevo se saltaba su propia tabla: el guardia de "esta tabla ya
tiene paginador" encontraba el que él mismo había puesto en el render anterior,
así que pulsar *Siguiente* no cambiaba nada. La prueba lo detectó porque
compara la primera fila visible antes y después, no solo que el botón exista.

Segundo, en la misma tanda: la tira de "comprometido para hoy" salía siempre en
cero porque filtraba por *sin contactar*, y un compromiso para hoy es por
definición un seguimiento de alguien **ya** contactado.

## Hallazgos de esta etapa que la auditoría no marca

- **La misma campaña repetida en tres filas seguidas**, porque el resumen
  agrupaba por campaña × procedencia. Ninguna regla de accesibilidad lo
  detecta, y obligaba a sumar a ojo. Ahora es una fila por campaña con el
  desglose dentro.
- **El segmentado Individual / Masiva sin pista**: dos cajas blancas iguales
  donde lo único que distinguía la activa era el color del subtítulo. El color
  no puede ser la única señal (WCAG 1.4.1); ahora la seleccionada se distingue
  por altura —superficie y sombra— además de por peso y tono.
- **Un contenedor con scroll que nunca desplaza.** La tabla de campañas heredó
  `table-wrap`, cuyo `overflow: auto` añade una parada de tabulador que no
  lleva a ningún sitio. Nota de CSS que costó una medición: `overflow-x: auto`
  con `overflow-y: visible` **no** deja el eje vertical libre — `visible` se
  convierte en `auto` si el otro eje no lo es. La solución no era ajustar el
  contenedor: era no tenerlo.

## Distancia de teclado

| Desde | Hasta | Tabulaciones |
|---|---|---|
| Panel del canal | Ver track de carterizados | 10 |
| Track | Indicador "En revisión de Riesgos" | 12 |
| Track | Buscador | 15 |
| Equipo (supervisor) | Organizar cobertura | 11 |

Los cuatro indicadores del track son `<button>`, no tarjetas con `onclick`: se
activan con Enter y tienen anillo de foco de 2px. Verificado, no supuesto.

## Separación de perfiles, verificada

- El administrador **no** alcanza `#cartera` ni `#cliente` escribiendo la URL.
- El administrador **no** puede abrir el movimiento de cartera.
- El supervisor **no** puede confirmar una carga masiva (`clients.length` no
  cambia al llamar a `confirmIntake()`).
- El supervisor ve **3** ejecutivos, los de su célula, y al mover cartera el
  desplegable no ofrece a nadie de otra.
- El ejecutivo **no** alcanza `#trazabilidad` ni `#ingresos` por URL.

## El primer render pintaba la versión anterior

`app.js` hace su primer `route()` al cargarse; las capas de las etapas 8 a 13
se cargan después. Medido: a los 150 ms **y a los 1.500 ms**, el menú seguía
siendo el de `app.js`. No era un retraso: no se corregía nunca hasta que algo
provocaba otro render.

Ninguna auditoría lo detectaba porque todas esperan a que la página se asiente
antes de medir. Quien abre el archivo, no.

## Lo que sigue abierto

- **Sin probar con ejecutivos reales ni con lector de pantalla.** Sigue siendo
  el hueco más grande, y ninguna auditoría automática lo tapa.
- La sesión vive en memoria: recargar pierde los cambios de la sesión.
- El track deriva la revisión de gestión de un límite fijo de 10 días. Ese
  número lo tiene que poner el negocio, no el prototipo.
- El indicador de gestión vencida marca 1,791 de 3,440 (52%). Si el dato real
  se parece, el hallazgo es del canal, no de la pantalla.
