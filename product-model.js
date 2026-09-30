import * as THREE from 'three';
import { FINISHES, specification } from './design-state.mjs';

function outline(w, d, r) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -d / 2);
  s.lineTo(w / 2 - r, -d / 2); s.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
  s.lineTo(w / 2, d / 2 - r); s.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
  s.lineTo(-w / 2 + r, d / 2); s.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
  s.lineTo(-w / 2, -d / 2 + r); s.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
  return s;
}

function plate(w, d, h, r = .12, bevel = .025) {
  const geometry = new THREE.ExtrudeGeometry(outline(w, d, r), { depth: h, bevelEnabled: bevel > 0, bevelSegments: 2, steps: 1, bevelSize: bevel, bevelThickness: bevel, curveSegments: 8 });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -h / 2, 0);
  return geometry;
}

export function exportBase(design) {
  const { base, template } = specification(design);
  const geometry = template === 'lamp' ? new THREE.CylinderGeometry(base.width / 2, base.width / 2, base.thickness, 96) : plate(base.width, base.length, base.thickness, base.cornerRadius, 0);
  // STL uses Z as the build axis, with its bottom at Z=0 and dimensions in mm.
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, 0, base.thickness / 2);
  return new THREE.Mesh(geometry);
}

export function createProduct(design) {
  const root = new THREE.Group();
  const layers = [];
  const materials = [];
  const material = (color, metalness = .4, roughness = .35, extra = {}) => {
    const m = new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });
    materials.push(m); return m;
  };
  const body = material(FINISHES[design.finish], .6, .27);
  const metal = material(0xb4bbc0, .88, .24);
  const dark = material(0x111719, .35, .5);
  const rubber = material(0x171b1d, .05, .8);
  const board = material(0x17483b, .38, .5);
  const gold = material(0xd3ad69, .8, .3);
  const glass = material(0x16354a, .7, .1);
  const led = material(0x8ddfca, .2, .22, { emissive: 0x73d3c1, emissiveIntensity: 1.3 });
  const warm = material(0xffe4bb, .15, .4, { emissive: 0xffc778, emissiveIntensity: .65 });
  function mesh(geometry, mat, parent, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(geometry, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  const box = (w, h, d, mat, parent, x = 0, y = 0, z = 0) => mesh(new THREE.BoxGeometry(w, h, d), mat, parent, x, y, z);
  const cylinder = (r, h, mat, parent, x = 0, y = 0, z = 0) => mesh(new THREE.CylinderGeometry(r, r, h, 40), mat, parent, x, y, z);
  function layer(y, lift) { const g = new THREE.Group(); g.position.y = y; g.userData = { y, lift }; root.add(g); layers.push(g); return g; }
  function screws(parent, w, d) {
    for (const x of [-w / 2, w / 2]) for (const z of [-d / 2, d / 2]) {
      cylinder(.045, .025, metal, parent, x, .07, z);
      box(.045, .005, .008, dark, parent, x, .085, z);
    }
  }
  function identity(parent, y, z) {
    if (typeof document === 'undefined') return;
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#12191b'; ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#cedad3'; ctx.font = 'bold 52px monospace'; ctx.fillText('AF / 01', 26, 70);
    ctx.fillStyle = '#79baa4'; ctx.font = '18px monospace'; ctx.fillText('EXPERIMENTAL SYSTEMS', 28, 104);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshStandardMaterial({ map: texture, roughness: .5, metalness: .25 }); materials.push(mat);
    const label = mesh(new THREE.PlaneGeometry(.9, .23), mat, parent, 0, y, z); label.rotation.x = -Math.PI / 2;
  }
  function circuit(parent, w, d) {
    mesh(plate(w, d, .045, .08, .007), board, parent);
    box(.4, .06, .44, dark, parent, 0, .05, 0);
    for (let i = 0; i < 8; i++) {
      for (const side of [-1, 1]) box(.08, .018, .018, gold, parent, side * .24, .048, -.18 + i * .05);
      box(.017, .005, d * .24, gold, parent, -.52 + i * .15, .029, d * .29);
    }
    for (let i = 0; i < 4; i++) { box(.14, .1, .22, metal, parent, -.5 + i * .32, .07, -d * .32); }
    cylinder(.045, .03, led, parent, w * .36, .055, d * .3);
    screws(parent, w - .18, d - .18);
  }
  if (design.template === 'rover') {
    const base = layer(.62, 0);
    mesh(plate(2.08, 2.9, .18, .23), metal, base);
    mesh(plate(1.94, 2.8, .25, .2), dark, base, 0, .08);
    for (const z of [-1.05, 1.05]) {
      const axle = cylinder(.1, 2.75, metal, base, 0, -.05, z); axle.rotation.z = Math.PI / 2;
      for (const side of [-1, 1]) {
        const wheel = new THREE.Group(); wheel.position.set(side * 1.24, -.08, z); wheel.rotation.z = Math.PI / 2; base.add(wheel);
        cylinder(.47, .33, rubber, wheel);
        for (const y of [-.17, .17]) {
          cylinder(.3, .024, metal, wheel, 0, y, 0);
          cylinder(.19, .03, body, wheel, 0, y * 1.1, 0);
          cylinder(.073, .045, dark, wheel, 0, y * 1.23, 0);
          for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; cylinder(.022, .032, gold, wheel, Math.cos(a) * .235, y * 1.1, Math.sin(a) * .235); }
        }
        for (let i = 0; i < 32; i++) { const a = i * Math.PI / 16; const tread = box(.06, .35, .036, rubber, wheel, Math.sin(a) * .466, 0, Math.cos(a) * .466); tread.rotation.y = a; }
      }
    }
    for (const z of [-1.5, 1.5]) { mesh(plate(1.74, .16, .21, .07), body, base, 0, .05, z); }
    const pcb = layer(.95, .7); circuit(pcb, 1.6, 2.25);
    const shell = layer(1.21, 1.25);
    mesh(plate(1.97, 2.77, .28, .25), body, shell);
    mesh(plate(1.03, 1.65, .045, .12), dark, shell, 0, .177, -.2);
    for (let i = 0; i < 8; i++) box(.76, .025, .045, metal, shell, 0, .21, -.8 + i * .16);
    screws(shell, 1.64, 2.42);
    identity(shell, .168, .88);
    const camera = layer(1.53, 1.7);
    mesh(plate(.94, .53, .29, .11), dark, camera, 0, .02, .87);
    for (const x of [-.25, .25]) {
      const lens = cylinder(.135, .08, metal, camera, x, .05, 1.14); lens.rotation.x = Math.PI / 2;
      const pupil = cylinder(.098, .09, glass, camera, x, .05, 1.18); pupil.rotation.x = Math.PI / 2;
      const glint = cylinder(.025, .092, led, camera, x + .022, .076, 1.184); glint.rotation.x = Math.PI / 2;
    }
    cylinder(.09, .43, metal, camera, 0, .18, -.5);
    cylinder(.32, .17, dark, camera, 0, .44, -.5);
    cylinder(.323, .027, led, camera, 0, .46, -.5);
    cylinder(.27, .035, metal, camera, 0, .54, -.5);
    box(.035, .55, .035, dark, camera, .75, .25, -.9);
  } else if (design.template === 'sensor') {
    const base = layer(.35, 0); mesh(plate(2.3, 2.65, .35, .22), metal, base);
    mesh(plate(2.07, 2.4, .12, .14), dark, base, 0, .22);
    const pcb = layer(.68, .8); circuit(pcb, 1.86, 2.16);
    cylinder(.22, .18, metal, pcb, .46, .14, -.45);
    const lid = layer(1.03, 1.7); mesh(plate(2.3, 2.65, .26, .22), body, lid);
    for (let i = 0; i < 9; i++) box(1.4, .03, .065, dark, lid, 0, .15, -.8 + i * .19);
    screws(lid, 1.9, 2.25);
    cylinder(.067, .04, led, lid, .75, .16, .88);
    box(.45, .16, .12, dark, base, 0, .1, 1.35);
    const antenna = layer(1.16, 2.3); cylinder(.045, .75, dark, antenna, -.8, .28, -.84); cylinder(.058, .025, led, antenna, -.8, .66, -.84);
  } else {
    const base = layer(.24, 0); cylinder(1.04, .2, body, base); cylinder(.85, .035, dark, base, 0, -.12);
    cylinder(.15, 1.6, metal, base, 0, .85); cylinder(.19, .08, dark, base, 0, .14);
    const light = layer(1.87, .9); cylinder(.54, .14, warm, light); cylinder(.68, .055, metal, light, 0, -.1);
    const shade = layer(2.18, 1.7);
    for (let i = 0; i < 40; i++) {
      const a = i * Math.PI * 2 / 40;
      const slat = box(.042, .9, .14, body, shade, Math.sin(a) * .83, 0, Math.cos(a) * .83); slat.rotation.y = a;
    }
    for (const y of [-.45, .45]) { const ring = mesh(new THREE.TorusGeometry(.83, .06, 8, 64), metal, shade, 0, y); ring.rotation.x = Math.PI / 2; }
    cylinder(.8, .06, body, shade, 0, .45);
  }
  root.scale.setScalar(design.width / 180);
  function update(next) {
    root.scale.setScalar(next.width / 180);
    body.color.setHex(FINISHES[next.finish]);
    for (const layer of layers) layer.position.y = layer.userData.y + layer.userData.lift * next.explode / 100;
    for (const m of materials) m.wireframe = next.wireframe;
  }
  update(design);
  return { root, update, dispose() { root.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); materials.forEach(m => { m.map?.dispose(); m.dispose(); }); } };
}
