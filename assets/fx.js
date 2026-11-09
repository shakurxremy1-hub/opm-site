// Site effects, plain-JS versions of three 21st.dev patterns:
//  1. Text Reveal (Mask)  – headline words slide up out of a mask on scroll (soralabs)
//  2. Magnetic            – buttons lean toward the cursor (ibelick)
//  3. Spotlight cards     – a soft light follows the cursor across grid cells
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]fx=on/.test(location.search);
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var root = document.documentElement;

  /* 1. masked word reveal */
  function splitWords(el) {
    var label = Array.prototype.map.call(el.childNodes, function (n) { return n.textContent; }).join(' ').replace(/\s+/g, ' ').trim();
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'tw';
            var inner = document.createElement('span'); inner.className = 'twi';
            inner.style.setProperty('--i', i++); inner.textContent = part;
            w.appendChild(inner); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') { walk(n); }
      });
    })(el);
    el.setAttribute('aria-label', label);
    Array.prototype.forEach.call(el.children, function (c) { c.setAttribute('aria-hidden', 'true'); });
  }
  if (!reduce) {
    var heads = document.querySelectorAll('h1, h2.big, .founder h2');
    root.classList.add('fx');
    Array.prototype.forEach.call(heads, splitWords);
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('tw-in'); io.unobserve(e.target); } });
      }, { threshold: 0.2 });
      Array.prototype.forEach.call(heads, function (h) { io.observe(h); });
    } else { Array.prototype.forEach.call(heads, function (h) { h.classList.add('tw-in'); }); }
  }

  if (!fine || reduce) return;

  /* 2. magnetic buttons */
  Array.prototype.forEach.call(document.querySelectorAll('.btn'), function (b) {
    var raf = 0, tx = 0, ty = 0;
    b.addEventListener('mousemove', function (e) {
      var r = b.getBoundingClientRect();
      tx = (e.clientX - (r.left + r.width / 2)) * 0.28;
      ty = (e.clientY - (r.top + r.height / 2)) * 0.28;
      if (!raf) raf = requestAnimationFrame(function () {
        raf = 0; b.style.setProperty('--mx', tx.toFixed(1) + 'px'); b.style.setProperty('--my', ty.toFixed(1) + 'px');
      });
    });
    b.addEventListener('mouseleave', function () { b.style.removeProperty('--mx'); b.style.removeProperty('--my'); });
  });

  /* 3. spotlight cells */
  Array.prototype.forEach.call(document.querySelectorAll('.svc article, .tier, .caps li, .proc article'), function (c) {
    c.classList.add('spot');
    c.addEventListener('mousemove', function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--sx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--sy', (e.clientY - r.top) + 'px');
    });
  });
})();

// ---- more effects ----
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]fx=on/.test(location.search);
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;

  // scroll progress bar
  var prog = document.getElementById('prog');
  if (prog && !reduce) {
    var tick = 0;
    function upd() {
      tick = 0;
      var h = document.documentElement.scrollHeight - innerHeight;
      prog.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')';
    }
    addEventListener('scroll', function () { if (!tick) tick = requestAnimationFrame(upd); }, { passive: true });
    upd();
  }

  // floating "Book a call": show after the hero, hide while the contact section is on screen
  var fab = document.getElementById('fab'), hero = document.querySelector('.hero'), contact = document.getElementById('contact');
  if (fab && hero && 'IntersectionObserver' in window) {
    var pastHero = false, atContact = false;
    function sync() { fab.classList.toggle('show', pastHero && !atContact); }
    new IntersectionObserver(function (es) { pastHero = !es[0].isIntersecting; sync(); }).observe(hero);
    if (contact) new IntersectionObserver(function (es) { atContact = es[0].isIntersecting; sync(); }, { threshold: 0.25 }).observe(contact);
  }

  if (reduce || !fine) return;

  // text scramble on nav links and hero keyword list
  var CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>_';
  function scramble(el) {
    var final = el.dataset.t || (el.dataset.t = el.textContent), n = 0;
    clearInterval(el._s);
    el._s = setInterval(function () {
      n += 0.6;
      var out = '';
      for (var i = 0; i < final.length; i++) out += (final[i] === ' ' || i < n) ? final[i] : CH[Math.floor(Math.random() * CH.length)];
      el.textContent = out;
      if (n >= final.length) { clearInterval(el._s); el.textContent = final; }
    }, 28);
  }
  Array.prototype.forEach.call(document.querySelectorAll('.nav a, .hero__side span'), function (a) {
    a.addEventListener('mouseenter', function () { scramble(a); });
  });

  // portrait tilt
  var img = document.querySelector('.founder img');
  if (img) {
    var box = img.parentElement;
    box.addEventListener('mousemove', function (e) {
      var r = img.getBoundingClientRect();
      img.style.setProperty('--ry', (((e.clientX - r.left) / r.width - 0.5) * 10).toFixed(2) + 'deg');
      img.style.setProperty('--rx', ((0.5 - (e.clientY - r.top) / r.height) * 8).toFixed(2) + 'deg');
    });
    box.addEventListener('mouseleave', function () { img.style.setProperty('--rx', '0deg'); img.style.setProperty('--ry', '0deg'); });
  }
})();

