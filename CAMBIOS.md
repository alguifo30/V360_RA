# CRM Renta Alta — Etapa 10 · 11 · 12 · 13 · 13.1

## El bug que explicaba las tres primeras capturas

`repro.mjs` lo reproduce en seis líneas: el diálogo "Validación previa y
propuesta de reparto" **sobrevivía a cada cambio de ruta**. Abierto desde el
ingreso, seguía encima del inicio del supervisor, del track y de la ficha del
cliente. No eran tres modales mal puestos: era **el mismo modal, huérfano**.

Causa raíz, un nivel más abajo:

```js
window.addEventListener("hashchange", route);   // ← captura la referencia
```

El listener se quedaba con la función `route` que existía al registrarse. Toda
capa posterior que envolviera `route()` quedaba muerta al navegar por hash —
incluida una de la Etapa 9 que llevaba tiempo sin ejecutarse y nadie había
notado. Ahora resuelve en el momento de la llamada:

```js
window.addEventListener("hashchange", () => route());
```

## La carga masiva es una sección, no una pila de diálogos

Quedaba un tercer modal: **"Resultado del ingreso"**. El flujo completo eran
tres diálogos encadenados —elegir archivo → validar y repartir → ver el
resultado— para una tarea que además hay que poder retomar, auditar y
enseñarle a otro.

Un diálogo sirve para una decisión corta que **interrumpe** lo que estabas
haciendo. Cargar 100 clientes no interrumpe nada: *es* lo que estabas
haciendo.

**Carga masiva** pasa a ser su propia sección del menú, con tres pasos dentro
de la página:

| Paso | Qué tiene |
|---|---|
| **1 · Archivo** | selector de archivo, campaña del lote, plantilla de 12 filas y lote de prueba de 100, con el historial de lotes de la sesión debajo |
| **2 · Validación y reparto** | reglas editables, cuatro contadores, derivación a Riesgos, distribución propuesta y resultado por cliente |
| **3 · Resultado y gestión** | lo que antes era el modal, **más la cola de Riesgos que abrió ese lote**, resoluble ahí mismo |

La barra de pasos deja volver a uno ya hecho. Antes, "volver" significaba
cerrar el diálogo y empezar de cero.

**Regla que queda escrita: en esta sección no se abre ningún diálogo**, y hay
una prueba que lo comprueba en los tres pasos.

La decisión vive en una **barra fija al pie** con el resumen en vivo (*57 entran
a cartera · 15 a Riesgos · 28 no ingresan*). La página mide más de dos
pantallas: con el botón solo en la cabecera, confirmar significaba decidir
antes de haber leído.

## La derivación a Riesgos, como gestión

"Van a Riesgos" era una frase en una pantalla que nadie volvía a abrir. Un pase
sin responsable, sin fecha y sin retorno no es un pase: es una pérdida.

Cada cliente en revisión genera una derivación con **analista asignado, fecha
de envío, plazo de 3 días y estado**. La bandeja vive en el ingreso, con filtros
*Pendientes / Vencidas / Todas*. Aprobar o rechazar **actualiza el track**: el
aprobado pasa a apto, el rechazado sale del canal, y el ejecutivo recibe aviso.

## Lote de prueba de 100 clientes

Junto a la plantilla, en el diálogo de carga. Mezcla deliberada y verificada:

| Resultado | Filas |
|---|---|
| Apto | 62 |
| En revisión | 15 |
| No apto | 13 |
| Duplicado | 6 |
| Error de formato | 4 |

Intercalados, no en bloques: un archivo con los 62 aptos primero y los errores
al final no se parece a uno real.

## Cobertura por juniors sin cartera

En la captura 4, mover una cartera de 480 clientes moría en un error rojo sin
salida: el destino ya tenía 490 y el tope son 800.

Tres **juniors de cobertura** —uno por célula— con cartera cero:

- No participan del reparto de lotes nuevos. Si entraran, dejarían de estar
  libres justo cuando hacen falta.
- Aparecen **primero** en el destino del movimiento, en su propio grupo, y van
  preseleccionados.
- Sin cartera no tienen meta: un junior libre sumaría 17 aceptaciones
  imposibles al objetivo de su célula.

Motivos de movimiento ampliados a **Vacaciones, Permiso, Descanso médico,
Reemplazo, Renuncia y Cese**; los cuatro primeros llevan fecha de retorno.

## Verificación

