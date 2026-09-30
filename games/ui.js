export const $ = (root, selector) => root.querySelector(selector);
export const t = (ar, en) => document.documentElement.lang === 'en' ? en : ar;
export const copy = (ar, en, tag = 'span', attrs = '') => `<${tag} ${attrs} data-ar="${ar}" data-en="${en}">${t(ar, en)}</${tag}>`;
export const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
export const icons = () => window.lucide?.createIcons({ attrs: { 'aria-hidden': 'true' } });
const libraries = new Map();
export function loadLibrary(url, name) {
  if (window[name]) return Promise.resolve(window[name]);
  if (!libraries.has(name)) libraries.set(name, new Promise((resolve, reject) => {
    const script = document.createElement('script'); script.src = url;
    script.onload = () => resolve(window[name]);
    script.onerror = () => { libraries.delete(name); script.remove(); reject(new Error(`Unable to load ${name}`)); };
    document.head.append(script);
  }));
  return libraries.get(name);
}
export function download(text, filename, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
