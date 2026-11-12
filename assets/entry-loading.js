(() => {
  const button = document.querySelector('#enter');
  const hint = document.querySelector('#entry-loading-hint');
  let progress = 0, stage = 'start', arabic = false;
  const copy = {
    en: { start: 'PREPARING YOUR UNIVERSE', city: 'BUILDING THE CITY', character: 'PREPARING YOUR EXPLORER', scene: 'CONNECTING THE WORLD', shaders: 'FINISHING THE LIGHTS', ready: 'ENTER THE UNIVERSE', error: '3D UNAVAILABLE' },
    ar: { start: 'بنجهّز عالمك', city: 'بنبني المدينة', character: 'بنجهّز شخصيتك', scene: 'بنربط العالم', shaders: 'آخر لمسات الإضاءة', ready: 'ادخل العالم', error: 'العرض غير متاح' }
  };
  function render() {
    const language = arabic ? 'ar' : 'en';
    button.replaceChildren();
    const label = document.createElement('span');
    label.className = 'entry-loading-label';
    label.textContent = copy[language][stage];
    const value = document.createElement('span');
    value.className = 'entry-loading-value';
    value.textContent = stage === 'error' ? '!' : stage === 'ready' ? '↗' : `${progress}%`;
    button.append(label, value);
    button.style.setProperty('--entry-progress', `${progress}%`);
    button.dataset.loadingStage = stage;
    button.setAttribute('aria-busy', String(stage !== 'ready' && stage !== 'error'));
    button.setAttribute('aria-label', `${label.textContent}${stage === 'ready' || stage === 'error' ? '' : ` ${progress}%`}`);
    hint.textContent = stage === 'ready'
      ? (arabic ? 'عالمك جاهز. يلا نستكشفه.' : 'Your universe is ready. Let’s explore.')
      : stage === 'error' ? ''
      : (arabic ? 'تقدّم مراحل التجهيز — الزرار هيفتح أول ما العالم يجهز.' : 'World preparation progress — entry unlocks when everything is ready.');
  }
  window.universeLoading = {
    update(value, name) { progress = Math.max(progress, value); stage = name; render(); },
    language(isArabic) { arabic = isArabic; render(); }
  };
  render();
})();
