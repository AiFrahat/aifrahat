import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Vector3 } from 'three';
import { DEFAULT_DESIGN, FINISHES, normalizeDesign, parseBrief, specification, briefMarkdown } from '../design-state.mjs';
import { exportBase, createProduct } from '../product-model.js';
import { STLExporter } from '../vendor/STLExporter.js';

test('the signature rover defaults to ruby without overwriting saved finishes', () => {
  assert.equal(DEFAULT_DESIGN.finish, 'ruby');
  assert.equal(normalizeDesign({}).finish, 'ruby');
  assert.equal(normalizeDesign({ ...DEFAULT_DESIGN, finish: 'turquoise' }).finish, 'turquoise');
});

test('the clear-coated body keeps its finish and updates correctly', () => {
  const product = createProduct(DEFAULT_DESIGN);
  let body;
  product.root.traverse(mesh => { if (mesh.material?.isMeshPhysicalMaterial) body = mesh.material; });
  assert.ok(body);
  assert.equal(body.color.getHex(), FINISHES.ruby);
  assert.equal(body.clearcoat, .85);
  const geometry = product.root.children[0].children[0].geometry;
  assert.equal(Object.keys(FINISHES).length, 5);
  for (const [finish, color] of Object.entries(FINISHES)) {
    product.update({ ...DEFAULT_DESIGN, finish, wireframe: true });
    assert.equal(body.color.getHex(), color);
    assert.equal(body.wireframe, true);
    assert.equal(product.root.children[0].children[0].geometry, geometry);
  }
  product.dispose();
});

test('English brief resolves template, finish and millimeter width', () => {
  const { design, matched } = parseBrief('A green sensor, 220 mm wide');
  assert.equal(design.template, 'sensor'); assert.equal(design.finish, 'mint'); assert.equal(design.width, 220); assert.equal(matched.length, 3);
});
test('Arabic brief supports Arabic numerals and centimeters', () => {
  const { design } = parseBrief('مصباح فضي بعرض ٢٠ سم');
  assert.equal(design.template, 'lamp'); assert.equal(design.finish, 'silver'); assert.equal(design.width, 200);
  assert.equal(parseBrief('حساس أخضر ١٥٠ مم').design.width, 150);
});
test('unknown intent preserves current design without implying inference', () => {
  const { design, matched } = parseBrief('Build a spaceship with five wings', { ...DEFAULT_DESIGN, width: 230 });
  assert.equal(design.width, 230); assert.equal(matched.length, 0);
});
test('input limits and untrusted persisted values are normalized', () => {
  assert.equal(parseBrief('rover width 900 mm').clamped, true);
  assert.equal(parseBrief('rover width 900 mm').design.width, 260);
  assert.equal(parseBrief('lamp 1 cm').design.width, 100);
  assert.deepEqual(normalizeDesign(null), DEFAULT_DESIGN);
  assert.deepEqual(normalizeDesign({ template: 'x', finish: '__proto__', width: 'bad', explode: Infinity, wireframe: 'true' }), DEFAULT_DESIGN);
});
test('exports explicitly declare scope and fabrication limitations', () => {
  assert.equal(specification(DEFAULT_DESIGN).units, 'mm');
  assert.match(briefMarkdown(DEFAULT_DESIGN), /Not manufacturing certified/);
  assert.match(briefMarkdown(DEFAULT_DESIGN), /no AI inference/);
});
for (const template of ['rover', 'sensor', 'lamp']) {
  for (const width of [100, 180, 260]) test(`${template} ${width}mm STL base has exact dimensions and a closed manifold`, () => {
    const design = { ...DEFAULT_DESIGN, template, width };
    const model = exportBase(design);
    model.updateMatrixWorld(true);
    const size = new Box3().setFromObject(model).getSize(new Vector3());
    const spec = specification(design).base;
    assert.ok(Math.abs(size.x - spec.width) < .001);
    assert.ok(Math.abs(size.y - spec.length) < .001);
    assert.ok(Math.abs(size.z - spec.thickness) < .001);
    const geometry = model.geometry.index ? model.geometry.toNonIndexed() : model.geometry;
    const p = geometry.attributes.position;
    const edges = new Map();
    const vertex = i => [p.getX(i), p.getY(i), p.getZ(i)].map(n => Math.round(n * 10000)).join(',');
    for (let i = 0; i < p.count; i += 3) {
      const vertices = [vertex(i), vertex(i + 1), vertex(i + 2)];
      for (let j = 0; j < 3; j++) { const key = [vertices[j], vertices[(j + 1) % 3]].sort().join('|'); edges.set(key, (edges.get(key) || 0) + 1); }
    }
    assert.ok([...edges.values()].every(n => n === 2), 'each welded edge has two incident triangles');
    const stl = new STLExporter().parse(model);
    assert.match(stl, /^solid exported/); assert.match(stl, /endsolid exported/); assert.ok(!stl.includes('NaN'));
    geometry.dispose(); model.geometry.dispose(); model.material.dispose();
  });
  test(`${template} preview has nonempty geometry and updates without NaN`, () => {
    const product = createProduct({ ...DEFAULT_DESIGN, template });
    product.update({ ...DEFAULT_DESIGN, template, width: 260, explode: 100, finish: 'mint', wireframe: true });
    const bounds = new Box3().setFromObject(product.root);
    assert.ok(!bounds.isEmpty()); assert.ok(Number.isFinite(bounds.max.y)); assert.ok(bounds.max.y > 2);
    product.dispose();
  });
}
