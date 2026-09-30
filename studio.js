import { DEFAULT_DESIGN, normalizeDesign, parseBrief, specification, briefMarkdown } from './design-state.mjs';
import { mountScene } from './product-scene.js';
import { exportBase } from './product-model.js';
import { STLExporter } from './vendor/STLExporter.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const english = () => document.documentElement.lang === 'en';
const t = (ar, en) => english() ? en : ar;
const icons = () => window.lucide?.createIcons({ attrs: { 'aria-hidden': 'true' } });
icons();
let design = { ...DEFAULT_DESIGN };
try { design = normalizeDesign(JSON.parse(localStorage.getItem('aifrahat-design')) || DEFAULT_DESIGN); } catch { /* Storage may be unavailable in private contexts. */ }
let heroDesign = { ...DEFAULT_DESIGN };
const hero = mountScene($('[data-scene="hero"]'), heroDesign, { hero: true });
const studio = mountScene($('[data-scene="studio"]'), design);
let feedback = null;
function sync() {
  $('[data-width]').value = design.width;
  $('[data-width-output]').textContent = `${design.width} mm`;
  $('[data-explode]').value = design.explode;
  $('[data-explode-output]').textContent = `${design.explode}%`;
  $('[data-wireframe]').checked = design.wireframe;
  $$('[data-preset]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.preset === design.template)));
  $$('[data-finish]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.finish === design.finish)));
  $('[data-product-label]').textContent = `AF / ${design.template.toUpperCase()}-01`;
  const base = specification(design).base;
  $('[data-mesh-status]').textContent = `${base.width} × ${base.length} mm / ${design.wireframe ? 'WIREFRAME' : 'SOLID'}`;
  if (feedback) {
    $('[data-build-feedback]').textContent = feedback.clamped ? t('المقاس محصور بين 100 و260 مم. تم تطبيق الأجزاء المعروفة من الوصف.', 'Size is limited to 100–260 mm. Recognized parts of the brief were applied.') : feedback.matched.length ? t('تم تطبيق الكلمات المعروفة على القالب المحلي. التفاصيل غير المدعومة لم تغيّر النموذج.', 'Recognized keywords applied to the local template. Unsupported details did not change the model.') : t('لم أجد قالبًا أو خامة أو مقاسًا معروفًا. النموذج الحالي لم يتغير.', 'No recognized template, finish, or size. The current model is unchanged.');
  } else $('[data-build-feedback]').textContent = t('ملف STL يصدّر القاعدة الصلبة فقط، بالمليمتر.', 'STL exports the solid concept base only, in millimeters.');
  try { localStorage.setItem('aifrahat-design', JSON.stringify(design)); } catch { /* Preview remains usable without storage. */ }
  studio.update(design);
}
$$('[data-preset]').forEach(b => b.addEventListener('click', () => { design.template = b.dataset.preset; feedback = null; sync(); }));
$$('[data-finish]').forEach(b => b.addEventListener('click', () => { design.finish = b.dataset.finish; sync(); }));
$('[data-width]').addEventListener('input', e => { design.width = Number(e.target.value); sync(); });
$('[data-explode]').addEventListener('input', e => { design.explode = Number(e.target.value); sync(); });
$('[data-wireframe]').addEventListener('change', e => { design.wireframe = e.target.checked; sync(); });
$('[data-build]').addEventListener('click', () => { feedback = parseBrief($('#product-prompt').value, design); design = feedback.design; sync(); });
$('[data-studio-reset]').addEventListener('click', () => studio.reset());
$('[data-hero-reset]').addEventListener('click', () => hero.reset());
$$('[data-hero-finish]').forEach(button => button.addEventListener('click', () => {
  heroDesign.finish = button.dataset.heroFinish;
  $$('[data-hero-finish]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  hero.update(heroDesign);
}));
$('[data-hero-explode]').addEventListener('input', e => { heroDesign.explode = Number(e.target.value); hero.update(heroDesign); });
let heroPaused = matchMedia('(prefers-reduced-motion: reduce)').matches;
function updatePause() {
  const button = $('[data-hero-pause]');
  button.setAttribute('aria-pressed', String(heroPaused));
  button.setAttribute('aria-label', heroPaused ? 'Resume motion' : 'Pause motion');
  button.innerHTML = `<i data-lucide="${heroPaused ? 'play' : 'pause'}"></i>`;
  icons(); hero.pause(heroPaused);
}
$('[data-hero-pause]').addEventListener('click', () => { heroPaused = !heroPaused; updatePause(); });
const frontierStates = { physical: { explode: 0, wireframe: false }, coding: { explode: 35, wireframe: true }, hardware: { explode: 85, wireframe: false }, fabrication: { explode: 55, wireframe: true }, product: { explode: 20, wireframe: false }, agentic: { explode: 55, wireframe: false } };
$$('[data-frontier]').forEach(b => b.addEventListener('click', () => {
  $$('[data-frontier]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  heroDesign = { ...heroDesign, ...frontierStates[b.dataset.frontier] };
  $('[data-hero-explode]').value = heroDesign.explode;
  hero.update(heroDesign);
}));
function download(text, name, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name;
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$$('[data-export]').forEach(button => button.addEventListener('click', () => {
  const name = `aifrahat-${design.template}-${design.width}mm`;
  const kind = button.dataset.export;
  if (kind === 'json') download(JSON.stringify(specification(design), null, 2), `${name}.json`, 'application/json');
  else if (kind === 'brief') download(briefMarkdown(design), `${name}-brief.md`, 'text/markdown');
  else {
    const base = exportBase(design); base.updateMatrixWorld(true);
    download(new STLExporter().parse(base), `${name}-base.stl`, 'model/stl');
    base.geometry.dispose(); base.material.dispose();
  }
  $('[data-build-feedback]').textContent = t('تم تجهيز الملف للتنزيل. راجع الأبعاد قبل أي تصنيع.', 'File prepared for download. Review dimensions before any fabrication.');
}));
document.addEventListener('languagechange', sync);
new MutationObserver(() => { hero.setTheme(); studio.setTheme(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
updatePause(); sync();
document.documentElement.dataset.studioReady = 'true';