// ---- round 3 ----
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]fx=on/.test(location.search);
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s) { return document.querySelector(s); };

  // copy email + toast
  var copy = $('#copy'), toast = $('#toast');
  if (copy && toast) copy.addEventListener('click', function () {
    var done = function (msg) { toast.textContent = msg; toast.classList.add('show'); setTimeout(function () { toast.classList.remove('show'); }, 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText('shakur@opmventuresllc.com').then(function () { done('Email copied'); }, function () { done('shakur@opmventuresllc.com'); });
    else done('shakur@opmventuresllc.com');
  });

  // section dots
  var dots = Array.prototype.slice.call(document.querySelectorAll('#dots a'));
  if (dots.length && 'IntersectionObserver' in window) {
    var by = {};
    dots.forEach(function (a) { by[a.getAttribute('href').slice(1)] = a; });
    var vis = {};
    var dio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { vis[e.target.id] = e.intersectionRatio; });
      var best = null, bv = 0;
      for (var id in vis) if (vis[id] > bv) { bv = vis[id]; best = id; }
      dots.forEach(function (a) { a.classList.toggle('on', by[best] === a); });
    }, { threshold: [0, .15, .3, .5, .75] });
    for (var id in by) { var el = document.getElementById(id); if (el) dio.observe(el); }
  }

  if (reduce) return;

  // marquee speed follows scroll velocity
  var anims = [];
  Array.prototype.forEach.call(document.querySelectorAll('.marq div, .ticker div'), function (d) {
    if (d.getAnimations) { var a = d.getAnimations()[0]; if (a) anims.push(a); }
  });
  if (anims.length) {
    var lastY = scrollY, boost = 0;
    (function loop() {
      var dy = Math.abs(scrollY - lastY); lastY = scrollY;
      boost = boost * 0.92 + Math.min(dy, 80) * 0.08;
      var rate = 1 + boost * 0.9;
      for (var i = 0; i < anims.length; i++) anims[i].playbackRate = rate;
      requestAnimationFrame(loop);
    })();
  }

  // draggable cube (spins on its own, drag to turn it)
  var wrap = $('.cube-wrap'), cube = $('.cube'), stage = $('.remy__stage');
  if (wrap && cube) {
    document.documentElement.classList.add('js-cube');
    var ry = 20, rx = -8, vy = 0.28, vx = 0, drag = false, lx = 0, ly = 0, on = true;
    wrap.addEventListener('pointerdown', function (e) { drag = true; lx = e.clientX; ly = e.clientY; wrap.setPointerCapture(e.pointerId); });
    wrap.addEventListener('pointermove', function (e) {
      if (!drag) return;
      vy = (e.clientX - lx) * 0.5; vx = -(e.clientY - ly) * 0.35; lx = e.clientX; ly = e.clientY;
      ry += vy; rx = Math.max(-70, Math.min(70, rx + vx));
    });
    function up() { drag = false; }
    wrap.addEventListener('pointerup', up); wrap.addEventListener('pointercancel', up);
    if ('IntersectionObserver' in window && stage) new IntersectionObserver(function (es) { on = es[0].isIntersecting; }).observe(stage);
    (function spin() {
      if (on) {
        var sy = scrollY, sd = sy - (spin.ly == null ? sy : spin.ly); spin.ly = sy;
        if (!drag) { vy += (0.28 - vy) * 0.03; vy += Math.max(-3, Math.min(3, sd * 0.02)); rx += (-8 - rx) * 0.02; ry += vy; }
        cube.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
      }
      requestAnimationFrame(spin);
    })();
  }

  if (!fine) return;

  // hero background parallax (mouse + scroll)
  var bg = $('.hero__bg'), hero = $('.hero');
  if (bg && hero) {
    var mx = 0, my = 0;
    hero.addEventListener('mousemove', function (e) {
      mx = (e.clientX / innerWidth - 0.5) * -26; my = (e.clientY / innerHeight - 0.5) * -14; paint();
    });
    addEventListener('scroll', paint, { passive: true });
    function paint() {
      if (scrollY > innerHeight * 1.2) return;
      bg.style.setProperty('--px', mx.toFixed(1) + 'px');
      bg.style.setProperty('--py', (my + scrollY * 0.18).toFixed(1) + 'px');
    }
  }

  // cursor ring
  var ring = document.createElement('div'); ring.className = 'ring'; ring.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ring);
  var tx = 0, ty = 0, cx = 0, cy = 0, seen = false;
  addEventListener('mousemove', function (e) {
    tx = e.clientX; ty = e.clientY;
    if (!seen) { seen = true; cx = tx; cy = ty; ring.classList.add('on'); }
    var onCube = !!e.target.closest && !!e.target.closest('.cube-wrap');
    ring.classList.toggle('lab', onCube); if (onCube) ring.setAttribute('data-l', 'Drag'); else ring.removeAttribute('data-l');
    ring.classList.toggle('big', !onCube && !!e.target.closest && !!e.target.closest('a,button'));
  });
  document.addEventListener('mouseleave', function () { ring.classList.remove('on'); seen = false; });
  // spring-driven follow (a little overshoot makes it feel liquid)
  var vx = 0, vy = 0, lt = 0;
  var rrun = false;
  function follow(now) {
    var dt = Math.min(.032, (now - lt) / 1000 || .016); lt = now;
    vx += (-190 * (cx - tx) - 24 * vx) * dt; vy += (-190 * (cy - ty) - 24 * vy) * dt;
    cx += vx * dt; cy += vy * dt;
    ring.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px)';
    if (Math.abs(cx - tx) + Math.abs(cy - ty) + Math.abs(vx) + Math.abs(vy) < .2) { rrun = false; return; }
    requestAnimationFrame(follow);
  }
  function wake() { if (!rrun) { rrun = true; lt = 0; requestAnimationFrame(follow); } }
  addEventListener('mousemove', wake);
})();

