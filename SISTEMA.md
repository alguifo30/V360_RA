# Sistema de diseño — Conecta · Renta Alta

Los tokens viven en `sistema.css`. Este documento dice qué significan y cuándo
usarlos. Si algo no está aquí, no forma parte del sistema.

---

## Auditoría de partida

| Categoría | Antes | Después |
|---|---|---|
| Valores de espaciado distintos | **40** | 14 |
| — fuera de cualquier rejilla | **28** | 2 (dentro de `clamp()`, fluidos a propósito) |
| Radios de borde distintos | **18** | 5 + `0` + `50%` |
| Sombras distintas | **17** | 4 niveles + 3 filetes de acento |
| Tamaños de texto distintos | **26** | 7 |
| Colores de texto sueltos | 190 | tokens |

Ese desorden es la razón real de que una interfaz "no se sienta bien". No es el
color ni la sombra: es que dos cosas separadas por "lo mismo" lo estén por 13px
en un sitio y 14px en otro. A ojo no se distingue la diferencia; el desorden sí
se nota.

El ajuste lo hizo `ajustar-ritmo.py`, que es idempotente y se puede volver a
correr tras cualquier cambio.

---

## Tokens

### Espaciado — rejilla de 4px

```
--e-1: 4px    --e-5: 20px    --e-10: 40px
--e-2: 8px    --e-6: 24px    --e-12: 48px
--e-3: 12px   --e-7: 28px    --e-16: 64px
--e-4: 16px   --e-8: 32px
```

Un solo múltiplo de base. Si algo "necesita" 13px, necesita 12 o 16.

**Excepción declarada.** Una medida que forma parte de un dibujo —no de la
maqueta— se marca con `/* fuera-de-escala */` y el script la respeta. Las tres
barras de 3px del medidor de prioridad, separadas por 2px, son un gráfico: en
la rejilla de 4px dejan de ser un medidor. *Un sistema sin excepciones
declaradas acaba teniendo excepciones silenciosas.*

### Radio

| Token | Valor | Para |
|---|---|---|
| `--r-xs` | 4px | píldoras de estado, chips diminutos |
| `--r-sm` | 8px | controles: botones, campos, segmentos |
| `--r-md` | 12px | tarjetas internas, pistas de control |
| `--r-lg` | 16px | tarjetas principales, paneles, diálogo |
| `--r-full` | 999px | botones de icono, indicadores redondos |

### Superficies — tono, no borde

```
--sup-fondo    #f1f4f4   el lienzo
--sup-tarjeta  #ffffff   lo que descansa sobre el lienzo
--sup-hundida  #e8edec   pistas de control
--sup-suave    #f7f9f9   cabeceras de tabla, cabecera de panel
--borde-sutil  #e4e9e9   separar, no encuadrar
--borde-fuerte #cfd8d8   bordes de control
```

Un borde por cada caja produce una reja. Separar por tono deja respirar y hace
que la jerarquía la lleve la luz.

### Elevación — cuatro niveles

| Token | Para |
|---|---|
| `--nivel-1` | tarjeta en reposo |
| `--nivel-2` | segmento seleccionado, tarjeta al pasar el cursor |
| `--nivel-3` | menús flotantes |
| `--nivel-4` | diálogo modal |

Sombras muy contenidas: su trabajo es decir "esto está por encima de aquello",
no dibujar una nube.

### Movimiento

```
--mov-rapido 130ms   --mov-medio 220ms
--curva cubic-bezier(0.32, 0.72, 0, 1)
```

Salida decidida y frenada larga: el movimiento se siente físico en vez de
mecánico. Dos duraciones, no doce. `prefers-reduced-motion` las anula todas.

### Color y tipografía

Definidos en `design.css`. Todo color de texto sale de un token verificado
contra su fondo; la escala tipográfica es `--t-xs` … `--t-2xl` sobre IBM Plex
(Condensed para titulares, Sans para interfaz, Mono para toda cifra).

---

## Componente: Control segmentado

### Descripción

Reparte una lista en pilas excluyentes. Se usa cuando alguien tiene que
**elegir sobre qué subconjunto trabajar**, no cuando navega entre secciones.

### Cuándo NO usarlo

