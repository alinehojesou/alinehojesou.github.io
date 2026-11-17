(function () {
  window.__init = true;
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ---------- split headings into words (springy reveal) ---------- */
  function split(el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var s = document.createElement('span'); s.className = 'sw'; s.style.setProperty('--i', i++); s.textContent = part; frag.appendChild(s);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1 && !c.classList.contains('sr') && !c.classList.contains('dot')) { walk(c); }
      });
    })(el);
    el.classList.add('split');
  }
  if (!reduce) {
    $$('.hero h1, .sec-head h2, .about h2, .resume h2, .contact-in h2, .case-card h3').forEach(split);
    var wm = $('.wordmark');
    if (wm) {
      var sup = wm.querySelector('sup'), txt = wm.firstChild.textContent, f = document.createDocumentFragment();
      txt.split('').forEach(function (ch, i) {
        if (ch === ' ') { f.appendChild(document.createTextNode(' ')); return; }
        var s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', i); s.textContent = ch; f.appendChild(s);
      });
      wm.replaceChild(f, wm.firstChild);
      if (sup) { sup.className = 'ch'; sup.style.setProperty('--i', txt.length); }
    }
  }

  /* ---------- reveal on scroll ---------- */
  function startReveals() {
    var els = $$('.reveal, .split, .wordmark');
    if (!('IntersectionObserver' in window) || reduce) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -7% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- loader: counts to 100 once per visit ---------- */
  var loader = $('.loader');
  if (root.classList.contains('loading') && loader) {
    var num = $('.loader-n', loader), t0 = performance.now(), dur = 1300;
    (function tick(now) {
      var p = clamp((now - t0) / dur, 0, 1), eased = 1 - Math.pow(1 - p, 3);
      num.textContent = Math.round(eased * 100);
      if (p < 1) { requestAnimationFrame(tick); return; }
      loader.classList.add('out');
      try { sessionStorage.setItem('seen', '1'); } catch (e) {}
      setTimeout(function () { root.classList.remove('loading'); startReveals(); }, 420);
    })(t0);
  } else { root.classList.remove('loading'); startReveals(); }

  /* ---------- menu ---------- */
  var mbtn = $('.menu-btn'), list = $('#navlist');
  function menu(open) { list.classList.toggle('open', open); mbtn.setAttribute('aria-expanded', open); }
  mbtn.addEventListener('click', function (e) { e.stopPropagation(); menu(!list.classList.contains('open')); });
  list.addEventListener('click', function (e) { if (e.target.closest('a')) menu(false); });
  document.addEventListener('click', function (e) { if (!e.target.closest('#navlist')) menu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') menu(false); });

  /* ---------- local clock ---------- */
  var clock = $('.clock');
  if (clock) {
    var fmt = new Intl.DateTimeFormat(root.lang, { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
    var setClock = function () { clock.textContent = fmt.format(new Date()); };
    setClock(); setInterval(setClock, 20000);
  }

  /* ---------- scroll: progress bar, marquee speed, parallax, dock state ---------- */
  var prog = document.createElement('div'); prog.className = 'prog'; document.body.appendChild(prog);
  var lastY = scrollY, vel = 0, shots = $$('.case-shot'), marquees = [];
  function anims() {
    if (marquees.length || reduce) return marquees;
    $$('.marquee ul, .talk-marquee div').forEach(function (el) { if (el.getAnimations) marquees = marquees.concat(el.getAnimations()); });
    return marquees;
  }
  var sections = $$('main section[id]'), dockLinks = $$('.dock a[href^="#"]');
  function onFrame() {
    var y = scrollY, max = root.scrollHeight - innerHeight;
    prog.style.scale = (max > 0 ? y / max : 0) + ' 1';
    vel += ((y - lastY) - vel) * 0.2; lastY = y;
    if (!reduce) {
      var rate = 1 + clamp(Math.abs(vel) / 6, 0, 7);
      anims().forEach(function (a) { a.playbackRate = vel < -0.5 ? -rate : rate; });
      if (innerWidth > 900) shots.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > innerHeight + 100) return;
        var p = (r.top + r.height / 2) / innerHeight - 0.5;
        el.style.translate = '0 ' + (p * -46).toFixed(1) + 'px';
      });
    }
    var cur = '';
    sections.forEach(function (s) { if (s.getBoundingClientRect().top < innerHeight * 0.45) cur = s.id; });
    dockLinks.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + cur); });
    requestAnimationFrame(onFrame);
  }
  requestAnimationFrame(onFrame);

  /* ---------- lightbox ---------- */
  var lb = $('#lb'), lbBody = $('.lb-body'), lbTitle = $('#lb-t');
  function openWork(slug, title) {
    var parts = (window.WORK || {})[slug] || [];
    if (!lb || !lb.showModal || !parts.length) return false;
    lbTitle.textContent = title; lbBody.innerHTML = '';
    var q = window.VER ? '?v=' + window.VER : '';
    parts.forEach(function (p, i) {
      var h = p, w = 1280, vid = false;
      if (typeof p !== 'number') { h = p[0]; w = p[1]; vid = p[2] === 'v'; }
      var base = window.ASSETS + 'img/work/' + slug + '-' + (i + 1), el;
      if (vid) {
        el = document.createElement('video');
        el.muted = true; el.loop = true; el.autoplay = true; el.playsInline = true;
        el.setAttribute('muted', ''); el.setAttribute('playsinline', ''); el.setAttribute('aria-label', title + ' — ' + (i + 1) + '/' + parts.length);
        el.poster = base + '.webp' + q; el.src = base + '.mp4' + q;
      } else {
        el = new Image(); el.alt = title + ' — ' + (i + 1) + '/' + parts.length;
        if (i > 0) el.loading = 'lazy';
        el.decoding = 'async'; el.src = base + '.webp' + q;
      }
      el.width = w; el.height = h;
      if (w < 1280) { el.className = 'nar'; el.style.width = (w / 12.8).toFixed(2) + '%'; }
      lbBody.appendChild(el);
    });
    lb.showModal(); lb.scrollTop = 0; return true;
  }
  if (lb) {
    $$('.card a').forEach(function (a) {
      a.addEventListener('click', function (e) { if (openWork(a.dataset.slug, a.dataset.title)) e.preventDefault(); });
    });
    $('#lb-x').addEventListener('click', function () { lb.close(); });
    lb.addEventListener('close', function () { $$('video', lbBody).forEach(function (v) { v.pause(); }); lbBody.innerHTML = ''; });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  }

  /* ---------- hero stickers: drag, throw, parallax ---------- */
  var hero = $('.hero'), stks = $$('.stk', hero), mx = 0, my = 0;
  stks.forEach(function (el, i) {
    var st = { x: 0, y: 0, vx: 0, vy: 0, px: 0, py: 0, depth: 8 + (i % 4) * 6, drag: false, moved: 0, raf: 0 };
    el._st = st;
    function paint() { el.style.translate = (st.x + st.px).toFixed(1) + 'px ' + (st.y + st.py).toFixed(1) + 'px'; }
    el._paint = paint;
    var lx, ly, z = 3;
    el.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      st.drag = true; st.moved = 0; lx = e.clientX; ly = e.clientY; st.vx = st.vy = 0;
      cancelAnimationFrame(st.raf);
      el.setPointerCapture(e.pointerId); el.classList.add('drag'); el.style.zIndex = ++z + stks.length;
    });
    el.addEventListener('pointermove', function (e) {
      if (!st.drag) return;
      var dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      st.x += dx; st.y += dy; st.vx = clamp(dx, -16, 16); st.vy = clamp(dy, -16, 16); st.moved += Math.abs(dx) + Math.abs(dy); paint();
    });
    function release() {
      if (!st.drag) return;
      st.drag = false; el.classList.remove('drag');
      if (st.moved < 6) { if (el.dataset.slug) openWork(el.dataset.slug, el.dataset.title); return; }
      if (reduce) return;
      (function glide() {
        st.vx *= 0.9; st.vy *= 0.9; st.x += st.vx; st.y += st.vy;
        var r = el.getBoundingClientRect(), h = hero.getBoundingClientRect();
        if (r.left < h.left && st.vx < 0 || r.right > h.right && st.vx > 0) st.vx *= -0.7;
        if (r.top < h.top && st.vy < 0 || r.bottom > h.bottom && st.vy > 0) st.vy *= -0.7;
        paint();
        if (Math.abs(st.vx) + Math.abs(st.vy) > 0.3) st.raf = requestAnimationFrame(glide);
      })();
    }
    el.addEventListener('pointerup', release); el.addEventListener('pointercancel', release);
    el.addEventListener('click', function (e) { e.preventDefault(); if (e.detail === 0 && el.dataset.slug) openWork(el.dataset.slug, el.dataset.title); });
    el.addEventListener('dragstart', function (e) { e.preventDefault(); });
  });
  if (fine && !reduce && hero) {
    hero.addEventListener('pointermove', function (e) { var r = hero.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5; });
    (function drift() {
      if (scrollY < innerHeight * 1.2) stks.forEach(function (el) {
        var st = el._st; if (st.drag) return;
        st.px += (mx * -st.depth * 2.4 - st.px) * 0.08; st.py += (my * -st.depth * 2.4 - st.py) * 0.08; el._paint();
      });
      requestAnimationFrame(drift);
    })();
  }

  /* ---------- custom cursor ---------- */
  var cur = $('.cursor');
  if (cur && fine && !reduce) {
    var cx = -100, cy = -100, tx = -100, ty = -100, label = $('.cur-label', cur), started = false;
    label.textContent = cur.dataset.view;
    var LINK = 'a, button, .filter, summary, label, [role=button]';
    addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!started) { started = true; cx = tx; cy = ty; root.classList.add('cc'); }
      var el = e.target.closest ? e.target : null; if (!el) return;
      var t = el.closest('.card a, .stk'), txt = '';
      if (t) txt = t.classList.contains('stk') ? cur.dataset.drag : cur.dataset.view;
      if (txt && label.textContent !== txt) label.textContent = txt;
      cur.classList.toggle('on', !!t);
      cur.classList.toggle('link', !t && !!el.closest(LINK));
      cur.classList.toggle('text', !!el.closest('input, textarea'));
    }, { passive: true });
    addEventListener('pointerdown', function () { cur.classList.add('down'); });
    addEventListener('pointerup', function () { cur.classList.remove('down'); });
    document.addEventListener('mouseleave', function () { root.classList.remove('cc'); started = false; });
    var dlg = $('#lb');
    if (dlg) { new MutationObserver(function () { root.classList.toggle('cc', !dlg.open && started); }).observe(dlg, { attributes: true, attributeFilter: ['open'] }); }
    (function follow() { cx += (tx - cx) * 0.3; cy += (ty - cy) * 0.3; cur.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px)'; requestAnimationFrame(follow); })();
  }

  /* ---------- magnetic buttons + dock magnification ---------- */
  if (fine && !reduce) {
    $$('.talk-btn, .pill.xl, .pill.solid').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.translate = ((e.clientX - r.left - r.width / 2) * 0.28).toFixed(1) + 'px ' + ((e.clientY - r.top - r.height / 2) * 0.4).toFixed(1) + 'px';
      });
      b.addEventListener('pointerleave', function () { b.style.translate = ''; });
    });
    var dock = $('.dock');
    if (dock) {
      var items = $$('a', dock);
      dock.addEventListener('pointermove', function (e) {
        items.forEach(function (a) {
          var r = a.getBoundingClientRect(), d = Math.abs(e.clientX - (r.left + r.width / 2));
          var s = 1 + 0.38 * Math.max(0, 1 - d / 120);
          a.style.scale = s.toFixed(3); a.style.translate = '0 ' + (-(s - 1) * 30).toFixed(1) + 'px';
        });
      });
      dock.addEventListener('pointerleave', function () { items.forEach(function (a) { a.style.scale = ''; a.style.translate = ''; }); });
    }
  }

  /* ---------- stats count up ---------- */
  if ('IntersectionObserver' in window && !reduce) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return; cio.unobserve(en.target);
        var el = en.target, m = el.textContent.match(/^(\D*)(\d+)([.,]\d+)?(.*)$/);
        if (!m || +m[2] === 0) return;
        var end = parseFloat(m[2] + (m[3] ? '.' + m[3].slice(1) : '')), dec = m[3] ? m[3].length - 1 : 0, sep = m[3] ? m[3][0] : '', t0 = performance.now();
        (function up(now) {
          var p = clamp((now - t0) / 1100, 0, 1), v = (end * (1 - Math.pow(1 - p, 4))).toFixed(dec);
          el.textContent = m[1] + (sep ? v.replace('.', sep) : v) + m[4];
          if (p < 1) requestAnimationFrame(up);
        })(t0);
      });
    }, { threshold: 0.6 });
    $$('.stats strong').forEach(function (el) { cio.observe(el); });
  }

  /* ---------- archive filters ---------- */
  var cards = $$('.card');
  $$('.filter').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.filter').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
      var f = b.dataset.f, show = function (c) { return f === 'all' || c.dataset.c.split(' ').indexOf(f) > -1; };
      if (reduce) { cards.forEach(function (c) { c.hidden = !show(c); }); return; }
      cards.forEach(function (c) { c.classList.add('out'); });
      setTimeout(function () {
        var n = 0;
        cards.forEach(function (c) {
          c.hidden = !show(c);
          if (!c.hidden) setTimeout(function () { c.classList.remove('out'); }, 30 + 35 * n++);
        });
      }, 220);
    });
  });

  /* ---------- confetti ---------- */
  var colors = ['#ff5a1f', '#e2e800', '#ffb1ea', '#1479ff', '#ffa76f', '#111'];
  function confetti(x, y) {
    if (reduce) return;
    for (var i = 0; i < 22; i++) {
      var s = document.createElement('i'), a = Math.random() * Math.PI * 2, d = 70 + Math.random() * 150;
      s.className = 'cf'; s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.background = colors[i % colors.length];
      s.style.borderRadius = i % 3 ? '3px' : '50%';
      s.style.setProperty('--x', (Math.cos(a) * d).toFixed(0) + 'px'); s.style.setProperty('--y', (Math.sin(a) * d - 60).toFixed(0) + 'px');
      s.style.setProperty('--r', (Math.random() * 720 - 360).toFixed(0) + 'deg');
      document.body.appendChild(s); setTimeout(function (n) { n.remove(); }, 1050, s);
    }
  }
  $$('a[download]').forEach(function (a) { a.addEventListener('click', function (e) { confetti(e.clientX, e.clientY); }); });


  /* ---------- looping site recordings: play only when visible; respect reduced motion ---------- */
  $$('.browser-video').forEach(function (v) {
    if (reduce) { v.removeAttribute('autoplay'); v.pause(); v.controls = true; return; }
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else { v.pause(); } });
    }, { threshold: 0.15 }).observe(v);
  });
  /* ---------- contact (address and form endpoint come from config.js) ---------- */
  var SITE = window.SITE || {};
  if (SITE.email) {
    $$('[data-mail]').forEach(function (a) { a.href = 'mailto:' + SITE.email; a.textContent = SITE.email; a.hidden = false; });
    $$('[data-mailto]').forEach(function (a) { a.href = 'mailto:' + SITE.email; });
  }
  var form = $('#cform');
  if (form) {
    var status = $('.form-status', form), btn = $('button[type=submit]', form), label = btn.innerHTML;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var d = {}; new FormData(form).forEach(function (v, k) { d[k] = v; });
      if (d._honey) return;
      var subject = 'Portfolio contact — ' + d.name + (d.company ? ' (' + d.company + ')' : '');
      var viaMail = function () {
        status.textContent = form.dataset.fail;
        if (SITE.email) { try { location.href = 'mailto:' + SITE.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(d.message + '\n\n— ' + d.name + '\n' + d.email); } catch (err) {} }
      };
      if (!SITE.form) { viaMail(); if (SITE.email) status.textContent = ''; return; }
      btn.disabled = true; btn.textContent = form.dataset.sending; status.textContent = '';
      fetch(SITE.form, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ name: d.name, email: d.email, company: d.company || '-', message: d.message, _subject: subject })
      }).then(function (r) {
        if (!r.ok) throw 0;
        status.textContent = form.dataset.ok; form.reset();
        var r2 = btn.getBoundingClientRect(); confetti(r2.left + r2.width / 2, r2.top);
      }).catch(viaMail).then(function () { btn.disabled = false; btn.innerHTML = label; });
    });
  }
})();
