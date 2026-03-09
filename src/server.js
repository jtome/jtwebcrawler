const express = require('express');
const path = require('path');
const { crawl } = require('./crawler');
const fs = require('fs');
const EventEmitter = require('events');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Guardamos los trabajos en memoria
// En un caso real se podría usar una base de datos o Redis
const crawlJobs = new Map();
const crawlEvents = new EventEmitter();

app.post('/api/crawl', async (req, res) => {
  const { url, depth, delay, outputDir, userAgent } = req.body;
  
  if (!url || !depth) {
    return res.status(400).json({ error: 'Faltan parámetros obligatorios: url y depth' });
  }

  const id = Date.now().toString();
  const config = {
    delay: delay || 0,
    outputDir: outputDir || 'output',
    userAgent: userAgent || 'JTWebCrawler/2.0 (+https://github.com/jtome/jtwebcrawler)'
  };

  // Asegurar que el directorio de salida existe
  const absOutputDir = path.resolve(process.cwd(), config.outputDir);
  if (!fs.existsSync(absOutputDir)) {
    fs.mkdirSync(absOutputDir, { recursive: true });
  }

  const job = { id, status: 'running', stats: null, error: null, cancelled: false };
  crawlJobs.set(id, job);

  // Función de callback para SSE
  const onProgress = (data) => {
    crawlEvents.emit(`progress-${id}`, data);
  };

  const isCancelled = () => job.cancelled;

  // Respondemos rápidamente que el trabajo ha iniciado
  res.json({ id, message: 'Crawler iniciado' });

  try {
    const stats = await crawl(url, parseInt(depth, 10), config, onProgress, isCancelled);
    if (job.cancelled) {
       job.status = 'cancelled';
       crawlEvents.emit(`progress-${id}`, { type: 'done', message: 'Rastreo cancelado por el usuario', stats });
    } else {
       job.status = 'completed';
       job.stats = stats;
       // Emitir mensaje de finalización para cerrar conexión SSE
       crawlEvents.emit(`progress-${id}`, { type: 'done', message: 'Rastreo completado', stats });
    }
  } catch (error) {
    job.status = 'failed';
    job.error = error.message;
    crawlEvents.emit(`progress-${id}`, { type: 'fatal_error', message: error.message });
  }
});

// Endpoint SSE para transmitir logs
app.get('/api/stream/:id', (req, res) => {
  const { id } = req.params;
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const onProgress = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    // Cerramos la conexión si terminó
    if (data.type === 'done' || data.type === 'error') {
      res.end();
      crawlEvents.removeListener(`progress-${id}`, onProgress);
    }
  };

  crawlEvents.on(`progress-${id}`, onProgress);

  // Limpiar listener si el cliente cierra la conexión prematuramente
  req.on('close', () => {
    crawlEvents.removeListener(`progress-${id}`, onProgress);
  });
});

app.get('/api/results/:id', (req, res) => {
  const { id } = req.params;
  const job = crawlJobs.get(id);
  if (!job) return res.status(404).json({ error: 'Job no encontrado' });
  res.json(job);
});

app.post('/api/stop/:id', (req, res) => {
  const { id } = req.params;
  const job = crawlJobs.get(id);
  if (!job) return res.status(404).json({ error: 'Job no encontrado' });
  if (job.status === 'running') {
    job.cancelled = true;
    res.json({ message: 'Deteniendo...' });
  } else {
    res.json({ message: 'El job no está en ejecución' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
