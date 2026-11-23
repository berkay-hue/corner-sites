/* studyo-motor.js — SmcMotor: tarayıcıda şablon video + görsel/carousel motoru (yalnız <canvas>, bağımlılık yok).
   Klasik <script defer> ile yüklenir; tek genel ad window.SmcMotor. CSP: script-src 'self', font-src 'self' yeterli.
   Sahne verisi /gen/video sözleşmesiyle aynı: scenes:[{text, sub, secs}]. Metinde *yıldız* arası kelimeler vurgulanır. */
(function () {
  'use strict';
  if (window.SmcMotor) return;

  /* ---------- Yazı tipleri ---------- */
  const SRC = (document.currentScript && document.currentScript.src) || '';
  const FONT_BASE = (function () { try { return SRC ? new URL('fonts/', SRC).href : '/assets/fonts/'; } catch (e) { return '/assets/fonts/'; } })();
  const FAM = 'SmcMotor Manrope';
  const EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji"';
  const SANS = '"' + FAM + '",Manrope,system-ui,-apple-system,"Segoe UI",Roboto,Arial,' + EMOJI + ',sans-serif';
  const SERIF = '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Times New Roman",' + EMOJI + ',serif';
  const R_LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
  const R_EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
  let fontGen = 0, readyP = null;

  function withTimeout(p, ms) { return Promise.race([p, new Promise(function (r) { setTimeout(r, ms); })]); }

  function ready() {
    if (readyP) return readyP;
    readyP = (async function () {
      try {
        if (typeof FontFace === 'function' && document.fonts) {
          const faces = [
            new FontFace(FAM, 'url("' + FONT_BASE + 'manrope-latin.woff2") format("woff2")', { weight: '200 800', style: 'normal', unicodeRange: R_LATIN }),
            new FontFace(FAM, 'url("' + FONT_BASE + 'manrope-latin-ext.woff2") format("woff2")', { weight: '200 800', style: 'normal', unicodeRange: R_EXT })
          ];
          faces.forEach(function (f) { document.fonts.add(f); });
          await withTimeout(Promise.all(faces.map(function (f) { return f.load().catch(function () {}); })), 5000);
        }
      } catch (e) { /* sistem yedeği kullanılır */ }
      fontGen++; LCACHE.clear();
    })();
    return readyP;
  }

  /* ---------- Yardımcılar ---------- */
  const clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  const lerp = function (a, b, k) { return a + (b - a) * k; };
  const E = {
    outCubic: function (k) { return 1 - Math.pow(1 - k, 3); },
    outQuart: function (k) { return 1 - Math.pow(1 - k, 4); },
    outQuint: function (k) { return 1 - Math.pow(1 - k, 5); },
    outExpo: function (k) { return k >= 1 ? 1 : 1 - Math.pow(2, -10 * k); },
    inCubic: function (k) { return k * k * k; },
    inOutCubic: function (k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; },
    outBack: function (k) { const c1 = 1.15, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); }
  };
  function prog(t, start, d, ease) { const k = clamp((t - start) / d, 0, 1); return ease ? ease(k) : k; }
  const pad2 = function (n) { return String(n).padStart(2, '0'); };

  /* ---------- Renk ---------- */
  function parseColor(c, fb) {
    if (c && typeof c === 'object' && 'r' in c) return c;
    if (typeof c !== 'string') return fb;
    const s = c.trim().toLowerCase();
    let m = /^#?([0-9a-f]{3,8})$/.exec(s);
    if (m) {
      let h = m[1];
      if (h.length === 3 || h.length === 4) h = h.split('').map(function (x) { return x + x; }).join('');
      if (h.length === 6 || h.length === 8) return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
      return fb;
    }
    m = /^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/.exec(s);
    if (m) return { r: clamp(+m[1], 0, 255), g: clamp(+m[2], 0, 255), b: clamp(+m[3], 0, 255) };
    return fb;
  }
  const css = function (c, a) { return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + (a == null ? 1 : +a.toFixed(4)) + ')'; };
  const mix = function (a, b, k) { return { r: Math.round(lerp(a.r, b.r, k)), g: Math.round(lerp(a.g, b.g, k)), b: Math.round(lerp(a.b, b.b, k)) }; };
  function lum(c) { const f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); }
  function contrast(a, b) { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
  const WHITE = { r: 255, g: 255, b: 255 }, BLACK = { r: 0, g: 0, b: 0 }, INK = { r: 14, g: 16, b: 24 };
  function onColor(c) { return contrast(c, WHITE) >= 3.4 || contrast(c, WHITE) >= contrast(c, INK) ? WHITE : INK; }
  function readable(c, bg, min) {
    if (contrast(c, bg) >= min) return c;
    const tgt = lum(bg) > 0.3 ? BLACK : WHITE;
    for (let k = 0.08; k <= 1.001; k += 0.08) { const m = mix(c, tgt, k); if (contrast(m, bg) >= min) return m; }
    return tgt;
  }
  function hueShift(c, deg) {
    const r = c.r / 255, g = c.g / 255, b = c.b / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    let h = 0, s = 0; const l = (mx + mn) / 2, d = mx - mn;
    if (d) {
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60;
    }
    h = (h + deg + 360) % 360;
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = function (t) { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 0.5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    return { r: Math.round(f(h / 360 + 1 / 3) * 255), g: Math.round(f(h / 360) * 255), b: Math.round(f(h / 360 - 1 / 3) * 255) };
  }

  /* ---------- Veri: oranlar, paletler ---------- */
  const aspects = { '9:16': [1080, 1920], '1:1': [1080, 1080], '4:5': [1080, 1350], '16:9': [1920, 1080] };
  // Güvenli alan [üst, sağ, alt, sol]. 9:16: Reels/TikTok üst başlık, sağ düğmeler, alt açıklama bölgesi dışı.
  const SAFE = { '9:16': [250, 130, 400, 100], '1:1': [96, 96, 96, 96], '4:5': [100, 96, 110, 96], '16:9': [90, 130, 90, 130] };

  const palettes = [
    { id: 'marka', name_tr: 'Marka moru', name_en: 'Brand purple', bg: '#140f2c', fg: '#f7f4ff', accent: '#8a63f2' },
    { id: 'lavanta', name_tr: 'Lavanta', name_en: 'Lavender', bg: '#f3effe', fg: '#1b1236', accent: '#774be5' },
    { id: 'gece', name_tr: 'Gece', name_en: 'Midnight', bg: '#0b1622', fg: '#f2f7fb', accent: '#5fd3a6' },
    { id: 'krem', name_tr: 'Krem', name_en: 'Cream', bg: '#f3ede3', fg: '#1f1b16', accent: '#c8502a' },
    { id: 'neon', name_tr: 'Neon', name_en: 'Neon', bg: '#0e0e10', fg: '#ffffff', accent: '#d4ff3a' },
    { id: 'mercan', name_tr: 'Mercan', name_en: 'Coral', bg: '#fff3ee', fg: '#2b1611', accent: '#ff5a36' }
  ];
  const PAL = {}; palettes.forEach(function (p) { PAL[p.id] = p; });

  /* ---------- Metin: belirteç, ölçü, sığdırma ---------- */
  const MC = document.createElement('canvas'); MC.width = MC.height = 4;
  const MCTX = MC.getContext('2d');
  const HAS_LS = 'letterSpacing' in MCTX;
  function setLS(ctx, px) { if (HAS_LS) ctx.letterSpacing = (px ? px.toFixed(2) : '0') + 'px'; }
  function fontStr(weight, size, fam, italic) { return (italic ? 'italic ' : '') + weight + ' ' + (+size.toFixed(2)) + 'px ' + (fam === 'serif' ? SERIF : SANS); }
  function graphemes(s) {
    try { if (typeof Intl !== 'undefined' && Intl.Segmenter) return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(s), function (x) { return x.segment; }); } catch (e) { /* yok */ }
    return Array.from(s);
  }
  function upperOf(s, lang) { try { return s.toLocaleUpperCase(lang === 'en' ? 'en-US' : 'tr-TR'); } catch (e) { return s.toUpperCase(); } }

  // "*vurgu*" işaretli metni kelime belirteçlerine böler: {t, hl, br (önce satır sonu), nb (önce boşluk yok)}
  function tokenize(text, upper, lang, autoHl) {
    let s = String(text == null ? '' : text).replace(/\r/g, '').slice(0, 400);
    if (upper) s = upperOf(s, lang);
    const stars = (s.match(/\*/g) || []).length;
    const markup = stars >= 2 && stars % 2 === 0;
    const segs = markup ? s.split('*') : [s.replace(/\*/g, '')];
    const out = [];
    let pendBr = false;
    segs.forEach(function (seg, si) {
      const hl = markup && si % 2 === 1;
      const glue = out.length && seg && !/^\s/.test(seg) && si > 0 && !/\s$/.test(segs[si - 1]);
      let firstInSeg = true;
      seg.split('\n').forEach(function (ln, li) {
        if (li > 0) pendBr = true;
        ln.split(/[ \t ]+/).forEach(function (w) {
          if (!w) return;
          out.push({ t: w, hl: hl, br: pendBr, nb: !!(glue && firstInSeg && !pendBr) });
          pendBr = false; firstInSeg = false;
        });
      });
    });
    if (autoHl && !markup && out.length >= 3) {
      const nums = out.filter(function (k) { return /\d/.test(k.t); });
      if (nums.length && nums.length <= 2) nums.forEach(function (k) { k.hl = true; });
      else if (!nums.length) {
        const last = out[out.length - 1];
        if (last.t.replace(/[^\p{L}\p{N}]/gu, '').length >= 3) last.hl = true;
      }
    }
    return out;
  }

  const LCACHE = new Map();
  function fontOf(o, hl, size) { return fontStr(o.weight || 700, size, o.fam, !!(hl && o.hlItalic)); }
  function measureTokens(toks, o) {
    setLS(MCTX, (o.ls || 0) * 100);
    let last = '';
    const hp = (o.hlPad || 0) * 200;
    const ws = toks.map(function (k) { const f = fontOf(o, k.hl, 100); if (f !== last) { MCTX.font = f; last = f; } return MCTX.measureText(k.t).width + (k.hl ? hp : 0); });
    MCTX.font = fontOf(o, false, 100);
    const sp = MCTX.measureText(' ').width;
    setLS(MCTX, 0);
    return { ws: ws, sp: sp };
  }
  function wrapIdx(ws, toks, sp, maxW) {
    const lines = []; let cur = [], w = 0;
    for (let i = 0; i < ws.length; i++) {
      if (toks[i].br && cur.length) { lines.push(cur); cur = []; w = 0; }
      if (!cur.length) { cur.push(i); w = ws[i]; continue; }
      const add = (toks[i].nb ? 0 : sp) + ws[i];
      if (w + add > maxW + 0.01) { lines.push(cur); cur = [i]; w = ws[i]; } else { cur.push(i); w += add; }
    }
    if (cur.length) lines.push(cur);
    return lines;
  }
  // Kutuya sığan en büyük punto; dengeli satırlar; en küçük puntoda bile sığmazsa uzun kelime bölünür, fazla satır "…" ile kesilir.
  function fit(toks, o) {
    const key = fontGen + '|' + JSON.stringify(o) + '|' + toks.map(function (k) { return (k.hl ? '*' : '') + (k.br ? '¶' : '') + (k.nb ? '~' : '') + k.t; }).join(' ');
    let r = LCACHE.get(key);
    if (r) return r;
    r = doFit(toks, o);
    if (LCACHE.size > 800) LCACHE.clear();
    LCACHE.set(key, r);
    return r;
  }
  function doFit(toks0, o) {
    let toks = toks0.length ? toks0 : [];
    const lh = o.lh, cap = o.cap || 0.72, maxLines = o.maxLines || 99;
    const hOf = function (n, s) { return n ? (n - 1) * s * lh + s * cap + s * 0.26 : 0; };
    let m = measureTokens(toks, o);
    const test = function (s) {
      const mw = o.maxW * 100 / s;
      for (let i = 0; i < m.ws.length; i++) if (m.ws[i] > mw) return null;
      const L = wrapIdx(m.ws, toks, m.sp, mw);
      return L.length <= maxLines && hOf(L.length, s) <= o.maxH ? L : null;
    };
    let lo = Math.max(8, Math.floor(o.minSize)), hi = Math.max(lo, Math.floor(o.maxSize));
    if (!test(hi)) { while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (test(mid)) lo = mid; else hi = mid - 1; } } else lo = hi;
    let s = lo, L = test(s), cut = false;
    if (!L) {
      const mw = o.maxW * 100 / s;
      const nt = [];
      toks.forEach(function (tk, i) {
        if (m.ws[i] <= mw) { nt.push(tk); return; }
        setLS(MCTX, (o.ls || 0) * 100); MCTX.font = fontOf(o, tk.hl, 100);
        let cur = '', first = true;
        graphemes(tk.t).forEach(function (g) {
          const tr = cur + g;
          if (cur && MCTX.measureText(tr).width > mw) { nt.push({ t: cur, hl: tk.hl, br: first ? tk.br : false, nb: first ? tk.nb : true }); first = false; cur = g; } else cur = tr;
        });
        if (cur) nt.push({ t: cur, hl: tk.hl, br: first ? tk.br : false, nb: first ? tk.nb : true });
        setLS(MCTX, 0);
      });
      toks = nt; m = measureTokens(toks, o);
      L = wrapIdx(m.ws, toks, m.sp, mw);
      const maxN = Math.max(1, Math.min(maxLines, Math.floor((o.maxH - s * cap - s * 0.26) / (s * lh)) + 1));
      if (L.length > maxN) { L = L.slice(0, maxN); cut = true; }
    }
    if (o.balance && L.length > 1 && !cut) {
      const n = L.length, wmax = Math.max.apply(null, m.ws);
      let a = Math.max(o.maxW * 0.4 * 100 / s, wmax), b = o.maxW * 100 / s;
      for (let it = 0; it < 14; it++) { const mid = (a + b) / 2; if (wrapIdx(m.ws, toks, m.sp, mid).length <= n) b = mid; else a = mid; }
      const Lb = wrapIdx(m.ws, toks, m.sp, b);
      if (Lb.length === n) L = Lb;
    }
    const k = s / 100, hpx = (o.hlPad || 0) * s;
    const lines = L.map(function (idx) {
      let x = 0;
      const items = idx.map(function (i, j) {
        if (j > 0 && !toks[i].nb) x += m.sp * k;
        const pd = toks[i].hl ? hpx : 0;
        const it = { t: toks[i].t, hl: !!toks[i].hl, x: x + pd, w: m.ws[i] * k - pd * 2, j: i };
        x += m.ws[i] * k;
        return it;
      });
      return { items: items, w: x };
    });
    if (cut && lines.length) {
      const ln = lines[lines.length - 1];
      setLS(MCTX, (o.ls || 0) * s); MCTX.font = fontOf(o, false, s);
      const ew = MCTX.measureText('…').width; setLS(MCTX, 0);
      while (ln.items.length > 1 && ln.w + ew > o.maxW) { ln.items.pop(); const l2 = ln.items[ln.items.length - 1]; ln.w = l2.x + l2.w; }
      ln.items.push({ t: '…', hl: false, x: ln.w, w: ew, j: toks.length }); ln.w += ew;
    }
    let width = 0; lines.forEach(function (l) { width = Math.max(width, l.w); });
    return { size: s, lh: lh, cap: cap, ls: (o.ls || 0) * s, lines: lines, n: lines.length, count: toks.length + (cut ? 1 : 0), width: width, height: hOf(lines.length, s), o: o };
  }

  // Satır/kelime çizimi. o: {align, boxW, color, hlColor, anim(item, li)->{dx,dy,a}, clip, pill:{fill,text,prog}, marker:{fill,prog}, wordColor(item)}
  function drawText(ctx, lay, x, y, o) {
    const s = lay.size, base = ctx.globalAlpha;
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    setLS(ctx, lay.ls);
    lay.lines.forEach(function (ln, li) {
      const bl = y + s * lay.cap + li * s * lay.lh;
      const lx = x + (o.align === 'center' ? (o.boxW - ln.w) / 2 : o.align === 'right' ? o.boxW - ln.w : 0);
      if (o.clip) { ctx.save(); ctx.beginPath(); ctx.rect(lx - s * 0.35, bl - s * 1.14, ln.w + s * 0.7, s * 1.48); ctx.clip(); }
      const anims = ln.items.map(function (it) { return (o.anim && o.anim(it, li)) || { dx: 0, dy: 0, a: 1 }; });
      // Vurgu dizileri (art arda vurgulu kelimeler tek blok)
      const runs = []; let run = null;
      ln.items.forEach(function (it, q) { if (it.hl) { if (!run) { run = { a: q, b: q }; runs.push(run); } else run.b = q; } else run = null; });
      const deco = o.pill || o.marker;
      const runGeo = runs.map(function (r) {
        const f = ln.items[r.a], g = ln.items[r.b], an = anims[r.a];
        const p = deco ? clamp(deco.prog(f), 0, 1) : 0;
        const padX = o.pill ? (lay.o.hlPad || 0.1) * s : s * 0.04;
        const x0 = lx + f.x + an.dx - padX, w = g.x + g.w - f.x - lay.ls + padX * 2;
        return { r: r, p: p, x0: x0, w: w, dy: an.dy, a: an.a };
      });
      if (deco) runGeo.forEach(function (R) {
        if (R.p <= 0) return;
        ctx.globalAlpha = base * Math.min(1, R.a);
        ctx.fillStyle = deco.fill;
        if (o.pill) { rr(ctx, R.x0, bl + R.dy - s * 0.88, R.w * R.p, s * 1.1, s * 0.12); ctx.fill(); }
        else { ctx.fillRect(R.x0, bl + R.dy - s * 0.36, R.w * R.p, s * 0.42); }
      });
      let lastF = '';
      ln.items.forEach(function (it, q) {
        const an = anims[q];
        if (an.a <= 0.001) return;
        const f = fontOf(lay.o, it.hl, s);
        if (f !== lastF) { ctx.font = f; lastF = f; }
        ctx.globalAlpha = base * Math.min(1, an.a);
        const col = o.wordColor ? o.wordColor(it) : (it.hl && o.hlColor ? o.hlColor : o.color);
        const px = lx + it.x + an.dx, py = bl + an.dy;
        const R = o.pill && it.hl ? runGeo.find(function (g) { return q >= g.r.a && q <= g.r.b; }) : null;
        if (R && R.p > 0) {
          const cut = R.x0 + R.w * R.p;
          ctx.save(); ctx.beginPath(); ctx.rect(cut, py - s * 1.2, 1e4, s * 1.6); ctx.clip(); ctx.fillStyle = o.color; ctx.fillText(it.t, px, py); ctx.restore();
          ctx.save(); ctx.beginPath(); ctx.rect(R.x0, py - s * 1.2, R.w * R.p, s * 1.6); ctx.clip(); ctx.fillStyle = o.pill.text; ctx.fillText(it.t, px, py); ctx.restore();
        } else { ctx.fillStyle = it.hl && o.pill ? o.color : col; ctx.fillText(it.t, px, py); }
      });
      if (o.clip) ctx.restore();
    });
    ctx.globalAlpha = base; setLS(ctx, 0);
  }

  /* ---------- Çizim yardımcıları ---------- */
  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r); ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.closePath();
  }
  const imgW = function (i) { return (i && (i.naturalWidth || i.videoWidth || i.width)) || 0; };
  const imgH = function (i) { return (i && (i.naturalHeight || i.videoHeight || i.height)) || 0; };
  function cover(ctx, img, x, y, w, h, z, px, py) {
    const iw = imgW(img), ih = imgH(img); if (!iw || !ih) return false;
    const s = Math.max(w / iw, h / ih) * (z || 1), dw = iw * s, dh = ih * s;
    try { ctx.drawImage(img, x + (w - dw) / 2 + (px || 0), y + (h - dh) / 2 + (py || 0), dw, dh); return true; } catch (e) { return false; }
  }
  function glow(ctx, P, x, y, r, c, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, css(c, a)); g.addColorStop(0.45, css(c, a * 0.42)); g.addColorStop(1, css(c, 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, P.W, P.H);
  }
  let GRAIN = null; const GPAT = new WeakMap();
  function grain(ctx, P, a) {
    if (!GRAIN) {
      GRAIN = document.createElement('canvas'); GRAIN.width = GRAIN.height = 160;
      const g = GRAIN.getContext('2d'), id = g.createImageData(160, 160);
      let seed = 1337;
      for (let i = 0; i < 160 * 160; i++) {
        seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
        const v = ((t ^ (t >>> 14)) >>> 0) % 256;
        id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255;
      }
      g.putImageData(id, 0, 0);
    }
    let pat = GPAT.get(ctx);
    if (!pat) { pat = ctx.createPattern(GRAIN, 'repeat'); GPAT.set(ctx, pat); }
    ctx.save(); ctx.globalAlpha = a; ctx.globalCompositeOperation = 'overlay'; ctx.fillStyle = pat; ctx.fillRect(0, 0, P.W, P.H); ctx.restore();
  }
  function baseBg(ctx, P, gt, scrimA) {
    ctx.fillStyle = css(P.bg); ctx.fillRect(0, 0, P.W, P.H);
    if (P.bgImage && cover(ctx, P.bgImage, 0, 0, P.W, P.H, kenBurns(P, gt))) { ctx.fillStyle = css(P.bg, scrimA); ctx.fillRect(0, 0, P.W, P.H); }
  }
  function kenBurns(P, gt) { return gt == null ? 1.04 : 1.0 + 0.08 * clamp(gt / P.total, 0, 1); }
  function ellipsize(ctx, s, maxW) {
    if (ctx.measureText(s).width <= maxW) return s;
    const g = graphemes(s);
    while (g.length > 1 && ctx.measureText(g.join('') + '…').width > maxW) g.pop();
    return g.join('') + '…';
  }
  function txt(ctx, s, x, y, font, color, alpha, align, ls, maxW) {
    ctx.save(); ctx.font = font; ctx.fillStyle = color; ctx.globalAlpha *= alpha == null ? 1 : alpha;
    ctx.textAlign = align || 'left'; ctx.textBaseline = 'alphabetic'; setLS(ctx, ls || 0);
    const out = maxW ? ellipsize(ctx, s, maxW) : s;
    ctx.fillText(out, x, y); const w = ctx.measureText(out).width; ctx.restore(); return w;
  }
  function drawLogo(ctx, img, x, y, h) {
    const iw = imgW(img), ih = imgH(img); if (!iw || !ih) return 0;
    const r = iw / ih;
    if (r > 0.8 && r < 1.25) { ctx.save(); rr(ctx, x, y, h, h, h * 0.28); ctx.clip(); cover(ctx, img, x, y, h, h, 1); ctx.restore(); return h; }
    const w = Math.min(h * r, h * 3.4), hh = w / r;
    try { ctx.drawImage(img, x, y + (h - hh) / 2, w, hh); } catch (e) { return 0; }
    return w;
  }
  function monogram(ctx, P, x, y, h) {
    const src = (P.brand.name || P.brand.handle || '').replace(/^@/, '').trim();
    const ch = upperOf(graphemes(src)[0] || '•', P.lang);
    ctx.save(); ctx.fillStyle = css(P.accent); ctx.beginPath(); ctx.arc(x + h / 2, y + h / 2, h / 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = css(P.onAccent); ctx.font = fontStr(800, h * 0.46, 'sans'); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(ch, x + h / 2, y + h / 2 + h * 0.165); ctx.restore();
    return h;
  }
  // Marka bloğu: logo/monogram + ad (+ kullanıcı adı). y = üst kenar, yükseklik h.
  function brand(ctx, P, x, y, o) {
    const name = P.brand.name, handle = P.brand.handle, h = o.h || 60;
    if (!name && !handle && !P.logo) return 0;
    let cx = x;
    const lw = P.logo ? drawLogo(ctx, P.logo, cx, y, h) : 0;
    cx += (lw || monogram(ctx, P, cx, y, h)) + h * 0.3;
    const maxW = o.maxW || 520, col = css(o.color);
    if (name && handle) {
      txt(ctx, name, cx, y + h * 0.45, fontStr(700, h * 0.42, 'sans'), col, 1, 'left', 0, maxW);
      txt(ctx, handle, cx, y + h * 0.9, fontStr(500, h * 0.36, 'sans'), col, 0.68, 'left', 0, maxW);
    } else if (name || handle) {
      txt(ctx, name || handle, cx, y + h * 0.64, fontStr(700, h * 0.42, 'sans'), col, 1, 'left', 0, maxW);
    }
    return 1;
  }
  function segments(ctx, x, y, w, h, n, i, f, on, off) {
    const g = n > 10 ? 6 : 10, sw = (w - g * (n - 1)) / n;
    for (let k = 0; k < n; k++) {
      const sx = x + k * (sw + g);
      ctx.fillStyle = off; rr(ctx, sx, y, sw, h, h / 2); ctx.fill();
      const fill = k < i ? 1 : k === i ? clamp(f, 0, 1) : 0;
      if (fill > 0) { ctx.fillStyle = on; rr(ctx, sx, y, Math.max(h, sw * fill), h, h / 2); ctx.fill(); }
    }
  }
  function dots(ctx, x, y, n, i, k, prev, on, off, sz, align) {
    sz = sz || 12; const big = sz * 3.2, gap = sz;
    const ws = []; for (let j = 0; j < n; j++) ws.push(sz + (big - sz) * ((j === i ? k : 0) + (j === prev ? 1 - k : 0)));
    const total = ws.reduce(function (a, b) { return a + b; }, 0) + gap * (n - 1);
    let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    for (let j = 0; j < n; j++) {
      const act = (j === i ? k : 0) + (j === prev ? 1 - k : 0);
      ctx.fillStyle = act > 0.5 ? on : off; rr(ctx, cx, y - sz / 2, ws[j], sz, sz / 2); ctx.fill();
      cx += ws[j] + gap;
    }
    return total;
  }
  function arrowBtn(ctx, cx, cy, r, bg, fg) {
    ctx.save(); ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = fg; ctx.lineWidth = r * 0.12; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(cx - r * 0.36, cy); ctx.lineTo(cx + r * 0.34, cy); ctx.moveTo(cx + r * 0.06, cy - r * 0.28); ctx.lineTo(cx + r * 0.36, cy); ctx.lineTo(cx + r * 0.06, cy + r * 0.28); ctx.stroke();
    ctx.restore();
  }
  function swipeHint(ctx, P, rx, cy, color, btnBg, btnFg) {
    const r = 34;
    arrowBtn(ctx, rx - r, cy, r, btnBg, btnFg);
    txt(ctx, P.lang === 'en' ? 'Swipe' : 'Kaydır', rx - r * 2 - 20, cy + 9, fontStr(600, 26, 'sans'), color, 0.78, 'right', 0.5);
  }
  const capOf = function (fam) { return fam === 'serif' ? 0.7 : 0.72; };
  const bySize = function (P, m) { return m[P.aspect]; };

  /* ---------- Şablonlar ---------- */
  // Her şablon: bg(ctx,P,gt,i), scene(ctx,P,a), chrome(ctx,P,c), tr (geçiş sn). a = {idx,t,dur,exit,stat,n}; t=Infinity => son hal.
  const T_KINETIK = {
    id: 'kinetik', name_tr: 'Kinetik', name_en: 'Kinetic', font: 'sans', palette: 'marka', tr: 0.5,
    bg: function (ctx, P, gt) {
      baseBg(ctx, P, gt, 0.8);
      const tt = gt == null ? 0 : gt, M = Math.max(P.W, P.H);
      glow(ctx, P, P.W * 0.92 + Math.sin(tt * 0.35) * 70, P.H * 0.08 + Math.cos(tt * 0.28) * 60, M * 0.72, P.accent, P.dark ? 0.42 : 0.24);
      glow(ctx, P, P.W * 0.02 + Math.cos(tt * 0.22) * 40, P.H * 0.98, M * 0.5, P.accent2, P.dark ? 0.2 : 0.12);
      if (gt != null) grain(ctx, P, P.dark ? 0.06 : 0.04);
    },
    layout: function (P, i) {
      const S = P.S, sc = P.scenes[i];
      const boxW = P.aspect === '16:9' ? Math.min(S.w * 0.82, 1400) : S.w;
      const top = S.y + 100, bot = S.b - 120, avail = bot - top, kick = 76;
      const sub = sc.sub ? fit(tokenize(sc.sub, false, P.lang, false), { fam: 'sans', weight: 500, maxSize: 44, minSize: 28, lh: 1.34, maxW: Math.min(boxW, 880), maxH: avail * 0.26, maxLines: 4 }) : null;
      const subH = sub ? sub.height + 44 : 0;
      const head = fit(tokenize(sc.text, true, P.lang, P.autoHl), { fam: P.font, weight: P.font === 'serif' ? 700 : 800, maxSize: bySize(P, { '9:16': 150, '1:1': 116, '4:5': 128, '16:9': 140 }), minSize: 52, lh: 1.06, ls: -0.02, hlPad: 0.12, maxW: boxW, maxH: avail - kick - subH, maxLines: 7, balance: true, cap: capOf(P.font) });
      const total = kick + head.height + subH;
      return { head: head, sub: sub, x: S.x, y0: top + Math.max(0, (avail - total) * 0.45), kick: kick };
    },
    scene: function (ctx, P, a) {
      const L = this.layout(P, a.idx), head = L.head, s = head.size, t = a.t;
      ctx.save();
      if (a.exit > 0) { ctx.globalAlpha = 1 - E.outCubic(a.exit); ctx.translate(0, -90 * E.inCubic(a.exit)); }
      // Üst işaret: vurgu çubuğu + sahne no
      const kb = prog(t, 0, 0.7, E.outExpo);
      ctx.fillStyle = css(P.accentInk); rr(ctx, L.x, L.y0 + 9, Math.max(0.1, 72 * kb), 10, 5); ctx.fill();
      const ka = prog(t, 0.12, 0.5, E.outCubic);
      if (ka > 0) {
        const w = txt(ctx, pad2(a.idx + 1), L.x + 96 - (1 - ka) * 16, L.y0 + 26, fontStr(800, 30, 'sans'), css(P.accentInk), ka, 'left', 2);
        txt(ctx, '/ ' + pad2(a.n), L.x + 96 + w + 10 - (1 - ka) * 16, L.y0 + 26, fontStr(600, 30, 'sans'), css(P.fg), ka * 0.45, 'left', 1);
      }
      const n = head.count, st = Math.min(0.075, 0.85 / Math.max(1, n));
      const wStart = function (j) { return 0.12 + j * st; };
      drawText(ctx, head, L.x, L.y0 + L.kick, {
        color: css(P.fg), clip: !a.stat && t < 0.12 + n * st + 0.8,
        anim: function (it) { const e = prog(t, wStart(it.j), 0.7, E.outExpo); return { dx: 0, dy: (1 - e) * s * 1.18, a: Math.min(1, e * 1.6) }; },
        pill: { fill: css(P.accent), text: css(P.onAccent), prog: function (it) { return prog(t, wStart(it.j) + 0.32, 0.6, E.outExpo); } }
      });
      if (L.sub) {
        const e = prog(t, 0.2 + n * st + 0.1, 0.75, E.outCubic);
        if (e > 0) { ctx.save(); ctx.globalAlpha *= e * 0.8; drawText(ctx, L.sub, L.x, L.y0 + L.kick + head.height + 44 + (1 - e) * 30, { color: css(P.fg) }); ctx.restore(); }
      }
      ctx.restore();
    },
    chrome: function (ctx, P, c) {
      const S = P.S;
      if (P.showProgress) segments(ctx, S.x, S.y, S.w, 6, c.n, c.i, c.stat ? 1 : c.local / c.dur, css(P.fg, 0.92), css(P.fg, 0.2));
      brand(ctx, P, S.x, S.b - 64, { h: 64, color: P.fg });
    }
  };

  const T_SLAYT = {
    id: 'slayt', name_tr: 'Slayt', name_en: 'Slide', font: 'sans', palette: 'lavanta', tr: 0.6,
    bg: function (ctx, P, gt) {
      baseBg(ctx, P, gt, 0.88);
      glow(ctx, P, P.W * 1.02, P.H * -0.02, Math.max(P.W, P.H) * 0.55, P.accent, P.dark ? 0.22 : 0.12);
      if (gt != null) grain(ctx, P, 0.03);
    },
    layout: function (P, i) {
      const S = P.S, sc = P.scenes[i], ind = 52;
      const boxW = (P.aspect === '16:9' ? Math.min(S.w * 0.74, 1300) : S.w) - ind;
      const top = S.y + 150, bot = S.b - 130, avail = bot - top;
      const sub = sc.sub ? fit(tokenize(sc.sub, false, P.lang, false), { fam: 'sans', weight: 500, maxSize: 40, minSize: 27, lh: 1.42, maxW: Math.min(boxW, 860), maxH: avail * 0.32, maxLines: 5 }) : null;
      const subH = sub ? sub.height + 46 : 0;
      const head = fit(tokenize(sc.text, false, P.lang, false), { fam: P.font, weight: P.font === 'serif' ? 700 : 800, maxSize: bySize(P, { '9:16': 124, '1:1': 96, '4:5': 108, '16:9': 112 }), minSize: 46, lh: 1.08, ls: -0.022, maxW: boxW, maxH: avail - subH, maxLines: 8, balance: true, cap: capOf(P.font) });
      const total = head.height + subH;
      return { head: head, sub: sub, x: S.x, ind: ind, y0: top + Math.max(0, (avail - total) * 0.5) };
    },
    scene: function (ctx, P, a) {
      const L = this.layout(P, a.idx), head = L.head, t = a.t;
      const ein = prog(t, 0, 0.75, E.outQuart), ex = E.inOutCubic(a.exit);
      ctx.save();
      // Büyük filigran numara (paralaks)
      const bs = Math.min(P.H * 0.42, P.W * 0.56);
      ctx.save(); ctx.globalAlpha = (1 - ex) * prog(t, 0, 0.6) * (P.dark ? 0.05 : 0.055);
      txt(ctx, pad2(a.idx + 1), P.W - 36 + (1 - ein) * P.W * 0.08 - ex * P.W * 0.12, P.H * 0.5 + bs * 0.36, fontStr(800, bs, 'sans'), css(P.fg), 1, 'right', -bs * 0.04);
      ctx.restore();
      ctx.translate((1 - ein) * P.W * 0.1 - ex * P.W * 0.24, 0);
      ctx.globalAlpha = (1 - ex) * prog(t, 0, 0.45);
      const barH = head.height - head.size * 0.12;
      const hb = prog(t, 0.1, 0.8, E.outExpo);
      ctx.fillStyle = css(P.accent); rr(ctx, L.x, L.y0 - 4, 12, Math.max(12, barH * hb), 6); ctx.fill();
      drawText(ctx, head, L.x + L.ind, L.y0, {
        color: css(P.fg), hlColor: css(P.accentInk),
        anim: function (it, li) { const e = prog(t, 0.14 + li * 0.07, 0.8, E.outQuart); return { dx: (1 - e) * 56, dy: 0, a: e }; }
      });
      if (L.sub) {
        const e = prog(t, 0.3 + head.n * 0.07, 0.75, E.outCubic);
        if (e > 0) { ctx.save(); ctx.globalAlpha *= e * 0.74; drawText(ctx, L.sub, L.x + L.ind, L.y0 + head.height + 46 + (1 - e) * 26, { color: css(P.fg) }); ctx.restore(); }
      }
      ctx.restore();
    },
    chrome: function (ctx, P, c) {
      const S = P.S;
      brand(ctx, P, S.x, S.y, { h: 60, color: P.fg });
      txt(ctx, pad2(c.i + 1) + ' / ' + pad2(c.n), S.r, S.y + 40, fontStr(600, 26, 'sans'), css(P.fg), 0.55, 'right', 1.5);
      const y = S.b - 34;
      if (P.showProgress) dots(ctx, S.x, y, c.n, c.i, c.stat ? 1 : c.k, c.stat ? -1 : c.prev, css(P.accent), css(P.fg, 0.18), 12, 'left');
      if (c.stat && c.i < c.n - 1) swipeHint(ctx, P, S.r, y, css(P.fg), css(P.accent), css(P.onAccent));
    }
  };

  const T_ALTYAZI = {
    id: 'altyazi', name_tr: 'Altyazı', name_en: 'Captions', font: 'sans', palette: 'gece', tr: 0.45,
    tone: function (P) { return P.bgImage ? { text: WHITE, scrim: BLACK, dark: true } : { text: P.fg, scrim: P.bg, dark: P.dark }; },
    bg: function (ctx, P, gt) {
      const tt = gt == null ? 0 : gt, M = Math.max(P.W, P.H), tn = this.tone(P);
      ctx.fillStyle = css(P.bg); ctx.fillRect(0, 0, P.W, P.H);
      const img = P.bgImage && cover(ctx, P.bgImage, 0, 0, P.W, P.H, kenBurns(P, gt), gt == null ? 0 : -P.W * 0.02 * clamp(gt / P.total, 0, 1), 0);
      if (!img) {
        glow(ctx, P, P.W * (0.22 + 0.07 * Math.sin(tt * 0.3)), P.H * (0.26 + 0.05 * Math.cos(tt * 0.24)), M * 0.72, P.accent, P.dark ? 0.62 : 0.4);
        glow(ctx, P, P.W * (0.9 + 0.06 * Math.cos(tt * 0.27)), P.H * (0.5 + 0.06 * Math.sin(tt * 0.21)), M * 0.62, P.accent2, P.dark ? 0.5 : 0.32);
        glow(ctx, P, P.W * 0.35, P.H * 1.02, M * 0.5, P.accent3, P.dark ? 0.35 : 0.22);
      }
      if (gt != null) grain(ctx, P, 0.06);
      // Okunurluk perdesi: alt yoğun, üst hafif
      let g = ctx.createLinearGradient(0, P.H * 0.36, 0, P.H);
      g.addColorStop(0, css(tn.scrim, 0)); g.addColorStop(0.55, css(tn.scrim, img ? 0.6 : 0.45)); g.addColorStop(1, css(tn.scrim, img ? 0.9 : 0.8));
      ctx.fillStyle = g; ctx.fillRect(0, P.H * 0.36, P.W, P.H * 0.64);
      g = ctx.createLinearGradient(0, 0, 0, P.S.y + 220);
      g.addColorStop(0, css(tn.scrim, img ? 0.55 : 0.3)); g.addColorStop(1, css(tn.scrim, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, P.W, P.S.y + 220);
    },
    layout: function (P, i) {
      const S = P.S, sc = P.scenes[i], ind = 36;
      const boxW = (P.aspect === '16:9' ? Math.min(S.w * 0.64, 1120) : S.w) - ind;
      const sub = sc.sub ? fit(tokenize(sc.sub, false, P.lang, false), { fam: 'sans', weight: 500, maxSize: 36, minSize: 26, lh: 1.38, maxW: boxW, maxH: P.H * 0.14, maxLines: 3 }) : null;
      const head = fit(tokenize(sc.text, false, P.lang, false), { fam: P.font, weight: 700, maxSize: bySize(P, { '9:16': 84, '1:1': 70, '4:5': 76, '16:9': 70 }), minSize: 40, lh: 1.14, ls: -0.012, maxW: boxW, maxH: P.H * (P.aspect === '9:16' ? 0.26 : 0.34), maxLines: 5, balance: true, cap: capOf(P.font) });
      const subH = sub ? sub.height + 34 : 0;
      return { head: head, sub: sub, x: S.x, ind: ind, y0: S.b - 16 - head.height - subH };
    },
    scene: function (ctx, P, a) {
      const L = this.layout(P, a.idx), head = L.head, t = a.t, tn = this.tone(P);
      const acc = readable(P.accent, tn.dark ? BLACK : WHITE, 4.5);
      const ein = prog(t, 0, 0.6, E.outCubic);
      ctx.save();
      ctx.globalAlpha = (1 - E.outCubic(a.exit)) * ein;
      ctx.translate(0, (1 - ein) * 40 + a.exit * 18);
      const hb = prog(t, 0.05, 0.7, E.outExpo);
      ctx.fillStyle = css(P.accent); rr(ctx, L.x, L.y0 - 6, 9, Math.max(9, (head.height - head.size * 0.1) * hb), 4.5); ctx.fill();
      const n = head.count, span = Math.max(0.8, a.dur * 0.72), kar = a.stat ? Infinity : (t - 0.35) / span * n;
      drawText(ctx, head, L.x + L.ind, L.y0, {
        color: css(tn.text),
        anim: function (it) { const e = prog(t, 0.05 + it.j * Math.min(0.035, 0.5 / n), 0.45, E.outCubic); const sp = clamp((kar - it.j) * 2.5, 0, 1); return { dx: 0, dy: (1 - e) * 14, a: e * (0.42 + 0.58 * sp) }; },
        wordColor: function (it) { return (Math.floor(kar) === it.j && kar < n) || it.hl ? css(acc) : css(tn.text); }
      });
      if (L.sub) {
        const e = prog(t, 0.35, 0.7, E.outCubic);
        ctx.save(); ctx.globalAlpha *= e * 0.86; drawText(ctx, L.sub, L.x + L.ind, L.y0 + head.height + 34 + (1 - e) * 16, { color: css(tn.text) }); ctx.restore();
      }
      ctx.restore();
    },
    chrome: function (ctx, P, c) {
      const S = P.S, tn = this.tone(P);
      if (P.showProgress) segments(ctx, S.x, S.y, S.w, 6, c.n, c.i, c.stat ? 1 : c.local / c.dur, css(tn.text, 0.95), css(tn.text, 0.25));
      brand(ctx, P, S.x, S.y + (P.showProgress ? 36 : 0), { h: 60, color: tn.text });
    }
  };

  const T_MINIMAL = {
    id: 'minimal', name_tr: 'Minimal', name_en: 'Minimal', font: 'serif', palette: 'krem', tr: 0.6,
    bg: function (ctx, P, gt) { baseBg(ctx, P, gt, 0.9); if (gt != null) grain(ctx, P, 0.035); },
    layout: function (P, i) {
      const S = P.S, sc = P.scenes[i], serif = P.font === 'serif';
      const boxW = P.aspect === '16:9' ? Math.min(S.w * 0.7, 1180) : S.w * 0.96;
      const top = S.y + 140, bot = S.b - 150, avail = bot - top, kick = 86;
      const sub = sc.sub ? fit(tokenize(sc.sub, false, P.lang, false), { fam: 'sans', weight: 400, maxSize: 34, minSize: 26, lh: 1.5, maxW: Math.min(boxW, 780), maxH: avail * 0.3, maxLines: 5 }) : null;
      const subH = sub ? sub.height + 56 : 0;
      const head = fit(tokenize(sc.text, false, P.lang, false), { fam: P.font, weight: serif ? 400 : 700, hlItalic: serif, maxSize: bySize(P, { '9:16': 120, '1:1': 92, '4:5': 104, '16:9': 100 }), minSize: 46, lh: serif ? 1.1 : 1.06, ls: serif ? -0.012 : -0.028, maxW: boxW, maxH: avail - kick - subH, maxLines: 8, balance: true, cap: capOf(P.font) });
      const total = kick + head.height + subH;
      return { head: head, sub: sub, x: S.x, y0: top + Math.max(0, (avail - total) * 0.42), kick: kick };
    },
    scene: function (ctx, P, a) {
      const L = this.layout(P, a.idx), head = L.head, s = head.size, t = a.t, serif = P.font === 'serif';
      ctx.save();
      if (a.exit > 0) { ctx.globalAlpha = 1 - E.outCubic(clamp(a.exit * 1.4, 0, 1)); ctx.translate(0, -22 * E.outCubic(a.exit)); }
      const ka = prog(t, 0.05, 0.7, E.outCubic);
      if (ka > 0) {
        txt(ctx, pad2(a.idx + 1) + '.', L.x, L.y0 + 32 + (1 - ka) * 12, serif ? fontStr(400, 42, 'serif', true) : fontStr(700, 34, 'sans'), css(P.accentInk), ka, 'left', 0);
      }
      drawText(ctx, head, L.x, L.y0 + L.kick, {
        color: css(P.fg), hlColor: css(P.accentInk), clip: !a.stat && t < 0.3 + head.n * 0.1 + 1.0,
        anim: function (it, li) { const e = prog(t, 0.22 + li * 0.1, 1.0, E.outQuart); return { dx: 0, dy: (1 - e) * s * 0.7, a: e }; }
      });
      if (L.sub) {
        const e = prog(t, 0.45 + head.n * 0.1, 0.9, E.outCubic);
        if (e > 0) { ctx.save(); ctx.globalAlpha *= e * 0.66; drawText(ctx, L.sub, L.x, L.y0 + L.kick + head.height + 56 + (1 - e) * 18, { color: css(P.fg) }); ctx.restore(); }
      }
      ctx.restore();
    },
    chrome: function (ctx, P, c) {
      const S = P.S, fg = css(P.fg);
      const label = P.brand.name || P.brand.handle || '';
      if (label) txt(ctx, label, S.x, S.y + 26, fontStr(700, 24, 'sans'), fg, 0.88, 'left', 1.2, S.w * 0.6);
      txt(ctx, pad2(c.i + 1) + ' — ' + pad2(c.n), S.r, S.y + 26, fontStr(500, 22, 'sans'), fg, 0.55, 'right', 2);
      const lp = c.stat ? 1 : prog(c.gt, 0, 1.4, E.outQuart);
      ctx.fillStyle = css(P.fg, 0.2); ctx.fillRect(S.x, S.y + 54, S.w * lp, 2);
      const by = S.b - 74;
      ctx.fillStyle = css(P.fg, 0.2); ctx.fillRect(S.x, by, S.w * lp, 2);
      if (P.showProgress) { ctx.fillStyle = css(P.accentInk); ctx.fillRect(S.x, by - 1, S.w * (c.stat ? (c.i + 1) / c.n : clamp(c.gt / P.total, 0, 1)), 4); }
      const h = P.brand.name && P.brand.handle ? P.brand.handle : '';
      if (h) txt(ctx, h, S.x, S.b - 18, fontStr(500, 24, 'sans'), fg, 0.62, 'left', 0.5, S.w * 0.6);
      if (P.logo) drawLogo(ctx, P.logo, S.r - 44, S.b - 50, 44);
      else if (c.stat && c.i < c.n - 1) txt(ctx, (P.lang === 'en' ? 'Swipe' : 'Kaydır') + '  →', S.r, S.b - 18, fontStr(600, 24, 'sans'), fg, 0.7, 'right', 1);
      else { ctx.fillStyle = css(P.accentInk); ctx.beginPath(); ctx.arc(S.r - 8, S.b - 26, 8, 0, Math.PI * 2); ctx.fill(); }
    }
  };

  const T_KART = {
    id: 'kart', name_tr: 'Kart', name_en: 'Card', font: 'sans', palette: 'mercan', tr: 0.7, rawExit: true,
    bg: function (ctx, P, gt) {
      const tt = gt == null ? 0 : gt, M = Math.max(P.W, P.H);
      ctx.fillStyle = css(P.accent); ctx.fillRect(0, 0, P.W, P.H);
      if (P.bgImage && cover(ctx, P.bgImage, 0, 0, P.W, P.H, kenBurns(P, gt))) { ctx.fillStyle = css(P.accent, 0.5); ctx.fillRect(0, 0, P.W, P.H); }
      glow(ctx, P, P.W * 0.1, P.H * 0.05, M * 0.6, mix(P.accent, WHITE, 0.35), 0.45);
      glow(ctx, P, P.W * 0.95, P.H * 0.98, M * 0.6, mix(P.accent, BLACK, 0.35), 0.5);
      // Nokta ızgarası (yavaş kayar)
      const sp = 44, off = (tt * 7) % sp;
      ctx.fillStyle = css(P.onAccent, 0.13); ctx.beginPath();
      for (let y = -sp + off; y < P.H + sp; y += sp) for (let x = -sp + off; x < P.W + sp; x += sp) { ctx.moveTo(x + 2.4, y); ctx.arc(x, y, 2.4, 0, Math.PI * 2); }
      ctx.fill();
      if (gt != null) grain(ctx, P, 0.04);
    },
    layout: function (P, i) {
      const S = P.S, sc = P.scenes[i];
      const cw = P.aspect === '16:9' ? Math.min(S.w * 0.8, 1340) : S.w;
      const cx = (P.W - cw) / 2, pad = P.aspect === '9:16' ? 68 : 60, iw = cw - pad * 2;
      const areaTop = S.y + 20, areaBot = S.b - 96, areaH = areaBot - areaTop;
      const hasBrand = !!(P.brand.name || P.brand.handle || P.logo), brandH = hasBrand ? 58 + 56 : 0, dotsH = P.showProgress ? 12 + 56 : 0;
      const sub = sc.sub ? fit(tokenize(sc.sub, false, P.lang, false), { fam: 'sans', weight: 500, maxSize: 36, minSize: 26, lh: 1.42, maxW: iw, maxH: areaH * 0.26, maxLines: 5 }) : null;
      const subH = sub ? sub.height + 38 : 0;
      const head = fit(tokenize(sc.text, false, P.lang, P.autoHl), { fam: P.font, weight: P.font === 'serif' ? 700 : 800, maxSize: bySize(P, { '9:16': 112, '1:1': 92, '4:5': 100, '16:9': 112 }), minSize: 42, lh: 1.1, ls: -0.02, maxW: iw, maxH: areaH - pad * 2 - brandH - dotsH - subH, maxLines: 8, balance: true, cap: capOf(P.font) });
      const ch = Math.max(areaH * (P.aspect === '9:16' ? 0.5 : P.aspect === '16:9' ? 0.78 : 0.66), pad * 2 + brandH + head.height + subH + dotsH);
      const cy = areaTop + (areaH - ch) / 2;
      const contentH = brandH + head.height + subH;
      return { head: head, sub: sub, cx: cx, cy: cy, cw: cw, ch: ch, pad: pad, hasBrand: hasBrand, brandH: brandH, ty: cy + pad + Math.max(0, (ch - pad * 2 - dotsH - contentH) * 0.5) };
    },
    scene: function (ctx, P, a) {
      const L = this.layout(P, a.idx), head = L.head, t = a.t, s = head.size;
      // İlk kart alttan yükselir; sonrakiler carousel gibi yana kayar (eski kartla aynı eğride).
      const first = a.idx === 0 || a.stat, ex = E.inOutCubic(a.exit), sw = P.W * 1.08;
      const e = first ? prog(t, 0, 0.8, E.outQuint) : 1, es = first ? prog(t, 0, 0.8, E.outBack) : 1;
      const slide = first ? 0 : 1 - prog(t, 0, this.tr, E.inOutCubic);
      ctx.save();
      ctx.globalAlpha = Math.min(1, e * 1.8);
      const ox = L.cx + L.cw / 2, oy = L.cy + L.ch / 2, sc = 0.9 + 0.1 * es;
      ctx.translate(ox + slide * sw - ex * sw, oy + (1 - e) * 140); ctx.scale(sc, sc); ctx.rotate((1 - e) * 0.035 + (slide - ex) * 0.03); ctx.translate(-ox, -oy);
      const t0 = first ? 0.28 : this.tr * 0.55;
      ctx.save();
      ctx.shadowColor = 'rgba(10,8,20,0.32)'; ctx.shadowBlur = 90 * P.sc; ctx.shadowOffsetY = 36 * P.sc;
      ctx.fillStyle = css(P.bg); rr(ctx, L.cx, L.cy, L.cw, L.ch, 44); ctx.fill();
      ctx.restore();
      let y = L.ty;
      if (L.hasBrand) { brand(ctx, P, L.cx + L.pad, y, { h: 58, color: P.fg, maxW: L.cw - L.pad * 2 - 80 }); y += L.brandH; }
      const n = head.count, st = Math.min(0.045, 0.6 / Math.max(1, n));
      drawText(ctx, head, L.cx + L.pad, y, {
        color: css(P.fg),
        anim: function (it) { const k = prog(t, t0 + it.j * st, 0.6, E.outCubic); return { dx: 0, dy: (1 - k) * s * 0.4, a: k }; },
        marker: { fill: css(P.accent, P.dark ? 0.6 : 0.45), prog: function (it) { return prog(t, t0 + 0.4 + it.j * st, 0.6, E.outExpo); } }
      });
      if (L.sub) {
        const k = prog(t, t0 + 0.2 + n * st, 0.7, E.outCubic);
        ctx.save(); ctx.globalAlpha *= k * 0.72; drawText(ctx, L.sub, L.cx + L.pad, y + head.height + 38 + (1 - k) * 18, { color: css(P.fg) }); ctx.restore();
      }
      if (P.showProgress) dots(ctx, L.cx + L.pad, L.cy + L.ch - L.pad + 2, a.n, a.idx, 1, -1, css(P.accentInk), css(P.fg, 0.16), 12, 'left');
      ctx.restore();
    },
    chrome: function (ctx, P, c) {
      if (c.stat && c.i < c.n - 1) swipeHint(ctx, P, P.S.r, P.S.b - 34, css(P.onAccent), css(P.onAccent), css(P.accent));
    }
  };

  const TPL = { kinetik: T_KINETIK, slayt: T_SLAYT, altyazi: T_ALTYAZI, minimal: T_MINIMAL, kart: T_KART };
  const templates = Object.keys(TPL).map(function (k) { const t = TPL[k]; return { id: t.id, name_tr: t.name_tr, name_en: t.name_en, font: t.font, palette: t.palette }; });

  /* ---------- Proje normalleştirme ---------- */
  function isDrawable(x) { return !!x && typeof x === 'object' && imgW(x) > 0; }
  function fmtHandle(h) {
    h = String(h || '').trim().slice(0, 60);
    if (!h || h[0] === '@' || /[\s/]/.test(h) || /\.[a-z]{2,}$/i.test(h)) return h;
    return '@' + h;
  }
  function norm(p) {
    p = p || {};
    const tpl = TPL[p.template] || T_KINETIK;
    const aspect = aspects[p.aspect] ? p.aspect : '9:16';
    const W = aspects[aspect][0], H = aspects[aspect][1], sf = SAFE[aspect];
    const pin = typeof p.palette === 'string' ? (PAL[p.palette] || {}) : (p.palette || {});
    const def = PAL[pin.id] || PAL[tpl.palette];
    const bg = parseColor(pin.bg, parseColor(def.bg)), fg = parseColor(pin.fg, parseColor(def.fg)), accent = parseColor(pin.accent, parseColor(def.accent));
    let scenes = (Array.isArray(p.scenes) ? p.scenes : []).slice(0, 30).map(function (s) {
      s = s || {};
      const secs = Number(s.secs);
      return { text: String(s.text == null ? '' : s.text).trim(), sub: String(s.sub == null ? '' : s.sub).trim(), secs: secs > 0 ? clamp(secs, 1.5, 15) : 3.5 };
    });
    if (!scenes.length) scenes = [{ text: '', sub: '', secs: 3.5 }];
    const starts = []; let acc = 0; scenes.forEach(function (s) { starts.push(acc); acc += s.secs; });
    const b = p.brand || {};
    const dark = lum(bg) < 0.3;
    return {
      tpl: tpl, aspect: aspect, W: W, H: H, sc: 1,
      S: { x: sf[3], y: sf[0], w: W - sf[1] - sf[3], h: H - sf[0] - sf[2], r: W - sf[1], b: H - sf[2] },
      bg: bg, fg: fg, accent: accent, dark: dark,
      onAccent: onColor(accent), accentInk: readable(accent, bg, 3), accent2: hueShift(accent, 38), accent3: hueShift(accent, -42),
      font: p.font === 'serif' || p.font === 'sans' ? p.font : tpl.font,
      lang: p.lang === 'en' ? 'en' : 'tr', autoHl: p.autoHighlight !== false,
      brand: { name: String(b.name || '').trim().slice(0, 60), handle: fmtHandle(b.handle) },
      logo: isDrawable(p.logo) ? p.logo : null, bgImage: isDrawable(p.bgImage) ? p.bgImage : null,
      scenes: scenes, starts: starts, total: acc, showProgress: p.showProgress !== false
    };
  }

  /* ---------- Kare oluşturma ---------- */
  function sceneIndex(P, t) { let i = 0; while (i < P.scenes.length - 1 && t >= P.starts[i + 1]) i++; return i; }
  function renderFrame(ctx, P, t, slideIdx) {
    const T = P.tpl, cw = ctx.canvas.width, ch = ctx.canvas.height;
    const sc = Math.min(cw / P.W, ch / P.H);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (Math.abs(cw / ch - P.W / P.H) > 0.005) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cw, ch); }
    ctx.setTransform(sc, 0, 0, sc, (cw - P.W * sc) / 2, (ch - P.H * sc) / 2);
    ctx.beginPath(); ctx.rect(0, 0, P.W, P.H); ctx.clip();
    P.sc = sc;
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    const n = P.scenes.length, stat = slideIdx != null;
    let i, local, gt;
    if (stat) { i = clamp(Math.floor(+slideIdx) || 0, 0, n - 1); local = Infinity; gt = null; }
    else { gt = clamp(+t || 0, 0, P.total); i = sceneIndex(P, gt); local = gt - P.starts[i]; }
    const dur = P.scenes[i].secs;
    T.bg(ctx, P, gt, i);
    let k = 1, lt = local;
    if (!stat && i > 0 && local < T.tr) {
      k = local / T.tr;
      const pd = P.scenes[i - 1].secs;
      // Eski sahne geçişin ilk ~%55'inde çıkar; yeni sahne biraz gecikmeli girer (üst üste binme olmaz).
      T.scene(ctx, P, { idx: i - 1, t: pd + local, dur: pd, exit: T.rawExit ? k : Math.min(1, k / 0.55), stat: false, n: n });
    }
    if (!stat && i > 0 && !T.rawExit) lt = local - T.tr * 0.3;
    T.scene(ctx, P, { idx: i, t: lt, dur: dur, exit: 0, stat: stat, n: n });
    T.chrome(ctx, P, { i: i, n: n, local: local, dur: dur, gt: gt, stat: stat, k: E.inOutCubic(k), prev: i - 1 });
    ctx.restore();
  }

  function duration(project) { return norm(project).total; }
  function draw(ctx, project, timeSec) { renderFrame(ctx, norm(project), timeSec, null); }
  function drawSlide(ctx, project, index) { renderFrame(ctx, norm(project), 0, index || 0); }
  function sceneAt(project, t) { const P = norm(project), g = clamp(+t || 0, 0, P.total), i = sceneIndex(P, g); return { index: i, local: g - P.starts[i], start: P.starts[i], secs: P.scenes[i].secs }; }

  /* ---------- Önizleme oynatıcı ---------- */
  function play(canvas, project, opts) {
    opts = opts || {};
    const ctx = canvas.getContext('2d');
    let proj = project, P = norm(proj), t = clamp(+opts.start || 0, 0, P.total), playing = opts.autoplay !== false, ended = false, alive = true, last = null, dirty = true, raf = 0;
    function size() {
      const dpr = window.devicePixelRatio || 1;
      const cssW = opts.width || canvas.clientWidth || 360;
      const w = Math.max(64, Math.min(P.W, Math.round(opts.width ? opts.width : cssW * dpr)));
      const h = Math.round(w * P.H / P.W);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    }
    function render() { renderFrame(ctx, P, t, null); dirty = false; if (opts.onTime) opts.onTime(t, P.total); }
    function loop(now) {
      if (!alive) return;
      if (playing) {
        if (last != null) t += Math.min(0.1, (now - last) / 1000);
        last = now;
        if (t >= P.total) {
          if (opts.loop) t = t % P.total;
          else { t = P.total; playing = false; ended = true; render(); if (opts.onEnd) opts.onEnd(); }
        }
        if (playing) render();
      } else if (dirty) render();
      raf = requestAnimationFrame(loop);
    }
    size(); render();
    ready().then(function () { if (alive) { dirty = true; last = null; raf = requestAnimationFrame(loop); } });
    return {
      pause: function () { playing = false; last = null; },
      resume: function () { if (ended || t >= P.total) { t = 0; ended = false; } playing = true; last = null; },
      seek: function (x) { t = clamp(+x || 0, 0, P.total); ended = false; dirty = true; last = null; },
      stop: function () { alive = false; playing = false; cancelAnimationFrame(raf); },
      setProject: function (p) { proj = p; P = norm(p); t = Math.min(t, P.total); size(); dirty = true; },
      resize: function () { size(); dirty = true; },
      get time() { return t; },
      get duration() { return P.total; },
      get playing() { return playing; }
    };
  }

  /* ---------- Dışa aktarma ---------- */
  function videoFormat() {
    if (typeof MediaRecorder === 'undefined' || typeof HTMLCanvasElement === 'undefined' || !HTMLCanvasElement.prototype.captureStream) return null;
    const c = [['video/mp4;codecs=avc1.640028', 'mp4'], ['video/mp4;codecs=avc1', 'mp4'], ['video/mp4', 'mp4'], ['video/webm;codecs=vp9', 'webm'], ['video/webm;codecs=vp8', 'webm'], ['video/webm', 'webm']];
    for (let i = 0; i < c.length; i++) { try { if (MediaRecorder.isTypeSupported(c[i][0])) return { mime: c[i][0].split(';')[0], codec: c[i][0], ext: c[i][1] }; } catch (e) { /* sıradaki */ } }
    return null;
  }
  function fullCanvas(P) { const c = document.createElement('canvas'); c.width = P.W; c.height = P.H; return c; }

  async function exportVideo(project, opts) {
    opts = opts || {};
    const signal = opts.signal, onProgress = opts.onProgress;
    if (signal && signal.aborted) throw new DOMException('Aborted', 'AbortError');
    await ready();
    const fmt = videoFormat();
    if (!fmt) throw new Error('video_unsupported');
    const P = norm(project), total = P.total;
    const cv = fullCanvas(P), ctx = cv.getContext('2d', { alpha: false });
    renderFrame(ctx, P, 0, null);
    const stream = cv.captureStream(30);
    const bps = opts.bitrate || Math.round(clamp(P.W * P.H / (1080 * 1920) * 8e6, 5e6, 8e6));
    const rec = new MediaRecorder(stream, { mimeType: fmt.codec, videoBitsPerSecond: bps });
    const chunks = [];
    rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    return new Promise(function (resolve, reject) {
      let t0 = 0, state = 'run', lastP = -1;
      const cleanup = function () { stream.getTracks().forEach(function (tr) { tr.stop(); }); if (signal) signal.removeEventListener('abort', onAbort); };
      const onAbort = function () { if (state !== 'run') return; state = 'abort'; try { rec.stop(); } catch (e) { /* zaten durdu */ } cleanup(); reject(new DOMException('Aborted', 'AbortError')); };
      if (signal) signal.addEventListener('abort', onAbort);
      rec.onerror = function (e) { if (state !== 'run') return; state = 'err'; cleanup(); reject((e && e.error) || new Error('recorder_error')); };
      rec.onstop = function () {
        if (state === 'abort' || state === 'err') return;
        state = 'done'; cleanup();
        const blob = new Blob(chunks, { type: fmt.mime });
        if (!blob.size) { reject(new Error('empty_video')); return; }
        if (onProgress) onProgress(1);
        resolve({ blob: blob, mime: fmt.mime, ext: fmt.ext });
      };
      const schedule = function () { if (document.hidden) setTimeout(tick, 1000 / 30); else requestAnimationFrame(tick); };
      const tick = function () {
        if (state !== 'run') return;
        const t = (performance.now() - t0) / 1000;
        renderFrame(ctx, P, Math.min(t, total), null);
        const pr = Math.min(0.999, t / total);
        if (onProgress && pr - lastP >= 0.005) { lastP = pr; onProgress(pr); }
        if (t >= total + 0.3) { state = 'stopping'; try { rec.requestData(); } catch (e) { /* yok */ } rec.stop(); } else schedule();
      };
      try { rec.start(1000); } catch (e) { state = 'err'; cleanup(); reject(e); return; }
      t0 = performance.now();
      schedule();
    });
  }

  function canvasBlob(cv) {
    return new Promise(function (res, rej) { cv.toBlob(function (b) { if (b) res(b); else rej(new Error('png_fail')); }, 'image/png'); });
  }
  async function exportPng(project, index) {
    await ready();
    const P = norm(project), cv = fullCanvas(P);
    renderFrame(cv.getContext('2d'), P, 0, index || 0);
    return canvasBlob(cv);
  }
  async function exportAllPng(project) {
    await ready();
    const P = norm(project), out = [];
    for (let i = 0; i < P.scenes.length; i++) { const cv = fullCanvas(P); renderFrame(cv.getContext('2d'), P, 0, i); out.push(await canvasBlob(cv)); }
    return out;
  }

  window.SmcMotor = Object.freeze({
    version: '1.0.0',
    templates: templates,
    aspects: aspects,
    palettes: palettes,
    ready: ready,
    duration: duration,
    sceneAt: sceneAt,
    draw: draw,
    drawSlide: drawSlide,
    play: play,
    videoFormat: videoFormat,
    exportVideo: exportVideo,
    exportPng: exportPng,
    exportAllPng: exportAllPng
  });
})();
