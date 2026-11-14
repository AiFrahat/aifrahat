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

test('the active Universe page references a valid local favicon', () => {
  const html = read('index.html').toString('utf8');
  // The active cinematic page uses favicon.ico; its preserved bytes are PNG.
  const iconPath = html.match(/<link\b[^>]*rel="icon"[^>]*href="([^"]+)"/i)?.[1];
  assert.equal(iconPath, '/favicon.ico');
  const icon = read(iconPath.slice(1));
  assert.deepEqual([...icon.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(icon.readUInt32BE(16) > 0 && icon.readUInt32BE(20) > 0, 'nonempty PNG dimensions');
  assert.ok(!html.includes('assets/crown-orbit'));
  assert.ok(!html.includes('assets/icon-'));
});