/* ---- round 4: tier tilt, price count-up, button ripple, process line ---- */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]fx=on/.test(location.search);
  var fine = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
  // 3D tilt + glare on tier cards
  if (fine && !reduce) document.querySelectorAll('.tier').forEach(function (t) {
    var g = document.createElement('span'); g.className = 'glare'; g.setAttribute('aria-hidden', 'true'); t.appendChild(g);
    t.addEventListener('mousemove', function (e) {
      var r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      t.style.setProperty('--ry', ((x - .5) * 8).toFixed(2) + 'deg');
      t.style.setProperty('--rx', ((.5 - y) * 8).toFixed(2) + 'deg');
      t.style.setProperty('--gx', (x * 100).toFixed(1) + '%'); t.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
      t.classList.add('tilting');
    });
    t.addEventListener('mouseleave', function () {
      t.classList.remove('tilting'); t.style.setProperty('--rx', '0deg'); t.style.setProperty('--ry', '0deg');
    });
  });
  // price count-up (first number in each price; final text is unchanged)
  if (!reduce && window.IntersectionObserver) {
    var po = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return; po.unobserve(en.target);
        var node = en.target.firstChild; if (!node || node.nodeType !== 3) return;
        var m = node.nodeValue.match(/([\d,]+)/); if (!m) return;
        var end = parseInt(m[1].replace(/,/g, ''), 10), full = node.nodeValue, t0 = performance.now();
        (function tick(now) {
          var k = Math.min(1, (now - t0) / 900), v = Math.round(end * (1 - Math.pow(1 - k, 3)));
          node.nodeValue = full.replace(m[1], v.toLocaleString('en-US'));
          if (k < 1) requestAnimationFrame(tick); else node.nodeValue = full;
        })(t0);
      });
    }, { threshold: .6 });
    document.querySelectorAll('.price').forEach(function (p) { po.observe(p); });
  }
  // click ripple on buttons
  if (!reduce) document.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('.btn'); if (!b) return;
    var r = b.getBoundingClientRect(), w = document.createElement('span'), d = document.createElement('i');
    w.className = 'rip'; w.setAttribute('aria-hidden', 'true');
    d.style.left = (e.clientX - r.left) + 'px'; d.style.top = (e.clientY - r.top) + 'px';
    w.appendChild(d); b.appendChild(w); setTimeout(function () { w.remove(); }, 700);
  });
  // process line: fills as the "How we start" steps scroll through
  var proc = document.querySelector('.proc');
  if (proc && !reduce) {
    var line = document.createElement('div'); line.className = 'step-line'; line.setAttribute('aria-hidden', 'true');
    line.innerHTML = '<i></i>'; proc.parentNode.insertBefore(line, proc);
    function upd() {
      var r = proc.getBoundingClientRect(), vh = innerHeight;
      var k = Math.max(0, Math.min(1, (vh * .85 - r.top) / (r.height + vh * .3)));
      line.style.setProperty('--sl', k.toFixed(3));
    }
    addEventListener('scroll', upd, { passive: true }); upd();
  }
})();

/* ---- round 5: gold dust in the Remy OS stage, founder photo wipe ---- */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]fx=on/.test(location.search);
  var img = document.querySelector('.founder img');
  if (img) {
    if (reduce || !window.IntersectionObserver) img.classList.add('wipe-in');
    else new IntersectionObserver(function (es, o) {
      if (es[0].isIntersecting) { img.classList.add('wipe-in'); o.disconnect(); }
    }, { threshold: .25 }).observe(img.parentNode);
  }
  var cv = document.querySelector('.remy__fx'); if (!cv || reduce) return;
  var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = 1, ps = [], raf = 0, vis = false;
  function size() {
    var r = cv.getBoundingClientRect(); W = r.width; H = r.height; dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(Math.min(70, W / 22)); ps = [];
    for (var i = 0; i < n; i++) ps.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + .4, v: Math.random() * .35 + .1, d: Math.random() * 6.28 });
  }
  function frame() {
    raf = 0; if (!vis) return;
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i]; p.y -= p.v; p.d += .01; p.x += Math.sin(p.d) * .25;
      if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832);
      ctx.fillStyle = 'rgba(224,186,100,' + (.25 + .5 * Math.abs(Math.sin(p.d))).toFixed(2) + ')'; ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }
  size(); if (window.ResizeObserver) new ResizeObserver(size).observe(cv);
  new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis && !raf) raf = requestAnimationFrame(frame); }).observe(cv);
})();

