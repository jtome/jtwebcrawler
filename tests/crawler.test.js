const { crawl } = require('../src/crawler');
const fs = require('fs');
const path = require('path');

describe('crawl', () => {
  const config = {
    userAgent: 'JTWebCrawler/1.0',
    headers: {},
    delay: 0
  };

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
    expect([0,1]).toContain(stats.max_depth_reached);
  });
});
