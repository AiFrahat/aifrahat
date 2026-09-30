import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url));

test('AF favicon derivatives have the declared PNG dimensions', () => {
  for (const size of [32, 64, 180, 192, 512]) {
    const png = read(`assets/af-icon-${size}.png`);
    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
});

test('the installed-app manifest uses both AF icon sizes', () => {
  const manifest = JSON.parse(read('site.webmanifest'));
  assert.deepEqual(manifest.icons.map(icon => icon.sizes), ['192x192', '512x512']);
  for (const icon of manifest.icons) {
    assert.ok(icon.src.startsWith('assets/af-icon-'));
    assert.ok(read(icon.src).length > 0);
  }
});

test('page identity and fallback assets no longer use the archived crown', () => {
  const html = read('index.html').toString('utf8');
  for (const path of ['af-icon-32.png', 'af-icon-64.png', 'af-icon-180.png', 'af-icon-192.png', 'af-monogram.webp', 'af-monogram.png']) {
    assert.ok(html.includes(`assets/${path}`), `page references ${path}`);
    assert.ok(read(`assets/${path}`).length > 0);
  }
  assert.ok(!html.includes('assets/crown-orbit'));
  assert.ok(!html.includes('assets/icon-'));
});
