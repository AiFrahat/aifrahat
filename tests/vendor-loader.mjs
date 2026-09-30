export function resolve(specifier, context, nextResolve) {
  if (specifier === 'three') return nextResolve(new URL('../vendor/three.module.min.js', import.meta.url).href, context);
  return nextResolve(specifier, context);
}
