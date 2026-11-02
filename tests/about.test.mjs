import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const entry = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const modulePath = entry.match(/<script type="module" crossorigin src="([^"]+)"/)[1];
const bundle = readFileSync(new URL(`..${modulePath}`, import.meta.url), 'utf8');

test('the active About UI omits the former visual-reference notice in both languages', () => {
  assert.doesNotMatch(bundle, /reference-credit|Samsy Ninja|Visual experience reference|مرجع التجربة البصرية/);
  assert.doesNotMatch(bundle, /Includes stripped city geometry derived from the supplied reference archive/);
  assert.doesNotMatch(bundle, /يتضمن العالم هندسة مدينة مشتقة من الأرشيف المقدم/);
});

test('About keeps its bilingual content, navigation, and third-party credits', () => {
  for (const text of ['about-page', 'about-close', 'about-interests', 'showAbout', 'hideAbout', 'From an idea to code, machines and products.', 'من الفكرة للكود والآلة والمنتج.', 'Quaternius', '[Three.js', '[Rapier', '[camera-controls']) {
    assert.ok(bundle.includes(text), text);
  }
  const provenance = readFileSync(new URL('../assets/city/CREDITS.md', import.meta.url), 'utf8');
  assert.match(provenance, /upstream asset license has not been independently verified/);
});
