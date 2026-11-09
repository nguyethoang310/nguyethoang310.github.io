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