85 combinaciones ruta × ancho con axe-core, incluida la pantalla de validación
con 100 clientes cargados y la bandeja de riesgos. 0 infracciones, 0 desborde,
0 objetivos bajo 24px, 0 errores de consola. 17 pruebas funcionales nuevas y
27 heredadas, todas en verde. Detalle en `QA.md`.


---

# Etapa 12

## El stepper: un fallo de marcado, no de gusto

El paso activo emitía el círculo y su etiqueta como **hermanos sueltos dentro
del `<li>`**, sin envoltura:

```html
<li class="paso11 paso11-actual"><span class="paso11-n">1</span>Archivo</li>
```

Así, la regla del contenedor (`.paso11 > span`) caía sobre el propio círculo:
26px de ancho en vez de 22, con el relleno del contenedor encima y la etiqueta
pegada sin separación. Los pasos ya hechos **sí** tenían envoltura, porque eran
`<button>` — por eso solo fallaban unos y otros no.

Ahora la envoltura va siempre, sea botón o span. De paso: un paso completado
muestra un check en lugar del número (el número ya no informa de nada), y cada
paso lleva texto oculto *"Paso 2 de 3, en curso"* para quien no ve el círculo
verde. Verificado con una medición: **0 solapamientos, los tres círculos de
26px, las tres cajas de la misma altura**.

## Una sola pestaña de ingreso

"Ingreso de clientes" y "Carga masiva" eran dos secciones del menú para lo
mismo. Ahora es una, con un control segmentado **Individual / Masiva**.

El formulario individual también salió de su diálogo: los dos modos se ven
igual de "sección". `#carga` sigue siendo una URL válida y abre el modo masiva,
para no romper un enlace que ya existía.

El segmentado está construido como lo define `SISTEMA.md` —pista hundida,
píldora elevada—, no como dos cajas blancas iguales: con dos cajas idénticas lo
único que distinguía la activa era el color del subtítulo, y **el color nunca
debe ser la única señal**.

## El lote no es una campaña

Obligar a elegir una campaña para todo el archivo daba por cierto algo que no
lo es: un lote trae clientes, y a cada uno se le puede ofrecer algo distinto.

- El archivo admite una columna **`campana` opcional al final**, una por
  cliente.
- La del formulario pasa a ser **"Campaña por defecto"**, solo para las filas
  que no traen la suya.
- El paso 2 gana el bloque **"Campañas que se van a ofrecer"**: una fila por
  campaña, con producto, prioridad, número de clientes y de dónde sale cada uno
  (*del archivo* / *por defecto* / *no reconocida*).
- Si el archivo trae una campaña que no existe en el catálogo, lo avisa en vez
  de aceptarla en silencio.
- Cada cliente entra a cartera con **su** campaña y la prioridad que le
  corresponde, no con la del lote.

El lote de prueba de 100 clientes trae campañas variadas por fila, con una de
cada seis sin campaña: sin esa mezcla, la columna nueva no se podría probar con
el archivo que se ofrece para probar.


---

# Etapa 13

## Los diálogos "sueltos": el fondo se iba, no el diálogo

Medido: con un diálogo abierto, la rueda del ratón desplazaba **la página de
detrás** — `scrollY 7 → 807`. El diálogo se quedaba quieto y el contenido de
debajo se iba, así que acababa flotando sobre una zona vacía con el pie de
página arriba del todo. Eso es exactamente lo que se ve en las capturas.

Un diálogo modal tiene que atrapar el desplazamiento. Ahora, mientras hay uno
abierto, lo único que se desplaza es él; al cerrarlo la página vuelve a su
posición exacta. Cubre también el cierre con `Esc` y con el fondo, que no pasan
por el botón de cerrar — sin eso la página se habría quedado bloqueada.

Segundo hallazgo en la misma medición: al asistente de tipificación le sobraban
**107px** a 640px de alto, y la cuarta respuesta quedaba cortada sin ninguna
señal. Recuperados repartidos entre las cuatro opciones, el stepper, la
cabecera y los márgenes. **Sobra ahora: 0px.** Las opciones quedan en 44px de
alto, por encima del mínimo táctil de 24px.

## Paginación de 15 en todas las tablas

En vez de parchear una a una las siete tablas que se pasaban —y de que la
próxima naciera sin paginar— el paginado se aplica sobre el DOM después de cada
render: si una tabla supera 15 filas y no trae ya su propio paginador, se le
pone uno. Las tablas agrupadas (un `<tbody>` por cliente) paginan por cliente,
que es la unidad correcta ahí.

También bajaron a 15 las dos que paginaban con otro número: la cartera (25) y
la tabla de campañas (20).

