# Tres niveles de acceso — Etapa 9 · 10

Antes había dos perfiles y uno de ellos hacía dos trabajos que no se parecen:
**dar de alta clientes en el canal** y **mover gente entre ejecutivos**. El
primero es administración —decide qué entra al canal y con qué reglas—; el
segundo es supervisión —decide quién atiende qué dentro de una célula—. Que
la misma persona pudiera hacer ambos no era un detalle de interfaz: era un
control interno que el prototipo no representaba.

## Quién hace qué

| | Administrador | Supervisor | Ejecutivo |
|---|---|---|---|
| Ingreso individual y carga masiva | **Sí** | No | No |
| Confirmar una distribución | **Sí** | No | No |
| Track de carterizados | **Sí** | No | No |
| Priorizar campañas del canal | **Sí** | No | No |
| Mover cartera (vacaciones, suspensión, baja) | No | **Sí** | No |
| Balancear y recaracterizar | No | **Sí** | No |
| Panel comercial de su equipo | Por célula | Por ejecutivo | Propio |
| Resolver derivaciones a Riesgos | **Sí** | No | No |
| Gestionar clientes y tipificar | No | No | **Sí** |

El administrador **no ve carteras individuales** y **no puede mover clientes**;
el supervisor **no puede dar de alta**. No es solo que el menú no lo ofrezca:
escribir la URL a mano tampoco funciona — `RUTAS_POR_PERFIL` en `app.js` es la
puerta, y el menú solo dice lo que se ofrece. Un prototipo que enseña permisos
que no existen enseña un modelo equivocado.

## Alcance de los datos

`scope()` es el único sitio donde se decide qué clientes ve cada quién:

- **Administrador** → el canal entero (3 células, 9 ejecutivos).
- **Supervisor** → solo su célula. El selector de la cabecera cambia de célula.
- **Ejecutivo** → solo su cartera.

El desplegable de destino al mover cartera solo ofrece ejecutivos de la propia
célula: la restricción se ve, no se explica.

## Panel del canal

El administrador no compara ejecutivos, compara **células**. La tabla es
deliberadamente la misma que la de equipo del supervisor —mismas columnas,
mismo orden por lo que falta— para que subir un nivel no obligue a reaprender
a leer. Cambia el sujeto de la fila, no la gramática.

Debajo, dos cortes que el supervisor no tiene: **aceptaciones por producto**
con la meta del canal según prioridad, y el **reparto de tipificaciones**.

## Track de carterizados

La trazabilidad completa de la ingesta, con las **dos revisiones** que el
negocio distingue y que la interfaz mezclaba:

- **Revisión del cliente** — ¿el dato entró bien? `Apto` · `En revisión`
  (derivado al analista de riesgos) · `No apto` · `Duplicado`.
- **Revisión de gestión** — ¿alguien lo trabajó? `Gestionado` · `Pendiente` ·
  `Vencida` (más de 10 días sin tipificar).

Son ejes independientes a propósito: un cliente puede estar **apto y vencido**
—entró bien y nadie lo llamó— y ese cruce es el que no se podía ver. Las cuatro
cifras de arriba no son adorno: cada una filtra la tabla que la produce.

Los derivados a Riesgos siguen en el track aunque no entren a ninguna cartera.
Ese era el punto ciego: salían de la pantalla de carga y no aparecían en
ninguna otra.

## Calibración de los datos de demostración

Medido antes de tocar nada: la meta es 17 aceptaciones por ejecutivo al mes
(la regla del negocio: 5 Alta + 5 Alta + 4 Media + 3 Baja) y la semilla
producía entre 25 y 49 por ejecutivo, **creciendo en línea recta con el id**.
Resultado: todos al 100%, `Falta ✓` en cada fila y una columna de avance que
no distinguía a nadie.

No se cambió la regla —la puso el negocio— sino el volumen sembrado. Ahora
van de 5 a 23 sobre una meta de 17: tres células por encima, seis ejecutivos
por debajo. *Un panel donde nadie va corto no enseña cómo se ve ir corto, que
es justo lo que un panel de metas tiene que enseñar.*

También se corrigió una mezcla de unidades: la columna **Sin contactar**
contaba tareas (12,532) junto a **Cartera**, que cuenta clientes (3,440). Dos
unidades distintas en columnas contiguas invitan a restarlas. Ahora ambas
cuentan clientes y la columna se llama **Sin gestión**.


## Cobertura por juniors (Etapa 10)

Cada célula tiene un **junior de cobertura** sin cartera propia: Sergio Bravo
(Lima Norte), Milena Ruiz (Lima Centro) y Joaquín Peña (Lima Sur).

Existen para recibir la cartera de un middle o senior que sale —vacaciones,
permiso, descanso médico, renuncia o cese— y sostenerla hasta que se
redistribuya o vuelva el titular.

- **No participan del reparto de lotes nuevos.** Si entraran, dejarían de estar
  libres justo cuando hacen falta.
- **Aparecen primero** en el destino del movimiento, en su propio grupo
  (*Cobertura disponible · sin cartera propia*) y preseleccionados. Antes,
  mover 480 clientes moría en "excede la capacidad configurada" porque el único
  destino ofrecido ya tenía 490 y el tope son 800.
- **Sin cartera no tienen meta.** Un junior libre sumaría 17 aceptaciones
  imposibles al objetivo de su célula. En la tabla de equipo se distinguen por
  estado (*Cobertura · libre*), no por una fila en rojo.

## La bandeja del analista de riesgos (Etapa 10)

Los clientes "en revisión" no entran a ninguna cartera y no están en la meta de
nadie: hasta que el analista responda, **no existen comercialmente**. Por eso
cada uno genera una derivación con analista, fecha de envío, plazo de 3 días y
estado.

Resolverla actualiza el track: aprobado pasa a apto, rechazado sale del canal,
y el ejecutivo recibe aviso. Es el pase que antes se anunciaba en una frase y
no llegaba a ningún sitio.
