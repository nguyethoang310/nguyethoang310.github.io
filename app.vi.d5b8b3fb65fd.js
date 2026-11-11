// language.js
(() => {
  const english = document.documentElement.lang === 'en';
  document.addEventListener('DOMContentLoaded', () => {
    const control = document.querySelector('.language-switch');
    if (!control) return;
    let switching = false;
    control.addEventListener('click', () => {
      if (switching) return;
      switching = true;
      control.setAttribute('aria-checked', String(!english));
      const url = new URL(control.dataset.languageTarget, location.href);
      url.hash = location.hash;
      if (location.hostname.endsWith('.chatgpt.site')) url.pathname = url.pathname.replace(/index\.html$/, '').replace(/index\.en\.html$/, 'index.en');
      try { localStorage.setItem('portfolio-language', english ? 'vi' : 'en'); } catch (_) {}
      // Let the thumb settle before navigating; reduced-motion users switch immediately.
      const delay = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 180;
      setTimeout(() => location.assign(url.href), delay);
    });
    // Back/forward cache restores the original page without rerunning initialization.
    addEventListener('pageshow', () => {
      switching = false;
      control.setAttribute('aria-checked', String(english));
    });
  });
})();

;
// script.js
const tabs = Array.from(document.querySelectorAll('.chapter-tabs [role="tab"]'));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const activeEffects = new Set();
const elementEffects = new WeakMap();
const motionEntered = new WeakSet();
function animateOnce(element, frames, options = {}) {
  if (reducedMotion.matches || !element || typeof element.animate !== 'function') return;
  elementEffects.get(element)?.cancel();
  const timing = {duration:720,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards',...options};
  if (element.closest('#intro,.header')) {
    timing.duration = Math.min(timing.duration, 420);
    timing.delay = Math.min(timing.delay || 0, 60);
    frames = frames.map(frame => typeof frame.opacity === 'number' ? {...frame,opacity:Math.max(.65,frame.opacity)} : frame);
  }
  const effect = element.animate(frames, timing);
  elementEffects.set(element, effect);
  activeEffects.add(effect);
  effect.finished.catch(() => {}).finally(() => {
    activeEffects.delete(effect);
    if (elementEffects.get(element) === effect) elementEffects.delete(element);
  });
  return effect;
}
function softEnter(element, {delay = 0, x = 0, y = 20, scale = 1, duration = 780} = {}) {
  const distance = matchMedia('(max-width:620px)').matches ? .6 : 1;
  animateOnce(element, [
    {opacity: 0, translate: `${x * distance}px ${y * distance}px`, scale},
    {opacity: 1, translate: '0px 0px', scale: 1}
  ], {delay, duration});
}
// Short, distinct motion cues; all content stays visible if animation is disabled.
function motionReveal(element, kind = 'fade', {delay = 0, duration = 700, direction = 1} = {}) {
  const compact = matchMedia('(max-width:620px)').matches;
  const distance = compact ? 12 : 24;
  const frames = {
    fade: [{opacity:0}, {opacity:1}],
    side: [{opacity:0, translate:`${distance * direction}px 0px`}, {opacity:1, translate:'0px 0px'}],
    rise: [{opacity:0, translate:`0px ${compact ? 12 : 22}px`}, {opacity:1, translate:'0px 0px'}],
    zoom: [{opacity:0, scale:compact ? .98 : .96}, {opacity:1, scale:1}],
    wipe: [{opacity:.25, clipPath:'inset(-15% 100% -20% 0%)'}, {opacity:1, clipPath:'inset(-15% 0% -20% 0%)'}],
    aperture: [{opacity:.35, clipPath:'circle(35% at 50% 50%)', scale:1.035}, {opacity:1, clipPath:'circle(50% at 50% 50%)', scale:1}],
    settle: [{opacity:0, rotate:`${compact ? -1 : -3}deg`, scale:.97}, {opacity:1, rotate:'0deg', scale:1}],
    metal: [{opacity:.2, rotate:'-16deg', scale:.9}, {opacity:1, rotate:'0deg', scale:1}],
    underline: [{backgroundSize:'0% 100%', backgroundRepeat:'no-repeat'}, {backgroundSize:'100% 100%', backgroundRepeat:'no-repeat'}]
  };
  return animateOnce(element, frames[kind] || frames.fade, {delay, duration});
}
function drawStroke(path, delay = 0) {
  if (reducedMotion.matches || !path || typeof path.getTotalLength !== 'function') return;
  const length = path.getTotalLength();
  animateOnce(path, [{strokeDasharray:`${length}`,strokeDashoffset:length,opacity:0},
    {strokeDasharray:`${length}`,strokeDashoffset:0,opacity:1}], {delay,duration:850});
}
// Preserve the original text and whitespace, including Vietnamese diacritics.
function prepareTitle(element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    if (walker.currentNode.textContent.trim()) nodes.push(walker.currentNode);
  }
  for (const node of nodes) {
    const fragment = document.createDocumentFragment();
    for (const text of node.textContent.split(/(\s+)/)) {
      if (!text.trim()) { fragment.append(document.createTextNode(text)); continue; }
      const mask = document.createElement('span');
      mask.className = 'title-word-mask';
      const word = document.createElement('span');
      word.className = 'title-word';
      word.textContent = text;
      mask.append(word);
      fragment.append(mask);
    }
    node.replaceWith(fragment);
  }
}
document.querySelectorAll('.hero h1,#journey-title,#clients-title').forEach(prepareTitle);
const runningTitleEffects = new WeakMap();
function replayAccent(element, className) {
  if (reducedMotion.matches) return;
  if (!element.classList.contains(className)) { element.classList.add(className); return; }
  element.classList.remove(className);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (!reducedMotion.matches && element.isConnected && !element.hidden) element.classList.add(className);
  }));
}
function revealTitle(element, delay = 0) {
  if (!element) return;
  runningTitleEffects.get(element)?.forEach(effect => effect.cancel());
  const effects = [];
  // Move the full heading for fly-ins so word masks do not turn motion into a wipe.
  if (element.id === 'sunworld-title') {
    element.querySelectorAll('.title-word').forEach((word, i) => {
      const effect = motionReveal(word, 'wipe', {delay:delay+i*65,duration:800});
      if (effect) effects.push(effect);
    });
  } else {
    const kind = element.id === 'journey-title' ? 'rise'
      : element.id === 'projects-title' ? 'side'
      : element.closest('#intro-title') && !element.matches('.name-prefix') ? 'side' : 'fade';
    const effect = motionReveal(element, kind, {delay,direction:-1,duration:800});
    if (effect) effects.push(effect);
  }
  runningTitleEffects.set(element, effects);
  replayAccent(element, 'title-arrived');
}
function revealChapter(panel) {
  motionReveal(panel.querySelector('.unit-heading'), 'fade', {duration:550});
  motionReveal(panel.querySelector('.unit-logo'), 'settle', {delay:80,duration:700});
  panel.querySelectorAll('.role-entry').forEach((element, i) =>
    motionReveal(element, 'side', {delay:70+i*85,direction:i%2 ? -1 : 1,duration:650}));
  replayAccent(panel, 'timeline-awake');
}
function selectChapter(tab) {
  if (tab.getAttribute('aria-selected') === 'true') return;
  for (const item of tabs) {
    const active = item === tab;
    item.setAttribute('aria-selected', String(active));
    item.tabIndex = active ? 0 : -1;
    const panel = document.getElementById(item.getAttribute('aria-controls'));
    panel.hidden = !active;
    if (active) { motionEntered.add(panel); revealChapter(panel); }
  }
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectChapter(tab));
  tab.addEventListener('keydown', (event) => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    selectChapter(tabs[next]);
    tabs[next].focus();
  });
});
// Re-arm only after fully leaving the viewport, so stationary sections never loop.
const motionPlans = new WeakMap();
let entranceObserver;
function onEntrance(element, reveal) {
  if (!element || reducedMotion.matches) return;
  if (!entranceObserver) { if (!element.hidden) reveal(); return; }
  motionPlans.set(element, reveal);
  entranceObserver.observe(element);
}
if ('IntersectionObserver' in window) {
  entranceObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) { motionEntered.delete(entry.target); continue; }
      if (entry.intersectionRatio < .2 || motionEntered.has(entry.target)) continue;
      motionEntered.add(entry.target);
      motionPlans.get(entry.target)?.();
    }
  }, {threshold: [0, .2], rootMargin: '0px 0px -24px 0px'});
  const portrait = document.querySelector('.hero-visual');
  const pause = new IntersectionObserver(([entry]) => {
    portrait.classList.toggle('effects-paused', !entry.isIntersecting);
  });
  pause.observe(portrait);
}
onEntrance(document.querySelector('.header'), () => {
  softEnter(document.querySelector('.header .brand'), {y: -8, duration: 600});
  softEnter(document.querySelector('.header nav'), {delay: 80, y: -8, duration: 600});
});
onEntrance(document.querySelector('.hero-copy'), () => {
  revealTitle(document.querySelector('.hero h1>.name-prefix'));
  revealTitle(document.querySelector('.hero h1>span:nth-child(2)'), 100);
  const sequence = ['.english-name', '.bio>p:first-child', '.bio>p:nth-child(2)', '.email-box'];
  sequence.forEach((selector, i) => motionReveal(document.querySelector(`.hero-copy ${selector}`),
    i === 0 ? 'side' : i === 3 ? 'zoom' : 'fade', {delay:180+i*65,direction:1,duration:650}));
});
onEntrance(document.querySelector('.hero-visual'), () => {
  motionReveal(document.querySelector('.portrait-frame'), 'zoom', {duration:420});
  motionReveal(document.querySelector('.orbit-one'), 'metal', {delay:120,duration:1100});
  motionReveal(document.querySelector('.orbit-two'), 'metal', {delay:200,duration:1100});
  motionReveal(document.querySelector('.orbit-star'), 'zoom', {delay:260,duration:800});
  motionReveal(document.querySelector('.experience-stamp'), 'settle', {delay:300,duration:850});
  motionReveal(document.querySelector('.role-note'), 'fade', {delay:280});
});
onEntrance(document.querySelector('.journey-heading'), () => {
  motionReveal(document.querySelector('.journey-heading .section-label'), 'fade');
  revealTitle(document.querySelector('#journey-title'), 70);
});
onEntrance(document.querySelector('.chapter-tabs'), () => tabs.forEach((tab, i) =>
  motionReveal(tab, 'side', {delay:i*65,direction:1,duration:600})));
