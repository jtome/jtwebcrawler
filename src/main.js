const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const { crawl } = require('./crawler');
const path = require('path');
const fs = require('fs');



function isValidUrl(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

module.exports = { isValidUrl };

function runCrawler() {
  const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 <url> <depth> [--outputDir <dir>]')
    .demandCommand(2)
    .option('outputDir', {
      alias: 'o',
      type: 'string',
      description: 'Directorio de salida para los ficheros generados'
    })
    .option('delay', {
      alias: 'd',
      type: 'number',
      description: 'Tiempo medio de retardo (ms) entre peticiones'
    })
    .help()
    .argv;

  const url = argv._[0];
  const depth = parseInt(argv._[1], 10);

  // Cargar configuración
  const configPath = path.join(__dirname, 'config.json');
  let config = {};
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }

  // Determinar directorio de salida y delay antes de validar
  var outputDir = (argv.outputDir !== undefined) ? argv.outputDir : (config.outputDir || '.');
  var delay = (argv.delay !== undefined) ? argv.delay : (config.delay || 0);

  // Sobrescribir config con CLI si corresponde
  if (argv.userAgent) config.userAgent = argv.userAgent;
  if (argv.headers) config.headers = argv.headers;
  config.delay = delay;

  // Validación de parámetros
  if (!isValidUrl(url)) {
    console.error('ERROR: La URL proporcionada no es válida.');
    process.exit(1);
  }
  if (isNaN(depth) || depth < 0 || depth > 10) {
    console.error('ERROR: La profundidad debe ser un número entero entre 0 y 10.');
    process.exit(1);
  }
  if (delay < 0 || delay > 60000) {
    console.error('ERROR: El delay debe ser un número positivo y razonable (0-60000 ms).');
    process.exit(1);
  }
  if (typeof outputDir !== 'string' || outputDir.length > 128) {
    console.error('ERROR: El directorio de salida no es válido o es demasiado largo.');
    process.exit(1);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Iniciando crawler en: ${url} con profundidad: ${depth} (delay medio: ${delay} ms)`);

  crawl(url, depth, config)
    .then(stats => {
      lastStats = stats;
      console.log('\n--- Estadísticas del rastreo ---');
      for (const [k, v] of Object.entries(stats)) {
        if (k === 'inventory') {
          console.log(`inventory: ${Array.isArray(v) ? v.length + ' URLs' : v}`);
        } else {
          console.log(`${k}: ${v}`);
        }
      }
      writeOutput(stats);
    })
    .catch(err => {
      console.error('Error en el crawler:', err);
      if (lastStats) writeOutput(lastStats);
    });
}

if (require.main === module) {
  runCrawler();
}