/* ---- round 6: command palette (Cmd/Ctrl+K) ---- */
(function () {
  var mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  var items = [
    ['Remy OS', 'Section', '#remy'], ['Services', 'Section', '#services'], ['How we start', 'Section', '#start'],
    ['Operator', 'Section', '#operator'], ['Tiers', 'Section', '#tiers'], ['Questions', 'Section', '#faq'], ['Contact', 'Section', '#contact'],
    ['Book a call', 'Action', 'https://calendly.com/shakur-opmventuresllc/30min'],
    ['Copy email', 'Action', 'copy']
  ];
  var el = document.createElement('div'); el.className = 'cmd'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Jump to');
  el.innerHTML = '<div class="cmd__box"><input type="text" placeholder="Jump to…" aria-label="Search" autocomplete="off" spellcheck="false"><ul role="listbox"></ul></div>';
  document.body.appendChild(el);
  var input = el.querySelector('input'), list = el.querySelector('ul'), sel = 0, shown = [], lastFocus = null;
  function render() {
    var q = input.value.trim().toLowerCase();
    shown = items.filter(function (it) { return !q || it[0].toLowerCase().indexOf(q) > -1; });
    sel = Math.min(sel, Math.max(0, shown.length - 1));
    list.innerHTML = shown.length ? '' : '<p>No match.</p>';
    shown.forEach(function (it, i) {
      var li = document.createElement('li'); li.setAttribute('role', 'option'); li.setAttribute('aria-selected', i === sel);
      li.innerHTML = '<span></span><small></small>'; li.firstChild.textContent = it[0]; li.lastChild.textContent = it[1];
      li.addEventListener('mousemove', function () { sel = i; mark(); });
      li.addEventListener('click', function () { run(it); });
      list.appendChild(li);
    });
  }
  function mark() { [].forEach.call(list.children, function (li, i) { li.setAttribute('aria-selected', i === sel); }); }
  function open() { lastFocus = document.activeElement; el.classList.add('open'); input.value = ''; sel = 0; render(); input.focus(); }
  function close() { el.classList.remove('open'); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  function run(it) {
    close();
    if (it[2] === 'copy') { var c = document.getElementById('copy'); if (c) c.click(); }
    else if (it[2].charAt(0) === '#') { var t = document.querySelector(it[2]); if (t) t.scrollIntoView({ behavior: 'smooth' }); }
    else window.open(it[2], '_blank', 'noopener');
  }
  input.addEventListener('input', function () { sel = 0; render(); });
  el.addEventListener('mousedown', function (e) { if (e.target === el) close(); });
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); el.classList.contains('open') ? close() : open(); return; }
    if (!el.classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(shown.length - 1, sel + 1); mark(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); mark(); }
    else if (e.key === 'Enter' && shown[sel]) { e.preventDefault(); run(shown[sel]); }
    else if (e.key === 'Tab') { e.preventDefault(); }
  });
  var hdr = document.querySelector('.hdr'), burger = document.getElementById('burger');
  if (hdr && burger) {
    var b = document.createElement('button'); b.className = 'kbtn'; b.type = 'button';
    b.setAttribute('aria-label', 'Open quick jump'); b.textContent = (mac ? '⌘' : 'Ctrl ') + 'K';
    b.addEventListener('click', open); hdr.insertBefore(b, burger);
  }
})();

/* ---- round 7: liquid glass (cursor sheen, scrolled header, glass classes) ---- */
(function () {
  ['#fab', '#toast', '.cmd__box'].forEach(function (q) { var e = document.querySelector(q); if (e) e.classList.add('glass'); });
  var hdr = document.querySelector('.hdr');
  function onScroll() { if (hdr) hdr.classList.toggle('glass-on', scrollY > 60); }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  document.addEventListener('pointermove', function (e) {
    var g = e.target.closest && e.target.closest('.glass'); if (!g) return;
    var r = g.getBoundingClientRect();
    g.style.setProperty('--gx', (e.clientX - r.left) + 'px'); g.style.setProperty('--gy', (e.clientY - r.top) + 'px');
  });
})();

