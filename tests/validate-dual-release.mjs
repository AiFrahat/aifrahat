// Run from any directory: node tests/validate-dual-release.mjs [--evidence PATH]
// This checks static references; real browser/network tests cover computed URLs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const evidenceAt = args.indexOf('--evidence');
const evidencePath = evidenceAt < 0 ? null : path.resolve(args[evidenceAt + 1]);
const base = '68f46e6f85e97da3f75927b8767817b3d9545dee';
const errors = [], references = [], dynamicReferences = [], baseline = [];
const files = new Set(), directories = new Set(['']), visited = new Set();
const htmlIds = new Map();
const slash = value => value.split(path.sep).join('/');
const fail = (kind, file, detail) => errors.push({ kind, file, detail });
const digest = (algorithm, value) => crypto.createHash(algorithm).update(value).digest('hex');
const text = file => fs.readFileSync(path.join(root, file), 'utf8');

function inventory(folder = '') {
  for (const entry of fs.readdirSync(path.join(root, folder), { withFileTypes: true })) {
    if (['.git', 'node_modules', '.test-results', 'artifacts', 'backups'].includes(entry.name)) continue;
    const file = path.posix.join(folder, entry.name);
    const stat = fs.lstatSync(path.join(root, file));
    if (stat.isSymbolicLink()) { fail('symlink', file, 'Release must not depend on symlink targets.'); continue; }
    if (stat.isDirectory()) { directories.add(file); inventory(file); }
    else if (stat.isFile()) files.add(file);
    if (file.startsWith('classic/') && /(?:^|\/)(?:\.env(?:\..*)?|\.git|id_rsa|id_ed25519)$|\.(?:pem|key|pfx|p12|sqlite3?|db|sql|bak|lnk)$/i.test(file)) {
      fail('sensitive-file-type', file, 'Unexpected secret, database, backup, or shortcut file in classic.');
    }
  }
}

function entities(value) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, entity => {
    const named = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>' };
    if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
    const hex = entity[2].toLowerCase() === 'x';
    const number = parseInt(entity.slice(hex ? 3 : 2, -1), hex ? 16 : 10);
    return number <= 0x10ffff ? String.fromCodePoint(number) : entity;
  });
}

