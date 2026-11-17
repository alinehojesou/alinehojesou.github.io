(function(){
  document.querySelectorAll('.strip').forEach(function(el){
    var down=false,sx=0,sl=0,moved=false;
    el.addEventListener('pointerdown',function(e){if(e.pointerType==='touch')return;down=true;moved=false;sx=e.clientX;sl=el.scrollLeft;});
    window.addEventListener('pointermove',function(e){if(!down)return;var dx=e.clientX-sx;if(Math.abs(dx)>3){moved=true;el.classList.add('drag');}el.scrollLeft=sl-dx;});
    window.addEventListener('pointerup',function(){down=false;el.classList.remove('drag');});
  });
})();
(function(){
  document.querySelectorAll('.cmp').forEach(function(f){
    var r=f.querySelector('.cmp-range');
    r.addEventListener('input',function(){f.style.setProperty('--pos',r.value+'%');});
    ['pointerdown','mousedown'].forEach(function(t){r.addEventListener(t,function(e){e.stopPropagation();});});
  });
})();

(function(){
  var vids=[].slice.call(document.querySelectorAll('.strip video'));
  vids.forEach(function(v){v.preload='metadata';});
  if(!('IntersectionObserver' in window)||!vids.length)return;
  var io=new IntersectionObserver(function(es){es.forEach(function(e){
    var v=e.target; if(e.isIntersecting){var p=v.play(); if(p&&p.catch)p.catch(function(){});} else v.pause();
  });},{rootMargin:'0px',threshold:.15});
  vids.forEach(function(v){v.removeAttribute('autoplay');v.pause();io.observe(v);});
})();