/* ---- round 8: button text roll, scroll-lit list, confetti on copy ---- */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]fx=on/.test(location.search);
  if (reduce) return;
  // text roll on buttons that only hold text
  document.querySelectorAll('.btn').forEach(function (b) {
    if (b.childNodes.length !== 1 || b.firstChild.nodeType !== 3) return;
    var t = b.textContent.trim(); if (!t) return;
    b.setAttribute('aria-label', t);
    b.innerHTML = '<span class="roll" aria-hidden="true"><span></span><span></span></span>';
    b.querySelectorAll('.roll span').forEach(function (x) { x.textContent = t; });
  });
  // list items brighten as they cross the middle of the screen
  var lis = [].slice.call(document.querySelectorAll('.familiar li')), tick = 0;
  function lit() {
    tick = 0; var mid = innerHeight * .55;
    lis.forEach(function (li) {
      var r = li.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - mid) / (innerHeight * .5);
      var o = Math.max(.28, 1 - d * .9); li.style.opacity = o.toFixed(2); li.classList.toggle('lit', d < .18);
    });
  }
  if (lis.length) { addEventListener('scroll', function () { if (!tick) tick = requestAnimationFrame(lit); }, { passive: true }); lit(); }
  // gold confetti when the email is copied
  var copy = document.getElementById('copy');
  if (copy) copy.addEventListener('click', function () {
    var cv = document.createElement('canvas'); cv.className = 'confetti'; cv.setAttribute('aria-hidden', 'true');
    var dpr = Math.min(2, devicePixelRatio || 1); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; document.body.appendChild(cv);
    var ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
    var r = copy.getBoundingClientRect(), ox = r.left + r.width / 2, oy = r.top + r.height / 2, cols = ['#e0ba64', '#f5e2a8', '#ffffff', '#c9972f'], ps = [];
    for (var i = 0; i < 60; i++) { var a = Math.random() * 6.28, v = 3 + Math.random() * 6; ps.push({ x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3, w: 4 + Math.random() * 5, h: 2 + Math.random() * 3, rot: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[i % 4] }); }
    var t0 = performance.now();
    (function f(now) {
      var k = (now - t0) / 1400; ctx.clearRect(0, 0, innerWidth, innerHeight);
      ps.forEach(function (p) { p.vy += .22; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.rot += p.vr; ctx.save(); ctx.globalAlpha = Math.max(0, 1 - k); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore(); });
      if (k < 1) requestAnimationFrame(f); else cv.remove();
    })(t0);
  });
})();

/* ---- round 9: inertial smooth scrolling (own implementation) ---- */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]fx=on/.test(location.search);
  var fine = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (reduce || !fine) return;
  var root = document.documentElement, cur = scrollY, tgt = scrollY, run = false, last = 0, vel = 0;
  function max() { return Math.max(0, root.scrollHeight - innerHeight); }
  function clamp(v) { return Math.min(max(), Math.max(0, v)); }
  function loop(now) {
    var dt = Math.min(48, now - last || 16); last = now;
    var k = 1 - Math.pow(1 - 0.12, dt / 16.67), d = tgt - cur;
    if (Math.abs(d) < .3) { cur = tgt; run = false; } else cur += d * k;
    window.scrollTo({ top: cur, behavior: 'instant' });
    vel += (Math.max(-2, Math.min(2, d / 90)) - vel) * .2; root.style.setProperty('--vel', vel.toFixed(3));
    if (run) requestAnimationFrame(loop); else { root.style.setProperty('--vel', '0'); }
  }
  function go() { if (!run) { run = true; last = 0; requestAnimationFrame(loop); } }
  root.classList.add('smooth');
  addEventListener('wheel', function (e) {
    if (e.ctrlKey || e.defaultPrevented) return;
    if (e.target.closest && e.target.closest('.cmd, textarea, input, select')) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    var dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
    if (!run) cur = scrollY;
    tgt = clamp(tgt + dy); go();
  }, { passive: false });
  // keep in sync when something else moves the page (scrollbar, keys, anchors, palette)
  addEventListener('scroll', function () { if (!run) { cur = tgt = scrollY; } }, { passive: true });
  // in-page links glide with the same easing
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a || e.defaultPrevented) return;
    var id = a.getAttribute('href'); if (id.length < 2) return;
    var t = document.querySelector(id); if (!t) return;
    e.preventDefault(); cur = scrollY;
    tgt = clamp(t.getBoundingClientRect().top + scrollY); go();
    history.replaceState(null, '', id);
  });
})();

/* ---- round 10: scroll cue, cursor glow, section chip ---- */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]fx=on/.test(location.search);
  var hero = document.querySelector('.hero');
  if (hero) { var c = document.createElement('a'); c.className = 'cue'; c.href = '#services'; c.setAttribute('aria-label', 'Scroll to services'); c.innerHTML = 'Scroll<i></i>'; hero.appendChild(c); }
  if (reduce) return;
  var fine = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (fine) {
    var g = document.createElement('div'); g.className = 'glow'; g.setAttribute('aria-hidden', 'true'); document.body.appendChild(g);
    var gx = 0, gy = 0, tx = 0, ty = 0;
    addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; g.classList.add('on'); });
    document.addEventListener('mouseleave', function () { g.classList.remove('on'); });
    var grun = false; function f() { gx += (tx - gx) * .08; gy += (ty - gy) * .08; g.style.transform = 'translate(' + gx.toFixed(1) + 'px,' + gy.toFixed(1) + 'px)'; if (Math.abs(tx - gx) + Math.abs(ty - gy) < .3) { grun = false; return; } requestAnimationFrame(f); } addEventListener('mousemove', function () { if (!grun) { grun = true; requestAnimationFrame(f); } });
  }
  var secs = [['#services', 'Services'], ['#remy', 'Remy OS'], ['#start', 'How we start'], ['#operator', 'Operator'], ['#tiers', 'Tiers'], ['#contact', 'Contact']]
    .map(function (s) { return { el: document.querySelector(s[0]), name: s[1] }; }).filter(function (s) { return s.el; });
  var chip = document.createElement('div'); chip.className = 'chip glass'; chip.setAttribute('aria-hidden', 'true'); document.body.appendChild(chip);
  var tk = 0;
  function upd() {
    tk = 0; var idx = -1, mid = innerHeight * .5;
    secs.forEach(function (s, i) { if (s.el.getBoundingClientRect().top < mid) idx = i; });
    if (idx < 0) { chip.classList.remove('show'); return; }
    chip.innerHTML = '<b>0' + (idx + 1) + ' / 0' + secs.length + '</b><span>' + secs[idx].name + '</span>';
    chip.classList.add('show');
  }
  addEventListener('scroll', function () { if (!tk) tk = requestAnimationFrame(upd); }, { passive: true }); upd();
})();

