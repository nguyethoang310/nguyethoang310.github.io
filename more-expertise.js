(() => {
 const area=document.querySelector('#professional-activities');
 if(!area)return;
 document.querySelectorAll('.more-heading').forEach(heading=>onEntrance(heading,()=>motionReveal(heading,'fade',{duration:650})));
 document.querySelectorAll('.support-skill,.language-item,.teaching-course').forEach((item,i)=>onEntrance(item,()=>motionReveal(item,i%3===0?'side':i%3===1?'fade':'rise',{direction:i%2?1:-1,duration:650})));
 const dialog=document.querySelector('#training-lightbox'),large=dialog.querySelector('img'),title=dialog.querySelector('h2');
 let opener;
 document.querySelectorAll('[data-course-image]').forEach(button=>button.addEventListener('click',()=>{
   const img=button.querySelector('img');opener=button;large.src=img.src;large.alt=img.alt;title.textContent=img.alt;dialog.showModal();
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
