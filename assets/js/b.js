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
;(function(){
  function stop(el){['pointerdown','mousedown'].forEach(function(t){el.addEventListener(t,function(e){e.stopPropagation();});});}
  function go(v,t){try{v.currentTime=t;}catch(e){}var p=v.play();if(p&&p.catch)p.catch(function(){});}
  document.querySelectorAll('.slot[data-tl]').forEach(function(f){
    var v=f.querySelector('video');v.preload='auto';
    f.querySelectorAll('.tl-b').forEach(function(b){
      stop(b);
      b.addEventListener('click',function(){go(v,parseFloat(b.getAttribute('data-t'))+0.4);});
    });
  });
  document.querySelectorAll('.slot[data-dots]').forEach(function(f){
    var v=f.querySelector('video'),n=parseInt(f.getAttribute('data-dots'),10),dur=parseFloat(f.getAttribute('data-dur'));
    var h=f.querySelector('.dh'),ring=f.querySelector('.dh-ring');v.preload='auto';stop(h);
    function nearest(e){
      var r=h.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*1280;
      var k=Math.round((x-(640-n*11+6))/22);return Math.max(0,Math.min(n-1,k));
    }
    h.addEventListener('mousemove',function(e){
      var r=h.getBoundingClientRect(),k=nearest(e);
      ring.style.left=((640-n*11+6+k*22)/1280*r.width)+'px';
    });
    h.addEventListener('click',function(e){
      var k=nearest(e),j=Math.floor((v.currentTime+0.05)/dur),g=Math.floor(j/n);
      go(v,(g*n+k)*dur+0.05);
    });
  });
})();
