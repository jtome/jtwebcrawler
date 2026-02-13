const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

async function crawl(startUrl, maxDepth, config) {
  const visited = new Set();
  const inventory = new Map();
  const fs = require('fs');
  const path = require('path');
  // Determinar nombre de fichero de inventario
  const outputDir = config.outputDir || '.';
  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
  const inventoryFile = path.join(outputDir, `crawler-inventory-${timestamp}.csv`);
  let inventoryHeaderWritten = false;
  const stats = {
    pages_visited: 0,
    pages_success: 0,
    pages_failed: 0,
    total_bytes: 0,
    errors: [],
    max_depth_reached: 0,
    duration_sec: 0
  };
  const startTime = Date.now();
  const headers = Object.assign({}, config.headers || {});
  if (config.userAgent) headers['User-Agent'] = config.userAgent;

  // Normaliza una URL para evitar duplicados por barra final
  function normalizeUrl(url) {
    try {
      const u = new URL(url);
      // Elimina barra final excepto si es la raíz
      if (u.pathname !== '/' && u.pathname.endsWith('/')) {
        u.pathname = u.pathname.replace(/\/+$/, '');
      }
      // Elimina fragmentos y query
      u.hash = '';
      u.search = '';
      return u.toString();
    } catch {
      return url;
    }
  }

  async function _crawl(url, depth) {
    // Esperar un retardo aleatorio con media delay si está definido y es mayor que 0
    const delay = Number(config.delay) || 0;
    if (delay > 0 && depth > 0) {
      // Usar distribución normal truncada para evitar valores negativos
      let delayMs = Math.round(Math.max(0, randomNormal(delay, delay / 3)));
      await new Promise(res => setTimeout(res, delayMs));
    }
      // Generador de números aleatorios con distribución normal (Box-Muller)
      function randomNormal(mean, std) {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return num * std + mean;
      }
    const normUrl = normalizeUrl(url);
    if (depth > maxDepth || visited.has(normUrl)) {
      stats.max_depth_reached = Math.max(stats.max_depth_reached, depth - 1);
      return;
    }
    visited.add(normUrl);
    const startReq = Date.now();
    let status = null;
    let elapsed = null;
    stats.pages_visited++;
    // Mostrar información de cada página visitada
    console.log(`[Profundidad ${depth}] Visitando: ${url}`);
    try {
      const resp = await axios.get(url, { headers, timeout: 10000, maxRedirects: 5, validateStatus: null });
      status = resp.status;
      elapsed = Date.now() - startReq;
      // Informar de redirección si la respuesta es 3xx
      if (resp.status >= 300 && resp.status < 400 && resp.headers.location) {
        const redirectUrl = resp.headers.location.startsWith('http') ? resp.headers.location : new URL(resp.headers.location, url).href;
        console.log(`  > Redirección detectada: ${url} -> ${redirectUrl}`);
      }
      if (resp.status >= 200 && resp.status < 300) {
        stats.pages_success++;
      } else {
        stats.pages_failed++;
        stats.errors.push(`${url}: Código HTTP ${resp.status}`);
        inventory.set(url, { url, status, elapsed });
        // Escribir en CSV
        if (!inventoryHeaderWritten) {
          fs.appendFileSync(inventoryFile, 'timestamp,url,status,elapsed_ms\n');
          inventoryHeaderWritten = true;
        }
        const reqTimestamp = new Date(startReq).toISOString();
        fs.appendFileSync(inventoryFile, `${reqTimestamp},${url.replace(/"/g, '""')},${status},${elapsed}\n`);
        return;
      }
      stats.total_bytes += resp.data.length || 0;
      if (resp.headers['content-type'] && resp.headers['content-type'].includes('text/html')) {
        const $ = cheerio.load(resp.data);
        const base = new URL(url);
        // Recolectar todos los enlaces válidos
        const links = new Set();
        $('a[href]').each((_, el) => {
          let nextUrl = $(el).attr('href');
          // Ignorar anchors puros o relativos ("#", "#algo")
          if (!nextUrl || nextUrl.trim().startsWith('#')) return;
          try {
            nextUrl = new URL(nextUrl, base).href;
            // Solo seguir enlaces http(s) del mismo dominio
            if ((nextUrl.startsWith('http://') || nextUrl.startsWith('https://')) && new URL(nextUrl).hostname === base.hostname) {
              links.add(normalizeUrl(nextUrl));
            }
          } catch {}
        });
        // Esperar a que todos los enlaces se rastreen antes de continuar
        for (const link of links) {
          await _crawl(link, depth + 1);
        }
      }
    } catch (e) {
      status = e.response ? e.response.status : 'ERR';
      elapsed = Date.now() - startReq;
      stats.pages_failed++;
      stats.errors.push(`${url}: ${e.message}`);
    }
    inventory.set(normUrl, { url: normUrl, status, elapsed });
    // Escribir en CSV
    if (!inventoryHeaderWritten) {
      fs.appendFileSync(inventoryFile, 'timestamp,url,status,elapsed_ms\n');
      inventoryHeaderWritten = true;
    }
    const reqTimestamp = new Date(startReq).toISOString();
    fs.appendFileSync(inventoryFile, `${reqTimestamp},${normUrl.replace(/"/g, '""')},${status},${elapsed}\n`);
  }
  await _crawl(startUrl, 1);
  stats.duration_sec = (Date.now() - startTime) / 1000;
  stats.inventory = Array.from(inventory.values());
  stats.inventoryFile = inventoryFile;
  return stats;
}

module.exports = { crawl };
