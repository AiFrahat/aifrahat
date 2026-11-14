const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#mobile-nav');
function closeMenu(){if(!nav||!menu)return;nav.hidden=true;menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label',window.__aiTr?window.__aiTr('فتح القائمة'):'فتح القائمة')}
if(menu&&nav){menu.addEventListener('click',()=>{nav.hidden=!nav.hidden;menu.setAttribute('aria-expanded',String(!nav.hidden));menu.setAttribute('aria-label',window.__aiTr?(nav.hidden?window.__aiTr('فتح القائمة'):window.__aiTr('إغلاق القائمة')):(nav.hidden?'فتح القائمة':'إغلاق القائمة'))});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()})}
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in');observer.unobserve(entry.target)}}),{threshold:.15});
document.querySelectorAll('.rv').forEach(el=>reduced?el.classList.add('in'):observer.observe(el));
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelectorAll('.project').forEach(card=>{card.hidden=button.dataset.filter!=='all'&&card.dataset.category!==button.dataset.filter;if(!card.hidden)card.classList.add('in')})}));
document.querySelectorAll('.faq-q').forEach((button,i)=>{const answer=button.nextElementSibling;answer.id='answer-'+i;button.setAttribute('aria-controls',answer.id);answer.inert=true;button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));button.parentElement.classList.toggle('open',open);answer.inert=!open;answer.style.maxHeight=open?answer.scrollHeight+'px':'0px'})});
const counters=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)return;const el=e.target,end=Number(el.dataset.count),start=performance.now();function tick(t){const p=reduced?1:Math.min((t-start)/1400,1);el.textContent=Math.round(end*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(tick)}requestAnimationFrame(tick);counters.unobserve(el)}),{threshold:.15});document.querySelectorAll('[data-count]').forEach(e=>counters.observe(e));
const timeline=document.querySelector('.timeline');let scheduled=false;
function drawTimeline(){scheduled=false;if(!timeline)return;const dots=[...timeline.querySelectorAll('.t-dot')],fill=timeline.querySelector('.t-fill'),rect=timeline.getBoundingClientRect();const positions=dots.map(d=>{const r=d.getBoundingClientRect();return {x:r.left+r.width/2-rect.left,y:r.top+r.height/2-rect.top}});if(!positions.length)return;const first=positions[0],last=positions.at(-1),reach=innerHeight*.62-rect.top,end=Math.max(first.y,Math.min(last.y,reach));fill.style.left=first.x+'px';fill.style.top=first.y+'px';fill.style.height=end-first.y+'px';dots.forEach((d,i)=>{const lit=positions[i].y<=reach;d.classList.toggle('on',lit);d.closest('.t-row').classList.toggle('lit',lit)})}
function scheduleDraw(){if(!scheduled){scheduled=true;requestAnimationFrame(drawTimeline)}}addEventListener('scroll',scheduleDraw,{passive:true});addEventListener('resize',()=>{scheduleDraw();document.querySelectorAll('.faq-item.open .faq-a').forEach(a=>a.style.maxHeight=a.scrollHeight+'px');if(innerWidth>850)closeMenu()});addEventListener('load',scheduleDraw);timeline?.addEventListener('transitionend',scheduleDraw);scheduleDraw();
/* ---------- Batch 4C: screenshot showcase (only pages containing [data-showcase]) ---------- */
(()=>{const roots=[...document.querySelectorAll('[data-showcase]')];if(!roots.length)return;
const bind=root=>{const slides=[...root.querySelectorAll('.showcase-slide')];if(slides.length<2)return;
const ui=[...root.querySelectorAll('[data-showcase-ui]')];ui.forEach(el=>{el.hidden=false});
root.classList.add('is-enhanced');
const thumbs=[...root.querySelectorAll('.showcase-thumb')];
const prev=root.querySelector('.showcase-prev'),next=root.querySelector('.showcase-next'),zoomBtn=root.querySelector('.showcase-zoom'),current=root.querySelector('.showcase-current');
const dialog=document.querySelector('[data-showcase-lightbox]');
const lbTitle=dialog?dialog.querySelector('#showcase-lb-title'):null,lbImg=dialog?dialog.querySelector('.showcase-lb-img'):null,lbPrev=dialog?dialog.querySelector('.showcase-lb-prev'):null,lbNext=dialog?dialog.querySelector('.showcase-lb-next'):null,lbCount=dialog?dialog.querySelector('.showcase-lb-counter span'):null,lbClose=dialog?dialog.querySelector('.showcase-lb-close'):null,lbZoom=dialog?dialog.querySelector('.showcase-lb-zoom'):null;
const rtl=getComputedStyle(root).direction==='rtl';const total=slides.length;let idx=0,trigger=null,savedScroll=null;
const imgOf=s=>s.querySelector('img');
const fillLb=()=>{if(!dialog||!lbImg)return;const s=slides[idx],im=imgOf(s);if(!im)return;if(lbTitle)lbTitle.textContent=s.dataset.title||'';lbImg.src=im.src;if(im.getAttribute('width'))lbImg.setAttribute('width',im.getAttribute('width'));if(im.getAttribute('height'))lbImg.setAttribute('height',im.getAttribute('height'));lbImg.alt=im.alt;if(lbCount)lbCount.textContent=String(idx+1)};
const paint=()=>{slides.forEach((s,n)=>{if(n===idx){s.setAttribute('data-active','');s.setAttribute('aria-hidden','false')}else{s.removeAttribute('data-active');s.setAttribute('aria-hidden','true')}});thumbs.forEach((t,n)=>t.setAttribute('aria-current',n===idx?'true':'false'));if(current)current.textContent=String(idx+1);if(dialog&&dialog.open)fillLb()};
const go=d=>{idx=(idx+d+total)%total;paint()};
const open=()=>{if(!dialog||!lbImg)return;trigger=document.activeElement;savedScroll=window.scrollY;fillLb();if(lbZoom)lbZoom.setAttribute('aria-pressed','false');lbImg.classList.remove('is-zoomed');document.documentElement.classList.add('showcase-locked');document.body.classList.add('showcase-locked');dialog.hidden=false;try{dialog.showModal()}catch(e){dialog.setAttribute('open','')};requestAnimationFrame(()=>{if(lbClose)lbClose.focus()})};
if(prev)prev.addEventListener('click',()=>go(-1));if(next)next.addEventListener('click',()=>go(1));
thumbs.forEach((t,n)=>t.addEventListener('click',()=>{idx=n;paint()}));
if(zoomBtn)zoomBtn.addEventListener('click',open);
root.addEventListener('keydown',e=>{if(e.target.closest('dialog'))return;const pK=rtl?'ArrowRight':'ArrowLeft',nK=rtl?'ArrowLeft':'ArrowRight';
if(e.key===pK){e.preventDefault();go(-1)}else if(e.key===nK){e.preventDefault();go(1)}else if(e.key==='Home'){e.preventDefault();idx=0;paint()}else if(e.key==='End'){e.preventDefault();idx=total-1;paint()}});
if(dialog&&lbImg){const close=()=>{try{dialog.close()}catch(e){dialog.removeAttribute('open');cleanup()}};
const cleanup=()=>{document.documentElement.classList.remove('showcase-locked');document.body.classList.remove('showcase-locked');lbImg.classList.remove('is-zoomed');if(lbZoom)lbZoom.setAttribute('aria-pressed','false');if(trigger&&typeof trigger.focus==='function')trigger.focus();if(savedScroll!==null){const y=savedScroll;savedScroll=null;window.scrollTo({top:y,left:0,behavior:'instant'})}};
dialog.addEventListener('close',cleanup);
if(lbClose)lbClose.addEventListener('click',close);
if(lbPrev)lbPrev.addEventListener('click',()=>{idx=(idx-1+total)%total;paint()});
if(lbNext)lbNext.addEventListener('click',()=>{idx=(idx+1)%total;paint()});
if(lbZoom)lbZoom.addEventListener('click',()=>{const on=lbZoom.getAttribute('aria-pressed')!=='true';lbZoom.setAttribute('aria-pressed',String(on));lbImg.classList.toggle('is-zoomed',on)});
dialog.addEventListener('click',e=>{if(e.target===dialog)close()});
dialog.addEventListener('keydown',e=>{
if(e.key==='Escape'){e.preventDefault();close();return}
if(e.key==='Tab'){const f=[...dialog.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(el=>!el.disabled&&el.offsetParent!==null);if(!f.length)return;const a=f[0],b=f[f.length-1];if(e.shiftKey&&document.activeElement===a){e.preventDefault();b.focus()}else if(!e.shiftKey&&document.activeElement===b){e.preventDefault();a.focus()}return}
const pK=rtl?'ArrowRight':'ArrowLeft',nK=rtl?'ArrowLeft':'ArrowRight';
if(e.key===pK){e.preventDefault();idx=(idx-1+total)%total;paint()}else if(e.key===nK){e.preventDefault();idx=(idx+1)%total;paint()}})}
paint()};
roots.forEach(bind)})();


/* ---------- Batch 5: bilingual UI, theme switch, persisted preferences ---------- */
(()=>{
  const EN=window.__AI18N_EN__||{};
  const root=document.documentElement;
  const LK='aifrahat-lang',TK='aifrahat-theme';
  const textOrig=new WeakMap();
  const attrOrig=new WeakMap();
  const ATTRS=['aria-label','alt','title','placeholder','content','data-title','data-meta'];
  const mqReduced=matchMedia('(prefers-reduced-motion: reduce)');
  const isEn=()=>root.lang==='en';
  const store=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
  window.__aiTr=(ar)=>isEn()?(EN[ar]||ar):ar;

  function translateTextNodes(){
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode(n){
      if(!n.nodeValue||!n.nodeValue.trim())return NodeFilter.FILTER_REJECT;
      const p=n.parentElement;
      if(!p||/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|SVG|PATH)$/.test(p.tagName))return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }});
    const nodes=[]; let n;
    while((n=walker.nextNode()))nodes.push(n);
    for(const node of nodes){
      if(isEn()){
        const raw=node.nodeValue,key=raw.trim();
        if(!EN[key])continue;
        if(!textOrig.has(node))textOrig.set(node,raw);
        const orig=textOrig.get(node);
        node.nodeValue=orig.replace(key,EN[key]);
      }else if(textOrig.has(node)){
        node.nodeValue=textOrig.get(node);
      }
    }
    for(const el of document.querySelectorAll('*')){
      for(const a of ATTRS){
        const v=el.getAttribute(a);
        if(v===null)continue;
        let rec=attrOrig.get(el);
        if(isEn()){
          const key=v.trim();
          if(!EN[key])continue;
          if(!rec){rec={};attrOrig.set(el,rec);}
          if(!(a in rec))rec[a]=v;
          el.setAttribute(a,rec[a].replace(key,EN[key]));
        }else if(rec&&a in rec){
          el.setAttribute(a,rec[a]);
        }
      }
    }
  }

  function updateControls(){
    const en=isEn(),dark=root.dataset.theme==='dark';
    for(const b of document.querySelectorAll('[data-lang-toggle]')){
      b.hidden=false;
      b.textContent=en?'AR':'EN';
      b.setAttribute('aria-label',en?'Switch to Arabic':'التبديل إلى الإنجليزية');
      b.setAttribute('title',en?'Switch to Arabic':'التبديل إلى الإنجليزية');
    }
    for(const b of document.querySelectorAll('[data-theme-toggle]')){
      b.hidden=false;
      b.setAttribute('aria-pressed',String(dark));
      b.setAttribute('aria-label',en?(dark?'Switch to light theme':'Switch to dark theme'):(dark?'تفعيل الوضع الفاتح':'تفعيل الوضع الداكن'));
      b.setAttribute('title',en?(dark?'Switch to light theme':'Switch to dark theme'):(dark?'تفعيل الوضع الفاتح':'تفعيل الوضع الداكن'));
      const ic=b.querySelector('span');
      if(ic)ic.textContent=dark?'☀':'◐';
    }
    const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#mobile-nav');
    if(menu&&nav)menu.setAttribute('aria-label',nav.hidden?(en?'Open menu':'فتح القائمة'):(en?'Close menu':'إغلاق القائمة'));
  }

  function applyLang(lang,persist){
    const target=lang==='en'?'en':'ar';
    root.lang=target;
    root.dir=target==='en'?'ltr':'rtl';
    try{translateTextNodes();}catch(e){}
    root.classList.remove('i18n-loading');
    updateControls();
    if(persist)store(LK,target);
  }

  function applyTheme(theme,persist){
    root.dataset.theme=theme==='dark'?'dark':'light';
    updateControls();
    if(persist)store(TK,root.dataset.theme);
  }

  if(!root.dataset.theme)root.dataset.theme='light';
  applyLang(root.lang==='en'?'en':'ar',false);
  applyTheme(root.dataset.theme,false);

  document.addEventListener('click',e=>{
    const langBtn=e.target.closest('[data-lang-toggle]');
    if(langBtn){e.preventDefault();applyLang(isEn()?'ar':'en',true);return;}
    const themeBtn=e.target.closest('[data-theme-toggle]');
    if(themeBtn){e.preventDefault();applyTheme(root.dataset.theme==='dark'?'light':'dark',true);return;}
  });
})();