/* ---- round 11: magnetic nav links ---- */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]fx=on/.test(location.search);
  var fine = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (reduce || !fine) return;
  document.querySelectorAll('.nav a').forEach(function (a) {
    a.style.display = 'inline-block'; a.style.transition = 'transform .25s ease-out';
    a.addEventListener('mousemove', function (e) {
      var r = a.getBoundingClientRect();
      a.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .25).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * .35).toFixed(1) + 'px)';
    });
    a.addEventListener('mouseleave', function () { a.style.transform = ''; });
  });
})();

/* ---- round 12: paragraphs light up word by word as you scroll ---- */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]fx=on/.test(location.search);
  if (reduce) return;
  var ps = [].slice.call(document.querySelectorAll('.remy__intro p:first-of-type, .founder p:first-of-type'));
  var items = ps.map(function (p) {
    var text = p.textContent.trim(); p.setAttribute('aria-label', text);
    p.innerHTML = text.split(/\s+/).map(function (w) { return '<span class="lw" aria-hidden="true">' + w.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span>'; }).join(' ');
    return { p: p, w: [].slice.call(p.children) };
  });
  var tk = 0;
  function upd() {
    tk = 0; var vh = innerHeight;
    items.forEach(function (it) {
      var r = it.p.getBoundingClientRect();
      var k = Math.max(0, Math.min(1, (vh * .85 - r.top) / (vh * .5 + r.height * .5)));
      var n = Math.round(k * it.w.length);
      it.w.forEach(function (w, i) { w.classList.toggle('on', i < n); });
    });
  }
  addEventListener('scroll', function () { if (!tk) tk = requestAnimationFrame(upd); }, { passive: true }); upd();
})();

/* ---- round 13: footer wordmark that fills on scroll, ⌘K hint ---- */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]fx=on/.test(location.search);
  var foot = document.querySelector('footer');
  if (foot) {
    var m = document.createElement('div'); m.className = 'bigmark'; m.setAttribute('aria-hidden', 'true'); m.innerHTML = '<span>OPM Ventures</span>';
    foot.parentNode.insertBefore(m, foot);
    if (reduce) m.style.setProperty('--p', '100%');
    else {
      var tk = 0;
      var upd = function () {
        tk = 0; var r = m.getBoundingClientRect(), vh = innerHeight;
        var k = Math.max(0, Math.min(1, (vh - r.top) / (vh * .2 + r.height * .4)));
        m.style.setProperty('--p', (k * 115).toFixed(1) + '%');
      };
      addEventListener('scroll', function () { if (!tk) tk = requestAnimationFrame(upd); }, { passive: true }); upd();
    }
  }
  // one-time hint about the quick-jump search
  var fine = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (!reduce && fine) {
    var seen = false; try { seen = sessionStorage.getItem('kh') === '1'; } catch (e) {}
    if (!seen) setTimeout(function () {
      var t = document.getElementById('toast'); if (!t) return;
      var mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
      var old = t.textContent; t.textContent = 'Tip: press ' + (mac ? '⌘' : 'Ctrl+') + 'K to jump anywhere';
      t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.textContent = old; }, 400); }, 3500);
      try { sessionStorage.setItem('kh', '1'); } catch (e) {}
    }, 5000);
  }
})();

/* ---- round 14: dock-style dots, number-key shortcuts ---- */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]fx=on/.test(location.search);
  var fine = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
  var dots = document.getElementById('dots');
  if (dots && fine && !reduce) {
    var as = [].slice.call(dots.querySelectorAll('a'));
    dots.addEventListener('mousemove', function (e) {
      as.forEach(function (a) {
        var r = a.getBoundingClientRect(), d = Math.abs(e.clientY - (r.top + r.height / 2));
        var m = 1 + Math.max(0, 1 - d / 70) * 1.1; a.style.transform = 'scale(' + (m * (a.classList.contains('on') ? 1.35 : 1)).toFixed(2) + ')';
      });
    });
    dots.addEventListener('mouseleave', function () { as.forEach(function (a) { a.style.transform = ''; }); });
  }
  // keys 1-6 jump to the sections, when you are not typing
  var ids = ['#services', '#remy', '#start', '#operator', '#tiers', '#contact'];
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    var t = e.target; if (t && (/input|textarea|select/i.test(t.tagName) || t.isContentEditable)) return;
    if (document.querySelector('.cmd.open')) return;
    var i = '123456'.indexOf(e.key); if (i < 0 || e.key.length !== 1) return;
    var el = document.querySelector(ids[i]); if (!el) return;
    var a = document.createElement('a'); a.href = ids[i]; a.style.display = 'none'; document.body.appendChild(a); a.click(); a.remove();
  });
})();

