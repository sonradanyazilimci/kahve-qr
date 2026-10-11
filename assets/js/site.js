Cloud.loadForSite().then(function (boot) {
  'use strict';

  const D = boot.data;
  const L = D.labels;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Başlıklarda *kelime* italik olur, satır sonları korunur.
  const rich = s => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
  const reduce = D.theme.motion === false || matchMedia('(prefers-reduced-motion: reduce)').matches;

  const price = v => {
    if (v === '' || v == null) return '';
    return D.menu.currencyPosition === 'before' ? D.menu.currency + v : v + ' ' + D.menu.currency;
  };
  const byId = (list, id) => list.find(x => x.id === id);

  /* ---------- Tema ---------- */
  function applyTheme() {
    const t = D.theme, s = document.documentElement.style;
    s.setProperty('--bg', t.bg);
    s.setProperty('--surface', t.surface);
    s.setProperty('--text', t.text);
    s.setProperty('--muted', t.muted);
    s.setProperty('--accent', t.accent);
    s.setProperty('--radius', t.radius + 'px');
    s.setProperty('--float', (reduce ? 0 : t.float) + 'px');
    s.setProperty('--card-sat', t.cardSaturation / 100);
    s.setProperty('--veil', D.background.overlay / 100);
    s.setProperty('--bg-sat', D.background.saturation / 100);
    s.setProperty('--font-display', `'${t.fontDisplay}', 'Times New Roman', serif`);
    s.setProperty('--font-body', `'${t.fontBody}', system-ui, sans-serif`);

    const fam = f => encodeURIComponent(f).replace(/%20/g, '+');
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fam(t.fontDisplay)}:ital,wght@0,400;0,500;1,400;1,500&family=${fam(t.fontBody)}:wght@300;400;500&display=swap`;
    document.head.appendChild(link);

    document.title = D.brand.pageTitle || D.brand.name;
    $('meta[name="description"]').content = D.brand.metaDescription || '';
    $('meta[name="theme-color"]').content = t.bg;
    document.documentElement.classList.toggle('no-motion', reduce);
  }

  /* ---------- Video yardımcıları ---------- */
  // Telefonlar (düşük güç modu, veri tasarrufu) otomatik oynatmayı engelleyebilir.
  // Oynaması gereken her video işaretlenir; engellenirse ilk dokunuşta yeniden denenir.
  const play = v => {
    v.dataset.want = '1';
    v.muted = true;
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  };
  const stop = v => {
    delete v.dataset.want;
    v.pause();
  };
  const resumeAll = () => $$('video').forEach(v => { if (v.dataset.want && v.paused) play(v); });
  ['pointerup', 'touchend', 'click', 'keydown'].forEach(ev => addEventListener(ev, resumeAll, { passive: true }));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) resumeAll(); });
  addEventListener('pageshow', resumeAll);

  function media(src, lazy) {
    const attr = lazy ? `preload="none" data-src="${esc(src)}"` : `autoplay preload="auto" src="${esc(src)}"`;
    return `<span class="media"><span class="media__fallback" aria-hidden="true"><i>${esc(D.brand.mark)}</i></span><video muted loop playsinline webkit-playsinline disablepictureinpicture ${attr}></video></span>`;
  }

  function wireMedia(root) {
    $$('.media video', root).forEach(v => {
      v.muted = true;
      v.defaultMuted = true;
      v.playsInline = true;
      const ready = () => v.parentNode.classList.add('is-ready');
      ['loadeddata', 'canplay', 'playing'].forEach(ev => v.addEventListener(ev, ready, { once: true }));
      // Bağlantı anlık koparsa bir kez daha dener.
      v.addEventListener('error', () => {
        if (v.dataset.retried || !v.getAttribute('src')) return;
        v.dataset.retried = '1';
        setTimeout(() => { v.load(); if (v.dataset.want) play(v); }, 1500);
      });
    });
  }

  // Yalnızca ekranda görünen videolar oynar; kaynak ilk yaklaşmada yüklenir.
  const videoObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const v = e.target;
      if (e.isIntersecting) {
        if (!v.getAttribute('src') && v.dataset.src) {
          // #t ile ilk kare, oynatma engellense bile görünür.
          v.preload = 'metadata';
          v.src = v.dataset.src + (v.dataset.src.includes('#') ? '' : '#t=0.001');
        }
        if (!detailOpen) play(v);
      } else {
        stop(v);
      }
    });
  }, { rootMargin: '120px 0px' });

  const brandHTML = () =>
    `<span class="brand__mark">${esc(D.brand.mark)}</span><span class="brand__name">${esc(D.brand.name)}</span>`;

  const badgeHTML = id => {
    const b = byId(D.badges, id);
    if (!b) return '';
    return `<span class="badge${b.highlight ? ' badge--on' : ''}">${b.icon ? `<span aria-hidden="true">${esc(b.icon)}</span>` : ''}${esc(b.label)}</span>`;
  };

  /* ---------- Sabit bölümler ---------- */
  function renderChrome() {
    const links = [['#menu', L.navMenu]];
    if (D.about.enabled) links.push(['#about', L.navAbout]);
    if (D.promise.enabled) links.push(['#promise', L.navPromise]);
    if (D.visit.enabled) links.push(['#visit', L.navVisit]);
    $('#nav').innerHTML =
      `<a class="brand" href="#top" aria-label="${esc(D.brand.name)}">${brandHTML()}</a>` +
      `<nav class="nav__links">${links.map(l => `<a href="${l[0]}">${esc(l[1])}</a>`).join('')}</nav>`;

    $('#top').innerHTML =
      `<p class="eyebrow">${esc(D.hero.eyebrow)}</p>` +
      `<h1 class="display hero__title">${rich(D.hero.title)}</h1>` +
      `<p class="hero__text">${esc(D.hero.text)}</p>`;

    $('#menuNote').textContent = D.menu.note;

    const a = D.about;
    $('#about').innerHTML = !a.enabled ? '' :
      `<div class="panel about reveal"><div>` +
      `<p class="eyebrow">${esc(a.eyebrow)}</p><h2 class="display panel__title">${rich(a.title)}</h2>` +
      `<p class="panel__text">${esc(a.text)}</p>` +
      (a.stats.length ? `<dl class="stats">${a.stats.map(s => `<div><dt>${esc(s.value)}</dt><dd>${esc(s.label)}</dd></div>`).join('')}</dl>` : '') +
      `</div>${a.video ? `<div class="about__media">${media(a.video, true)}</div>` : ''}</div>`;

    const p = D.promise;
    $('#promise').innerHTML = !p.enabled ? '' :
      `<div class="panel reveal"><p class="eyebrow">${esc(p.eyebrow)}</p>` +
      `<h2 class="display panel__title">${rich(p.title)}</h2><p class="panel__text">${esc(p.text)}</p>` +
      `<ol class="promise__list">${p.items.map(i => `<li><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p></li>`).join('')}</ol></div>`;

    const v = D.visit;
    $('#visit').innerHTML = !v.enabled ? '' :
      `<div class="panel visit reveal"><div>` +
      `<p class="eyebrow">${esc(v.eyebrow)}</p><h2 class="display panel__title">${rich(v.title)}</h2>` +
      `<p class="visit__address">${esc(v.address)}</p><div class="visit__links">` +
      (v.phone ? `<a class="link" href="tel:${esc(v.phone.replace(/[^\d+]/g, ''))}">${esc(v.phone)}</a>` : '') +
      (v.email ? `<a class="link" href="mailto:${esc(v.email)}">${esc(v.email)}</a>` : '') +
      `</div>${v.mapUrl ? `<a class="btn" href="${esc(v.mapUrl)}" target="_blank" rel="noopener">${esc(v.mapLabel)} <span aria-hidden="true">→</span></a>` : ''}` +
      `</div><div><h3 class="hours__title">${esc(v.hoursTitle)}</h3>` +
      `<dl class="hours">${v.hours.map(h => `<div><dt>${esc(h.day)}</dt><dd>${esc(h.time)}</dd></div>`).join('')}</dl>` +
      (D.social.length ? `<div class="social">${D.social.map(s => `<a class="link" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join('')}</div>` : '') +
      `</div></div>`;

    $('#footer').innerHTML =
      `<span class="brand">${brandHTML()}</span><span>${esc(D.footer.text)}</span><span>${esc(D.footer.note)}</span>`;

    wireMedia($('#main'));
    $$('#main .block .media video').forEach(el => videoObserver.observe(el));

    const reveal = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); reveal.unobserve(e.target); }
    }), { threshold: .12 });
    $$('.reveal').forEach(el => reveal.observe(el));

    const nav = $('#nav');
    const onScroll = () => nav.classList.toggle('is-stuck', scrollY > 24);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Menü: kategoriler ve kartlar ---------- */
  let activeCat = 'all';
  let cardObserver = null;
  let entered = false;

  function renderChips() {
    const cats = D.categories.filter(c => c.active !== false);
    const all = [{ id: 'all', name: D.menu.allLabel }].concat(cats);
    $('#chips').innerHTML = all.map(c =>
      `<button class="chip" type="button" role="tab" data-cat="${esc(c.id)}" aria-selected="${c.id === activeCat}">${esc(c.name)}</button>`).join('');
  }

  function visibleProducts() {
    const activeCats = D.categories.filter(c => c.active !== false).map(c => c.id);
    return D.products.filter(p => p.active !== false &&
      (activeCat === 'all' ? activeCats.includes(p.category) : p.category === activeCat));
  }

  function renderGrid() {
    const grid = $('#grid');
    const list = visibleProducts();
    if (cardObserver) cardObserver.disconnect();
    $$('video', grid).forEach(v => videoObserver.unobserve(v));

    if (!list.length) {
      grid.innerHTML = `<p class="menu__empty">${esc(D.menu.empty)}</p>`;
      return;
    }

    grid.innerHTML = list.map((p, i) => {
      const cat = byId(D.categories, p.category);
      // Her kart farklı bir yönden gelir ve kendi ritminde süzülür.
      const style = [
        `--fx:${((i * 53) % 7 - 3) * 34}px`,
        `--fy:${120 + (i * 37) % 120}px`,
        `--fr:${((i * 29) % 9 - 4) * 3}deg`,
        `--dur:${6 + (i * 13) % 5}s`,
        `--delay:-${(i * 1.7) % 6}s`,
        `--tilt:${i % 2 ? .7 : -.6}deg`
      ].join(';');
      return `<article class="card" data-id="${esc(p.id)}" style="${style}">` +
        `<div class="card__float"><button class="card__body" type="button" aria-label="${esc(p.name)}">` +
        media(p.video, true) +
        `<span class="card__shade"></span>` +
        `<span class="card__badges">${(p.badges || []).slice(0, 2).map(badgeHTML).join('')}</span>` +
        `<span class="card__info"><span class="card__cat">${esc(cat ? cat.name : '')}</span>` +
        `<span class="card__name">${esc(p.name)}</span>` +
        `<span class="card__meta"><span class="card__price">${esc(price(p.price))}</span>` +
        (p.kcal !== '' && p.kcal != null ? `<span class="card__kcal">${esc(p.kcal)} ${esc(L.caloriesUnit)}</span>` : '') +
        `</span></span></button></div><span class="card__shadow"></span></article>`;
    }).join('');

    wireMedia(grid);
    $$('video', grid).forEach(v => videoObserver.observe(v));
    if (entered) flyCards();
  }

  // Kartlar görüş alanına girdikçe derinlikten uçarak gelir.
  function flyCards() {
    cardObserver = new IntersectionObserver(entries => {
      let n = 0;
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.style.setProperty('--d', n++);
        e.target.classList.add('is-in');
        cardObserver.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    $$('#grid .card').forEach(c => cardObserver.observe(c));
  }

  $('#chips').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip || chip.dataset.cat === activeCat) return;
    activeCat = chip.dataset.cat;
    $$('#chips .chip').forEach(c => c.setAttribute('aria-selected', c === chip));
    renderGrid();
    const top = $('#menu').getBoundingClientRect().top + scrollY - 60;
    if (scrollY > top) scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  });

  /* ---------- Ürün detayı: önce uzaklaş, sonra açılıp ekranı kapla ---------- */
  const detail = $('#detail');
  const detailBody = $('#detailBody');
  let detailOpen = false, busy = false, currentCard = null, lastFocus = null;

  function fillDetail(p) {
    const cat = byId(D.categories, p.category);
    const allergens = (p.allergens || []).map(id => byId(D.allergens, id)).filter(Boolean);
    const hasKcal = p.kcal !== '' && p.kcal != null;
    detailBody.innerHTML =
      `<div class="detail__media">${media(p.video, false)}</div>` +
      `<div class="detail__sheet"><div class="detail__inner">` +
      `<div class="detail__badges">${(p.badges || []).map(badgeHTML).join('')}</div>` +
      `<div><p class="eyebrow">${esc(cat ? cat.name : '')}</p>` +
      `<div class="detail__head"><h2 class="display detail__name" id="detailName">${esc(p.name)}</h2>` +
      `<p class="detail__price">${esc(price(p.price))}</p></div></div>` +
      `<p class="detail__desc">${esc(p.desc)}</p>` +
      (hasKcal || p.portion ? `<dl class="facts">` +
        (hasKcal ? `<div><dt>${esc(L.calories)}</dt><dd>${esc(p.kcal)} <small>${esc(L.caloriesUnit)}</small></dd></div>` : '') +
        (p.portion ? `<div><dt>${esc(L.portion)}</dt><dd>${esc(p.portion)}</dd></div>` : '') + `</dl>` : '') +
      `<div class="detail__section"><h3>${esc(L.allergens)}</h3>` +
      (allergens.length
        ? `<div class="allergens">${allergens.map(a => `<span class="allergen">${esc(a.label)}</span>`).join('')}</div>`
        : `<p>${esc(L.noAllergens)}</p>`) + `</div>` +
      (p.ingredients ? `<div class="detail__section"><h3>${esc(L.ingredients)}</h3><p>${esc(p.ingredients)}</p></div>` : '') +
      `<p class="detail__disclaimer">${esc(L.disclaimer)}</p>` +
      `</div></div>`;
    detail.setAttribute('aria-labelledby', 'detailName');
    $('#detailClose').setAttribute('aria-label', L.close);
    wireMedia(detailBody);
    $$('video', detailBody).forEach(play);
  }

  // Kartın ekrandaki yerini, tam ekran katmanı kırpan bir inset() değerine çevirir.
  function insetOf(el, scale) {
    const r = el.getBoundingClientRect();
    const dx = r.width * (1 - scale) / 2, dy = r.height * (1 - scale) / 2;
    return `inset(${r.top + dy}px ${innerWidth - r.right + dx}px ${innerHeight - r.bottom + dy}px ${r.left + dx}px round ${D.theme.radius}px)`;
  }
  const FULL = 'inset(0px 0px 0px 0px round 0px)';

  function openDetail(card) {
    const p = byId(D.products, card.dataset.id);
    if (!p || busy || detailOpen) return;
    busy = true; detailOpen = true; currentCard = card; lastFocus = document.activeElement;
    fillDetail(p);
    $$('#grid video').forEach(stop);
    document.documentElement.classList.add('is-locked');
    try { history.pushState({ kqDetail: p.id }, ''); } catch (e) {}

    const body = $('.card__body', card);
    const done = () => {
      detail.classList.add('is-open');
      card.classList.add('is-hidden');
      busy = false;
      $('#detailClose').focus({ preventScroll: true });
    };

    if (reduce) {
      detail.hidden = false;
      detail.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250 }).onfinish = done;
      return;
    }

    const from = insetOf(body, 1), far = insetOf(body, .82);
    card.classList.add('is-leaving');
    detail.hidden = false;
    detail.animate([
      { clipPath: from, opacity: 0, easing: 'cubic-bezier(.5,0,.75,0)' },
      { clipPath: far, opacity: 1, offset: .3, easing: 'cubic-bezier(.76,0,.18,1)' },
      { clipPath: FULL, opacity: 1 }
    ], { duration: 1150 }).onfinish = done;
  }

  function closeDetail() {
    if (!detailOpen || busy) return;
    busy = true;
    const card = currentCard;
    detail.classList.remove('is-open');

    const done = () => {
      detail.hidden = true;
      detailBody.innerHTML = '';
      document.documentElement.classList.remove('is-locked');
      detailOpen = false; busy = false; currentCard = null;
      $$('#grid video').forEach(v => {
        const r = v.getBoundingClientRect();
        if (v.getAttribute('src') && r.bottom > 0 && r.top < innerHeight) play(v);
      });
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    };

    const inDom = card && card.isConnected;
    if (inDom) card.classList.remove('is-hidden');
    if (reduce || !inDom) {
      if (inDom) card.classList.remove('is-leaving');
      detail.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220 }).onfinish = done;
      return;
    }

    const to = insetOf($('.card__body', card), .82);
    detail.animate([
      { clipPath: FULL, opacity: 1, easing: 'cubic-bezier(.76,0,.18,1)' },
      { clipPath: to, opacity: 1, offset: .8 },
      { clipPath: to, opacity: 0 }
    ], { duration: 760 }).onfinish = () => {
      done();
      card.classList.remove('is-leaving');
    };
  }

  // Telefonun geri tuşu detayı kapatır.
  const requestClose = () => {
    if (history.state && history.state.kqDetail) history.back();
    else closeDetail();
  };
  addEventListener('popstate', closeDetail);
  $('#detailClose').addEventListener('click', requestClose);
  addEventListener('keydown', e => { if (e.key === 'Escape' && detailOpen) requestClose(); });
  $('#grid').addEventListener('click', e => {
    const card = e.target.closest('.card');
    if (card) openDetail(card);
  });

  /* ---------- Karşılama ---------- */
  function enterSite(instant) {
    if (entered) return;
    entered = true;
    document.body.classList.remove('is-intro');
    const intro = $('#intro');
    if (intro) {
      if (instant) intro.remove();
      else {
        intro.classList.add('is-leaving');
        setTimeout(() => intro.remove(), 1300);
      }
    }
    setTimeout(flyCards, instant ? 80 : 380);
  }

  function initIntro() {
    const I = D.intro, el = $('#intro');
    let seen = false;
    try { seen = sessionStorage.getItem('kahveqr:intro') === '1'; } catch (e) {}
    if (!I.enabled || !I.video && !I.title || (I.oncePerSession && seen)) return enterSite(true);
    try { sessionStorage.setItem('kahveqr:intro', '1'); } catch (e) {}

    el.innerHTML =
      media(I.video, false) +
      `<div class="intro__veil"></div>` +
      `<div class="intro__top"><span class="brand">${brandHTML()}</span>` +
      `<button class="intro__skip" type="button" data-enter>${esc(L.skip)}</button></div>` +
      `<div class="intro__content"><p class="eyebrow">${esc(I.eyebrow)}</p>` +
      `<h1 class="display intro__title">${rich(I.title)}</h1>` +
      `<p class="intro__sub">${esc(I.subtitle)}</p>` +
      `<button class="intro__btn" type="button" data-enter>${esc(I.button)} <span aria-hidden="true">→</span></button></div>` +
      `<span class="intro__progress"></span>`;
    wireMedia(el);
    $$('video', el).forEach(play);
    el.addEventListener('click', e => { if (e.target.closest('[data-enter]')) enterSite(false); });

    const secs = Number(I.autoSkip) || 0;
    if (secs > 0) {
      $('.intro__progress', el).animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: secs * 1000, fill: 'forwards' });
      setTimeout(() => enterSite(false), secs * 1000);
    }
  }

  function initBackground() {
    const v = $('#bgVideo');
    if (!D.background.video) return;
    v.src = D.background.video;
    v.addEventListener('loadedmetadata', () => { v.playbackRate = Number(D.background.playbackRate) || 1; });
    v.autoplay = true;
    play(v);
  }

  /* ---------- Başlat ---------- */
  applyTheme();
  initBackground();
  renderChrome();
  renderChips();
  renderGrid();
  initIntro();

  // Admin panelindeki taslak değişiklikler açık sekmeye anında yansır.
  addEventListener('storage', e => { if (e.key === Store.KEY) location.reload(); });

  // Bağlantı yavaşsa eski kopya gösterilir; güncel içerik gelince, misafir henüz
  // karşılama ekranındaysa sayfa yenilenir.
  if (boot.late) boot.late.then(d => { if (d && d.updatedAt !== boot.shown && !entered) location.reload(); });
});