/* ---------- Profile visual upgrade: internal subsection navigation + scrollspy ---------- */
(() => {
  const nav = document.querySelector('.profile-subnav');
  if (!nav) return;
  const links = [...nav.querySelectorAll('.psn-links a[href^="#pb-"]')];
  const sections = links.map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
  if (!links.length || sections.length !== links.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobileMq = matchMedia('(max-width: 1100px)');
  let active = null;
  let ticking = false;
  let clickLock = false;
  let lockTimer = 0;
  const headerOffset = () => {
    const header = document.querySelector('.nav');
    const h = header ? header.getBoundingClientRect().height : 0;
    return mobileMq.matches ? h + nav.getBoundingClientRect().height + 80 : h + 130;
  };
  const revealActive = (link) => {
    if (!mobileMq.matches) return;
    const r = link.getBoundingClientRect();
    const n = nav.getBoundingClientRect();
    if (r.left < n.left + 12 || r.right > n.right - 12) {
      const target = nav.scrollLeft + (r.left - n.left) - 16;
      nav.scrollTo({ left: target, behavior: reduced.matches ? 'auto' : 'smooth' });
    }
  };
  const setActive = (id, reveal = true) => {
    const link = links.find(a => a.getAttribute('href') === '#' + id);
    if (!link || active === id) return;
    active = id;
    links.forEach(a => {
      const on = a === link;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
    if (reveal) revealActive(link);
  };
  const update = () => {
    ticking = false;
    if (clickLock) return;
    const offset = headerOffset();
    let current = sections[0].id;
    for (const section of sections) {
      if (section.getBoundingClientRect().top - offset <= 0) current = section.id;
    }
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      current = sections[sections.length - 1].id;
    }
    setActive(current);
  };
  const schedule = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };
  const clearLock = () => {
    if (!clickLock) return;
    clickLock = false;
    clearTimeout(lockTimer);
    update();
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('scrollend', clearLock, { passive: true });
  links.forEach(link => {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      clickLock = true;
      clearTimeout(lockTimer);
      lockTimer = setTimeout(clearLock, 1600);
      setActive(id);
      target.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
      try { history.pushState(null, '', '#' + id); } catch (e) {}
    });
  });
  const initial = location.hash && links.find(a => a.getAttribute('href') === location.hash);
  update();
  if (initial) setActive(location.hash.slice(1), false);
})();
