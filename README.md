# JTWebCrawler

JTWebCrawler es una aplicación web moderna y de alto rendimiento impulsada por Node.js y Express que permite rastrear sitios web de forma configurable. Genera estadísticas en tiempo real y construye un inventario detallado de URLs visitadas.

A través de su interfaz visual vibrante basada en **Glassmorphism**, el crawler permite supervisar el progreso de la exploración, interceptar errores HTTP y detener operaciones instantáneamente.

## Características

- **Interfaz de Usuario Premium:** Panel de control ligero y responsivo con tema oscuro y animaciones dinámicas.
- **Rastreo en Tiempo Real:** Monitorización en vivo del progreso mediante Server-Sent Events (SSE) que actualiza los contadores de éxitos y errores orgánicamente sin saturar la red.
- **Cancelación Absoluta:** Botón de "Stop Crawler" acoplado a un `AbortController` en el servidor, permitiendo cortar los escaneos instantáneamente a nivel de hilo red.
- **Resiliencia Frontend:** Recuperación automática de escaneos activos en la Interfaz (gracias al `localStorage`) si se recarga la pestaña por error.
- **Resultados Detallados:** Exporta el inventario de rastreo a formato CSV, capturando código de estado HTTP y la latencia exacta.

## Estructura del proyecto

- `src/server.js`: API y servidor HTTP web en Express.js.
- `src/crawler.js`: Motor de rastreo lógico, concurrencia y gestión asíncrona.
- `src/config.json`: Archivo para valores predeterminados de la app.
- `public/`: Diseño UI (HTML, CSS vainilla, y App JS de conexión SSE).

## Instalación

```sh
npm install
```

## Configuración y Variables por Defecto

En el formulario web puedes escoger la URL, profundidad, User Agent y Delay en milisegundos.
Sin embargo, el archivo `src/config.json` te permite definir políticas permanentes a nivel de servidor:

- `userAgent`: User-Agent global para las peticiones (si el usuario no designa uno en la interfaz).
- `headers`: Cabeceras HTTP persistentes adicionales.
- `outputDir`: Nombre de la carpeta de salida (por defecto `output`).
- `delay`: Tiempo medio de retardo (ms) por defecto entre peticiones.

## Uso Rápido

Para arrancar el servidor web, ejecuta en tu terminal:

```sh
npm run server
```

1. Abre tu navegador y dirígete a `http://localhost:3000`.
2. Completa los requisitos de tu rastreo y presiona **Launch Crawler**.
3. Verás los logs de descubrimiento inyectarse fluidamente, y la resolución (`✓ OK` o `✗ ERROR`) completarse en la misma línea en tiempo real.
4. Consulta los documentos resultantes generados en tu carpeta `/output/`.

*Nota:* Si quieres utilizar el proyecto en modo antiguo sin interfaz desde la línea de comandos, aún puedes ejecutar `node src/main.js <URL> <PROF>`.

## Scripts disponibles

- `npm run server`: Levanta el panel WebApp y la API.
- `npm start`: Inicia el modo heredado CLI.
- `npm test`: Ejecuta los tests unitarios en Jest.
- `npm run audit`: Ejecuta un análisis de seguridad profundo usando dependencias (npm audit).

## Salida y Logs

De manera predeterminada, los resultados se volcarán en el directorio `/output`.
Se generarán dos ficheros principales:
- `crawler-stats-YYYYMMDD_HH...json`: Resumen estadístico de iteraciones y dominios saltados por profundidad límite.
- `crawler-inventory-YYYYMMDD_HH...csv`: Hoja de cálculo tabular secuencial que incluye fecha HTTP ISO, la URL absoluta normalizada, código HTTP, y el tiempo de respuesta (ms).

## Seguridad

Ejecuta habitualmente:
```sh
npm run audit
```
Esto chequeará vulnerabilidades críticas en la paquetería backend (Axios, Express, Cheerio).

## Licencia

Este proyecto está licenciado bajo la MIT License. Revisar el archivo `LICENSE` para los detalles legales.
