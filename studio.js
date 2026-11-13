(() => {
 const viewer=document.querySelector('#eyewear-3d'),stage=document.querySelector('.studio');
 const compact=matchMedia('(max-width:600px)');
 const frameProduct=()=>viewer.setAttribute('camera-orbit',compact.matches?'25deg 65deg 105%':'25deg 65deg 75%');
 frameProduct();compact.addEventListener('change',frameProduct);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let onScreen=true,touching=false;
 const sync=()=>viewer.toggleAttribute('auto-rotate',!touching&&!reduced.matches&&!document.hidden&&onScreen&&!document.documentElement.classList.contains('motion-paused'));
 function fail(){stage.querySelector('.studio-fallback').hidden=false;stage.querySelector('.studio-progress').hidden=true;}
 viewer.addEventListener('progress',e=>{document.querySelector('#model-progress').style.width=Math.round(e.detail.totalProgress*100)+'%';});
 viewer.addEventListener('load',()=>{stage.classList.add('is-ready');stage.querySelector('.studio-fallback').hidden=true;document.querySelector('#model-status').textContent='Mô hình 3D đã sẵn sàng';sync();});
 viewer.addEventListener('error',fail);
 viewer.addEventListener('pointerdown',()=>{touching=true;sync();});
 const release=()=>{touching=false;sync();};
 window.addEventListener('pointerup',release);window.addEventListener('pointercancel',release);
 new IntersectionObserver(e=>{onScreen=e[0].isIntersecting;sync();},{threshold:.1}).observe(stage);
 new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
 viewer.setAttribute('rotation-per-second','6deg');viewer.setAttribute('auto-rotate-delay','1200');sync();
 document.querySelector('#retry-model').addEventListener('click',()=>{stage.querySelector('.studio-fallback').hidden=true;stage.querySelector('.studio-progress').hidden=false;viewer.src='assets/ridgeline-optical-v2.glb?retry='+Date.now();});
 setTimeout(()=>{if(!customElements.get('model-viewer'))fail();},12000);
})();




