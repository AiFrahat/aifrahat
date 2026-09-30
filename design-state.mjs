export const DEFAULT_DESIGN = Object.freeze({ template: 'rover', width: 180, finish: 'ruby', explode: 25, wireframe: false });
export const FINISHES = Object.freeze({ ruby: 0xa71930, silver: 0xa5b4b8, mint: 0x5b9e84, turquoise: 0x10a99f, lime: 0xa9d52b });

export function normalizeDesign(value = {}) {
  if (!value || typeof value !== 'object') value = {};
  const finite = (n, fallback) => Number.isFinite(Number(n)) ? Number(n) : fallback;
  return {
    template: ['rover', 'sensor', 'lamp'].includes(value.template) ? value.template : 'rover',
    width: Math.round(Math.max(100, Math.min(260, finite(value.width, 180))) / 10) * 10,
    finish: Object.hasOwn(FINISHES, value.finish) ? value.finish : DEFAULT_DESIGN.finish,
    explode: Math.max(0, Math.min(100, finite(value.explode, 25))),
    wireframe: value.wireframe === true
  };
}

// A deliberately bounded bilingual parser: no model call and no invented inference.
export function parseBrief(text, current = DEFAULT_DESIGN) {
  const brief = String(text).slice(0, 360).toLowerCase().replace(/[٠-٩]/g, n => '٠١٢٣٤٥٦٧٨٩'.indexOf(n));
  const result = normalizeDesign(current);
  const matched = [];
  const templates = [['rover', /\brover\b|\brobot\b|مستكشف|روبوت|عرب[ةه]|روفر/], ['sensor', /\bsensor\b|\benclosure\b|حساس|مستشعر/], ['lamp', /\blamp\b|\blight\b|مصباح|إضاءة|اضاءة/]];
  for (const [id, pattern] of templates) if (pattern.test(brief)) { result.template = id; matched.push('template'); break; }
  const finishes = [['turquoise', /\bturquoise\b|\bteal\b|تركواز|تركوازي|فيروزي|تركوازى/], ['lime', /\blime\b|\bneon\b|ليموني|ليمونى/], ['ruby', /\bred\b|\bruby\b|أحمر|احمر|حمراء/], ['silver', /\bsilver\b|\btitanium\b|فضي|تيتانيوم/], ['mint', /\bmint\b|\bgreen\b|أخضر|اخضر|خضراء/]];
  for (const [id, pattern] of finishes) if (pattern.test(brief)) { result.finish = id; matched.push('finish'); break; }
  const dimension = brief.match(/(?:width|wide|عرض|بعرض)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(cm|mm|سم|مم)?/) || brief.match(/(\d+(?:\.\d+)?)\s*(mm|cm|مم|سم)(?![a-z\u0600-\u06ff])/);
  let clamped = false;
  if (dimension) {
    const requested = Number(dimension[1]) * (['cm', 'سم'].includes(dimension[2]) ? 10 : 1);
    result.width = requested;
    clamped = requested < 100 || requested > 260;
    matched.push('width');
  }
  return { design: normalizeDesign(result), matched, clamped };
}

export function specification(design) {
  const d = normalizeDesign(design);
  const lengthFactor = d.template === 'rover' ? 1.4 : d.template === 'sensor' ? 1.15 : 1;
  return { schema: 'aifrahat.concept.v1', units: 'mm', template: d.template, base: { width: d.width, length: Math.round(d.width * lengthFactor), thickness: 8, cornerRadius: d.template === 'lamp' ? d.width / 2 : 12 }, finish: d.finish, preview: { explode: d.explode, wireframe: d.wireframe }, generator: 'Deterministic local template; no AI inference', exportScope: 'Single solid concept base. Electronics and moving parts are visual references only.', validation: 'Not manufacturing certified. Check scale, clearances, material, tolerances and safety before fabrication.' };
}

export function briefMarkdown(design) {
  const s = specification(design);
  return `# AiFRAHAT / ${s.template.toUpperCase()} concept\n\n- Base: ${s.base.width} x ${s.base.length} x ${s.base.thickness} mm\n- Finish: ${s.finish} (visual only)\n- Units: millimeters\n\n## Method\n${s.generator}.\n\n## Export scope\n${s.exportScope}\n\n## Required review\n${s.validation}\n\n## Next steps\n- Establish functional requirements and constraints.\n- Select and measure real components.\n- Add mounting holes, wall thicknesses and clearance.\n- Inspect mesh and prototype before committing to fabrication.\n\nSource: https://github.com/AiFrahat/aifrahat\n`;
}
