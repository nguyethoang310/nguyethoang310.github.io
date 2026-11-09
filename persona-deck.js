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
