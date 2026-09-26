# Voltia web

Interfaz de Voltia, la plataforma que convierte lecturas de medidores en decisiones de mantenimiento. Es una aplicación de React con Vite que consume la API del repositorio `voltia`.

La dirección visual, con sus razones, está en [`DESIGN.md`](DESIGN.md).

## Estado

Hecho: login, armazón (sidebar, topbar, modo claro y oscuro), panel lateral del análisis con sus siete etapas y el dashboard con los seis indicadores. Faltan Medidores, Detalle, Anomalías IA, Investigación y el resto del dashboard.

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
src/components/   armazón, panel del análisis, logo
src/pages/        Login y Dashboard
src/styles/       tokens de color y tipografía (de DESIGN.md) y estilos
```
