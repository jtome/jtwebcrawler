const { crawl } = require('../src/crawler');
const fs = require('fs');
const path = require('path');

describe('crawl', () => {
  const config = {
    userAgent: 'JTWebCrawler/1.0',
    headers: {},
    delay: 0
  };

  test('should write CSV with timestamp column', async () => {
    const configWithDir = { ...config, outputDir: __dirname };
    const stats = await crawl('https://httpbin.org/html', 1, configWithDir);
    expect(stats.inventoryFile).toBeDefined();
    const csv = require('fs').readFileSync(stats.inventoryFile, 'utf-8');
    const lines = csv.trim().split(/\r?\n/);
    expect(lines[0]).toMatch(/^timestamp,url,status,elapsed_ms$/);
    expect(lines[1]).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z,https:\/\/httpbin.org\/html,200,\d+$/);
    // Limpieza: eliminar el archivo generado
    require('fs').unlinkSync(stats.inventoryFile);
  });

  test('should crawl a valid URL and return stats', async () => {
    const stats = await crawl('https://httpbin.org/html', 1, config);
    expect(stats.pages_visited).toBe(1);
    expect(stats.pages_success).toBe(1);
    expect(stats.pages_failed).toBe(0);
    expect(stats.inventory.length).toBe(1);
    expect(stats.inventory[0].url).toBe('https://httpbin.org/html');
    expect(stats.inventory[0].status).toBe(200);
  });

  test('should handle invalid URL gracefully', async () => {
    await expect(crawl('http://invalid.localhost', 1, config)).resolves.toMatchObject({
      pages_failed: 1
    });
  });

  test('should respect maxDepth', async () => {
    const stats = await crawl('https://httpbin.org/html', 1, config);
    expect([0, 1]).toContain(stats.max_depth_reached);
  });
});
