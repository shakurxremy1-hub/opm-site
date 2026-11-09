// Kinetic Grid, warp + ripple version (plain JS port of the React component).
// A line grid that bends away from the cursor and sends a ripple on every click.
// Usage: <div data-warp-grid data-theme="monochrome"></div>  (theme: monochrome | default)
// The element becomes a canvas layer; put it behind your content. Mouse and click
// events are read from the element's parent so content on top doesn't block them.
(function () {
  var CELL = 55, RADIUS = 260, MAX_WARP = 24, DOT_SP = 28, LERP = 0.08;
  var LINE_BASE = { r: 255, g: 255, b: 255, a: 0.13 };
  var NODE_R = 1.8, NODE_R_ACTIVE = 3.2;
  var THEMES = {
    default: { line: { r: 74, g: 158, b: 255, a: 0.9 }, node: { r: 74, g: 158, b: 255, a: 1 }, glow: '74,158,255', ripple: '100,180,255', bg: '' },
    monochrome: { line: { r: 255, g: 255, b: 255, a: 0.9 }, node: { r: 255, g: 255, b: 255, a: 1 }, glow: '255,255,255', ripple: '255,255,255', bg: '' }
  };
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mix(a, b, t) {
    return 'rgba(' + Math.round(lerp(a.r, b.r, t)) + ',' + Math.round(lerp(a.g, b.g, t)) + ',' + Math.round(lerp(a.b, b.b, t)) + ',' + lerp(a.a, b.a, t).toFixed(3) + ')';
  }

  function init(host) {
    var theme = THEMES[host.dataset.theme] || THEMES.monochrome;
    if (host.dataset.background) host.style.background = host.dataset.background;
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
    host.style.overflow = 'hidden';
    host.style.pointerEvents = 'none';
    host.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var W = 0, H = 0, dpr = 1;
    var mouse = { x: -9999, y: -9999 }, target = { x: -9999, y: -9999 };
    var ripples = [], raf = 0, visible = true;
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches && !/[?&]fx=on/.test(location.search);

    function size() {
      var r = host.getBoundingClientRect();
      W = Math.max(1, Math.floor(r.width)); H = Math.max(1, Math.floor(r.height));
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduce) draw(performance.now());
    }

    function warp(gx, gy, col, row, cols, rows) {
      var m = 1.5;
      var cp = Math.min(col / m, (cols - 1 - col) / m, 1), rp = Math.min(row / m, (rows - 1 - row) / m, 1);
      var pin = cp * cp * rp * rp;
      var dx = gx - mouse.x, dy = gy - mouse.y, dist = Math.sqrt(dx * dx + dy * dy);
      var prox = Math.max(0, 1 - dist / RADIUS) * pin;
      var rx = 0, ry = 0;
      for (var i = 0; i < ripples.length; i++) {
        var rp2 = ripples[i], rdx = gx - rp2.x, rdy = gy - rp2.y;
        var rd = Math.sqrt(rdx * rdx + rdy * rdy), diff = rd - rp2.radius, ww = 55;
        if (Math.abs(diff) < ww) {
          var s = (1 - Math.abs(diff) / ww) * rp2.opacity * 18 * pin;
          var a = Math.atan2(rdy, rdx), sign = diff < 0 ? -1 : 1;
          rx += Math.cos(a) * s * sign * -1; ry += Math.sin(a) * s * sign * -1;
        }
      }
      if (dist < RADIUS && dist > 0 && pin > 0) {
        var t = dist / RADIUS;
        var e = t < 0.01 ? 0 : (1 - t) * (1 - t) * Math.min(1, dist / 60);
        var amt = e * MAX_WARP * pin, ang = Math.atan2(dy, dx);
        return { x: gx - Math.cos(ang) * amt + rx, y: gy - Math.sin(ang) * amt + ry, p: prox };
      }
      return { x: gx + rx, y: gy + ry, p: prox };
    }

    function draw(now) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (var x = DOT_SP / 2; x < W; x += DOT_SP) for (var y = DOT_SP / 2; y < H; y += DOT_SP) {
        ctx.beginPath(); ctx.arc(x, y, 0.7, 0, 6.2832); ctx.fill();
      }
      for (var i = ripples.length - 1; i >= 0; i--) {
        var rp = ripples[i], age = (now - rp.born) / 1000;
        rp.radius = Math.max(0, age * 400); rp.opacity = Math.max(0, 1 - age * 1.2);
        if (rp.opacity <= 0) ripples.splice(i, 1);
      }
      var cols = Math.max(2, Math.ceil(W / CELL)) + 1, rows = Math.max(2, Math.ceil(H / CELL)) + 1;
      var cw = W / (cols - 1), ch = H / (rows - 1), pts = [], r, c;
      for (r = 0; r < rows; r++) { pts[r] = []; for (c = 0; c < cols; c++) pts[r][c] = warp(c * cw, r * ch, c, r, cols, rows); }
      function seg(a, b) {
        var avg = (a.p + b.p) / 2, t = avg * avg * (3 - 2 * avg);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = mix(LINE_BASE, theme.line, t); ctx.lineWidth = lerp(0.8, 1.5, t); ctx.stroke();
      }
      for (r = 0; r < rows; r++) for (c = 0; c < cols - 1; c++) seg(pts[r][c], pts[r][c + 1]);
      for (c = 0; c < cols; c++) for (r = 0; r < rows - 1; r++) seg(pts[r][c], pts[r + 1][c]);
      for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
        var p = pts[r][c], t2 = p.p * p.p * (3 - 2 * p.p), rad = lerp(NODE_R, NODE_R_ACTIVE, t2);
        if (t2 > 0.3) {
          var gr = rad + lerp(0, 6, (t2 - 0.3) / 0.7);
          var g = ctx.createRadialGradient(p.x, p.y, rad * 0.5, p.x, p.y, gr);
          g.addColorStop(0, 'rgba(' + theme.glow + ',' + (t2 * 0.3).toFixed(3) + ')');
          g.addColorStop(1, 'rgba(' + theme.glow + ',0)');
          ctx.beginPath(); ctx.arc(p.x, p.y, gr, 0, 6.2832); ctx.fillStyle = g; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, 6.2832);
        ctx.fillStyle = mix({ r: 255, g: 255, b: 255, a: 0.2 }, theme.node, t2); ctx.fill();
      }
      for (i = 0; i < ripples.length; i++) {
        var q = ripples[i];
        ctx.beginPath(); ctx.arc(q.x, q.y, Math.max(0, q.radius), 0, 6.2832);
        ctx.strokeStyle = 'rgba(' + theme.ripple + ',' + (q.opacity * 0.28).toFixed(3) + ')'; ctx.lineWidth = 1.5; ctx.stroke();
      }
    }

    function loop(now) {
      raf = 0;
      if (!visible) return;
      mouse.x = lerp(mouse.x, target.x, LERP); mouse.y = lerp(mouse.y, target.y, LERP);
      draw(now);
      raf = requestAnimationFrame(loop);
    }
    function start() { if (!raf && visible && !reduce) raf = requestAnimationFrame(loop); }

    size();
    if (window.ResizeObserver) new ResizeObserver(size).observe(host); else window.addEventListener('resize', size);
    if (reduce) return; // static grid only

    var src = host.parentElement || host;
    function rel(e) { var r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    src.addEventListener('mousemove', function (e) {
      var p = rel(e);
      if (mouse.x === -9999) { mouse.x = p.x; mouse.y = p.y; }
      target = p;
    });
    src.addEventListener('mouseleave', function () { target = { x: -9999, y: -9999 }; mouse = { x: -9999, y: -9999 }; });
    src.addEventListener('click', function (e) { var p = rel(e); ripples.push({ x: p.x, y: p.y, radius: 0, opacity: 1, born: performance.now() }); });
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); }).observe(host);
    }
    start();
  }

  function boot() { document.querySelectorAll('[data-warp-grid]').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
