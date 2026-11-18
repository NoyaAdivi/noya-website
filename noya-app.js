/*!
 * noya-app.js  ·  FAQ by topic + installable app (PWA) + scroll extras
 * Shared by all of Noya Adivi's sites. No dependencies.
 *
 * <script src="faq.js" defer></script>            window.NOYA_FAQ = { topics: [...], items: [...] }
 * <script src="noya-app.js" defer
 *         data-sw="sw.js"                          service worker to register (makes the site installable)
 *         data-repo="https://github.com/..."       "still have a question?" link
 *         data-before="footer"                     where to put the FAQ (default: before the first <footer>)
 *         data-replace="#faq"                      replace an existing FAQ section
 *         data-home-only                          hash-router sites: show the FAQ on the home view only (automatic for #/route sites)
 *         data-faq-show="5"                       how many questions show before "show all" (default 5)
 *         data-install="off"                     no install popup (the site stays installable from the browser)
 *         data-top="off"                           hide the back-to-top button
 *         data-scroll="off"></script>              no progress bar and no back-to-top (site has its own)
 */
(function () {
  'use strict';
  var me = document.currentScript || document.querySelector('script[src*="noya-app"]');
  var opt = (me && me.dataset) || {};
  var root = document.documentElement;
  var he = function () { return (root.lang || '').toLowerCase().indexOf('he') === 0; };
  var T = function (h, e) { return he() ? h : e; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  var css = '' +
    '.na-faq{max-width:860px;margin:72px auto 40px;padding:0 20px;font-family:Rubik,system-ui,sans-serif;color:inherit}' +
    '.na-faq .na-eye{display:inline-block;font:700 .78rem Rubik,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#7A6BE0;background:#EEEAFF;padding:.35em .9em;border-radius:999px}' +
    '.na-faq h2{font:700 clamp(1.7rem,4vw,2.4rem)/1.15 Fredoka,Rubik,system-ui,sans-serif;margin:.4em 0 .2em;background:linear-gradient(90deg,#5548C8,#F28C7A);-webkit-background-clip:text;background-clip:text;color:transparent}' +
    '.na-faq .na-sub{margin:0 0 22px;opacity:.75}' +
    '.na-head{text-align:center}' +
    '.na-search{position:relative;margin:0 auto 16px;max-width:520px}' +
    '.na-search input{width:100%;box-sizing:border-box;padding:14px 46px;border-radius:18px;border:2px solid #E3DEFF;background:#FFFDFC;color:inherit;font:500 1rem Rubik,system-ui,sans-serif;transition:border-color .25s,box-shadow .25s}' +
    '.na-search input:focus{outline:0;border-color:#8B7CF6;box-shadow:0 0 0 5px rgba(139,124,246,.18)}' +
    '.na-search span{position:absolute;top:50%;transform:translateY(-50%);inset-inline-start:16px;opacity:.6}' +
    '.na-chips{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:0 0 22px}' +
    '.na-chip{border:2px solid #E3DEFF;background:#FBFAFF;color:inherit;border-radius:999px;padding:8px 15px;font:600 .92rem Rubik,system-ui,sans-serif;cursor:pointer;display:inline-flex;gap:6px;align-items:center;transition:transform .2s,background .25s,border-color .25s,color .25s}' +
    '.na-chip:hover{transform:translateY(-2px);border-color:#B3A9FA}' +
    '.na-chip[aria-pressed=true]{background:linear-gradient(135deg,#8B7CF6,#F28C7A);border-color:transparent;color:#fff;box-shadow:0 8px 20px rgba(139,124,246,.3)}' +
    '.na-chip small{font-size:.75em;opacity:.8;background:rgba(0,0,0,.08);border-radius:999px;padding:0 .5em}' +
    '.na-list{display:grid;gap:12px}' +
    '.na-item{border:2px solid #EEEAFF;background:#FFFDFC;border-radius:22px;overflow:hidden;transition:border-color .25s,box-shadow .25s,transform .25s;animation:naIn .45s both}' +
    '.na-item:hover{border-color:#D9D3FF;box-shadow:0 10px 26px rgba(85,72,200,.1)}' +
    '.na-item.open{border-color:#B3A9FA;box-shadow:0 14px 34px rgba(85,72,200,.14)}' +
    '@keyframes naIn{from{opacity:0;transform:translateY(12px)}}' +
    '.na-q{all:unset;box-sizing:border-box;width:100%;display:flex;gap:12px;align-items:center;padding:18px 20px;cursor:pointer;font:600 1.03rem/1.4 Rubik,system-ui,sans-serif}' +
    '.na-q:focus-visible{outline:3px solid #8B7CF6;outline-offset:-3px;border-radius:22px}' +
    '.na-q .na-ic{flex:none;width:34px;height:34px;border-radius:12px;display:grid;place-items:center;background:#FFE9E3}' +
    '.na-q .na-t{flex:1}' +
    '.na-q .na-pm{flex:none;width:28px;height:28px;border-radius:50%;background:#EEEAFF;display:grid;place-items:center;transition:transform .35s cubic-bezier(.3,1.5,.5,1),background .25s}' +
    '.na-item.open .na-pm{transform:rotate(135deg);background:#8B7CF6;color:#fff}' +
    '.na-a{display:grid;grid-template-rows:0fr;transition:grid-template-rows .4s ease}' +
    '.na-item.open .na-a{grid-template-rows:1fr}' +
    '.na-a>div{overflow:hidden}.na-a p{margin:0;padding:0 20px 20px 66px;line-height:1.7;opacity:.85}' +
    '[dir=rtl] .na-a p,.na-faq[dir=rtl] .na-a p{padding:0 66px 20px 20px}' +
    '.na-tag{display:inline-block;margin-inline-start:8px;font-size:.72rem;font-weight:700;color:#7A6BE0;background:#EEEAFF;border-radius:999px;padding:.15em .6em;vertical-align:middle}' +
    '.na-empty{text-align:center;padding:26px;opacity:.7}' +
    '.na-more{text-align:center;margin-top:20px}' +
    '.na-more a{display:inline-flex;gap:8px;align-items:center;font-weight:700;color:#5548C8;text-decoration:none;padding:10px 18px;border-radius:999px;background:#EEEAFF;transition:transform .2s}' +
    '.na-more a:hover{transform:translateY(-2px)}' +
    'mark.na-hl{background:#FFE08A;color:inherit;border-radius:4px;padding:0 2px}' +
    /* progress + top + install */
    '.na-prog{position:fixed;top:0;inset-inline:0;height:4px;z-index:2147482990;transform-origin:0 50%;transform:scaleX(0);background:linear-gradient(90deg,#8B7CF6,#F28C7A,#FFC36B);pointer-events:none}' +
    '[dir=rtl] .na-prog,html[dir=rtl] .na-prog{transform-origin:100% 50%}' +
    '.na-top{position:fixed;bottom:22px;inset-inline-end:22px;z-index:2147482995;width:48px;height:48px;border-radius:16px;border:0;cursor:pointer;background:#FFFDFC;color:#5548C8;box-shadow:0 10px 26px rgba(85,72,200,.25);font-size:1.3rem;opacity:0;transform:translateY(20px) scale(.8);pointer-events:none;transition:opacity .3s,transform .35s cubic-bezier(.3,1.5,.5,1)}' +
    '.na-top.show{opacity:1;transform:none;pointer-events:auto}.na-top:hover{transform:translateY(-3px)}' +
    '.na-install{position:fixed;bottom:22px;left:50%;z-index:2147482996;display:flex;gap:10px;align-items:center;padding:10px 10px 10px 16px;border-radius:999px;background:#FFFDFC;color:#2C2668;box-shadow:0 16px 40px rgba(44,38,104,.25);border:2px solid #E3DEFF;font:600 .95rem Rubik,system-ui,sans-serif;transform:translate(-50%,140%);transition:transform .5s cubic-bezier(.3,1.4,.5,1)}' +
    '.na-install.show{transform:translate(-50%,0)}.na-install img{width:30px;height:30px;border-radius:9px}' +
    '.na-install button{border:0;cursor:pointer;font:700 .9rem Rubik,system-ui,sans-serif;border-radius:999px;padding:9px 16px}' +
    '.na-install .na-go{background:linear-gradient(135deg,#8B7CF6,#F28C7A);color:#fff}.na-install .na-no{background:transparent;color:inherit;padding:9px 10px;opacity:.6}' +
    /* dark */
    'html[data-theme=dark] .na-search input,html[data-theme=dark] .na-item,html[data-theme=dark] .na-top,html[data-theme=dark] .na-install{background:#251F3A;border-color:#3E3560;color:#F1EEFF}' +
    'html[data-theme=dark] .na-chip{background:#2F2847;border-color:#3E3560}html[data-theme=dark] .na-q .na-ic{background:#3A2E45}' +
    'html[data-theme=dark] .na-q .na-pm,html[data-theme=dark] .na-tag,html[data-theme=dark] .na-faq .na-eye,html[data-theme=dark] .na-more a{background:#3E3560;color:#E2DCFF}' +
    'html[data-theme=dark] .na-faq h2{background:linear-gradient(90deg,#C9C1FF,#FFB4A6);-webkit-background-clip:text;background-clip:text}' +
    'html[data-theme=dark] .na-top{color:#C9C1FF}' +
    '@media (prefers-reduced-motion:reduce){.na-item,.na-a,.na-pm,.na-top,.na-install,.na-chip{animation:none!important;transition:none!important}}' +
    'html.nk-still .na-item,html.nk-still .na-a,html.nk-still .na-pm{animation:none!important;transition:none!important}' +
    '.na-all{display:flex;justify-content:center;margin-top:16px}' +
    '.na-all button{border:2px solid #E3DEFF;background:#FBFAFF;color:#5548C8;border-radius:999px;padding:11px 20px;font:700 .95rem Rubik,system-ui,sans-serif;cursor:pointer;display:inline-flex;gap:8px;align-items:center;transition:transform .2s,box-shadow .25s}' +
    '.na-all button:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(85,72,200,.15)}' +
    'html[data-theme=dark] .na-all button{background:#2F2847;border-color:#3E3560;color:#E2DCFF}' +
    '@media (max-width:560px){' +
      '.na-faq{margin:48px auto 28px;padding:0 14px}.na-faq .na-sub{font-size:.95rem}' +
      '.na-chips{flex-wrap:nowrap;justify-content:flex-start;overflow-x:auto;scroll-snap-type:x proximity;-webkit-overflow-scrolling:touch;scrollbar-width:none;margin:0 0 18px;padding:2px 14px 8px;mask-image:linear-gradient(90deg,transparent,#000 14px,#000 calc(100% - 14px),transparent);-webkit-mask-image:linear-gradient(90deg,transparent,#000 14px,#000 calc(100% - 14px),transparent)}' +
      '.na-chips::-webkit-scrollbar{display:none}.na-chip{flex:none;scroll-snap-align:start;padding:7px 13px;font-size:.88rem}' +
      '.na-q{padding:14px 14px;gap:10px;font-size:.97rem}.na-q .na-ic{width:30px;height:30px;border-radius:10px}' +
      '.na-a p,[dir=rtl] .na-a p{padding:0 16px 16px}.na-item{border-radius:18px}' +
      '.na-top{bottom:calc(84px + env(safe-area-inset-bottom));width:44px;height:44px}' +
      '.na-install{left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));transform:translateY(160%);border-radius:20px;font-size:.88rem;padding:10px 10px 10px 12px}' +
      '.na-install.show{transform:none}.na-install span{flex:1;min-width:0;line-height:1.35}' +
    '}' +
    /* mobile guard: nothing wider than the screen, no sideways wobble, no iOS zoom on inputs */
    'html{-webkit-text-size-adjust:100%;text-size-adjust:100%}' +
    'html,body{max-width:100%;overflow-x:hidden}@supports (overflow:clip){html,body{overflow-x:clip}}' +
    'img,video,iframe,canvas{max-width:100%}img,video{height:auto}' +
    'h1,h2,h3,h4,h5,p,li,dt,dd,blockquote,figcaption,label,td,th{overflow-wrap:break-word}' +
    'pre{max-width:100%;overflow-x:auto}' +
    '.nk-panel{max-height:calc(100dvh - 24px)!important;overscroll-behavior:contain}' +
    '@media (max-width:700px){' +
      'input:not([type=checkbox]):not([type=radio]):not([type=range]),select,textarea{font-size:max(16px,1em)}' +
      'table{display:block;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}' +
      '.nk-tab{width:46px!important;height:46px!important}' +
    '}';
  var st = document.createElement('style'); st.id = 'noya-app-css'; st.textContent = css; document.head.appendChild(st);

  /* ---------- FAQ ---------- */
  function faq() {
    var D = window.NOYA_FAQ; if (!D || !D.items || !D.items.length) return;
    var old = opt.replace && document.querySelector(opt.replace), sec;
    if (old) { sec = old; sec.innerHTML = ''; sec.classList.add('na-faq'); } // keep the element so the site's own nav still tracks it
    else {
      sec = document.createElement('section'); sec.className = 'na-faq'; sec.id = 'faq';
      var before = document.querySelector(opt.before || 'footer');
      if (before && before.parentNode) before.parentNode.insertBefore(sec, before); else (document.querySelector('main') || document.body).appendChild(sec);
    }
    var topic = 'all', query = '', openId = null, all = false, LIM = +(opt.faqShow || 5);
    var L = function (o) { return o ? (he() ? (o.he || o.en) : (o.en || o.he)) : ''; };
    var topicOf = function (id) { for (var i = 0; i < D.topics.length; i++) if (D.topics[i].id === id) return D.topics[i]; return null; };
    var norm = function (s) { return String(s).toLowerCase().replace(/[֑-ׇ]/g, ''); };
    var hl = function (s) { var h = esc(s); if (!query) return h; var q = esc(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); return h.replace(new RegExp('(' + q + ')', 'gi'), '<mark class="na-hl">$1</mark>'); };

    function shell() {
      sec.dir = he() ? 'rtl' : 'ltr';
      sec.innerHTML = '<div class="na-head"><span class="na-eye">' + T('שאלות נפוצות', 'FAQ') + '</span>' +
        '<h2>' + esc(L(D.title) || T('יש שאלה? יש תשובה', 'Questions? Answered')) + '</h2>' +
        '<p class="na-sub">' + (D.items.length > 6 ? T('בוחרים נושא או מחפשים, והתשובה נפתחת בלחיצה', 'Pick a topic or search, then tap a question to open it') : T('בוחרים נושא ולוחצים על שאלה', 'Pick a topic and tap a question')) + '</p></div>' +
        (D.items.length > 6 ? '<div class="na-search"><span aria-hidden="true">🔎</span><input type="search" aria-label="' + T('חיפוש בשאלות', 'Search the questions') + '" placeholder="' + T('חיפוש שאלה…', 'Search a question…') + '"></div>' : '') +
        '<div class="na-chips" role="group" aria-label="' + T('סינון לפי נושא', 'Filter by topic') + '"></div>' +
        '<div class="na-list"></div><div class="na-all" hidden><button type="button"></button></div><p class="na-empty" hidden></p>' +
        (opt.repo ? '<p class="na-more"><a href="' + esc(opt.repo) + '/issues/new" target="_blank" rel="noopener">💬 ' + T('לא מצאתם תשובה? כתבו לי בגיטהאב', 'Didn\'t find it? Ask me on GitHub') + '</a></p>' : '');
      var inp = sec.querySelector('input');
      if (inp) { inp.value = query; inp.addEventListener('input', function () { query = inp.value.trim(); list(); chips(); }); }
      chips(); list();
    }
    function visible(it, ignoreTopic) {
      if (!ignoreTopic && topic !== 'all' && it.t !== topic) return false;
      if (!query) return true; var p = (he() ? it.he : it.en) || it.he || it.en;
      return norm(p[0] + ' ' + p[1]).indexOf(norm(query)) > -1;
    }
    function chips() {
      var box = sec.querySelector('.na-chips');
      var count = function (id) { return D.items.filter(function (it) { return visible(it, true) && (id === 'all' || it.t === id); }).length; };
      box.innerHTML = [{ id: 'all', icon: '✨', he: 'הכל', en: 'All' }].concat(D.topics).map(function (t) {
        return '<button type="button" class="na-chip" data-topic="' + t.id + '" aria-pressed="' + (topic === t.id) + '"><span aria-hidden="true">' + (t.icon || '') + '</span>' + esc(L(t)) + ' <small>' + count(t.id) + '</small></button>';
      }).join('');
    }
    function list() {
      var box = sec.querySelector('.na-list'), match = D.items.filter(function (it) { return visible(it); });
      var cut = !all && !query && topic === 'all' && match.length > LIM + 1, shown = cut ? match.slice(0, LIM) : match;
      var more = sec.querySelector('.na-all'); more.hidden = !cut;
      if (cut) more.firstChild.innerHTML = '<span aria-hidden="true">▾</span> ' + T('להצגת כל ' + match.length + ' השאלות', 'Show all ' + match.length + ' questions');
      box.innerHTML = shown.map(function (it, i) {
        var p = (he() ? it.he : it.en) || it.he || it.en, id = D.items.indexOf(it), tp = topicOf(it.t), open = openId === id;
        return '<div class="na-item' + (open ? ' open' : '') + '" style="animation-delay:' + Math.min(i * 45, 400) + 'ms">' +
          '<button type="button" class="na-q" data-q="' + id + '" aria-expanded="' + open + '" aria-controls="na-a' + id + '">' +
          '<span class="na-ic" aria-hidden="true">' + ((tp && tp.icon) || '❓') + '</span><span class="na-t">' + hl(p[0]) +
          (topic === 'all' && tp ? '<span class="na-tag">' + esc(L(tp)) + '</span>' : '') + '</span><span class="na-pm" aria-hidden="true">+</span></button>' +
          '<div class="na-a" id="na-a' + id + '" role="region"><div><p>' + hl(p[1]) + '</p></div></div></div>';
      }).join('');
      var em = sec.querySelector('.na-empty'); em.hidden = match.length > 0;
      em.textContent = T('לא מצאתי שאלה כזו. נסו מילה אחרת 🙂', 'No question matches that. Try another word 🙂');
    }
    sec.addEventListener('click', function (e) {
      if (e.target.closest('.na-all')) { all = true; list(); return; }
      var c = e.target.closest('.na-chip'); if (c) { c.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); topic = c.getAttribute('data-topic'); openId = null; chips(); list(); return; }
      var q = e.target.closest('.na-q'); if (!q) return;
      var id = +q.getAttribute('data-q'), item = q.parentNode, was = item.classList.contains('open');
      sec.querySelectorAll('.na-item.open').forEach(function (x) { x.classList.remove('open'); x.querySelector('.na-q').setAttribute('aria-expanded', 'false'); });
      if (!was) { item.classList.add('open'); q.setAttribute('aria-expanded', 'true'); openId = id; } else openId = null;
    });
    new MutationObserver(shell).observe(root, { attributes: true, attributeFilter: ['lang'] });
    { /* #/route views other than home hide the FAQ; plain #anchors never do */ var vis = function () { var v = location.hash.split('/')[1]; sec.hidden = !!v && v !== 'home'; }; addEventListener('hashchange', vis); vis(); }
    shell();
    if (location.hash === '#faq') setTimeout(function () { sec.scrollIntoView({ behavior: 'smooth' }); }, 300);
  }

  /* ---------- scroll progress + back to top ---------- */
  function scrollers() {
    if (opt.scroll === 'off') return;
    var bar = document.createElement('div'); bar.className = 'na-prog'; bar.setAttribute('aria-hidden', 'true'); document.body.appendChild(bar);
    var top = null;
    if (opt.top !== 'off') {
      top = document.createElement('button'); top.type = 'button'; top.className = 'na-top'; top.textContent = '↑';
      top.addEventListener('click', function () { scrollTo({ top: 0, behavior: 'smooth' }); });
      document.body.appendChild(top);
    }
    var tick = false;
    function upd() {
      tick = false; var h = document.documentElement.scrollHeight - innerHeight, p = h > 0 ? scrollY / h : 0;
      bar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, p)) + ')';
      if (top) { top.classList.toggle('show', scrollY > 600); top.setAttribute('aria-label', T('חזרה למעלה', 'Back to top')); top.title = top.getAttribute('aria-label'); }
    }
    addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    addEventListener('resize', upd); upd();
  }

  /* ---------- installable app ---------- */
  function app() {
    if (opt.sw && 'serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      addEventListener('load', function () { navigator.serviceWorker.register(opt.sw).catch(function () {}); });
    }
    if (opt.install === 'off') return;
    var standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (standalone) { root.classList.add('na-standalone'); return; }
    var KEY = 'noya-app:install-dismissed', deferred = null, bar = null;
    try { if (localStorage.getItem(KEY)) return; } catch (e) {}
    function name() { var m = document.querySelector('meta[name="application-name"]'); return m ? m.content : document.title.split(/[·|]/)[0].trim(); }
    function icon() { var l = document.querySelector('link[rel="apple-touch-icon"]') || document.querySelector('link[rel="icon"]'); return l ? l.href : ''; }
    function show(ios) {
      if (bar) return;
      bar = document.createElement('div'); bar.className = 'na-install'; bar.setAttribute('role', 'dialog');
      var paint = function () {
        bar.dir = he() ? 'rtl' : 'ltr'; bar.setAttribute('aria-label', T('התקנת האפליקציה', 'Install the app'));
        bar.innerHTML = '<img src="' + icon() + '" alt=""><span>' + (ios ? T('להתקנה: שיתוף ⬆️ ואז "הוספה למסך הבית"', 'To install: Share ⬆️ then "Add to Home Screen"') : T('להתקין את ' + esc(name()) + ' כאפליקציה?', 'Install ' + esc(name()) + ' as an app?')) + '</span>' +
          (ios ? '' : '<button type="button" class="na-go">' + T('התקנה', 'Install') + '</button>') + '<button type="button" class="na-no" aria-label="' + T('לא עכשיו', 'Not now') + '">✕</button>';
      };
      paint(); document.body.appendChild(bar); requestAnimationFrame(function () { requestAnimationFrame(function () { bar.classList.add('show'); }); });
      new MutationObserver(paint).observe(root, { attributes: true, attributeFilter: ['lang'] });
      bar.addEventListener('click', function (e) {
        if (e.target.closest('.na-go') && deferred) { deferred.prompt(); deferred.userChoice.finally(function () { deferred = null; hide(); }); }
        if (e.target.closest('.na-no')) { try { localStorage.setItem(KEY, '1'); } catch (er) {} hide(); }
      });
    }
    function hide() { if (bar) { bar.classList.remove('show'); setTimeout(function () { bar && bar.remove(); bar = null; }, 500); } }
    addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; setTimeout(function () { show(false); }, 4000); });
    addEventListener('appinstalled', hide);
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
    if (ios && opt.sw) setTimeout(function () { show(true); }, 6000);
  }

  /* ---------- phone overflow guard ---------- */
  function guard() {
    var busy = false, runs = 0;
    function scan() {
      busy = false; if (innerWidth > 760) return;
      var W = document.documentElement.clientWidth, els = document.body.querySelectorAll('*');
      for (var i = 0; i < els.length; i++) {
        var el = els[i], r = el.getBoundingClientRect();
        if (r.width <= W + 1 || !r.height) continue;
        var cs = getComputedStyle(el); if (cs.position === 'fixed' || cs.position === 'absolute') continue;
        var p = el.parentElement, inside = false;
        for (; p && p !== document.body; p = p.parentElement) { var o = getComputedStyle(p).overflowX; if (o === 'auto' || o === 'scroll' || o === 'hidden' || o === 'clip') { inside = true; break; } }
        if (inside) continue;
        el.style.maxWidth = '100%'; el.style.boxSizing = 'border-box'; if (cs.whiteSpace === 'nowrap') el.style.whiteSpace = 'normal';
      }
    }
    function later(e) { if (e && e.type === 'resize') runs = 0; if (busy || runs > 25) return; busy = true; runs++; setTimeout(scan, 900); }
    addEventListener('load', later); addEventListener('resize', later); addEventListener('hashchange', later);
    new MutationObserver(function () { later(); }).observe(document.body, { childList: true, subtree: true });
    later();
  }

  function init() { faq(); scrollers(); app(); guard(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