/* ---- round 16: sliding pill in the nav, live San Antonio clock ---- */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]fx=on/.test(location.search);
  var nav = document.getElementById('nav');
  if (nav && !reduce) {
    var pill = document.createElement('span'); pill.className = 'nind'; pill.setAttribute('aria-hidden', 'true'); nav.appendChild(pill);
    var links = [].slice.call(nav.querySelectorAll('a')), cur = null;
    function to(a) {
      if (!a) { pill.classList.remove('on'); return; }
      pill.style.width = (a.offsetWidth + 24) + 'px';
      pill.style.transform = 'translate(' + (a.offsetLeft - 12) + 'px,-50%)';
      pill.classList.add('on');
    }
    links.forEach(function (a) {
      a.addEventListener('mouseenter', function () { to(a); });
      a.addEventListener('focus', function () { to(a); });
    });
    nav.addEventListener('mouseleave', function () { to(cur); });
    var tk = 0;
    function track() {
      tk = 0; var mid = innerHeight * .5, found = null;
      links.forEach(function (a) { var t = document.querySelector(a.getAttribute('href')); if (t && t.getBoundingClientRect().top < mid && t.getBoundingClientRect().bottom > mid) found = a; });
      if (found !== cur) { cur = found; if (!nav.matches(':hover')) to(cur); }
    }
    addEventListener('scroll', function () { if (!tk) tk = requestAnimationFrame(track); }, { passive: true });
    addEventListener('resize', function () { to(cur); }); track();
  }
  var foot = document.querySelector('footer span');
  if (foot && window.Intl) {
    var el = document.createElement('span'); el.className = 'clock'; foot.parentNode.insertBefore(el, foot.nextSibling);
    var fmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Chicago', timeZoneName: 'short' });
    function tick() { el.textContent = 'San Antonio · ' + fmt.format(new Date()); }
    tick(); setInterval(tick, 20000);
  }
})();

/* ---- round 18: cave parallax ---- */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]fx=on/.test(location.search);
  var fine = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
  var st = document.querySelector('.remy__stage'); if (!st || reduce || !fine) return;
  st.addEventListener('mousemove', function (e) {
    var r = st.getBoundingClientRect();
    st.style.setProperty('--mx2', (((e.clientX - r.left) / r.width - .5) * 2).toFixed(3));
    st.style.setProperty('--my2', (((e.clientY - r.top) / r.height - .5) * 2).toFixed(3));
  });
  st.addEventListener('mouseleave', function () { st.style.setProperty('--mx2', 0); st.style.setProperty('--my2', 0); });
})();

/* ---- round 20: smooth FAQ accordion (native details underneath) ---- */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]fx=on/.test(location.search);
  var all = [].slice.call(document.querySelectorAll('.faq details'));
  if (reduce || !all.length || !Element.prototype.animate) return;
  all.forEach(function (d) {
    var sum = d.querySelector('summary'), ans = d.querySelector('.ans'), anim = null;
    sum.addEventListener('click', function (e) {
      e.preventDefault(); if (anim) anim.cancel();
      if (!d.open) {
        all.forEach(function (o) { if (o !== d && o.open) o.querySelector('summary').click(); });
        d.open = true; var h = ans.offsetHeight;
        anim = ans.animate({ height: ['0px', h + 'px'], opacity: [0, 1] }, { duration: 420, easing: 'cubic-bezier(.19,1,.22,1)' });
        anim.onfinish = function () { anim = null; };
      } else {
        var h2 = ans.offsetHeight;
        anim = ans.animate({ height: [h2 + 'px', '0px'], opacity: [1, 0] }, { duration: 300, easing: 'cubic-bezier(.7,0,.2,1)' });
        anim.onfinish = function () { d.open = false; anim = null; };
      }
    });
  });
})();

