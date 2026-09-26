# DESIGN.md · Voltia

> **Estado: aprobado por el dueño del proyecto (2026-09-26).**
> Lo redactó Claude con `ui-ux-pro-max` y las skills de antislop, y el dueño delegó en Claude las decisiones abiertas de la sección 12. Cada decisión lleva su razón en una línea (R-31). Si una razón deja de convencer, se cambia la decisión, no la razón.

## 1. Lectura de diseño

> Reading this as: **panel de operación** para **técnicos de mantenimiento y evaluadores técnicos**, en lenguaje visual de **instrumento industrial sobrio**, dial **ENERGY 2 / RHYTHM 2 / MOTION 2**.

| Dial | Valor | Razón |
|---|---|---|
| ENERGY | 2 | Es una herramienta que se mira durante horas y una demo de 5 a 10 minutos. Debe tener carácter propio sin gritar: el único énfasis fuerte es el acento y la severidad. |
| RHYTHM | 2 | El armazón (sidebar, topbar) es constante porque un operador necesita orientación fija. Cada pantalla rompe ese patrón en su punto focal: Dashboard con la lista de atención, Investigación con la gráfica y la narrativa. |
| MOTION | 2 | Solo movimiento que informa un cambio de estado. Lista cerrada en la sección 9. Nada corre en bucle. |

## 2. Identidad

**Personalidad:** un tablero de sala de control que dice qué mirar primero y por qué. Voz de ingeniero de mantenimiento: cifras concretas, frases cortas, sin adornos.

**Idea que organiza todo el diseño: la banda esperada.** El motor compara cada lectura contra una banda (mediana y MAD por hora y día). Toda la interfaz habla de "dentro o fuera de la banda". Ese es el motivo de identidad, y es un dato, no decoración:

- Gráfica de detalle: banda sombreada con la línea de consumo encima; la zona fuera de banda toma el color de la severidad.
- Sparkline de la tabla de medidores: la misma banda, en miniatura, detrás de la línea.
- Desglose de confianza y prioridad: barras horizontales con marca de umbral, que se leen igual que la banda.

Razón: si se cambia el nombre y el logo, la banda esperada sigue diciendo que esto es Voltia y no un panel genérico (R-20).

## 3. Tema

**Oscuro por defecto, con modo claro funcional.** Razón: el producto imita un centro de control que se mira en salas de operación y turnos largos, y el color de severidad se lee mejor sobre fondo oscuro sin deslumbrar (R-21). El modo claro existe para la sala con luz de día y para proyectar. Ambos se verifican por separado (R-34). El usuario elige con un conmutador en la topbar y se guarda su elección; sin elección, se respeta `prefers-color-scheme`.

## 4. Color

Regla de paleta (R-29): 2 neutros de base, 1 acento, y un sistema semántico cerrado de 5 estados. Los colores semánticos no se usan para decorar.

### Tokens

| Token | Oscuro | Claro | Uso |
|---|---|---|---|
| `--bg` | `#121418` | `#F3F2EE` | Fondo de página |
| `--surface` | `#1A1D23` | `#FFFFFF` | Paneles y tarjetas |
| `--raised` | `#22262E` | `#F8F7F4` | Menús, drawer, filas al pasar el cursor |
| `--border` | `#2C313B` | `#D8D5CC` | Separadores de paneles (decorativo) |
| `--border-control` | `#6F7787` | `#7A7F8A` | Borde de inputs y botones secundarios (3:1) |
| `--text` | `#E9EBEF` | `#191C22` | Texto principal |
| `--text-muted` | `#A3AAB8` | `#575D6A` | Etiquetas y texto de apoyo |
| `--accent` | `#FFB81C` | `#FFB81C` | Relleno del botón primario |
| `--on-accent` | `#14161A` | `#14161A` | Texto sobre el acento |
| `--accent-focus` | `#FFB81C` | `#8A5200` | Anillo de foco, enlace y elemento seleccionado |
| `--critical` | `#FF7A7A` | `#B42323` | Severidad crítica |
| `--alert` | `#FF9A3C` | `#964500` | Severidad alta o de alerta |
| `--ok` | `#3DD68C` | `#0B6E3D` | Medidor en estado OK |
| `--data-quality` | `#B49CFF` | `#5B3FC4` | Problema de calidad de datos |
| `--false-positive` | `#98A0AE` | `#5A6270` | Falso positivo |