document.querySelectorAll('.chapter-panel').forEach(panel =>
  onEntrance(panel, () => revealChapter(panel)));
// Wait until the title is mostly inside the reading area, and replay on re-entry.
(() => {
  const title = document.querySelector('#clients-title');
  if (!title || reducedMotion.matches) return;
  if (!('IntersectionObserver' in window)) { revealTitle(title); return; }
  let entered = false;
  const titleObserver = new IntersectionObserver(([entry]) => {
    if (entry.intersectionRatio >= .65 && !entered) {
      entered = true;
      revealTitle(title);
    } else if (!entry.isIntersecting) {
      entered = false;
    }
  }, {threshold: [0, .65], rootMargin: '0px 0px -32px 0px'});
  titleObserver.observe(title);
})();
document.querySelectorAll('.clients-overview,.clients-actions,.footer').forEach((element, i) =>
  onEntrance(element, () => motionReveal(element, i === 0 ? 'zoom' : 'fade', {delay:i===0 ? 100 : 0})));

// Local pointer interaction only: no page-wide mouse loop or mobile tilt.
(() => {
  const stage = document.querySelector('.portrait-stage');
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)');
  let frame = 0, bounds, point;
  function reset() {
    cancelAnimationFrame(frame); frame = 0; bounds = null;
    stage.style.removeProperty('--portrait-tilt-x');
    stage.style.removeProperty('--portrait-tilt-y');
  }
  stage.addEventListener('pointerenter', () => { bounds = stage.getBoundingClientRect(); });
  stage.addEventListener('pointermove', event => {
    if (reducedMotion.matches || !finePointer.matches) return;
    bounds ||= stage.getBoundingClientRect();
    point = {x: event.clientX, y: event.clientY};
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const x = Math.max(-1, Math.min(1, (point.x - bounds.left) / bounds.width * 2 - 1));
      const y = Math.max(-1, Math.min(1, (point.y - bounds.top) / bounds.height * 2 - 1));
      stage.style.setProperty('--portrait-tilt-x', `${-y * 1.6}deg`);
      stage.style.setProperty('--portrait-tilt-y', `${x * 2.2}deg`);
    });
  });
  stage.addEventListener('pointerleave', reset);
  stage.addEventListener('pointercancel', reset);
  reducedMotion.addEventListener('change', reset);
  window.addEventListener('resize', reset, {passive: true});
})();
document.addEventListener('visibilitychange', () => {
  document.body.classList.toggle('effects-paused', document.hidden);
});
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) for (const effect of activeEffects) effect.cancel();
});