| Situación | Control correcto |
|---|---|
| Cambiar de sección dentro de un registro | Pestaña subrayada |
| Filtros combinables entre sí | Selectores en el bloque de filtros |
| Una sola acción | Botón |

### El diagnóstico que lo motivó

La versión anterior eran cinco cajas sueltas encima de la tarjeta. Medido:

| Medida | Antes | Después |
|---|---|---|
| Ancho ocupado de la fila (1440px) | 602 de 1388 — **786px vacíos** | pista compacta de 689px |
| Variación de ancho entre cajas | ±26px, ragged | segmentos dentro de una pista única |
| Tamaño cifra : etiqueta | **26px : 12.5px** (2.1× a favor de la cifra) | **12.5px : 14px** (la etiqueta manda) |
| Relación con el panel que filtra | 20px por encima, despegado | **dentro** del panel (−82px) |
| Filas en móvil | 3 | 1, con desplazamiento y degradado |

### Los principios, donde se pueden señalar

- **Mapeo (Norman)** — el control vive *dentro* de la tarjeta que filtra. La
  relación entre mando y efecto es física; no hay que deducirla.
- **Significantes** — una pista hundida con una píldora elevada encima dice
  "elige una de estas" sin que nadie tenga que rotularlo.
- **Restricciones** — la forma impide leerlo como cinco botones sueltos: es
  visiblemente un grupo de elección única.
- **Retroalimentación** — el conteo de resultados está al lado del control y
  cambia al pulsar. La consecuencia se ve donde se produjo la causa.
- **Jerarquía** — se elige por *nombre* y se compara por *cantidad*: la
  etiqueta manda y la cifra acompaña. Estaba al revés.

### Estados

| Estado | Visual | Comportamiento |
|---|---|---|
| Reposo | transparente sobre la pista, texto `--muted` | — |
| Hover | superficie blanca al 60%, texto `--ink` | — |
| Seleccionado | píldora blanca + `--nivel-2`, etiqueta 600, cifra verde | filtra la lista |
| Foco | anillo `#1f6fa8` a 2px, offset 2px | — |

El seleccionado se distingue por **altura** (superficie y sombra) además de
por peso y tono: sigue leyéndose en escala de grises y en alto contraste.

### Accesibilidad

- **Rol:** `role="tablist"` con `role="tab"` y `aria-selected` en cada segmento.
- **Teclado:** una sola parada de tabulador para el grupo (tabindex móvil).
  `←` `→` mueven, `Inicio` / `Fin` van a los extremos.
- **Lector de pantalla:** se anuncia como lista de pestañas con la
  seleccionada; la etiqueta se lee antes que la cifra.

### Uso

```html
<div class="vistas" role="tablist" aria-label="Estado de la cartera">
  <button role="tab" class="active" tabindex="0" aria-selected="true">
    <span>En cartera</span><b class="num">500</b>
  </button>
  …
</div>
```

El orden en el marcado es `span` (etiqueta) y luego `b` (cifra); el CSS los
ordena visualmente. Así el lector de pantalla y la vista coinciden.

---

## Componente: Pestaña subrayada

Navega entre secciones de un mismo registro (ficha de cliente, tipos de
campaña). No filtra: cambia de panel.

| Estado | Visual |
|---|---|
| Reposo | texto `--muted`, subrayado transparente |
| Hover | texto `--ink`, subrayado `--borde-fuerte` |
| Activa | texto `--green-text` 600, subrayado `--green` 2px |

---

## Reglas de convivencia

1. **Un componente se define en un sitio.** Las vistas de cartera estaban
   definidas en `design.css` y en `sistema.css` a la vez; ganaba quien tuviera
   más especificidad, no quien tuviera razón. Ahora solo las define
   `sistema.css`.
2. **El orden de las hojas es la jerarquía:** `style.css` (estructura heredada)
   → `design.css` (tipografía y color) → `sistema.css` (sistema y componentes).
3. **Tras cualquier cambio de CSS, correr el ajuste y la auditoría:**

```bash
python3 ajustar-ritmo.py style.css design.css sistema.css
node audit-rutas.mjs . ./qa 390,720,834,1050,1440
```