/* ---- round 21: "what do you need most?" picks a tier ---- */
(function () {
  var grid = document.querySelector('.tiers__grid'); if (!grid) return;
  var tiers = [].slice.call(grid.querySelectorAll('.tier'));
  var opts = ['Get seen', 'Get leads', 'Get capital', 'Multi-location or higher budgets'];
  if (tiers.length !== 4) return;
  var box = document.createElement('div'); box.className = 'pick'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'What do you need most?');
  box.innerHTML = '<span class="pick__q">What do you need most?</span><div class="pick__opts"></div><p class="pick__out" aria-live="polite"></p>';
  var wrap = box.querySelector('.pick__opts'), out = box.querySelector('.pick__out'), btns = [];
  function clear() { btns.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); }); tiers.forEach(function (t) { t.classList.remove('match'); }); grid.classList.remove('has-match'); out.textContent = ''; }
  opts.forEach(function (label, i) {
    var b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', function () {
      var on = b.getAttribute('aria-pressed') === 'true'; clear(); if (on) return;
      b.setAttribute('aria-pressed', 'true'); tiers[i].classList.add('match'); grid.classList.add('has-match');
      var name = tiers[i].querySelector('h3').textContent.trim(), bl = (tiers[i].querySelector('.bl') || {}).textContent || '';
      out.innerHTML = '<b></b> '; out.firstChild.textContent = name + ':'; out.appendChild(document.createTextNode(bl.trim()));
    });
    btns.push(b); wrap.appendChild(b);
  });
  grid.parentNode.insertBefore(box, grid);
})();

/* ---- round 23: pinned statement, one line lights up at a time ---- */
(function () {
  var sec = document.querySelector('.statement'); if (!sec || !document.documentElement.classList.contains('fx')) return;
  var lines = [].slice.call(sec.querySelectorAll('span')), tk = 0;
  function upd() {
    tk = 0; var r = sec.getBoundingClientRect(), vh = innerHeight;
    var p = Math.max(0, Math.min(.999, -r.top / Math.max(1, r.height - vh)));
    var idx = Math.floor(p * lines.length * 1.0 + .0001);
    if (r.top > vh * .5) idx = -1;
    lines.forEach(function (l, i) { l.classList.toggle('cur', i === idx); l.classList.toggle('past', i < idx || (idx === lines.length - 1 && false)); });
  }
  addEventListener('scroll', function () { if (!tk) tk = requestAnimationFrame(upd); }, { passive: true }); upd();
})();

/* ---- round 24: count-up facts, hero fades as you scroll away ---- */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]fx=on/.test(location.search);
  if (reduce) return;
  var nums = [].slice.call(document.querySelectorAll('[data-count]'));
  if (nums.length && window.IntersectionObserver) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return; io.unobserve(en.target);
        var el = en.target, end = parseInt(el.getAttribute('data-count'), 10), t0 = performance.now(), dur = 1400 + end * 20;
        (function f(now) {
          var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
          el.textContent = Math.round(end * e); if (k < 1) requestAnimationFrame(f); else el.textContent = end;
        })(t0);
      });
    }, { threshold: .6 });
    nums.forEach(function (n) { n.textContent = '0'; io.observe(n); });
  }
  var hero = document.querySelector('.hero'), tk = 0;
  if (hero) {
    var upd = function () { tk = 0; var k = Math.max(0, Math.min(1, scrollY / (innerHeight * .8))); hero.style.setProperty('--hs', k.toFixed(3)); };
    addEventListener('scroll', function () { if (!tk) tk = requestAnimationFrame(upd); }, { passive: true }); upd();
  }
})();

/* ---- round 25: speed dial above the Book a call button ---- */
(function () {
  var fab = document.getElementById('fab'); if (!fab) return;
  var fine = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches; if (!fine) return;
  var defs = [['Email', 'mailto:shakur@opmventuresllc.com?subject=OPM%20Ventures%20%E2%80%94%20enquiry'], ['See plans', '#tiers']];
  var subs = defs.map(function (d, i) {
    var a = document.createElement('a'); a.className = 'fab2 glass' + (i ? ' d2' : ''); a.style.bottom = (76 + i * 48) + 'px'; a.href = d[1]; a.textContent = d[0]; document.body.appendChild(a); return a;
  });
  var t = 0;
  function open() { clearTimeout(t); if (fab.classList.contains('show')) subs.forEach(function (a) { a.classList.add('open'); }); }
  function close() { clearTimeout(t); t = setTimeout(function () { subs.forEach(function (a) { a.classList.remove('open'); }); }, 250); }
  [fab].concat(subs).forEach(function (e) { e.addEventListener('mouseenter', open); e.addEventListener('mouseleave', close); e.addEventListener('focus', open); e.addEventListener('blur', close); });
})();

/* ---- round 26: small gold spark burst on clicks that are not on links or buttons ---- */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]fx=on/.test(location.search);
  var fine = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (reduce || !fine || !Element.prototype.animate) return;
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('a,button,summary,input,.cmd,.cube-wrap,[data-warp-grid]')) return;
    for (var i = 0; i < 9; i++) {
      var d = document.createElement('i'); d.className = 'spark'; d.setAttribute('aria-hidden', 'true');
      d.style.left = e.clientX + 'px'; d.style.top = e.clientY + 'px'; document.body.appendChild(d);
      var a = (i / 9) * 6.283 + Math.random() * .5, r = 22 + Math.random() * 26;
      var an = d.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: 'translate(' + Math.cos(a) * r + 'px,' + Math.sin(a) * r + 'px) scale(0)', opacity: 0 }], { duration: 520, easing: 'cubic-bezier(.19,1,.22,1)' });
      an.onfinish = (function (x) { return function () { x.remove(); }; })(d);
    }
  });
})();
