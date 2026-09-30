import { t, icons } from './ui.js';

const panels = [...document.querySelectorAll('[data-game-panel]')];
const tabs = [...document.querySelectorAll('[data-game]')];
const controllers = new Map();
const loading = new Map();
let active = 'chess';
async function select(name) {
  controllers.get(active)?.deactivate?.();
  active = name;
  for (const tab of tabs) { tab.setAttribute('aria-selected', String(tab.dataset.game === name)); tab.tabIndex = tab.dataset.game === name ? 0 : -1; }
  for (const panel of panels) panel.hidden = panel.dataset.gamePanel !== name;
  const panel = panels.find(p => p.dataset.gamePanel === name);
  if (!controllers.has(name)) {
    if (!loading.has(name)) {
      panel.textContent = t('جارٍ تحضير التجربة…', 'Preparing the experiment…');
      loading.set(name, import(`./${name}-game.js`).then(module => module.mount(panel)).then(controller => { controllers.set(name, controller); return controller; }).catch(error => {
        loading.delete(name);
        panel.replaceChildren();
        const message = document.createElement('p'); message.textContent = t('تعذّر تحميل اللعبة. حاول مرة أخرى.', 'The game could not load. Please retry.');
        const retry = document.createElement('button'); retry.className = 'button primary-action'; retry.textContent = t('إعادة المحاولة', 'Retry'); retry.onclick = () => select(name);
        panel.append(message, retry); console.error(error);
      }));
    }
    await loading.get(name);
  }
  if (active === name) controllers.get(name)?.activate?.();
  else controllers.get(name)?.deactivate?.();
  icons();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => select(tab.dataset.game));
  tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].focus(); select(tabs[next].dataset.game);
  });
});
document.addEventListener('languagechange', () => controllers.forEach(c => c.render?.()));
document.addEventListener('visibilitychange', () => document.hidden ? controllers.get(active)?.deactivate?.() : controllers.get(active)?.activate?.());
select('chess');