Fondo de chip semántico: el color del estado al 12% sobre `--surface`.

### Contraste verificado (fórmula WCAG 2.x)

| Par | Oscuro | Claro |
|---|---|---|
| `--text` sobre `--surface` | 14,14 | 17,07 |
| `--text-muted` sobre `--surface` | 7,23 | 6,61 |
| `--text-muted` sobre `--raised` | 6,50 | 6,17 |
| `--on-accent` sobre `--accent` | 10,46 | 10,46 |
| `--accent-focus` sobre `--surface` | 9,75 | 6,39 |
| `--border-control` sobre `--surface` | 3,75 | 4,02 |
| Crítico sobre su chip | 5,57 | 5,38 |
| Alerta sobre su chip | 6,46 | 5,56 |
| OK sobre su chip | 7,12 | 5,32 |
| Calidad de datos sobre su chip | 5,96 | 5,90 |
| Falso positivo sobre su chip | 5,25 | 5,20 |

Peor caso de un chip sobre `--raised`: 4,68 (oscuro, falso positivo) y 4,99 (claro, OK). Todo cumple AA de 4,5:1. Al ajustar cualquier valor se vuelve a calcular con `antislop-human/contrast-check.py`.

### Razones

- **Acento ámbar `#FFB81C`:** color de la electricidad y de las señales de precaución industrial, y no el azul-violeta por defecto de la IA (R-01). Se usa solo en el botón primario, el anillo de foco y el elemento seleccionado (un acento deliberado).
- **Grafito neutro `#121418` y no el azul pizarra de Tailwind:** el fondo no debe competir con el ámbar ni parecer plantilla.
- **En modo claro el ámbar no sirve como texto ni foco** (1,9:1 sobre blanco), por eso existe `--accent-focus` como versión oscura.
- **Cinco colores semánticos** porque el dominio tiene cinco resultados distintos (Crítico, Alerta, OK, Calidad de datos, Falso positivo) y el operador debe distinguirlos a golpe de vista.

### El color nunca va solo

Cada estado combina color, **forma** y **texto** (WCAG 1.4.1):

| Estado | Forma | Texto del chip |
|---|---|---|
| Crítico | Cuadrado relleno | Crítica |
| Alerta | Triángulo | Alta |
| OK | Círculo | OK |
| Calidad de datos | Hexágono | Calidad de datos |
| Falso positivo | Círculo con raya | Falso positivo |

Ámbar de acento y naranja de alerta están cerca en tono. Se distinguen por rol: el acento es un relleno sólido solo en un botón o foco; la alerta es siempre un chip con tinte, forma y texto. No se usa relleno ámbar sólido en ninguna otra parte.

## 5. Tipografía

| Rol | Fuente | Razón |
|---|---|---|
| Interfaz y titulares | **IBM Plex Sans** (400, 500, 600) | Herencia de instrumentación técnica, legible en tamaños pequeños, cifras tabulares reales y tildes y eñes completas para es-CO. No es la fuente por defecto de la IA (R-06). |
| Identificadores y marcas de tiempo | **IBM Plex Mono** (400, 500) | Solo para `MTR-001`, IDs y horas, donde la columna debe alinear. Nunca en titulares. |

Se sirven desde el paquete `@fontsource` empaquetado en el build, sin CDN externo: la demo debe funcionar con `docker compose up` sin red.

| Uso | Tamaño / interlínea | Peso |
|---|---|---|
| Cifra grande (KPI) | 28 / 32 | 600, `tabular-nums` |
| Título de pantalla | 20 / 28 | 600 |
| Título de panel | 16 / 24 | 600 |
| Texto | 14 / 20 | 400 |
| Etiqueta y apoyo | 12 / 16 | 500 |

Sin mayúsculas con tracking ancho: las etiquetas van en minúscula de oración. Mínimo de 12 px, y solo para etiquetas; el texto corrido va en 14 px o más. Razón del 14 y no 16: es una interfaz densa de operación, y la lectura de tablas manda sobre la del párrafo.

