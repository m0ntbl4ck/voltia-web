# VoltIA web

Interfaz de VoltIA, la plataforma que convierte lecturas de medidores en decisiones de mantenimiento. Es una aplicación de React con Vite que consume la API del repositorio `voltia`.

La dirección visual, con sus razones, está en [`DESIGN.md`](DESIGN.md).

## Estado

Las siete pantallas del acuerdo están hechas y conectadas a la API: login, dashboard (indicadores, lista de atención, consumo de la planta y mapa de calor por medidor y día), medidores, detalle con su banda esperada, anomalías, investigación con acciones y análisis con sus siete etapas.

Comprobado en Chrome con un recorrido automático (login, filtros, orden, acciones, tema, 375 y 768 px sin desborde) y con axe-core, que no reporta violaciones WCAG 2.2 AA en ninguna pantalla, en oscuro ni en claro. axe no analiza el contraste dentro de las gráficas de canvas. También se recorrió el flujo de la demo solo con teclado (login, análisis, filtros, detalle, acción con confirmación), se comprobó el hover de botones, filtros, filas y enlaces, y el mensaje de error de cada pantalla con el servidor apagado y su recuperación al reiniciarlo.

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

## Despliegue en AWS Amplify

El repositorio trae `amplify.yml` con la compilación (`npm ci` y `npm run build`, salida en `dist`). Amplify solo necesita esto, en la consola de la aplicación:

1. Variables de entorno de compilación: `VITE_DEMO_EMAIL` y `VITE_DEMO_PASSWORD`, con la cuenta pública de `.env.example`.
2. Reescrituras y redirecciones, en este orden (la de `/api` va primero porque la segunda coge todo lo que no lleva punto):

```json
[
  { "source": "/api/<*>", "target": "https://HOST_DE_LA_API/api/<*>", "status": "200", "condition": null },
  { "source": "</^[^.]+$|\\.(?!(css|gif|ico|jpg|jpeg|js|png|txt|svg|woff|woff2|ttf|map|json|webp|xml)$)([^.]+$)/>", "target": "/index.html", "status": "200", "condition": null }
]
```

`HOST_DE_LA_API` es el nombre HTTPS de la instancia del backend (ver `deploy/aws` en el repositorio `voltia`). Amplify solo admite HTTPS en las reescrituras a otro dominio. Después de desplegar, entra como demo y comprueba que la sesión se conserva al recargar: eso confirma que la cookie atraviesa la reescritura.

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
