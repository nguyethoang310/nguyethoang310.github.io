(() => {
  const root=document.querySelector('.personal-constellation');if(!root)return;
  const points=[...root.querySelectorAll('[data-personal-point]')];
  const panel=root.querySelector('.constellation-reading');
  const text=panel.querySelector('p');
  const readings=[
    'Yêu cái đẹp, thích sự công bằng.',
    'Là người chăm sóc, truyền cảm hứng, tạo động lực cho đội nhóm.',
    'Mọc Ma Kết, Mặt trăng Nhân Mã — Có kỷ luật trong cách làm, thích tự do trong cách nghĩ.',
    'Thân vô chính diệu, Thiên Cơ & Thiên Lương — Thích tìm hiểu đến gốc rễ, linh hoạt kết nối thông tin, tìm hướng giải quyết.'
  ];
  let active=0;
  function select(index){
    if(index===active)return;active=index;
    points.forEach((point,i)=>{point.setAttribute('aria-selected',String(i===index));point.tabIndex=i===index?0:-1;});
    panel.setAttribute('aria-labelledby',points[index].id);text.textContent=readings[index];
    if(!reducedMotion.matches){text.getAnimations().forEach(a=>a.cancel());text.animate([{opacity:0,transform:'translateY(3px)'},{opacity:1,transform:'none'}],{duration:230,easing:'ease-out'});}
  }
  points.forEach((point,i)=>{
    point.addEventListener('click',()=>select(i));
    point.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')select(i);});
    point.addEventListener('focus',()=>select(i));
    point.addEventListener('keydown',e=>{
      let next;if(e.key==='ArrowRight'||e.key==='ArrowDown')next=(i+1)%points.length;
      if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=(i+points.length-1)%points.length;
      if(e.key==='Home')next=0;if(e.key==='End')next=points.length-1;
      if(next!==undefined){e.preventDefault();select(next);points[next].focus();}
    });
  });
  onEntrance(root,()=>{motionReveal(root.querySelector('h3'),'fade',{duration:600});points.forEach((point,i)=>motionReveal(point,'fade',{delay:i*90,duration:600}));});
})();
