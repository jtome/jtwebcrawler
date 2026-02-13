
# JTWebCrawler

JTWebCrawler es un script Node.js que permite rastrear sitios web de forma configurable, generando estadísticas detalladas e inventario de URLs visitadas. El crawler acepta parámetros de URL, profundidad, directorio de salida y delay entre peticiones, y permite personalizar cabeceras y user-agent. Los resultados se guardan en ficheros CSV y JSON para su posterior análisis.

## Funcionalidad
- Rastrea un sitio web hasta la profundidad indicada, siguiendo solo enlaces internos.
- Permite configurar el user-agent, cabeceras, directorio de salida y delay entre peticiones.
- Genera estadísticas de rastreo y un inventario de URLs visitadas con código de respuesta y tiempo.
- Valida todos los parámetros de entrada y permite auditoría de dependencias.
- Permite interrupción ordenada (Ctrl+C) guardando resultados parciales.

## Autor
- Jorge Tomé Hernando (<jorge@jorgetome.info>)

## Licencia
Este proyecto está licenciado bajo la MIT License. Puedes consultar el archivo LICENSE para más detalles.

## Estructura del proyecto
- `src/`: Código fuente principal
- `tests/`: (opcional) Pruebas unitarias

## Instalación

```sh
npm install
```

## Configuración

El archivo `src/config.json` permite especificar:
- `userAgent`: User-Agent para las peticiones
- `headers`: Cabeceras HTTP adicionales
- `outputDir`: Carpeta de salida por defecto
- `delay`: Tiempo medio de retardo (ms) entre peticiones

**Importante:** No subas tu `src/config.json` al repositorio. Usa el archivo `src/config.example.json` como plantilla y referencia.

Para crear tu configuración personalizada:
1. Copia `src/config.example.json` a `src/config.json`.
2. Modifica los valores según tus necesidades.

Ejemplo de configuración:

```json
{
  "userAgent": "JTWebCrawler/1.0 (+https://tu-sitio.com)",
  "headers": {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9"
  },
  "outputDir": "output",
  "delay": 500
}
```

Puedes modificar este archivo para personalizar las peticiones y la salida.

## Uso

```sh
node src/main.js <URL> <PROFUNDIDAD> [--outputDir <directorio>] [--delay <ms>]
```

Ejemplo:

```sh
node src/main.js https://www.exampleweb.com 2 --outputDir resultados --delay 500
```

## Scripts disponibles

- `npm start`: Ejecuta el crawler con los parámetros y configuración indicados.
- `npm test`: Ejecuta los tests unitarios.
- `npm run audit`: Ejecuta un análisis de seguridad automático sobre las dependencias del proyecto usando `npm audit --audit-level=high`.

## Seguridad

Para mantener el proyecto seguro, ejecuta periódicamente:

```sh
npm run audit
```

Esto revisará las dependencias y reportará vulnerabilidades de nivel alto o crítico. Se recomienda actualizar los paquetes afectados si se detectan problemas.


## Salida


Se generan dos ficheros en el directorio de salida:
- `crawler-stats-YYYYMMDD_HHMM.json`: Estadísticas y parámetros de la ejecución
- `crawler-inventory-YYYYMMDD_HHMM.csv`: Inventario incremental de URLs visitadas. Incluye las columnas:
  - `timestamp`: Fecha y hora ISO de la petición
  - `url`: URL visitada
  - `status`: Código de respuesta HTTP
  - `elapsed_ms`: Tiempo de respuesta en milisegundos

## Tests

Para ejecutar los tests unitarios, asegúrate de tener instalado Jest:

```sh
npm install --save-dev jest
```

Luego ejecuta:

```sh
npm test
```

O directamente:

```sh
npx jest
```

Los tests se encuentran en la carpeta `tests/` y cubren validaciones, CLI y la función principal del crawler.