Formato es-CO con `Intl.NumberFormat("es-CO")`: `2.180 kWh`, `+103,7 %`. Cifras siempre con `font-variant-numeric: tabular-nums`.

## 6. Espacio, forma y profundidad

- **Densidad alta (8/10):** escala en base 4: `4 · 8 · 12 · 16 · 24 · 32`. Panel con relleno de 16, filas de tabla de 40 px, objetivo táctil mínimo de 44 px en móvil (R-03).
- **Radio en tres niveles:** `2 px` chips, `4 px` controles, `8 px` paneles y drawer. Sin píldoras. Razón: el radio pequeño da aspecto de instrumento y la jerarquía se lee por nivel (R-11).
- **Sombra:** solo drawer y menús flotantes, para marcar que están sobre la página. Los paneles van planos con borde (R-12).
- **Sin** vidrio esmerilado, sin brillo, sin cuadrícula de fondo, sin degradados de fondo (R-07, R-10, R-13). La única textura es la banda esperada, que es dato.

## 7. Estructura y pantallas

Armazón: sidebar fijo (Dashboard, Medidores, Anomalías IA, Análisis, API docs) y topbar con búsqueda y el botón primario **Ejecutar análisis**, siempre visible. Solo existen enlaces a pantallas que existen (R-24).

| Pantalla | Punto focal | Cómo rompe el ritmo |
|---|---|---|
| Login | El botón "Entrar como demo" | Pantalla centrada, sin sidebar |
| Dashboard | Lista "Requiere atención" (top 3) | Lista ancha a la izquierda, 6 KPIs compactos en una banda, heatmap al final |
| Medidores | La tabla | Tabla a ancho completo con sparkline de banda |
| Detalle | La gráfica con banda | Gráfica a ancho completo, pestañas V/I/FP debajo |
| Anomalías IA | La primera fila por prioridad | Tabla ordenada por prioridad, sin decorar |
| Investigación | Narrativa y gráfica del episodio | Dos columnas: narrativa y acción a un lado, evidencia al otro |
| Análisis | El stepper de 7 etapas | Stepper vertical y resumen final |

Los 6 KPIs no son 6 tarjetas iguales: el KPI de anomalías pendientes es el mayor, los demás forman una banda de cifras con etiqueta. Razón: solo una cifra sostiene la decisión del operador (R-14, C-3).

### Estados (R-27)

Cada vista con datos define vacío, carga y error, con causa y siguiente acción:

- **Dashboard sin análisis:** "Aún no hay análisis. Ejecuta uno para ver qué medidores se salen de su banda." con el botón primario. Es el "antes" de la demo.
- **Carga:** texto de lo que carga ("Cargando medidores…") con esqueleto solo de la forma final de la tabla.
- **Error:** qué falló y qué hacer ("No se pudo leer el análisis. Reintenta o revisa que el servidor esté arriba.") con botón Reintentar.
- **Filtro sin resultados:** dice cuál filtro lo causó y ofrece limpiarlo.

Ningún dato inventado: sin nombres, sin cifras ni tendencias sin serie real detrás (R-17, R-38). Los porcentajes de variación aparecen solo con el período comparado nombrado.

## 8. Componentes

- **Botón primario:** relleno `--accent`, texto `--on-accent`. Uno por pantalla. Secundario: borde `--border-control`, sin relleno.
- **Chip de severidad:** forma + color + texto (sección 4), radio 2, sin punto pulsante ni brillo (R-09).
- **Tabla:** encabezado en `--text-muted` 12 px, fila de 40 px, columna decisiva primero (prioridad), fila enfocable con teclado, orden anunciado con `aria-sort`.
- **Gráfica (ECharts):** línea de consumo en `--text`, banda en `--text-muted` al 15%, zona anómala con el color de severidad al 20%, marcadores de evento con forma distinta al color. Cada gráfica lleva como título la pregunta que responde ("Consumo horario frente a su banda, 14 días"). Segmentos con 3:1 entre vecinos (R-25).
- **Drawer del análisis:** entra desde la derecha, se cierra con Escape, devuelve el foco al botón que lo abrió.
- **Foco:** anillo de 2 px en `--accent-focus` con separación de 2 px, en todo elemento interactivo y en ambos temas. Nunca `outline: none` sin reemplazo (R-32).
- **Iconos:** sin librería. Texto para navegación y acciones, y las cinco formas de severidad para el estado (sección 12).

