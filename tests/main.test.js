const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('main.js CLI/validations', () => {
  const mainPath = path.join(__dirname, '../src/main.js');

  test('should exit with error for invalid URL', () => {
    try {
      execSync(`node "${mainPath}" not_a_url 1`, { stdio: 'pipe' });
      throw new Error('Should have failed');
    } catch (e) {
      expect(e.stderr.toString()).toMatch(/ERROR: La URL proporcionada no es válida/);
    }
  });

  test('should exit with error for invalid depth', () => {
    try {
      execSync(`node "${mainPath}" https://httpbin.org/html -1`, { stdio: 'pipe' });
      throw new Error('Should have failed');
    } catch (e) {
      expect(e.stderr.toString()).toMatch(/ERROR: La profundidad debe ser un número entero/);
    }
  });

  test('should exit with error for invalid delay', () => {
    try {
      execSync(`node "${mainPath}" https://httpbin.org/html 1 --delay -5`, { stdio: 'pipe' });
      throw new Error('Should have failed');
    } catch (e) {
      expect(e.stderr.toString()).toMatch(/ERROR: El delay debe ser un número positivo/);
    }
  });

  test('should exit with error for invalid outputDir', () => {
    try {
      execSync(`node "${mainPath}" https://httpbin.org/html 1 --outputDir ${'a'.repeat(129)}`, { stdio: 'pipe' });
      throw new Error('Should have failed');
    } catch (e) {
      expect(e.stderr.toString()).toMatch(/ERROR: El directorio de salida no es válido/);
    }
  });
});