Un bug encontrado al probarlo: el paginador genérico se saltaba su propia
tabla, porque el guardia de "ya tiene paginador" encontraba el suyo del render
anterior. Pulsar *Siguiente* no cambiaba nada. Ahora se retira antes de
recalcular.

## Un cliente puede entrar sin campaña

Carterizar y ofrecer no son el mismo momento. El selector ofrece **"Sin
campaña · se asigna después"**, y esos clientes:

- entran a cartera y al track como cualquier otro, marcados *pendiente de
  asignar*;
- **no abren una oportunidad de venta**, así que no inflan la meta de nadie;
- aparecen en una tabla propia del panel, *Clientes sin campaña*, con un botón
  para asignársela — sin esa lista, "se asigna después" se convierte en "no se
  asigna nunca";
- al asignarla, la oportunidad se abre y empieza a contar.

## Gestionar abre la ficha del cliente

Desde la cartera, *Gestionar* llevaba directamente al diálogo de tipificación:
obligaba a responder por el cliente antes de haberlo visto. Ahora abre su vista
360 —saldos, campañas abiertas, historial— y tipificar es una acción de ahí
dentro.

## El panel del ejecutivo es su panel

El inicio repetía dos secciones que ya existen: la bandeja de trabajo (que es
la cartera filtrada) y un acceso a campañas (que es una pestaña). Lo que no
estaba en ninguna parte visible era **cómo va él**.

Ahora el inicio **es** su panel de ventas y gestiones, y *Panel de ventas* deja
de ser una entrada aparte del menú: `Mi panel · Mis clientes · Campañas`. La
URL `#ventas` sigue funcionando y lleva allí.

Un matiz que conviene revisar: quitar la bandeja se llevaba por delante un dato
que no está en ninguna otra pantalla — **qué tiene comprometido para hoy**. La
bandeja no vuelve, pero el dato sí, en una línea sobre el panel que lleva a la
cartera ya filtrada por esa fecha, avisando de que está filtrada y cómo salir.


---

# Etapa 13.1 — dos correcciones

## Al abrir el archivo salía la versión anterior

Medido: `app.js` hace su primer `route()` al cargarse, y las capas de las
etapas 8 a 13 se cargan **después**. La primera pantalla era la de `app.js` —
menú viejo, *Mi día*, bandeja de trabajo — y el menú **no se corregía nunca por
sí solo**: a los 1.500 ms seguía siendo el anterior. Solo cambiaba al pulsar
algo, que es lo que pasó entre tus capturas 1 y 2.

Ahora la última capa, al terminar de cargar, repinta la aplicación una vez con
todo ya definido. Verificado sin hash, con `#inicio` y con `#cartera`: a los
250 ms ya sale el menú correcto.

## Las modales pegadas: el evento `close` llegaba tarde

Varios flujos saltan de paso con `closeModal(); modal(...)` en la misma
instrucción. El evento `close` de un `<dialog>` es **asíncrono**: llega
*después* de que el segundo diálogo ya esté abierto. Mi bloqueo de fondo
escuchaba ese evento para desbloquear, así que:

1. se cierra el primero → desbloquea,
2. se abre el segundo → bloquea,
3. **llega el `close` atrasado → desbloquea con el segundo diálogo delante.**

A partir de ahí el fondo volvía a desplazarse: al girar la rueda la página se
iba, quedaba el pie de página arriba y el diálogo flotando sobre el vacío. Eso
son las "modales pegadas abajo" de las capturas 3 y 4.

La corrección no es añadir otra llamada simétrica, sino **derivar** el estado:
el bloqueo se calcula de si hay un diálogo abierto, no se lleva a mano. Un
evento fuera de orden ya no puede mentir.

## Prueba nueva: `dialogos.mjs`

Recorre **los ocho diálogos** del prototipo de principio a fin y comprueba en
cada uno, a 1366×640 y con la página ya desplazada:

- que se abra como modal de verdad (`:modal`), no en el flujo de la página;
- que quede centrado (desviación máxima de 2px) y no se salga por abajo;
- que la rueda sobre el velo **no** mueva el fondo;
- que al terminar el flujo **no quede nada abierto ni la página bloqueada**;
- y el caso que lo originó: cerrar y reabrir en el mismo gesto.

Dos de los ocho fallaron al principio por culpa de la prueba, no del producto:
un selector equivocado y un formulario con campo obligatorio sin rellenar —
que el diálogo siguiera abierto ahí era lo correcto.