## 9. Movimiento (MOTION 2)

Lista cerrada de lo que se anima, todo entre 120 y 200 ms con `ease-out`:

1. Hover y foco de controles y filas.
2. Entrada y salida del drawer del análisis (salida más rápida que entrada).
3. Avance del stepper: cada etapa cambia de estado al terminar, con un cambio de forma y texto, no solo de color.
4. Cambio de tema.

Sin bucles, sin pulsos, sin entradas escalonadas al hacer scroll, sin animación de las gráficas. `prefers-reduced-motion: reduce` desactiva 2 y 3 y deja el estado final al instante. Razón: el operador mira cifras, y el movimiento solo debe avisarle de que algo cambió.

## 10. Voz y texto

- Idioma: español de Colombia. Sin vosotros.
- Frases de ingeniero de mantenimiento: cifra, medidor y hora. Ejemplo: "MTR-004 consumió 2.180 kWh entre las 02:00 y las 05:00, 103,7 % sobre su banda."
- Botones con el verbo de la acción: "Ejecutar análisis", "Crear orden de inspección", "Descartar como falso positivo", "Entrar como demo". Nunca "Empezar", "Explorar" ni "Descubrir".
- Sin guion largo, sin emoji, sin vocabulario vacío de IA (R-02, R-16). La palabra "IA" solo aparece donde nombra algo real: la sección "Anomalías IA" y la insignia de fuente de la explicación (Gemini o plantilla), que es un estado real.

## 11. Accesibilidad y responsive

- Todo el flujo de la demo se recorre con teclado, en orden visual, con el foco siempre visible.
- Objetivo táctil de 44 px en móvil; sin scroll horizontal en 375, 768, 1024 y 1440 px.
- Tablas anchas en móvil: se apilan como filas de tarjeta o scrollean dentro de su contenedor, sin romper la página.
- Texto redimensionable hasta 200 % sin recortes.
- Cada gráfica tiene una descripción textual y una tabla equivalente accesible.

## 12. Activos y decisiones

El dueño delegó estas decisiones en Claude el 2026-09-26 (R-23). Quedan resueltas así:

1. **Logo y wordmark:** wordmark "Voltia" en IBM Plex Sans 600 más un isotipo geométrico propio: una banda horizontal con un punto que sale de ella, el mismo motivo de la sección 2. Se dibuja como SVG de una sola forma, sin degradado. Razón: reutiliza la idea que organiza todo el diseño y no depende de un icono genérico.
2. **Iconos:** sin librería de iconos. La navegación y las acciones van con texto, y el estado se marca con las cinco formas de severidad de la sección 4. Si una acción necesita un símbolo, se dibuja a mano como SVG con el trazo del isotipo. Razón: evita el aspecto de trazo fino redondeado que delata una librería por defecto (R-04) y no hay un icono que aporte más que la palabra.
3. **Botón primario:** "Ejecutar análisis". Razón: la interfaz va en español y "AI" en el botón no informa nada.
4. **Acento y alerta cercanos en tono:** se mantienen ámbar `#FFB81C` y naranja de alerta, separados por rol y por forma (sección 4). Si en pantalla se confunden, la alternativa es mover la alerta a un tono más rojizo. Razón: el ámbar viene acordado en la arquitectura y la forma más el texto ya evitan depender del tono.
5. **Modo por defecto:** oscuro, con la razón de la sección 3.

## 13. Referencias descartadas

La búsqueda de `ui-ux-pro-max` para "energy management analytics dashboard" devolvió Minimalism and Swiss Style, Fira Code y Fira Sans, y un verde de acento sobre pizarra. Se adopta la densidad alta, el movimiento sutil y el tema oscuro con claro. Se descartan el verde de acento (choca con el estado OK y con el ámbar acordado en la arquitectura) y Fira Code (fuente por defecto de la IA, sin razón de marca, R-06).
