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
    const trigger=project && document.querySelector('[aria-controls="'+project.id+'"]');
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
