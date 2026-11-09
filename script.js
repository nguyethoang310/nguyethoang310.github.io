const tabs = Array.from(document.querySelectorAll('.chapter-tabs [role="tab"]'));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const activeEffects = new Set();
const elementEffects = new WeakMap();
const motionEntered = new WeakSet();
function animateOnce(element, frames, options = {}) {
  if (reducedMotion.matches || !element || typeof element.animate !== 'function') return;
  elementEffects.get(element)?.cancel();
  const effect = element.animate(frames, {duration: 720, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards', ...options});
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
  motionReveal(document.querySelector('.portrait-frame'), 'aperture', {delay:80,duration:1000});
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