// Four logos per turn; expanding provides immediate access to the full list.
(() => {
  const section = document.querySelector('.clients-section');
  const viewport = section?.querySelector('.clients-overview');
  const toggle = section?.querySelector('.clients-toggle');
  if (!toggle) return;
  const pages = section.querySelector('.clients-pages');
  const list = section.querySelector('.client-list');
  const starts = [0, 4, 8, Math.max(0, list.children.length - 4)];
  let current = 0, expanded = false, visible = false, hovered = false, focused = false;
  let timer, scrollTimer;
  const buttons = starts.map((start, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Xem lượt logo ${i + 1} trên ${starts.length}`);
    button.addEventListener('click', () => { show(i); schedule(); });
    pages.append(button);
    return button;
  });
  function update() {
    buttons.forEach((button, i) => button.setAttribute('aria-current', String(i === current)));
  }
  function show(index, smooth = true) {
    current = index;
    viewport.scrollTo({left: list.children[starts[index]].offsetLeft - list.children[0].offsetLeft,
      behavior: smooth && !reducedMotion.matches ? 'smooth' : 'instant'});
    update();
  }
  function schedule() {
    clearTimeout(timer);
    if (expanded || !visible || hovered || focused || document.hidden || reducedMotion.matches) return;
    timer = setTimeout(() => { show((current + 1) % starts.length); schedule(); }, 3200);
  }
  toggle.addEventListener('click', () => {
    expanded = !expanded;
    section.classList.toggle('is-compact', !expanded);
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.querySelector('span').textContent = expanded ? 'Thu gọn' : 'Xem tất cả';
    pages.hidden = expanded;
    viewport.tabIndex = expanded ? -1 : 0;
    if (expanded) list.querySelectorAll('.client-mark').forEach((mark, i) =>
      motionReveal(mark, 'zoom', {delay:Math.min(i*25,220),duration:500}));
    if (!expanded) show(0, false);
    schedule();
  });
  viewport.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      if (expanded) return;
      const first = list.children[0].offsetLeft;
      current = starts.reduce((best, start, i) =>
        Math.abs(list.children[start].offsetLeft - first - viewport.scrollLeft) <
        Math.abs(list.children[starts[best]].offsetLeft - first - viewport.scrollLeft) ? i : best, 0);
      update();
    }, 120);
  }, {passive: true});
  section.addEventListener('mouseenter', () => { hovered = true; schedule(); });
  section.addEventListener('mouseleave', () => { hovered = false; schedule(); });
  section.addEventListener('focusin', () => { focused = true; schedule(); });
  section.addEventListener('focusout', event => { focused = section.contains(event.relatedTarget); schedule(); });
  document.addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener('change', schedule);
  new ResizeObserver(() => { if (!expanded) show(current, false); }).observe(viewport);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); }).observe(section);
  } else { visible = true; }
  section.classList.add('is-compact');
  section.querySelector('.clients-actions').hidden = false;
  viewport.tabIndex = 0;
  viewport.setAttribute('role', 'region');
  viewport.setAttribute('aria-label', 'Logo khách hàng, bốn logo mỗi lượt');
  update();
  schedule();
})();



;
// project-images.js
// Decode project images ahead of interaction without loading every project at page entry.
window.projectImages = (() => {
  const cache = new Map(), revisions = new WeakMap();
  const connection = navigator.connection;
  const limited = connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '');
  const pending = new Set();
  let running = 0;
  function load(src) {
    if (cache.has(src)) return cache.get(src);
    const img = new Image();
    img.decoding = 'async';
    const entry = {image:img, ready:false};
    entry.promise = new Promise((resolve, reject) => {
      img.onload = async () => {
        try { await img.decode(); } catch (_) {}
        entry.ready = true; resolve(img);
      };
      img.onerror = () => { cache.delete(src); reject(new Error('Image unavailable: '+src)); };
      img.src = src;
    });
    cache.set(src, entry);
    return entry;
  }
  function pump() {
    while (running < 2 && pending.size) {
      const src = pending.values().next().value;
      pending.delete(src); running++;
      load(src).promise.catch(()=>{}).finally(()=>{ running--; pump(); });
    }
  }
  function warm(urls) {
    if (limited) return;
    urls.filter(Boolean).forEach(src=>{ if (!cache.has(src)) pending.add(src); });
    pump();
  }
  function register(section, urls) {
    if (!section || limited) return;
    let started = false;
    const start = () => { if (!started) { started=true; warm(urls); } };
    const observer = new IntersectionObserver(entries=>{
      if(entries.some(e=>e.isIntersecting)){start();observer.disconnect();}
    },{rootMargin:'700px 0px'});
    observer.observe(section);
    const project=section.closest('.project-panel');
    const trigger=document.getElementById(section.getAttribute('aria-labelledby')) || (project && document.querySelector('[aria-controls="'+project.id+'"]'));
    ['pointerenter','focus','touchstart'].forEach(event=>trigger?.addEventListener(event,start,{once:true,passive:true}));
  }
  function swap(container, items, done) {
    const revision=(revisions.get(container)||0)+1;
    revisions.set(container,revision);
    const entries=items.map(item=>load(item.src));
    const commit=()=>{
      if(revisions.get(container)!==revision)return;
      items.forEach(({element,src,alt})=>{element.loading='eager';element.src=src;element.alt=alt;});
      container.removeAttribute('aria-busy');
      if(done)done();
    };
    // A warm image can be painted immediately; a cold image keeps the previous frame intact.
    if(entries.every(entry=>entry.ready))commit();
    else {
      container.setAttribute('aria-busy','true');
      Promise.all(entries.map(entry=>entry.promise)).then(commit).catch(()=>{
        if(revisions.get(container)===revision)commit();
      });
    }
  }
  function activate(panel) {
    panel.querySelectorAll('img[src]').forEach(img=>{
      if (!img.closest('[hidden]')) img.loading='eager';
    });
  }
  return {warm,register,swap,activate};
})();

;
// sunworld.js
function initSunWorldCase(section, {prefix, name, articles, groups}) {
  if (!section) return;
  const query = selector => section.querySelector(selector.replaceAll('#sw-', '#'+prefix+'-'));
  const tabs = [...section.querySelectorAll('[data-challenge]')];
  const postButtons = [...section.querySelectorAll('[data-post]')];
  const story = query('#sw-story');
  const pair = query('.sw-pair');
  const artwork = query('#sw-artwork');
  const caption = query('#sw-caption');
  const readLink = query('#sw-read-post');
  const dialog = document.querySelector('#sw-lightbox');
  const asset = name => `assets/projects/sunworld/${name}.webp`;
  let groupIndex = 0, postIndex = 0;
  const selectedArticle = () => articles[groups[groupIndex].posts[postIndex]];
  function selectPost(index, animate = true) {
    if (index >= groups[groupIndex].posts.length) return;
    postIndex = index;
    const article = selectedArticle();
    if (animate || section.getBoundingClientRect().top < innerHeight + 700 && !section.closest('[hidden]')) projectImages.swap(pair, [
      {element:artwork,src:asset(article.preview || article.art),alt:article.artAlt},
      {element:caption,src:asset(article.caption),alt:article.captionAlt}
    ]);
    readLink.href = article.url;
    postButtons.forEach((button, i) => {
      button.hidden = i >= groups[groupIndex].posts.length;
      button.setAttribute('aria-pressed', String(i === index));
      button.textContent = articles[groups[groupIndex].posts[i]]?.label || 'Bài '+String(i+1).padStart(2,'0');
    });

  }
  function setHighlightedCopy(element, text, keys) {
    const phrases = Array.isArray(keys) ? keys : [keys];
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    while (cursor < text.length) {
      const match = phrases.filter(Boolean).map(key=>({key,index:text.indexOf(key,cursor)})).filter(m=>m.index>=0).sort((a,b)=>a.index-b.index)[0];
      if (!match) { fragment.append(document.createTextNode(text.slice(cursor))); break; }
      fragment.append(document.createTextNode(text.slice(cursor,match.index)));
      const strong=document.createElement('strong');strong.textContent=match.key;fragment.append(strong);
      cursor=match.index+match.key.length;
    }
    element.replaceChildren(fragment);
  }
  function selectChallenge(index, focus = false, animate = true) {
    groupIndex = index;
    tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
    if (tabs[index]) story.setAttribute('aria-labelledby',tabs[index].id);
    setHighlightedCopy(query('#sw-problem'), groups[index].problem, groups[index].problemKey);
    setHighlightedCopy(query('#sw-approach'), groups[index].approach, groups[index].approachKey);
    selectPost(0, animate);
    if (animate) motionReveal(query('.sw-problem-card'), 'side', {direction:-1,duration:450});
    if (animate) motionReveal(query('.sw-approach'), 'fade', {delay:70,duration:500});
    if (animate) query('.sw-approach').querySelectorAll('strong').forEach(n=>motionReveal(n, 'underline', {delay:180,duration:650}));
    if (focus && tabs[index]) tabs[index].focus();
  }
  projectImages.register(section, articles.flatMap(article=>[asset(article.preview || article.art),asset(article.caption)]));
  selectChallenge(0, false, false);
  tabs.forEach((tab, i) => {
    tab.addEventListener('click',()=>selectChallenge(i));
    tab.addEventListener('keydown',event=>{
      let index;
      if (event.key==='ArrowRight'||event.key==='ArrowLeft') index = (groupIndex + (event.key==='ArrowRight' ? 1 : groups.length-1)) % groups.length;
      if (event.key==='Home') index=0;
      if (event.key==='End') index=groups.length-1;
      if (index===undefined) return;
      event.preventDefault();selectChallenge(index,true);
    });
  });
  postButtons.forEach((button, i)=>button.addEventListener('click',()=>selectPost(i)));
  pair.addEventListener('click',()=>{
    if(pair.getAttribute('aria-busy')==='true')return;
    const article = selectedArticle();
    const fullArt = dialog.querySelector('#sw-full-artwork');
    const fullCaption = dialog.querySelector('#sw-full-caption');
    fullArt.src = asset(article.art); fullArt.alt = article.artAlt;
    fullCaption.src = asset(article.caption); fullCaption.alt = article.captionAlt;
    dialog.querySelector('#sw-full-link').href = article.url;
    dialog.querySelector('#sw-lightbox-title').textContent = `${name} · ${article.label || 'Bài '+String(postIndex+1).padStart(2,'0')}`;
    dialog.showModal();
    motionReveal(dialog, 'zoom', {duration:300});
    document.body.classList.add('sw-dialog-open');
  });

  onEntrance(section,()=>{
    motionReveal(query('.sw-case-heading'),'side',{direction:-1,duration:650});
    motionReveal(query('.sw-challenges'),'side',{delay:80,duration:600});
    motionReveal(query('.sw-problem-card'),'side',{delay:100,direction:-1});
    motionReveal(query('.sw-approach'),'rise',{delay:160});
    motionReveal(query('.sw-metal-disc'),'metal',{delay:220,duration:1000});
    query('.sw-approach').querySelectorAll('strong').forEach(n=>motionReveal(n,'underline',{delay:250,duration:700}));
    motionReveal(query('.sw-evidence'),'side',{delay:140,direction:1,duration:750});
  });
}
(() => {
  const articles = [
    {art:'bnh.1.1', caption:'bnh.1.2', preview:'bnh.1.1-preview', artAlt:'Infographic tháng 3 Bà Nà có gì đặc biệt', captionAlt:'Nội dung bài đăng tháng 3 Bà Nà có gì đặc biệt', url:'https://www.facebook.com/share/p/1EkauoW9mB/'},
    {art:'bnh.1.3', caption:'bnh.1.4', preview:'bnh.1.3-preview', artAlt:'Infographic menu nhà hàng buffet tại Bà Nà', captionAlt:'Nội dung bài đăng về buffet Bà Nà', url:'https://www.facebook.com/share/p/1FcQyQzp3k/'},
    {art:'bnh.2.1', caption:'bnh.2.2', preview:'bnh.2.1-preview', artAlt:'Thiết kế Bà Nà ngày giải phóng 30 tháng 4', captionAlt:'Nội dung bài đăng theo cách tiếp cận Thời báo Bà Nà', url:'https://www.facebook.com/SunWorldBaNaHills/posts/pfbid02pUtrJnYL3JTC3w9LEG6y2M9ZRb6zA28fMAQfnZHeiG8vX4NzWxMuWWTGsxCA95Gl'}
  ];
  const groups = [
    {problem:'Bà Nà có rất nhiều trải nghiệm, nên lượng thông tin cần truyền tải rất lớn.', problemKey:'rất nhiều trải nghiệm', approach:'Bổ sung các tuyến bài infographic trực quan, hữu ích và cô đọng cho khán giả.', approachKey:'infographic trực quan', posts:[0,1]},
    {problem:'Bà Nà có nhiều sản phẩm lâu đời, nên luôn cần làm mới những trải nghiệm quen thuộc đó.', problemKey:'làm mới những trải nghiệm quen thuộc', approach:'Chọn cách thức mới hơn và sáng tạo hơn để tiếp cận khán giả.', approachKey:'mới hơn và sáng tạo hơn', posts:[2]}
  ];

  initSunWorldCase(document.querySelector('#bana-case'),{prefix:'sw',name:'Bà Nà Hills',articles,groups});
})();
initSunWorldCase(document.querySelector('#catba-case'),{
  "prefix": "cb",
  "name": "Cát Bà",
  "articles": [
    {
      "art": "cb.1.1",
      "caption": "cb.1.2",
      "artAlt": "Hình minh họa 7 chương nghệ thuật của Symphony of the Green Island",
      "captionAlt": "Nội dung bài viết về 7 chương nghệ thuật của Symphony of the Green Island",
      "url": "https://www.facebook.com/share/p/1EpodTa79Y/"
    },
    {
      "art": "cb.2.1",
      "caption": "cb.2.2",
      "artAlt": "Hình minh họa từ bản nháp đến sân khấu Symphony of the Green Island",
      "captionAlt": "Nội dung bài viết từ bản nháp đến thực tế của Symphony of the Green Island",
      "url": "https://www.facebook.com/share/p/1FW81wAqUa/"
    },
    {
      "art": "cb.3.1",
      "caption": "cb.3.2",
      "artAlt": "Hình minh họa các ngôi sao thế giới của Symphony of the Green Island",
      "captionAlt": "Nội dung bài viết về đội ngũ quốc tế của Symphony of the Green Island",
      "url": "https://www.facebook.com/share/p/1LdrKRyiWw/"
    }
  ],
  "groups": [
    {
      "problem": "SOTGI là show diễn tầm cỡ với rất nhiều lớp lang nghệ thuật và pháo hoa kết màn mãn nhãn. Tuy nhiên, khán giả có thể xem pháo hoa MIỄN PHÍ từ rất nhiều điểm xung quanh, dẫn đến khó bán vé show.",
      "problemKey": [
        "MIỄN PHÍ",
        "khó bán vé show"
      ],
      "approach": "Đọc kỹ toàn bộ tài liệu show diễn, nghiên cứu từng chương để đi sâu vào kịch bản. Đồng thời, nhấn mạnh vào những trải nghiệm đa giác quan chỉ có thể cảm nhận từ khán đài & tính quy mô của show diễn để thuyết phục khán giả mua vé.",
      "approachKey": [
        "kịch bản",
        "chỉ có thể cảm nhận từ khán đài"
      ],
      "posts": [
        0,
        1,
        2
      ]
    }
  ]
});
(() => {
 const section=document.querySelector('.sunworld-project');if(!section)return;
 const dialog=document.querySelector('#sw-lightbox');
 dialog.querySelector('.sw-dialog-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>document.body.classList.remove('sw-dialog-open'));
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  const title = section.querySelector('#sunworld-title');
  prepareTitle(title);
  onEntrance(section.querySelector('.sw-project-intro'),()=>{
    revealTitle(title);
    motionReveal(section.querySelector('.sw-role'), 'fade', {delay:90,duration:700});
    section.querySelectorAll('.sw-scope li').forEach((item,i)=>motionReveal(item,'fade',{delay:150+i*55,duration:600}));
    motionReveal(section.querySelector('.sw-intro-copy'), 'fade', {delay:280});
    motionReveal(section.querySelector('.sw-orbit-shape'), 'metal', {delay:100,duration:1200});
  });
  onEntrance(section.querySelector('.sw-map-column'),()=>{
    motionReveal(section.querySelector('.sw-map-card'),'fade',{duration:650});
    section.querySelectorAll('.sw-connector').forEach((path,i)=>drawStroke(path,80+i*35));
    section.querySelectorAll('.sw-location image').forEach((logo,i)=>motionReveal(logo,'fade',{delay:140+i*35,duration:650}));
  });
})();


(() => {
  const root = document.querySelector('.sunworld-project');
  if (!root) return;
  const tabs = [...root.querySelectorAll('[data-destination]')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  const pins = [...root.querySelectorAll('.sw-location')];
  const pinGroups = [[4],[2],[7,8],[5]];
  let active = 0;
  function select(index, focus = false) {
    const direction = index >= active ? 1 : -1;
    active = index;
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    projectImages.activate(panels[index]);
    pins.forEach((pin, i) => pin.classList.toggle('is-current', pinGroups[index].includes(i)));
    if (focus) tabs[index].focus();
    motionReveal(panels[index], 'side', {direction,duration:420});
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (active + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (active - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault(); select(next, true);
    });
  });
})();

(() => {const root=document.querySelector('.projects-section');if(!root)return;const tabs=[...root.querySelectorAll('[data-project]')],panels=[...root.querySelectorAll('.project-panel')];let active=0;function select(i,focus=false){active=i;tabs.forEach((tab,n)=>{tab.setAttribute('aria-selected',String(n===i));tab.tabIndex=n===i?0:-1;panels[n].hidden=n!==i;});projectImages.activate(panels[i]);if(focus)tabs[i].focus();motionReveal(panels[i],'fade',{duration:400});}tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>select(i));tab.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight')n=(active+1)%3;if(e.key==='ArrowLeft')n=(active+2)%3;if(e.key==='Home')n=0;if(e.key==='End')n=2;if(n===undefined)return;e.preventDefault();select(n,true);});});const title=root.querySelector('#projects-title');prepareTitle(title);onEntrance(root.querySelector('.projects-heading'),()=>revealTitle(title));})();

initSunWorldCase(document.querySelector('#pq-destination-case'),{
  "prefix": "pq",
  "name": "Phú Quốc",
  "articles": [
    {
      "art": "pq.1.1",
      "caption": "pq.1.2",
      "label": "Bài 01",
      "artAlt": "Hình hướng dẫn lịch trình trải nghiệm tại Sun Paradise Land Phu Quoc",
      "captionAlt": "Nội dung bài viết hướng dẫn trải nghiệm tại Sun Paradise Land Phu Quoc",
      "url": "https://www.facebook.com/share/p/19CNK3ngb4/"
    },
    {
      "art": "pq.2.1",
      "caption": "pq.2.2",
      "label": "Bài 02",
      "artAlt": "Hình lịch trình một ngày tại Sun World Hon Thom",
      "captionAlt": "Nội dung bài viết hướng dẫn một ngày tại Sun World Hon Thom",
      "url": "https://www.facebook.com/SunWorldHonThom/posts/pfbid027tK1gWRT9h6h1UkQWQE8R2KNvpCuSSRVHapK5eMWPFYpM37dkNLnr5MaSdqq9hkpl?rdid=YoLc8sMqLW3ziubT#"
    },
    {
      "art": "pq.3.1",
      "caption": "pq.3.2",
      "label": "Bài 1",
      "artAlt": "Hình gợi ý trải nghiệm Sunset Beach Club từ ban ngày đến buổi tối",
      "captionAlt": "Nội dung bài viết giới thiệu trải nghiệm Sunset Beach Club",
      "url": "https://www.facebook.com/SunBavariaGastroPub.Official/posts/pfbid0G67C6jfaCzEJJ71TdpmGJxx5KqvufaM8qqpkygkHtN5t83zvf6voA2DtFpQWMLo9l?rdid=WIwTEQijeShWCC6I#"
    }
  ],
  "groups": [
    {
      "problem": "Khi đến với SPL Phu Quoc, du khách thường chỉ trải nghiệm nội khu, thay vì kết hợp khám phá địa phương như những nơi khác. Do đó, cần giúp khán giả lấp đầy lịch trình trải nghiệm & hướng dẫn sắp xếp hoạt động sao cho hợp lý nhất.",
      "problemKey": [
        "lấp đầy lịch trình trải nghiệm",
        "sắp xếp hoạt động"
      ],
      "approach": "Bổ sung các tuyến bài hướng dẫn trải nghiệm để không bỏ lỡ hoạt động nào.",
      "approachKey": "hướng dẫn trải nghiệm",
      "posts": [
        0,
        1
      ]
    },
    {
      "problem": "Một vài sản phẩm sẽ cần được đẩy mạnh kinh doanh thông qua (1) bán gói cho khách hàng mới, (2) thâm canh doanh thu trên mỗi pax.",
      "problemKey": [
        "bán gói cho khách hàng mới",
        "doanh thu trên mỗi pax"
      ],
      "approach": "Tăng cường giới thiệu & gợi ý trải nghiệm cho khách ghé thăm.",
      "approachKey": "giới thiệu & gợi ý trải nghiệm",
      "posts": [
        2
      ]
    }
  ]
});
(() => {
  const root=document.querySelector('#phuquoc-case');if(!root)return;
  const tabs=[...root.querySelectorAll('[data-pq-service]')];
  const panels=tabs.map(t=>document.getElementById(t.getAttribute('aria-controls')));
  let active=0;
  function select(index,focus=false){active=index;tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;panels[i].hidden=i!==index;});projectImages.activate(panels[index]);if(focus)tabs[index].focus();motionReveal(panels[index],'fade',{duration:400});}
  tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>select(i));tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight'||event.key==='ArrowLeft')next=1-active;if(event.key==='Home')next=0;if(event.key==='End')next=1;if(next===undefined)return;event.preventDefault();select(next,true);});});
  onEntrance(root.querySelector('.pq-case-heading'),()=>motionReveal(root.querySelector('.pq-case-heading'),'side',{direction:-1,duration:650}));
})();

initSunWorldCase(document.querySelector('#pq-eschuri-case'),{
  "prefix": "es",
  "name": "Eschuri",
  "articles": [
    {
      "art": "es.3.1",
      "caption": "es.3.2",
      "label": "Bài 1",
      "artAlt": "Hình giới thiệu đặc tính sân link-style Eschuri Vung Bau Golf",
      "captionAlt": "Nội dung bài viết về sân link-style và trải nghiệm tại Eschuri Vung Bau Golf",
      "url": "https://www.facebook.com/share/p/18FYr5HXmk/"
    },
    {
      "art": "es.1.1",
      "caption": "es.1.2",
      "label": "Bài 2",
      "artAlt": "Hình trải nghiệm chơi golf lúc hoàng hôn tại Eschuri Vung Bau Golf",
      "captionAlt": "Nội dung bài viết về trải nghiệm chơi golf lúc hoàng hôn tại Eschuri",
      "url": "https://www.facebook.com/EschuriVungBauGolf/posts/pfbid0H1HPwwHqebBNALDSRSPvWKKZxhpEPjxVdkphJLZG5nw5bnQmJmRSYc7iEdKt6ietl?rdid=oc5ksOKbjJcVKVuy#"
    },
    {
      "art": "es.2.1",
      "caption": "es.2.2",
      "label": "Bài 3",
      "artAlt": "Hình một ngày di chuyển bằng golf cart tại Eschuri Vung Bau Golf",
      "captionAlt": "Nội dung bài viết về hành trình golf cart qua sân Eschuri Vung Bau Golf",
      "url": "https://www.facebook.com/EschuriVungBauGolf/posts/pfbid0kmUe256wXauZRmh9vSWoxHmfLwaJVnrMqWT7tPY75BDx5WBJuaXuzURS8d5yMMR8l?rdid=ddYBgFZ3muVyooVk#"
    }
  ],
  "groups": [
    {
      "problem": "Với sản phẩm luxury như sân golf, cần phải lựa chọn từ ngữ, chất liệu, thông điệp truyền tải sao cho vẫn thấy được sự sang trọng, mà không mang lại cảm giác thương mại hay sáo rỗng.",
      "problemKey": [
        "từ ngữ, chất liệu, thông điệp",
        "thương mại hay sáo rỗng"
      ],
      "approach": "Hạn chế tối thiểu tính từ, gần như không dùng từ \"sang trọng\" hay bất kỳ cụm từ đồng nghĩa nào trong các bài viết. Tập trung truyền tải giá trị & trải nghiệm mà sân mang đến.",
      "approachKey": [
        "Hạn chế tối thiểu tính từ",
        "giá trị & trải nghiệm"
      ],
      "posts": [
        0,
        1,
        2
      ]
    }
  ]
});

initSunWorldCase(document.querySelector("#diff-case"),{
  "prefix": "diff",
  "name": "DIFF",
  "articles": [
    {
      "art": "diff.1.1",
      "caption": "diff.1.2",
      "label": "Bài 1",
      "url": "https://www.facebook.com/diff.vn/posts/pfbid0QJ5LFfDYeZFtuXFdHDfLJwJGnjgqzxnJQgd5Gy4ZaNs2e2ha6BocK5h8gHZhPpZyl?rdid=lDZGqpi7xIlG2Wuy#",
      "artAlt": "Hình minh họa bài 1 về Lễ hội Pháo hoa Quốc tế Đà Nẵng",
      "captionAlt": "Nội dung bài 1 trên trang truyền thông chính thức DIFF"
    },
    {
      "art": "diff.2.1",
      "caption": "diff.2.2",
      "label": "Bài 2",
      "url": "https://www.facebook.com/diff.vn/posts/pfbid0bxXHLz3ayJACM38RSLbsRTkgnmL1UVyGEpMN6NJx9JNZBC7tcHQSLXjPn1i4gzQSl?rdid=flSZTCnX0A1f8VD7#",
      "artAlt": "Hình minh họa bài 2 về Lễ hội Pháo hoa Quốc tế Đà Nẵng",
      "captionAlt": "Nội dung bài 2 trên trang truyền thông chính thức DIFF"
    },
    {
      "art": "diff.3.1",
      "caption": "diff.3.2",
      "label": "Bài 3",
      "url": "https://www.facebook.com/diff.vn/posts/pfbid02vtxU8CGd5asBkacaYKp11bCJj3qWVQHVddtH73BJcThskDphnbPHWJWyvixs1ADBl?rdid=yKT2cu5Pg50hIPzT#",
      "artAlt": "Hình minh họa bài 3 về Lễ hội Pháo hoa Quốc tế Đà Nẵng",
      "captionAlt": "Nội dung bài 3 trên trang truyền thông chính thức DIFF"
    }
  ],
  "groups": [
    {
      "problem": "Xây dựng trang truyền thông chính thức & branding cho Lễ hội, lan tỏa không khí đến công chúng & hỗ trợ bán vé DIFF & các sản phẩm khác trong hệ sinh thái",
      "problemKey": [
        "trang truyền thông chính thức",
        "hỗ trợ bán vé DIFF"
      ],
      "approach": "Khai thác đa dạng tuyến bài về lễ hội, từ đó mang đến những góc nhìn thú vị cho cộng đồng\nHighlight những giá trị nghệ thuật và tầm cỡ lễ hội, lan tỏa thương hiệu DIFF & Sun Group đến công chúng",
      "approachKey": [
        "đa dạng tuyến bài",
        "giá trị nghệ thuật và tầm cỡ lễ hội"
      ],
      "posts": [
        0,
        1,
        2
      ]
    }
  ]
});

(() => {const strip=document.querySelector('.sw-impact-strip');if(!strip)return;onEntrance(strip,()=>{strip.querySelectorAll('.sw-impact').forEach((card,i)=>motionReveal(card,i?'fade':'rise',{delay:i*100,duration:550}));});})();

;
// kto.js
(() => {const root=document.querySelector('.kto-project');if(!root)return;const groups=[{"title":"Làm việc cùng vendor","items":[{"label":"Booking PR","text":"Booking PR","image":"kto.pr","alt":"Bài PR về du lịch Hàn Quốc trên báo Thanh Niên","url":"https://thanhnien.vn/du-xuan-giua-troi-hoa-thom-nang-vang-cung-nhung-trai-nghiem-thu-vi-tai-han-quoc-185250321203832496.htm"},{"label":"Key visual & Landing page","text":"Sản xuất Key visual & Landing page","image":"kto.ldp","alt":"Key visual và landing page chiến dịch Xuân Hạ ghé Hàn"}]},{"title":"Quản trị dự án","items":[{"text":"Lên kế hoạch, thực thi & đảm bảo phối hợp nội bộ, vendor và khách hàng để đảm bảo tiến độ dự án","image":"kto.pm","alt":"Bảng kế hoạch và theo dõi tiến độ dự án KTO"}]},{"title":"Tổ chức hoạt động online","items":[{"text":"Tổ chức hoạt động online: Cuộc thi, Minigame,...","detail":"Sáng tạo thể lệ, thu thập data, tổ chức quay giải, mua hàng & vận chuyển quà","image":"kto.minigame","alt":"Thông tin tổ chức minigame và danh sách nhận quà"}]},{"title":"Quản trị đối tác","items":[{"text":"Tiến hành thu thập thông tin & Tổ chức thông tin và quản trị thông tin cho các đối tác của KTO trong dự án","image":"kto.quantri","alt":"Bảng tổ chức và quản trị thông tin đối tác KTO"}]},{"title":"Báo cáo nghiệm thu","items":[{"text":"Thực hiện báo cáo chỉ số cuối dự án & Đánh giá hiệu quả","image":"kto.baocao","alt":"Báo cáo chỉ số truyền thông cuối dự án KTO"}]},{"title":"Survey & Phân tích kết quả","items":[{"label":"Khảo sát","text":"Tổ chức survey và phân tích kết quả khảo sát","image":"kto.khaosat1","alt":"Phiếu khảo sát du lịch y tế Hàn Quốc cùng KTO Việt Nam"},{"label":"Phân tích 01","text":"Tổ chức survey và phân tích kết quả khảo sát","image":"kto.khaosat2","alt":"Phân tích các rào cản trong quyết định du lịch y tế"},{"label":"Phân tích 02","text":"Tổ chức survey và phân tích kết quả khảo sát","image":"kto.khaosat3","alt":"Phân tích nhóm dịch vụ mở đầu hành trình du lịch y tế"}]}];
const tabs=[...root.querySelectorAll('[data-kto-task]')],panel=root.querySelector('#kto-task-panel'),title=root.querySelector('#kto-task-title'),description=root.querySelector('#kto-task-description'),extra=root.querySelector('#kto-task-extra'),nav=root.querySelector('.kto-item-nav'),image=root.querySelector('#kto-preview-image'),link=root.querySelector('#kto-pr-link'),dialog=root.querySelector('#kto-lightbox');let active=0,itemIndex=0;
function itemSelect(i,animate=true){itemIndex=i;const item=groups[active].items[i];description.textContent=item.text;extra.textContent=item.detail||'';extra.hidden=!item.detail;if(animate || !root.hidden)projectImages.swap(root.querySelector('.kto-preview'),[{element:image,src:'assets/projects/kto/'+item.image+'.webp',alt:item.alt}]);else {image.loading='lazy';image.src='assets/projects/kto/'+item.image+'.webp';image.alt=item.alt;}const isLanding=item.image==='kto.ldp';root.querySelector('.kto-preview').hidden=isLanding;root.querySelector('.kto-landing').hidden=!isLanding;if(isLanding)selectLanding(0);link.hidden=!item.url;if(item.url)link.href=item.url;[...nav.children].forEach((b,n)=>b.setAttribute('aria-pressed',String(n===i)));}
function select(i,focus=false,animate=true){active=i;tabs.forEach((t,n)=>{t.setAttribute('aria-selected',String(n===i));t.tabIndex=n===i?0:-1});panel.setAttribute('aria-labelledby','kto-task-'+i);title.textContent=groups[i].title;root.querySelector('.kto-task-number').textContent=String(i+1).padStart(2,'0');nav.replaceChildren();nav.hidden=groups[i].items.length<2;groups[i].items.forEach((item,n)=>{const b=document.createElement('button');b.type='button';b.textContent=item.label||'Ảnh '+(n+1);b.setAttribute('aria-pressed',String(n===0));b.addEventListener('click',()=>itemSelect(n));nav.append(b)});itemSelect(0,false);if(focus)tabs[i].focus();if(animate)motionReveal(panel,'fade',{duration:350});}
tabs.forEach((t,i)=>{t.addEventListener('click',()=>select(i));t.addEventListener('keydown',e=>{let n;if(['ArrowRight','ArrowDown'].includes(e.key))n=(active+1)%tabs.length;if(['ArrowLeft','ArrowUp'].includes(e.key))n=(active+tabs.length-1)%tabs.length;if(e.key==='Home')n=0;if(e.key==='End')n=tabs.length-1;if(n===undefined)return;e.preventDefault();select(n,true)})});
const landingParts=[...root.querySelectorAll('.kto-landing-part')],landingTabs=[...root.querySelectorAll('[data-kto-landing]')];
function selectLanding(i){landingTabs.forEach((b,n)=>b.setAttribute('aria-pressed',String(n===i)));landingParts.forEach((b,n)=>b.classList.toggle('is-current',n===i));}
landingTabs.forEach((b,i)=>b.addEventListener('click',()=>selectLanding(i)));
landingParts.forEach((b,i)=>b.addEventListener('click',()=>{const source=b.querySelector('img'),full=root.querySelector('#kto-full-image');full.src=source.src;full.alt=source.alt;root.querySelector('#kto-lightbox-title').textContent='Key visual & Landing page · Phần '+(i+1);dialog.showModal();document.body.style.overflow='hidden'}));
root.querySelector('.kto-preview').addEventListener('click',()=>{if(root.querySelector('.kto-preview').getAttribute('aria-busy')==='true')return;const item=groups[active].items[itemIndex],full=root.querySelector('#kto-full-image');full.src=image.src;full.alt=item.alt;root.querySelector('#kto-lightbox-title').textContent=groups[active].title+(item.label?' · '+item.label:'');dialog.showModal();document.body.style.overflow='hidden'});const unlock=()=>document.body.style.overflow='';root.querySelector('.kto-lightbox-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',unlock);dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});projectImages.register(root,groups.flatMap(group=>group.items.map(item=>'assets/projects/kto/'+item.image+'.webp')).concat([...root.querySelectorAll('.kto-landing img')].map(img=>img.getAttribute('src'))));select(0,false,false);onEntrance(root.querySelector('.kto-overview'),()=>{motionReveal(root.querySelector('.kto-heading'),'side',{duration:650});motionReveal(root.querySelector('.kto-lead'),'rise',{delay:90});motionReveal(root.querySelector('.kto-scope'),'fade',{delay:160});motionReveal(root.querySelector('.kto-scale'),'zoom',{delay:180})});onEntrance(root.querySelector('.kto-workspace'),()=>{motionReveal(root.querySelector('.kto-task-nav'),'side');motionReveal(panel,'fade',{delay:100})});})();
;
// tottri.js
(() => {const root=document.querySelector('.tottri-project');if(!root)return;const stages=[{"title":"Hiểu đề bài","eyebrow":"HIỂU ĐỀ BÀI","headline":"Hai mục tiêu kinh doanh","intro":"Đề bài:","cards":[{"title":"Chiếm lại thị phần từ đối thủ","text":""},{"title":"Tăng doanh thu trên đầu người","text":""}],"takeaway":"Thông qua việc nâng cao nhận thức sử dụng đủ lộ trình tránh tái phát trĩ","images":[]},{"title":"Nghiên cứu & Nhận định","eyebrow":"NGHIÊN CỨU & NHẬN ĐỊNH","headline":"Nghiên cứu","intro":"","cards":[{"title":"An Trĩ Vương","text":"Phủ nhận diện qua chuyên gia, tư vấn và tần suất xuất hiện; kết hợp bán hàng trực tiếp."},{"title":"CotriPro","text":"Tiếp cận tệp trẻ bằng nội dung gần gũi, KOL và kết nối tới kênh mua hàng online."},{"title":"Nhìn lại Tottri","text":"Đã chia nhỏ nhóm đối tượng; cần thêm chia sẻ thực tế và nội dung xuyên suốt hành trình."}],"takeaway":"Khán giả tìm hiểu âm thầm, kiểm chứng đa kênh và cần thông tin đáng tin cậy.","images":[{"n":70,"label":"So sánh hướng tiếp cận","alt":"Slide phân tích chiến lược phủ nhận diện của An Trĩ Vương, CotriPro và Tottri"},{"n":71,"label":"Khoảng trống hành trình","alt":"Slide phân tích khoảng trống nội dung trên hành trình khách hàng"}]},{"title":"Định hướng 2026","eyebrow":"","headline":"Định hướng 2026","intro":"Tạo ra hệ sinh thái thông tin đa điểm chạm, lấy Digital làm kênh truyền thông chính, nhằm phủ rộng trên toàn bộ hành trình khách hàng online.","cards":[],"takeaway":"","images":[{"n":76,"label":"Job to be Done","alt":"Slide Job to be Done 2026 do Minh Nguyệt thực hiện"},{"n":80,"label":"Bốn trụ cột nội dung","alt":"Slide chiến lược bốn trụ cột nội dung truyền thông Tottri 2026"}]},{"title":"Roadmap & Content","eyebrow":"KẾ HOẠCH TRIỂN KHAI","headline":"Roadmap 2026 & Activation Plan","intro":"Chiến lược content: duy trì nội dung xuyên năm, tập trung hai cao điểm mùa vụ.","cards":[],"takeaway":"","images":[{"n":82,"label":"Roadmap 2026","alt":"Slide roadmap truyền thông Tottri 2026 với hai cao điểm mùa vụ"},{"n":83,"label":"Activation Plan","alt":"Slide activation plan Tottri, kết nối nội dung và các kênh triển khai"},{"n":86,"label":"Angle theo nghề nghiệp","alt":"Slide đề xuất series infographic theo nghề nghiệp, có hình ảnh tham khảo","reference":true},{"n":87,"label":"Angle theo hành trình","alt":"Slide đề xuất nội dung hành trình sử dụng, có hình ảnh tham khảo","reference":true}]}];const tabs=[...root.querySelectorAll('[data-tottri-step]')],panel=root.querySelector('#tottri-stage'),grid=root.querySelector('.tottri-finding-grid'),nav=root.querySelector('.tottri-slide-nav'),image=root.querySelector('#tottri-slide-image'),dialog=root.querySelector('#tottri-lightbox');let active=0,imageIndex=0;
const story=root.querySelector('.tottri-story');
const summaries=[
`<h4 id="tottri-headline">Hai mục tiêu kinh doanh</h4><div class="tt-goals"><h5>Chiếm lại thị phần<br>từ đối thủ</h5><span class="tt-amp" aria-label="và">&amp;</span><h5>Tăng doanh thu<br>trên đầu người</h5></div><div class="tt-means"><span>Thông qua việc</span><p>Nâng cao nhận thức <strong>sử dụng đủ lộ trình</strong><br><em>tránh tái phát trĩ</em></p></div>`,
`<h4 id="tottri-headline">Nghiên cứu</h4><div class="tt-research"><article><h5>An Trĩ Vương</h5><strong>Phủ nhận diện</strong><p>Chuyên gia · Tư vấn · Tần suất xuất hiện</p><span>Kết hợp bán hàng trực tiếp</span></article><article><h5>CotriPro</h5><strong>Tiếp cận tệp trẻ</strong><p>Nội dung gần gũi · KOL</p><span>Kết nối kênh mua hàng online</span></article><article><h5>Nhìn lại Tottri</h5><strong>Chia nhỏ nhóm đối tượng</strong><p>Cần thêm chia sẻ thực tế &amp; nội dung xuyên suốt hành trình</p></article></div><div class="tt-audience"><span>KHÁN GIẢ</span><strong>Tìm hiểu âm thầm</strong><p>Kiểm chứng đa kênh · Cần thông tin đáng tin cậy</p></div>`,
`<h4 id="tottri-headline">Định hướng 2026</h4><div class="tt-direction"><p>Hệ sinh thái thông tin<strong>đa điểm chạm</strong></p><div class="tt-digital"><span>Digital</span><small>Kênh truyền thông chính</small></div><p class="tt-journey-reach">Phủ rộng toàn bộ<strong>hành trình khách hàng online</strong></p><div class="tt-orbit" aria-hidden="true"><i></i><i></i><i></i></div></div>`,
`<h4 id="tottri-headline">Roadmap 2026<br>&amp; Activation Plan</h4><div class="tt-roadmap"><div class="tt-always"><span>CHIẾN LƯỢC CONTENT</span><strong>Duy trì nội dung <br>xuyên suốt năm</strong><i aria-hidden="true"></i></div><div class="tt-seasons"><span><small>TẬP TRUNG HAI CAO ĐIỂM MÙA VỤ</small><strong>Hè <b>&amp;</b> Đông &amp; Tết</strong></span></div></div>`
];
const slideTitle=document.createElement('span'),counter=document.createElement('span');
slideTitle.className='tt-slide-title';slideTitle.setAttribute('aria-live','polite');counter.className='tt-slide-count';
const previous=document.createElement('button'),next=document.createElement('button');
previous.type=next.type='button';previous.className='tt-page-control tt-prev';next.className='tt-page-control tt-next';
previous.setAttribute('aria-label','Slide trước');next.setAttribute('aria-label','Slide tiếp theo');
previous.innerHTML='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m12 5-5 5 5 5"/></svg>';
next.innerHTML='<span>Tiếp</span><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m8 5 5 5-5 5"/></svg>';
nav.className='tt-slide-pager';nav.setAttribute('aria-label','Lật slide minh chứng');
nav.replaceChildren(slideTitle,previous,counter,next);
function selectImage(i,animate=true){
 imageIndex=i;const item=stages[active].images[i];if(!item)return;
 projectImages.swap(root.querySelector('.tottri-slide-preview'),[{element:image,src:'assets/projects/tottri/slide-'+item.n+'.webp',alt:item.alt}]);
 slideTitle.textContent=item.label;counter.textContent=String(i+1).padStart(2,'0')+' / '+String(stages[active].images.length).padStart(2,'0');
 previous.disabled=i===0;next.disabled=i===stages[active].images.length-1;

}
previous.addEventListener('click',()=>{if(imageIndex>0)selectImage(imageIndex-1)});
next.addEventListener('click',()=>{if(imageIndex<stages[active].images.length-1)selectImage(imageIndex+1)});
function select(i,focus=false,animate=true){
 active=i;panel.dataset.step=String(i);const data=stages[i];
 tabs.forEach((t,n)=>{t.setAttribute('aria-selected',String(n===i));t.tabIndex=n===i?0:-1});
 panel.setAttribute('aria-labelledby','tottri-step-'+i);panel.classList.toggle('is-brief',!data.images.length);
 story.innerHTML=summaries[i];root.querySelector('.tottri-evidence').hidden=!data.images.length;
 if(data.images.length){selectImage(0,false)}if(focus)tabs[i].focus();if(animate)motionReveal(panel,'fade',{duration:320});
}
tabs.forEach((t,i)=>{t.addEventListener('click',()=>select(i));t.addEventListener('keydown',e=>{let n;if(e.key==='ArrowRight')n=(active+1)%tabs.length;if(e.key==='ArrowLeft')n=(active+tabs.length-1)%tabs.length;if(e.key==='Home')n=0;if(e.key==='End')n=tabs.length-1;if(n===undefined)return;e.preventDefault();select(n,true)})});
root.querySelector('.tottri-slide-preview').addEventListener('click',()=>{if(root.querySelector('.tottri-slide-preview').getAttribute('aria-busy')==='true')return;const item=stages[active].images[imageIndex],full=root.querySelector('#tottri-full-image');full.src=image.src;full.alt=image.alt;root.querySelector('#tottri-lightbox-title').textContent=item.label;dialog.showModal();document.body.style.overflow='hidden'});
dialog.querySelector('button').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>document.body.style.overflow='');dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
projectImages.register(root,stages.flatMap(stage=>stage.images.map(item=>'assets/projects/tottri/slide-'+item.n+'.webp')));
select(0,false,false);const visibility=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('tt-in-view',entry.isIntersecting)),{threshold:.12});visibility.observe(root.querySelector('.tottri-evidence'));
onEntrance(root.querySelector('.tottri-overview'),()=>{motionReveal(root.querySelector('.tottri-title-row'),'side');motionReveal(root.querySelector('.tottri-lead'),'rise',{delay:80});motionReveal(root.querySelector('.tottri-contribution'),'fade',{delay:150})});
onEntrance(root.querySelector('.tottri-journey'),()=>motionReveal(root.querySelector('.tottri-journey'),'fade'));
})();

;
// about.js
(() => {
  const section=document.querySelector('#about');
  if(!section)return;
  onEntrance(section,()=>{
    motionReveal(section.querySelector('h2'),'side',{direction:-1,duration:780});
    motionReveal(section.querySelector('#work-values-title'),'fade',{delay:100,duration:800});
  });
  section.querySelectorAll('.usp-piece').forEach((piece,i)=>onEntrance(piece,()=>{
    motionReveal(piece,i===0?'zoom':i===1?'side':i===2?'rise':'fade',{direction:i%2?1:-1,duration:720});
    motionReveal(piece.querySelector('.usp-illustration,.usp-type-art'),'settle',{delay:100,duration:900});
  }));
  section.querySelectorAll('.value-item').forEach((unit,i)=>onEntrance(unit,()=>{
    motionReveal(unit,i===0?'zoom':i===1?'side':i===2?'rise':'fade',{direction:1,duration:700});
    motionReveal(unit.querySelector('svg'),'settle',{delay:120,duration:950});
    const number=unit.querySelector('strong');
    const digit=[...number.childNodes].find(node=>node.nodeType===Node.TEXT_NODE&&/\d/.test(node.textContent));
    if(!digit)return;
    const targets=[[200],[30],[40],[13,15]][i];
    number.setAttribute('aria-label', ['Khoảng 200','Khoảng 30%','40+','Khoảng 13 đến 15'][i]);
    cancelAnimationFrame(unit.countFrame);
    const start=performance.now();
    function tick(now){
      const progress=Math.min(1,(now-start)/1150);
      const eased=1-Math.pow(1-progress,3);
      digit.textContent=targets.map(value=>Math.round(value*eased)).join('–');
      if(progress<1&&!reducedMotion.matches)unit.countFrame=requestAnimationFrame(tick);
      else digit.textContent=targets.join('–');
    }
    unit.countFrame=requestAnimationFrame(tick);
  }));
  const notes=section.querySelector('.usp-personal-notes');
  const coreSkills=section.querySelector('.core-skills');
  onEntrance(coreSkills,()=>motionReveal(coreSkills.querySelector('h3'),'fade',{duration:650}));
  section.querySelectorAll('.core-skill').forEach((skill,i)=>onEntrance(skill,()=>{
    motionReveal(skill,i%2?'fade':'rise',{delay:i*50,duration:650});
    const icon=skill.querySelector('svg');
    icon?.getAnimations().forEach(a=>a.cancel());
    icon?.animate([{opacity:0,transform:'translateY(4px) rotate(-9deg)'},{opacity:1,transform:'translateY(-2px) rotate(2deg)',offset:.7},{opacity:1,transform:'none'}],{duration:900,delay:140+i*50,easing:'cubic-bezier(.16,1,.3,1)'});
    icon?.querySelector('.icon-accent')?.animate([{strokeDasharray:'90',strokeDashoffset:90},{strokeDasharray:'90',strokeDashoffset:0}],{duration:1100,delay:240+i*50,easing:'ease-out'});
  }));
  const workStyle=section.querySelector('.work-style');
  onEntrance(workStyle,()=>{
    motionReveal(workStyle.querySelector('.work-style-heading'),'fade',{duration:700});
    const sculpture=workStyle.querySelector('.thinking-sculpture svg');
    sculpture?.getAnimations().forEach(a=>a.cancel());
    sculpture?.animate([{opacity:0,transform:'rotate(-12deg) scale(.9)'},{opacity:1,transform:'rotate(2deg) scale(1.02)',offset:.75},{opacity:1,transform:'none'}],{duration:1300,delay:100,easing:'cubic-bezier(.16,1,.3,1)'});
    const track=sculpture?.querySelector('.thought-track');
    track?.getAnimations().forEach(a=>a.cancel());
    track?.animate([{strokeDasharray:'600',strokeDashoffset:600},{strokeDasharray:'600',strokeDashoffset:0}],{duration:1500,delay:200,easing:'ease-out'});
  });
  section.querySelectorAll('.work-style-list li').forEach((row,i)=>onEntrance(row,()=>motionReveal(row,i===1?'rise':'side',{direction:1,duration:650})));
  onEntrance(notes,()=>notes.querySelectorAll('.about-trait').forEach((trait,i)=>motionReveal(trait,'fade',{delay:i*65,duration:550})));
})();

;
// persona-deck.js
(() => {
 const root=document.querySelector('.persona-deck');if(!root)return;
 const tabs=[...root.querySelectorAll('[data-persona]')],card=root.querySelector('.persona-card');
 const caption=card.querySelector('.persona-caption'),name=card.querySelector('.persona-name'),copy=card.querySelector('.persona-description');
 const data=[
  ['Cung hoàng đạo','Thiên Bình','Yêu cái đẹp, thích sự công bằng.'],
  ['Số chủ đạo','6','Là người chăm sóc, truyền cảm hứng, tạo động lực cho đội nhóm.'],
  ['Cung mọc · Mặt trăng','Mọc Ma Kết, Mặt trăng Nhân Mã','Có kỷ luật trong cách làm, thích tự do trong cách nghĩ.'],
  ['Tử vi · Thân vô chính diệu','Thiên Cơ & Thiên Lương','Thích tìm hiểu đến gốc rễ, linh hoạt kết nối thông tin, tìm hướng giải quyết.']
 ];
 let current=0;
 function select(i){if(i===current)return;current=i;tabs.forEach((tab,j)=>{tab.setAttribute('aria-selected',String(j===i));tab.tabIndex=j===i?0:-1;});card.setAttribute('aria-labelledby',tabs[i].id);card.classList.toggle('is-number',i===1);card.classList.toggle('is-chart',i===2);card.classList.toggle('is-tuvi',i===3);[caption.textContent,name.textContent,copy.textContent]=data[i];if(i===2){const first=document.createElement("span"),second=document.createElement("span");first.textContent="Mọc Ma Kết,";second.textContent="Mặt trăng Nhân Mã";name.replaceChildren(first," ",second);}if(!reducedMotion.matches){card.getAnimations().forEach(a=>a.cancel());card.animate([{opacity:.55,transform:'translateY(6px) rotate(-2deg)'},{opacity:1,transform:'none'}],{duration:420,easing:'cubic-bezier(.16,1,.3,1)'});}}
 tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>select(i));tab.addEventListener('keydown',e=>{let next;if(['ArrowRight','ArrowDown'].includes(e.key))next=(i+1)%4;if(['ArrowLeft','ArrowUp'].includes(e.key))next=(i+3)%4;if(e.key==='Home')next=0;if(e.key==='End')next=3;if(next!==undefined){e.preventDefault();select(next);tabs[next].focus();}});});
 onEntrance(root,()=>{motionReveal(root.querySelector('h3'),'fade',{duration:650});motionReveal(root.querySelector('.persona-stack'),'settle',{duration:850});motionReveal(root.querySelector('.persona-picker'),'fade',{delay:150,duration:700});});
})();

;
// more-expertise.js
(() => {
 const area=document.querySelector('#professional-activities');
 if(!area)return;
 document.querySelectorAll('.more-heading').forEach(heading=>onEntrance(heading,()=>motionReveal(heading,'fade',{duration:650})));
 document.querySelectorAll('.support-skill,.language-item,.teaching-course').forEach((item,i)=>onEntrance(item,()=>motionReveal(item,i%3===0?'side':i%3===1?'fade':'rise',{direction:i%2?1:-1,duration:650})));
 const dialog=document.querySelector('#training-lightbox'),large=dialog.querySelector('img'),title=dialog.querySelector('h2');
 let opener;
 document.querySelectorAll('[data-course-image]').forEach(button=>button.addEventListener('click',()=>{
   const img=button.querySelector('img');opener=button;large.src=button.dataset.fullImage || img.currentSrc || img.src;large.alt=img.alt;title.textContent=img.alt;dialog.showModal();
 }));
 dialog.querySelector('button').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}});
 dialog.addEventListener('close',()=>opener?.focus({preventScroll:true}));
 const tabs=[...area.querySelectorAll('.training-tabs [role=tab]')];
 function select(index,focus=false){
   tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;document.getElementById(tab.getAttribute('aria-controls')).hidden=i!==index;});
   if(focus)tabs[index].focus({preventScroll:true});
   if(!reducedMotion.matches)motionReveal(document.getElementById(tabs[index].getAttribute('aria-controls')),'fade',{duration:350});
 }
 tabs.forEach((tab,i)=>{
   tab.addEventListener('click',()=>select(i));
   tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(i+1)%tabs.length;else if(event.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else return;event.preventDefault();select(next,true);});
 });
})();

;
// world.js
(() => {
 const world=document.querySelector('#world');
 if(!world)return;
 onEntrance(world.querySelector('.world-heading'),()=>motionReveal(world.querySelector('.world-heading'),'fade',{duration:650}));
 world.querySelectorAll('.world-photo,.world-book,.world-subhead,.reading-title').forEach((item,i)=>onEntrance(item,()=>motionReveal(item,i%3===0?'fade':i%3===1?'side':'rise',{duration:650,direction:i%2?1:-1})));
})();
