import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';
import { createProduct } from './product-model.js';

export function mountScene(container, initial, { hero = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power', preserveDrawingBuffer: true });
  } catch {
    container.dataset.renderStatus = 'fallback';
    return { update() {}, reset() {}, pause() {}, setTheme() {}, dispose() {} };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.append(renderer.domElement);
  container.classList.add('has-webgl');
  container.dataset.renderStatus = 'ready';
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', '3D product. Arrow keys rotate, plus and minus zoom. Drag to orbit.');
  renderer.domElement.setAttribute('role', 'application');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 80);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = .07;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.minPolarAngle = .35;
  controls.maxPolarAngle = Math.PI / 2 - .03;
  controls.autoRotateSpeed = .65;
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motionQuery.matches;
  let state = { ...initial };
  let visible = true;
  let lastFrame = 0;
  let frame;
  let lost = false;
  const studioRoom = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studioRoom, .04);
  scene.environment = environment.texture;
  scene.environmentIntensity = .7;
  studioRoom.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xe7f4ff, 0x2d2926, 1.2));
  const key = new THREE.DirectionalLight(0xffeee0, 2.8);
  key.position.set(4, 7, 3); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -5; key.shadow.camera.right = 5;
  key.shadow.camera.top = 7; key.shadow.camera.bottom = -4;
  key.shadow.normalBias = .035; scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fdcdb, 3);
  rim.position.set(-4, 3, -4); scene.add(rim);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.ShadowMaterial({ opacity: .32 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = .015; ground.receiveShadow = true; scene.add(ground);
  const grid = new THREE.GridHelper(12, 24, 0x344a44, 0x283632);
  grid.material.transparent = true; grid.material.opacity = hero ? .2 : .28; scene.add(grid);
  let model = createProduct(state); scene.add(model.root);
  function reset() {
    const narrow = container.clientWidth < 500;
    const scale = Math.max(1, state.width / 180);
    camera.position.set(5.2 * scale, 3.9 * scale, 6.4 * scale);
    controls.target.set(0, (state.template === 'lamp' ? 1.55 : 1.3) * scale + state.explode / 100 * .55, 0);
    camera.fov = narrow ? 38 : 35;
    camera.updateProjectionMatrix();
    model.root.rotation.y = -.2;
    controls.update();
  }
  function resize() {
    const w = Math.max(container.clientWidth, 1), h = Math.max(container.clientHeight, 1);
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(container);
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { rootMargin: '80px' }); observer.observe(container);
  function setTheme() {
    const light = document.documentElement.dataset.theme === 'light' && hero;
    grid.material.opacity = light ? .17 : hero ? .2 : .28;
    ground.material.opacity = light ? .16 : .32;
    renderer.toneMappingExposure = light ? .9 : .95;
  }
  function animate(time) {
    frame = requestAnimationFrame(animate);
    if (!visible || document.hidden || lost || time - lastFrame < 30) return;
    const delta = Math.min((time - lastFrame) / 1000, .05); lastFrame = time;
    controls.autoRotate = !paused && !motionQuery.matches;
    controls.update(delta); renderer.render(scene, camera);
  }
  renderer.domElement.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-', '='].includes(e.key)) return;
    e.preventDefault();
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') model.root.rotation.y += e.key === 'ArrowLeft' ? -.15 : .15;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') camera.position.y = THREE.MathUtils.clamp(camera.position.y + (e.key === 'ArrowUp' ? .3 : -.3), 2, 10);
    else { const v = camera.position.clone().sub(controls.target).multiplyScalar(e.key === '-' ? 1.1 : .9); if (v.length() > 4 && v.length() < 16) camera.position.copy(controls.target).add(v); }
    controls.update();
  });
  renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; container.classList.remove('has-webgl'); container.dataset.renderStatus = 'fallback'; });
  renderer.domElement.addEventListener('webglcontextrestored', () => { lost = false; container.classList.add('has-webgl'); container.dataset.renderStatus = 'ready'; });
  resize(); reset(); setTheme(); frame = requestAnimationFrame(animate);
  return {
    update(next) {
      const changed = next.template !== state.template;
      const reframing = changed || next.width !== state.width;
      state = { ...next };
      if (changed) { scene.remove(model.root); model.dispose(); model = createProduct(state); scene.add(model.root); }
      else model.update(state);
      if (reframing) reset();
      controls.target.y = (state.template === 'lamp' ? 1.55 : 1.3) * Math.max(1, state.width / 180) + state.explode / 100 * .55;
    },
    reset, setTheme,
    pause(value) { paused = value; },
    dispose() { cancelAnimationFrame(frame); observer.disconnect(); resizeObserver.disconnect(); controls.dispose(); model.dispose(); environment.dispose(); ground.geometry.dispose(); ground.material.dispose(); grid.geometry.dispose(); grid.material.dispose(); renderer.dispose(); renderer.domElement.remove(); }
  };
}
