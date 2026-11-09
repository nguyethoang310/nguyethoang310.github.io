(() => {
 const world=document.querySelector('#world');
 if(!world)return;
 onEntrance(world.querySelector('.world-heading'),()=>motionReveal(world.querySelector('.world-heading'),'fade',{duration:650}));
 world.querySelectorAll('.world-photo,.world-book,.world-subhead,.reading-title').forEach((item,i)=>onEntrance(item,()=>motionReveal(item,i%3===0?'fade':i%3===1?'side':'rise',{duration:650,direction:i%2?1:-1})));
})();
