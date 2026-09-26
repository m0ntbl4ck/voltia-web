# Voltia web

Interfaz de Voltia, la plataforma que convierte lecturas de medidores en decisiones de mantenimiento. Es una aplicación de React con Vite que consume la API del repositorio `voltia`.

La dirección visual, con sus razones, está en [`DESIGN.md`](DESIGN.md).

## Estado

Las siete pantallas del acuerdo están hechas y conectadas a la API: login, dashboard (indicadores, lista de atención, consumo de la planta y mapa de calor por medidor y día), medidores, detalle con su banda esperada, anomalías, investigación con acciones y análisis con sus siete etapas.

Comprobado en Chrome con un recorrido automático (login, filtros, orden, acciones, tema, 375 y 768 px sin desborde) y con axe-core, que no reporta violaciones WCAG 2.2 AA en ninguna pantalla, en oscuro ni en claro. axe no analiza el contraste dentro de las gráficas de canvas.

Limitaciones conocidas:

- No hay historial de ejecuciones: la API solo entrega la última.
- La zona horaria de la planta (`America/Bogota`) está fija en `src/lib/plant.ts`, porque la API no la expone.
- Despliegue: el frontend no se dockeriza. Si se sirve aparte del backend, hace falta reescribir `/api` hacia el servidor o añadir CORS con credenciales (ADR 0010 del repo `voltia`).

## Ejecutar

Requisitos: Node 24 y el backend corriendo en `localhost:8080` (ver el README de `voltia`).

```sh
cp .env.example .env.local   # opcional, ver abajo
npm install
npm run dev                  # http://localhost:5173
```

Vite dirige `/api` al backend, así que el navegador ve un solo origen y la cookie de sesión funciona sin CORS. Para apuntar a otro servidor: `API_URL=http://otro:8080 npm run dev`.

Si `VITE_DEMO_EMAIL` y `VITE_DEMO_PASSWORD` coinciden con la cuenta demo del backend, el formulario de entrada sale relleno y aparece "Entrar como demo". Sin ellas, el botón no se muestra.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Comprueba tipos y compila a `dist/` |
| `npm run lint` | oxlint |

## Estructura

```
src/lib/          cliente de la API, tipos, formato es-CO, tema y sesión
src/components/   armazón, panel del análisis, tablas, gráficas, chips y logo
src/pages/        una por pantalla
src/styles/       tokens de color y tipografía (de DESIGN.md) y estilos
```
