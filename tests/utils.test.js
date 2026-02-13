const { isValidUrl } = require('../src/main');

describe('isValidUrl', () => {
  test('returns true for valid URLs', () => {
    expect(isValidUrl('https://www.google.com')).toBe(true);
    expect(isValidUrl('http://localhost:3000')).toBe(true);
  });

  test('returns false for invalid URLs', () => {
    expect(isValidUrl('notaurl')).toBe(false);
    expect(isValidUrl('')).toBe(false);
    expect(isValidUrl('ftp://example.com')).toBe(true); // Accepts any valid URL scheme
  });
});