function tags(source) {
  const result = [];
  const clean = source.replace(/<!--[\s\S]*?-->/g, '');
  for (const match of clean.matchAll(/<([a-z][\w:-]*)\b((?:"[^"]*"|'[^']*'|[^'">])*)>/gi)) {
    const attrs = {};
    for (const attr of match[2].matchAll(/([^\s=/'"<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s'"=<>`]+)))?/g)) {
      attrs[attr[1].toLowerCase()] = entities(attr[2] ?? attr[3] ?? attr[4] ?? '');
    }
    result.push({ tag: match[1].toLowerCase(), attrs });
  }
  return result;
}

function ids(file) {
  if (!htmlIds.has(file)) {
    const ids = new Set();
    for (const { tag, attrs } of tags(text(file))) {
      if (attrs.id) ids.add(attrs.id);
      if (tag === 'a' && attrs.name) ids.add(attrs.name);
    }
    htmlIds.set(file, ids);
  }
  return htmlIds.get(file);
}

function reference(source, raw, kind) {
  const value = entities(raw).trim();
  if (!value) return;
  if (/^(?:https?:|mailto:|tel:|data:|blob:|\/\/)/i.test(value)) return;
  if (/^[a-z][a-z\d+.-]*:/i.test(value)) { fail('unsupported-url-scheme', source, value); return; }
  if (value.includes('${')) { dynamicReferences.push({ source, value, kind }); return; }
  const hashIndex = value.indexOf('#');
  const rawFragment = hashIndex < 0 ? '' : value.slice(hashIndex + 1);
  let urlPath = value.split(/[?#]/, 1)[0], fragment;
  try { urlPath = decodeURIComponent(urlPath); fragment = decodeURIComponent(rawFragment); }
  catch { fail('invalid-url-encoding', source, value); return; }
  if (urlPath.includes('\\') || urlPath.includes('\0')) { fail('unsafe-path', source, value); return; }
  const segments = urlPath.startsWith('/') ? [] : path.posix.dirname(source).split('/').filter(p => p !== '.');
  if (!urlPath) segments.splice(0, segments.length, ...source.split('/'));
  else for (const part of urlPath.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (!segments.length) { fail('path-traversal', source, value); return; }
      segments.pop();
    } else segments.push(part);
  }
  let target = segments.join('/');
  if (directories.has(target)) {
    if (kind === 'js-local-literal') {
      references.push({ source, value, target, kind, directory: true }); return;
    }
    target = path.posix.join(target, 'index.html');
  }
  const record = { source, value, target, kind };
  references.push(record);
  if (!files.has(target)) { fail('missing-or-case-mismatched-reference', source, record); return; }
  if (fragment && /\.(?:html?|svg)$/i.test(target) && !ids(target).has(fragment)) {
    fail('missing-anchor', source, record);
  }
  scan(target);
}

function scanCss(source, content) {
  const clean = content.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const match of clean.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi)) {
    reference(source, match[1] ?? match[2] ?? match[3], 'css-url');
  }
  for (const match of clean.matchAll(/@import\s+(?:"([^"]*)"|'([^']*)')/gi)) {
    reference(source, match[1] ?? match[2], 'css-import');
  }
}

function srcsetUrls(value) {
  // Standard URL plus optional w/x descriptor. Data URLs may contain commas.
  const urls = [];
  let remaining = value.trim();
  while (remaining) {
    const match = remaining.match(/^(\S+)(?:\s+([^,]*))?(?:,\s*|$)/);
    if (!match) break;
    const token = match[1].replace(/,+$/, '');
    if (token.startsWith('data:')) urls.push(token);
    else urls.push(...token.split(',').filter(Boolean));
    remaining = remaining.slice(match[0].length).trim();
  }
  return urls;
}

function scan(file) {
  if (visited.has(file)) return;
  visited.add(file);
  if (!/\.(?:html?|css|js|mjs|json|svg)$/i.test(file)) return;
  const content = text(file);
  if (/\.(?:html?|svg)$/i.test(file)) {
    for (const { tag, attrs } of tags(content)) {
      for (const attribute of ['src', 'href', 'poster', 'action', 'xlink:href']) {
        if (attrs[attribute] !== undefined) reference(file, attrs[attribute], `${tag}[${attribute}]`);
      }
      if (attrs.srcset) for (const value of srcsetUrls(attrs.srcset)) reference(file, value, `${tag}[srcset]`);
      if (attrs.style) scanCss(file, attrs.style);
    }
    for (const match of content.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) scanCss(file, match[1]);
  } else if (file.endsWith('.css')) scanCss(file, content);
  else if (/\.(?:js|mjs)$/.test(file)) {
    // Deliberately bounded to local path literals. Documentation URLs and arbitrary
    // third-party prose are not treated as runtime references.
    for (const match of content.matchAll(/(["'`])((?:\/assets\/|\.\/|\.\.\/)[^"'`\r\n]{1,220})\1/g)) {
      reference(file, match[2], 'js-local-literal');
    }
  } else if (file.endsWith('.json')) {
    try {
      const walk = value => {
        if (typeof value === 'string' && /^(?:\/assets\/|\.\/|\.\.\/)/.test(value)) reference(file, value, 'json-local-path');
        else if (Array.isArray(value)) value.forEach(walk);
        else if (value && typeof value === 'object') Object.values(value).forEach(walk);
      };
      walk(JSON.parse(content));
    } catch (error) { fail('invalid-json', file, error.message); }
  }
}

function preserveGitHubFiles() {
  // Only the entry markup, documentation and test updates are allowed to change.
  // All previously tracked cinematic bundles, styles, media and other files must
  // retain the exact GitHub bytes; added integration files are checked separately.
  const allowed = file => file === 'index.html' || file === 'README.md' || file.startsWith('tests/') || file.startsWith('docs/');
  const tree = execFileSync('git', ['ls-tree', '-r', '-z', base], { cwd: root, encoding: 'utf8' });
  for (const entry of tree.split('\0').filter(Boolean)) {
    const match = entry.match(/^(\d+) (\S+) ([0-9a-f]+)\t([\s\S]*)$/);
    if (!match) { fail('git-tree-entry', '', entry); continue; }
    const [, mode, type, expected, file] = match;
    if (type !== 'blob' || mode === '120000') { fail('unsupported-base-object', file, mode); continue; }
    if (allowed(file)) continue;
    if (!files.has(file)) { fail('missing-baseline-file', file, expected); continue; }
    const bytes = fs.readFileSync(path.join(root, file));
    const actual = execFileSync('git', ['hash-object', '--path=' + file, file], { cwd: root, encoding: 'utf8' }).trim();
    baseline.push({ file, gitBlob: expected, sha256: digest('sha256', bytes), unchanged: actual === expected });
    if (actual !== expected) fail('changed-baseline-file', file, { expected, actual });
  }
}

try {
  inventory();
  if (!files.has('index.html')) fail('missing-entry', 'index.html', 'Cinematic entry is required.');
  else scan('index.html');
  const classicHtml = [...files].filter(file => /^classic\/[^/]+\.html$/.test(file));
  if (classicHtml.length !== 10) fail('classic-page-count', 'classic/', { expected: 10, actual: classicHtml.length });
  for (const file of classicHtml) scan(file);
  for (const file of files) if (file.startsWith('classic/') && /\.(?:css|js|json)$/.test(file)) scan(file);
  preserveGitHubFiles();
} catch (error) { fail('validator-exception', '', error.stack ?? error.message); }

const result = {
  observedUtc: new Date().toISOString(),
  baselineCommit: base,
  passed: errors.length === 0,
  counts: { files: files.size, inspected: visited.size, references: references.length, baselineFilesPreserved: baseline.filter(item => item.unchanged).length, errors: errors.length, dynamicReferencesDeferred: dynamicReferences.length },
  limitations: [
    'Static tag/CSS/literal analysis is not a full HTML, CSS or JavaScript parser.',
    'Computed JavaScript URLs, runtime DOM changes, external destinations, MIME types, redirect behavior and network failures require browser E2E.',
    'Directory references are checked for presence; the hosting server must provide normal index.html and trailing-slash handling.',
    'Preservation permits changes to index.html, README.md, tests/ and docs/; every other previously tracked file is checked against the original GitHub Git blob.',
    'Secret-file checks concern file types in classic; they are not a full content/history secret scan.'
  ],
  errors, dynamicReferences, references, baseline
};
if (evidencePath) {
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(evidencePath, JSON.stringify(result, null, 2) + '\n');
}
console.log(JSON.stringify({ passed: result.passed, counts: result.counts, errors, evidencePath }, null, 2));
if (!result.passed) process.exitCode = 1;
