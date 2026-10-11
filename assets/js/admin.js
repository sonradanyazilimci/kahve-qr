(function () {
  'use strict';

  let data = Store.defaults();
  // Firestore'daki yayınlanmış sürümün zaman damgası (hiç yayınlanmadıysa 0).
  let publishedAt = 0;
  const $ = s => document.querySelector(s);

  /* ---------- Küçük yardımcılar ---------- */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const k in attrs || {}) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked') el.checked = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach(c => { if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c)); });
    return el;
  }
  const uid = p => p + '_' + Math.random().toString(36).slice(2, 8);
  const get = path => path.split('.').reduce((o, k) => (o == null ? o : o[k]), data);
  function set(path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    keys.reduce((o, k) => o[k], data)[last] = value;
    dirty();
  }

  // Değişiklikler önce bu tarayıcıya taslak olarak kaydedilir; "Yayınla" ile Firebase'e gönderilir.
  let saveTimer, savePending = false;
  function dirty() {
    const s = $('#status');
    s.textContent = 'Taslak kaydediliyor…';
    s.classList.add('is-dirty');
    savePending = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 250);
  }
  function paintStatus() {
    const pending = !publishedAt || data.updatedAt !== publishedAt;
    const s = $('#status');
    s.textContent = pending ? 'Yayınlanmamış değişiklikler var' : 'Yayında';
    s.classList.toggle('is-dirty', pending);
    $('#publish').disabled = !pending;
  }
  async function publishNow() {
    const btn = $('#publish'), s = $('#status');
    clearTimeout(saveTimer);
    savePending = false;
    btn.disabled = true;
    s.textContent = 'Yayınlanıyor…';
    try {
      Store.save(data);
      const snapshot = Store.clone(data);
      await Cloud.publish(snapshot);
      publishedAt = snapshot.updatedAt;
      paintStatus();
    } catch (e) {
      s.textContent = 'Yayınlanamadı: ' + explain(e);
      s.classList.add('is-dirty');
      btn.disabled = false;
    }
  }
  function saveNow() {
    clearTimeout(saveTimer);
    savePending = false;
    const s = $('#status');
    try {
      Store.save(data);
      paintStatus();
    } catch (e) {
      s.textContent = 'Taslak kaydedilemedi (tarayıcı depolaması dolu veya kapalı)';
    }
    $('#sideMark').textContent = data.brand.mark;
    $('#sideName').textContent = data.brand.name;
  }

  function download(name, text, type) {
    const a = h('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name });
    document.body.append(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ---------- Alan türleri ---------- */
  function control(def, path) {
    const val = get(path);
    switch (def.type) {
      case 'textarea':
        return h('textarea', { value: val == null ? '' : val, rows: def.rows || 3, oninput: e => set(path, e.target.value) });

      case 'number':
        return h('input', {
          type: 'number', value: val == null ? '' : val, min: def.min, max: def.max, step: def.step || 'any',
          oninput: e => set(path, e.target.value === '' ? '' : Number(e.target.value))
        });

      case 'toggle':
        return h('label', { class: 'toggle' },
          h('input', { type: 'checkbox', checked: val !== false && !!val, onchange: e => { set(path, e.target.checked); if (def.refresh) render(); } }),
          h('i'), h('span', {}, def.onLabel || 'Açık'));

      case 'range': {
        const out = h('output', {}, val + (def.unit || ''));
        return h('div', { class: 'range' },
          h('input', {
            type: 'range', min: def.min, max: def.max, step: def.step || 1, value: val,
            oninput: e => { set(path, Number(e.target.value)); out.textContent = e.target.value + (def.unit || ''); }
          }), out);
      }

      case 'color': {
        const text = h('input', { type: 'text', value: val, oninput: e => { if (/^#[0-9a-f]{6}$/i.test(e.target.value)) { pick.value = e.target.value; set(path, e.target.value); } } });
        const pick = h('input', { type: 'color', value: val, oninput: e => { text.value = e.target.value; set(path, e.target.value); } });
        return h('div', { class: 'color' }, pick, text);
      }

      case 'select': {
        const opts = def.from ? get(def.from).map(o => [o.id, o.name || o.label]) : def.options;
        const sel = h('select', { onchange: e => set(path, e.target.value) },
          opts.map(o => h('option', { value: o[0] }, o[1])));
        if (!opts.some(o => o[0] === val)) sel.prepend(h('option', { value: val == null ? '' : val }, '— seçin —'));
        sel.value = val == null ? '' : val;
        return sel;
      }

      case 'checks': {
        const current = () => (Array.isArray(get(path)) ? get(path) : []);
        return h('div', { class: 'checks' }, get(def.from).map(o =>
          h('label', { class: 'check' },
            h('input', {
              type: 'checkbox', checked: current().includes(o.id),
              onchange: e => set(path, e.target.checked ? current().concat(o.id) : current().filter(x => x !== o.id))
            }),
            h('span', {}, o.label))));
      }

      case 'video': {
        const state = h('p', { class: 'video__state' });
        const vid = h('video', { muted: true, loop: true, playsinline: true, autoplay: true });
        vid.muted = true;
        const load = url => {
          state.className = 'video__state';
          state.textContent = url ? 'Video kontrol ediliyor…' : 'Video bağlantısı boş.';
          if (url) vid.src = url; else vid.removeAttribute('src');
        };
        vid.addEventListener('loadeddata', () => { state.textContent = 'Video yüklendi.'; state.classList.add('is-ok'); vid.play().catch(() => {}); });
        vid.addEventListener('error', () => { if (vid.getAttribute('src')) { state.textContent = 'Video yüklenemedi. Doğrudan .mp4 / .webm dosya bağlantısı kullanın.'; state.classList.add('is-bad'); } });
        const input = h('input', {
          type: 'url', value: val || '', placeholder: 'https://…/video.mp4',
          oninput: e => set(path, e.target.value.trim()),
          onchange: e => load(e.target.value.trim())
        });
        // Önizleme yalnızca alan ekranda göründüğünde yüklenir (kapalı ürünler video indirmez).
        const box = h('div', { class: 'video' }, input, h('div', { class: 'video__preview' }, vid), state);
        const seen = new IntersectionObserver(es => {
          if (es.some(e => e.isIntersecting)) { seen.disconnect(); load(get(path)); }
        });
        seen.observe(box);
        return box;
      }

      default:
        return h('input', { type: 'text', value: val == null ? '' : val, placeholder: def.placeholder, oninput: e => { set(path, e.target.value); if (def.onInput) def.onInput(); } });
    }
  }

  function field(def, path) {
    const wide = def.wide || ['textarea', 'video', 'checks'].includes(def.type);
    const tag = ['toggle', 'checks', 'video', 'range', 'color'].includes(def.type) ? 'div' : 'label';
    return h(tag, { class: 'field' + (wide ? ' field--wide' : '') },
      h('span', { class: 'field__label' }, def.label),
      control(def, path),
      def.hint ? h('span', { class: 'field__hint' }, def.hint) : null);
  }

  /* ---------- Liste düzenleyici ---------- */
  const openItems = new WeakSet();
  const filters = {};

  function listEl(cfg) {
    const arr = get(cfg.path);
    const wrap = h('div', { class: 'list' });
    const q = (filters[cfg.path] || '').toLocaleLowerCase('tr');

    arr.forEach((item, i) => {
      const titleText = () => cfg.title(item) || 'Adsız';
      if (q && !titleText().toLocaleLowerCase('tr').includes(q)) return;
      const title = h('span', { class: 'item__title' });
      const paint = () => {
        title.textContent = titleText();
        if (cfg.sub) title.append(h('small', {}, cfg.sub(item)));
        el.classList.toggle('is-off', item.active === false);
      };
      const move = d => e => {
        e.preventDefault();
        arr.splice(i + d, 0, arr.splice(i, 1)[0]);
        dirty(); render();
      };
      const remove = e => {
        e.preventDefault();
        const extra = cfg.confirmDelete ? cfg.confirmDelete(item) : '';
        if (!confirm(`“${titleText()}” silinsin mi?${extra ? '\n\n' + extra : ''}`)) return;
        arr.splice(i, 1);
        dirty(); render();
      };
      const el = h('details', { class: 'item', open: openItems.has(item) },
        h('summary', {},
          h('span', { class: 'item__caret' }), title,
          h('span', { class: 'item__actions' },
            h('button', { class: 'btn btn--icon', type: 'button', title: 'Yukarı taşı', disabled: i === 0, onclick: move(-1) }, '↑'),
            h('button', { class: 'btn btn--icon', type: 'button', title: 'Aşağı taşı', disabled: i === arr.length - 1, onclick: move(1) }, '↓'),
            h('button', { class: 'btn btn--icon btn--danger', type: 'button', title: 'Sil', onclick: remove }, '✕'))),
        h('div', { class: 'item__body' },
          h('div', { class: 'fields', oninput: paint, onchange: paint },
            cfg.fields.map(f => field(f, `${cfg.path}.${i}.${f.key}`)))));
      el.addEventListener('toggle', () => (el.open ? openItems.add(item) : openItems.delete(item)));
      paint();
      wrap.append(el);
    });

    if (!wrap.children.length) wrap.append(h('p', { class: 'empty' }, q ? 'Aramayla eşleşen kayıt yok.' : 'Henüz kayıt yok.'));
    return wrap;
  }

  function listGroup(g) {
    const cfg = g.list;
    const add = () => {
      const item = cfg.create();
      get(cfg.path).push(item);
      openItems.add(item);
      filters[cfg.path] = '';
      dirty(); render();
      const items = document.querySelectorAll(`[data-list="${cfg.path}"] .item`);
      if (items.length) items[items.length - 1].scrollIntoView({ block: 'center', behavior: 'smooth' });
    };
    const body = h('div', {}, listEl(cfg));
    const search = cfg.search && h('input', {
      type: 'search', placeholder: 'Ara…', value: filters[cfg.path] || '',
      oninput: e => { filters[cfg.path] = e.target.value; body.replaceChildren(listEl(cfg)); }
    });
    return h('section', { class: 'group', 'data-list': cfg.path },
      h('div', { class: 'group__head' },
        h('h3', { class: 'group__title' }, `${g.title} (${get(cfg.path).length})`),
        h('div', { class: 'list__tools' }, search, h('button', { class: 'btn btn--solid', type: 'button', onclick: add }, '+ ' + cfg.addLabel))),
      g.hint ? h('p', { class: 'hint', style: 'margin-bottom:14px' }, g.hint) : null,
      body);
  }

  /* ---------- Panel şeması: sitedeki her alan burada tanımlı ---------- */
  const FONTS_DISPLAY = ['Cormorant Garamond', 'Playfair Display', 'Fraunces', 'Bodoni Moda', 'DM Serif Display'].map(f => [f, f]);
  const FONTS_BODY = ['Jost', 'Manrope', 'Inter', 'DM Sans', 'Outfit'].map(f => [f, f]);
  const TITLE_HINT = 'Bir kelimeyi *yıldız* içine alırsanız italik görünür.';
  const VIDEO_HINT = 'Doğrudan video dosyası bağlantısı (.mp4 / .webm). YouTube sayfa bağlantıları çalışmaz.';
  const catName = id => (data.categories.find(c => c.id === id) || {}).name || 'Kategorisiz';
  const money = v => (data.menu.currencyPosition === 'before' ? data.menu.currency + v : v + ' ' + data.menu.currency);

  const SECTIONS = [
    {
      id: 'products', title: 'Ürünler', desc: 'Menü kartları. Her ürün bir video bağlantısı, etiketler, alerjenler ve kalori bilgisi taşır.',
      groups: [{
        title: 'Ürünler',
        list: {
          path: 'products', addLabel: 'Ürün ekle', search: true,
          title: p => p.name, sub: p => `${catName(p.category)} · ${money(p.price)}${p.active === false ? ' · gizli' : ''}`,
          create: () => ({ id: uid('p'), active: true, category: (data.categories[0] || {}).id || '', name: 'Yeni ürün', price: 0, video: '', desc: '', ingredients: '', kcal: '', portion: '', badges: ['glutensiz'], allergens: [] }),
          fields: [
            { key: 'name', label: 'Ürün adı' },
            { key: 'category', label: 'Kategori', type: 'select', from: 'categories' },
            { key: 'price', label: 'Fiyat', type: 'number', min: 0 },
            { key: 'active', label: 'Menüde göster', type: 'toggle', onLabel: 'Görünür' },
            { key: 'video', label: 'Ürün videosu', type: 'video', hint: VIDEO_HINT },
            { key: 'desc', label: 'Açıklama', type: 'textarea', rows: 2 },
            { key: 'kcal', label: 'Kalori (kcal)', type: 'number', min: 0 },
            { key: 'portion', label: 'Porsiyon', placeholder: '1 dilim · 110 g' },
            { key: 'badges', label: 'Etiketler (kartta ilk ikisi görünür)', type: 'checks', from: 'badges' },
            { key: 'allergens', label: 'Alerjenler', type: 'checks', from: 'allergens' },
            { key: 'ingredients', label: 'İçindekiler', type: 'textarea', rows: 2 }
          ]
        }
      }]
    },
    {
      id: 'categories', title: 'Kategoriler', desc: 'Menünün üstündeki filtre sekmeleri. Sıra, menüdeki sırayı belirler.',
      groups: [{
        title: 'Kategoriler',
        list: {
          path: 'categories', addLabel: 'Kategori ekle',
          title: c => c.name, sub: c => `${data.products.filter(p => p.category === c.id).length} ürün${c.active === false ? ' · gizli' : ''}`,
          create: () => ({ id: uid('c'), name: 'Yeni kategori', active: true }),
          confirmDelete: c => {
            const n = data.products.filter(p => p.category === c.id).length;
            return n ? `Bu kategorideki ${n} ürün menüde görünmez olur; ürünlere yeni kategori atamanız gerekir.` : '';
          },
          fields: [
            { key: 'name', label: 'Kategori adı' },
            { key: 'active', label: 'Menüde göster', type: 'toggle', onLabel: 'Görünür' }
          ]
        }
      }]
    },
    {
      id: 'tags', title: 'Etiketler & Alerjenler', desc: 'Ürünlere atanabilen “Glutensiz”, “Şefin Seçimi” gibi etiketler ve alerjen listesi.',
      groups: [
        {
          title: 'Etiketler',
          list: {
            path: 'badges', addLabel: 'Etiket ekle',
            title: b => `${b.icon || ''} ${b.label}`.trim(), sub: b => (b.highlight ? 'vurgulu' : ''),
            create: () => ({ id: uid('b'), label: 'Yeni etiket', icon: '✦', highlight: false }),
            fields: [
              { key: 'label', label: 'Etiket adı' },
              { key: 'icon', label: 'Simge (tek karakter, boş olabilir)' },
              { key: 'highlight', label: 'Vurgulu göster (beyaz dolgu)', type: 'toggle', onLabel: 'Vurgulu' }
            ]
          }
        },
        {
          title: 'Alerjenler',
          list: {
            path: 'allergens', addLabel: 'Alerjen ekle',
            title: a => a.label,
            create: () => ({ id: uid('a'), label: 'Yeni alerjen' }),
            fields: [{ key: 'label', label: 'Alerjen adı', wide: true }]
          }
        }
      ]
    },
    { divider: true },
    {
      id: 'brand', title: 'Marka', desc: 'İsim, logo harfi ve tarayıcı sekmesinde görünen bilgiler.',
      groups: [{
        title: 'Kimlik',
        fields: [
          { path: 'brand.name', label: 'Marka adı' },
          { path: 'brand.mark', label: 'Logo harfi / simgesi' },
          { path: 'brand.tagline', label: 'Slogan', wide: true },
          { path: 'brand.pageTitle', label: 'Sayfa başlığı (tarayıcı sekmesi)', wide: true },
          { path: 'brand.metaDescription', label: 'Arama motoru açıklaması', type: 'textarea', rows: 2 }
        ]
      }]
    },
    {
      id: 'intro', title: 'Karşılama Videosu', desc: 'QR okutulduğunda misafiri karşılayan tam ekran video.',
      groups: [{
        title: 'Karşılama',
        fields: [
          { path: 'intro.enabled', label: 'Karşılama ekranı', type: 'toggle' },
          { path: 'intro.oncePerSession', label: 'Aynı ziyarette yalnızca bir kez göster', type: 'toggle' },
          { path: 'intro.video', label: 'Karşılama videosu', type: 'video', hint: VIDEO_HINT },
          { path: 'intro.eyebrow', label: 'Üst yazı', wide: true },
          { path: 'intro.title', label: 'Başlık', type: 'textarea', rows: 2, hint: TITLE_HINT },
          { path: 'intro.subtitle', label: 'Alt metin', type: 'textarea', rows: 2 },
          { path: 'intro.button', label: 'Düğme yazısı' },
          { path: 'intro.autoSkip', label: 'Otomatik geç (saniye, 0 = kapalı)', type: 'number', min: 0, max: 60 }
        ]
      }]
    },
    {
      id: 'theme', title: 'Tema & Zemin', desc: 'Renkler, yazı tipleri, zemin videosu ve kart hareketleri.',
      groups: [
        {
          title: 'Zemin videosu',
          fields: [
            { path: 'background.video', label: 'Zeminde dönen video', type: 'video', hint: VIDEO_HINT },
            { path: 'background.overlay', label: 'Karartma', type: 'range', min: 0, max: 95, unit: '%' },
            { path: 'background.saturation', label: 'Renk doygunluğu (0 = siyah-beyaz)', type: 'range', min: 0, max: 100, unit: '%' },
            { path: 'background.playbackRate', label: 'Oynatma hızı', type: 'range', min: 0.3, max: 1.5, step: 0.1, unit: 'x' }
          ]
        },
        {
          title: 'Renkler',
          fields: [
            { path: 'theme.bg', label: 'Zemin rengi', type: 'color' },
            { path: 'theme.surface', label: 'Yüzey rengi', type: 'color' },
            { path: 'theme.text', label: 'Yazı rengi', type: 'color' },
            { path: 'theme.muted', label: 'İkincil yazı rengi', type: 'color' },
            { path: 'theme.accent', label: 'Vurgu rengi (düğmeler, seçili sekme)', type: 'color' }
          ]
        },
        {
          title: 'Yazı tipi ve kartlar',
          fields: [
            { path: 'theme.fontDisplay', label: 'Başlık yazı tipi', type: 'select', options: FONTS_DISPLAY },
            { path: 'theme.fontBody', label: 'Metin yazı tipi', type: 'select', options: FONTS_BODY },
            { path: 'theme.radius', label: 'Kart köşe yuvarlaklığı', type: 'range', min: 0, max: 40, unit: 'px' },
            { path: 'theme.float', label: 'Kartların süzülme miktarı', type: 'range', min: 0, max: 24, unit: 'px' },
            { path: 'theme.cardSaturation', label: 'Ürün videosu renk doygunluğu', type: 'range', min: 0, max: 120, unit: '%' },
            { path: 'theme.motion', label: 'Animasyonlar', type: 'toggle' }
          ]
        }
      ]
    },
    {
      id: 'menuText', title: 'Menü Metinleri', desc: 'Menü ekranının başlığı, para birimi ve notları.',
      groups: [
        {
          title: 'Menü başlığı',
          fields: [
            { path: 'hero.eyebrow', label: 'Üst yazı' },
            { path: 'hero.title', label: 'Başlık', type: 'textarea', rows: 2, hint: TITLE_HINT },
            { path: 'hero.text', label: 'Alt metin', type: 'textarea', rows: 2 }
          ]
        },
        {
          title: 'Menü ayarları',
          fields: [
            { path: 'menu.allLabel', label: '“Tümü” sekmesinin adı' },
            { path: 'menu.currency', label: 'Para birimi simgesi' },
            { path: 'menu.currencyPosition', label: 'Simge konumu', type: 'select', options: [['after', 'Fiyattan sonra (95 ₺)'], ['before', 'Fiyattan önce (₺95)']] },
            { path: 'menu.note', label: 'Menü altı notu', wide: true },
            { path: 'menu.empty', label: 'Boş kategori mesajı', wide: true }
          ]
        },
        {
          title: 'Ürün detayı ve gezinme yazıları',
          fields: [
            { path: 'labels.navMenu', label: 'Gezinme: Menü' },
            { path: 'labels.navAbout', label: 'Gezinme: Hakkımızda' },
            { path: 'labels.navPromise', label: 'Gezinme: Glutensiz' },
            { path: 'labels.navVisit', label: 'Gezinme: İletişim' },
            { path: 'labels.skip', label: 'Karşılama: “Geç”' },
            { path: 'labels.close', label: 'Detay: “Kapat”' },
            { path: 'labels.calories', label: 'Detay: Kalori başlığı' },
            { path: 'labels.caloriesUnit', label: 'Kalori birimi' },
            { path: 'labels.portion', label: 'Detay: Porsiyon başlığı' },
            { path: 'labels.allergens', label: 'Detay: Alerjen başlığı' },
            { path: 'labels.ingredients', label: 'Detay: İçindekiler başlığı' },
            { path: 'labels.noAllergens', label: 'Alerjen yoksa gösterilen metin' },
            { path: 'labels.disclaimer', label: 'Alerjen uyarısı', type: 'textarea', rows: 2 }
          ]
        }
      ]
    },
    { divider: true },
    {
      id: 'about', title: 'Hakkımızda', desc: 'Kurumsal sitenin hikâye bölümü.',
      groups: [
        {
          title: 'Hikâye',
          fields: [
            { path: 'about.enabled', label: 'Bölümü göster', type: 'toggle' },
            { path: 'about.eyebrow', label: 'Üst yazı' },
            { path: 'about.title', label: 'Başlık', type: 'textarea', rows: 2, hint: TITLE_HINT },
            { path: 'about.text', label: 'Metin', type: 'textarea', rows: 6 },
            { path: 'about.video', label: 'Bölüm videosu', type: 'video', hint: VIDEO_HINT }
          ]
        },
        {
          title: 'Rakamlar',
          list: {
            path: 'about.stats', addLabel: 'Rakam ekle', title: s => `${s.value} — ${s.label}`,
            create: () => ({ value: '0', label: 'Açıklama' }),
            fields: [{ key: 'value', label: 'Değer' }, { key: 'label', label: 'Açıklama' }]
          }
        }
      ]
    },
    {
      id: 'promise', title: 'Glutensiz Sözümüz', desc: 'Glutensiz mutfak taahhüdünü anlatan bölüm.',
      groups: [
        {
          title: 'Bölüm',
          fields: [
            { path: 'promise.enabled', label: 'Bölümü göster', type: 'toggle' },
            { path: 'promise.eyebrow', label: 'Üst yazı' },
            { path: 'promise.title', label: 'Başlık', type: 'textarea', rows: 2, hint: TITLE_HINT },
            { path: 'promise.text', label: 'Metin', type: 'textarea', rows: 3 }
          ]
        },
        {
          title: 'Maddeler',
          list: {
            path: 'promise.items', addLabel: 'Madde ekle', title: i => i.title,
            create: () => ({ title: 'Yeni madde', text: '' }),
            fields: [{ key: 'title', label: 'Başlık', wide: true }, { key: 'text', label: 'Metin', type: 'textarea', rows: 2 }]
          }
        }
      ]
    },
    {
      id: 'visit', title: 'İletişim & Saatler', desc: 'Adres, telefon, çalışma saatleri, sosyal medya ve alt bilgi.',
      groups: [
        {
          title: 'İletişim',
          fields: [
            { path: 'visit.enabled', label: 'Bölümü göster', type: 'toggle' },
            { path: 'visit.eyebrow', label: 'Üst yazı' },
            { path: 'visit.title', label: 'Başlık', type: 'textarea', rows: 2, hint: TITLE_HINT },
            { path: 'visit.address', label: 'Adres', type: 'textarea', rows: 2 },
            { path: 'visit.phone', label: 'Telefon' },
            { path: 'visit.email', label: 'E-posta' },
            { path: 'visit.mapUrl', label: 'Harita bağlantısı' },
            { path: 'visit.mapLabel', label: 'Harita düğmesi yazısı' },
            { path: 'visit.hoursTitle', label: 'Saatler başlığı' }
          ]
        },
        {
          title: 'Çalışma saatleri',
          list: {
            path: 'visit.hours', addLabel: 'Satır ekle', title: x => `${x.day} · ${x.time}`,
            create: () => ({ day: 'Gün', time: '09:00 – 21:00' }),
            fields: [{ key: 'day', label: 'Gün' }, { key: 'time', label: 'Saat' }]
          }
        },
        {
          title: 'Sosyal medya',
          list: {
            path: 'social', addLabel: 'Bağlantı ekle', title: x => x.label, sub: x => x.url,
            create: () => ({ label: 'Instagram', url: 'https://' }),
            fields: [{ key: 'label', label: 'Ad' }, { key: 'url', label: 'Bağlantı' }]
          }
        },
        {
          title: 'Alt bilgi',
          fields: [
            { path: 'footer.text', label: 'Telif yazısı', wide: true },
            { path: 'footer.note', label: 'Ek not', wide: true }
          ]
        }
      ]
    },
    { divider: true },
    { id: 'publish', title: 'Yayın & Yedek', desc: 'Değişiklikleri yayınlayın, QR kodu oluşturun, yedek alın ve şifreyi değiştirin.', custom: publishSection }
  ];

  /* ---------- Yayın, QR, yedek, şifre ---------- */
  function publishSection() {
    const frag = document.createDocumentFragment();

    frag.append(h('section', { class: 'group' },
      h('div', { class: 'group__head' }, h('h3', { class: 'group__title' }, 'Değişiklikleri yayınla')),
      h('ol', { class: 'steps' },
        h('li', {}, 'Yaptığınız değişiklikler önce ', h('b', {}, 'bu tarayıcıya taslak'), ' olarak kaydedilir; “Siteyi aç” ile yalnızca siz önizlersiniz.'),
        h('li', {}, 'Sağ üstteki ', h('b', {}, 'Yayınla'), ' düğmesi içeriği Firebase’e gönderir; misafirler menüyü bir sonraki açışlarında yeni hâlini görür.'),
        h('li', {}, 'Başka bir cihazdan giriş yaptığınızda en son yayınlanan içerik yüklenir.')),
      h('div', { class: 'actions' },
        h('button', { class: 'btn btn--solid', type: 'button', onclick: publishNow }, 'Şimdi yayınla'))));

    // QR kod
    let qrUrl = '';
    try { qrUrl = localStorage.getItem('kahveqr:qrurl') || ''; } catch (e) {}
    if (!qrUrl && /^https?:/.test(location.protocol)) qrUrl = location.href.replace(/admin\.html.*$/, '');
    const qrBox = h('div', { class: 'qr__box' });
    const qrMsg = h('p', { class: 'msg' });
    const qrInput = h('input', { type: 'url', value: qrUrl, placeholder: 'https://siteniz.com/' });
    const makeQr = () => {
      const url = qrInput.value.trim();
      qrMsg.className = 'msg';
      qrBox.replaceChildren();
      if (!url) { qrMsg.textContent = 'Önce menünüzün yayınlandığı adresi yazın.'; qrMsg.classList.add('is-bad'); return; }
      if (!window.QRCode) { qrMsg.textContent = 'QR kütüphanesi yüklenemedi; internet bağlantınızı kontrol edin.'; qrMsg.classList.add('is-bad'); return; }
      try { localStorage.setItem('kahveqr:qrurl', url); } catch (e) {}
      new QRCode(qrBox, { text: url, width: 800, height: 800, colorDark: '#000000', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
      qrMsg.textContent = 'QR kod hazır. Bastırmadan önce telefonunuzla okutup deneyin.';
    };
    const saveQr = () => {
      const canvas = qrBox.querySelector('canvas');
      if (!canvas) return makeQr();
      const a = h('a', { href: canvas.toDataURL('image/png'), download: 'qr-menu.png' });
      a.click();
    };
    frag.append(h('section', { class: 'group' },
      h('div', { class: 'group__head' }, h('h3', { class: 'group__title' }, 'QR kod')),
      h('label', { class: 'field' }, h('span', { class: 'field__label' }, 'Menünün yayın adresi'), qrInput),
      h('div', { class: 'qr' }, qrBox,
        h('div', { style: 'display:grid;gap:12px' },
          h('div', { class: 'actions' },
            h('button', { class: 'btn btn--solid', type: 'button', onclick: makeQr }, 'QR oluştur'),
            h('button', { class: 'btn', type: 'button', onclick: saveQr }, 'PNG indir')),
          qrMsg))));

    // Yedek
    const fileInput = h('input', {
      type: 'file', accept: '.json,.js,application/json', hidden: true, onchange: e => {
        const file = e.target.files[0];
        if (!file) return;
        file.text().then(text => {
          const json = text.replace(/^[\s\S]*?window\.SITE_DATA\s*=\s*/, '').replace(/;\s*$/, '');
          const parsed = JSON.parse(json);
          if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.products)) throw new Error();
          data = Store.merge(Store.defaults(), parsed);
          saveNow(); render();
          backupMsg.className = 'msg'; backupMsg.textContent = 'Yedek yüklendi.';
        }).catch(() => { backupMsg.className = 'msg is-bad'; backupMsg.textContent = 'Dosya okunamadı; geçerli bir yedek ya da site-data.js dosyası seçin.'; });
        e.target.value = '';
      }
    });
    const backupMsg = h('p', { class: 'msg' });
    frag.append(h('section', { class: 'group' },
      h('div', { class: 'group__head' }, h('h3', { class: 'group__title' }, 'Yedek')),
      h('div', { class: 'actions' },
        h('button', { class: 'btn', type: 'button', onclick: () => { saveNow(); download('qr-menu-yedek.json', JSON.stringify(data, null, 2), 'application/json'); } }, 'Yedek indir'),
        h('button', { class: 'btn', type: 'button', onclick: () => fileInput.click() }, 'Yedekten yükle'),
        h('button', {
          class: 'btn btn--danger', type: 'button', onclick: async () => {
            if (!confirm('Yayınlanmamış taslak değişiklikler silinip en son yayınlanan içeriğe dönülsün mü?')) return;
            clearTimeout(saveTimer);
            savePending = false;
            try {
              const remote = await Cloud.fetchContent();
              Store.reset();
              publishedAt = remote ? remote.updatedAt : 0;
              data = Store.load(remote);
              render(); paintStatus();
              backupMsg.className = 'msg'; backupMsg.textContent = 'Taslak silindi, yayındaki içerik yüklendi.';
            } catch (e) {
              backupMsg.className = 'msg is-bad'; backupMsg.textContent = explain(e);
            }
          }
        }, 'Taslağı sil'),
        fileInput),
      backupMsg));

    // Şifre
    const p1 = h('input', { type: 'password', autocomplete: 'new-password' });
    const p2 = h('input', { type: 'password', autocomplete: 'new-password' });
    const passMsg = h('p', { class: 'msg' });
    frag.append(h('section', { class: 'group' },
      h('div', { class: 'group__head' }, h('h3', { class: 'group__title' }, 'Panel şifresi')),
      h('div', { class: 'fields' },
        h('label', { class: 'field' }, h('span', { class: 'field__label' }, 'Yeni şifre'), p1),
        h('label', { class: 'field' }, h('span', { class: 'field__label' }, 'Yeni şifre (tekrar)'), p2)),
      h('div', { class: 'actions', style: 'margin:16px 0 14px' },
        h('button', {
          class: 'btn btn--solid', type: 'button', onclick: async () => {
            passMsg.className = 'msg is-bad';
            if (p1.value.length < 8) { passMsg.textContent = 'Şifre en az 8 karakter olmalı.'; return; }
            if (p1.value !== p2.value) { passMsg.textContent = 'Şifreler eşleşmiyor.'; return; }
            try {
              await Cloud.changePassword(p1.value);
              p1.value = p2.value = '';
              passMsg.className = 'msg'; passMsg.textContent = 'Şifre güncellendi.';
            } catch (e) {
              passMsg.textContent = explain(e);
            }
          }
        }, 'Şifreyi değiştir')),
      passMsg,
      h('p', { class: 'note' }, 'Giriş: ' + Cloud.user.email + '. Hesap Firebase Authentication’da tutulur; içeriği yalnızca ilk kurulumda tanımlanan bu yönetici hesabı değiştirebilir.')));

    return frag;
  }

  /* ---------- Çizim ---------- */
  let current = SECTIONS[0].id;

  function renderNav() {
    $('#sideNav').replaceChildren(...SECTIONS.map(s => s.divider ? h('hr') :
      h('button', { type: 'button', 'aria-current': s.id === current ? 'true' : null, onclick: () => { current = s.id; renderNav(); render(); scrollTo(0, 0); } }, s.title)));
  }

  function render() {
    const sec = SECTIONS.find(s => s.id === current);
    $('#sectionTitle').textContent = sec.title;
    $('#sectionDesc').textContent = sec.desc;
    const content = $('#content');
    if (sec.custom) return content.replaceChildren(sec.custom());
    content.replaceChildren(...sec.groups.map(g => g.list ? listGroup(g) :
      h('section', { class: 'group' },
        h('div', { class: 'group__head' }, h('h3', { class: 'group__title' }, g.title)),
        h('div', { class: 'fields' }, g.fields.map(f => field(f, f.path))))));
  }

  /* ---------- Giriş (Firebase Authentication) ---------- */
  const ERRORS = {
    INVALID_LOGIN_CREDENTIALS: 'E-posta veya şifre hatalı.',
    INVALID_PASSWORD: 'E-posta veya şifre hatalı.',
    EMAIL_NOT_FOUND: 'E-posta veya şifre hatalı.',
    INVALID_EMAIL: 'Geçerli bir e-posta adresi yazın.',
    MISSING_EMAIL: 'E-posta adresinizi yazın.',
    MISSING_PASSWORD: 'Şifrenizi yazın.',
    WEAK_PASSWORD: 'Şifre çok zayıf; en az 8 karakter kullanın.',
    TOO_MANY_ATTEMPTS_TRY_LATER: 'Çok fazla deneme yapıldı. Biraz bekleyip yeniden deneyin.',
    USER_DISABLED: 'Bu hesap devre dışı bırakılmış.',
    CREDENTIAL_TOO_OLD_LOGIN_AGAIN: 'Güvenlik için çıkış yapıp yeniden giriş yapın, sonra tekrar deneyin.',
    TOKEN_EXPIRED: 'Oturum süresi doldu; çıkış yapıp yeniden giriş yapın.',
    NO_SESSION: 'Oturum bulunamadı; yeniden giriş yapın.',
    NOT_OWNER: 'Bu hesap yönetici değil. Paneli yalnızca ilk kurulumda tanımlanan hesap kullanabilir.',
    SHORT_PASSWORD: 'Şifre en az 8 karakter olmalı.'
  };
  function explain(e) {
    if (e instanceof TypeError) return 'Firebase’e bağlanılamadı. İnternet bağlantınızı kontrol edin.';
    if (e.status === 403) return 'Bu işlem için yetkiniz yok.';
    const code = String(e.message || '').split(/[ :]/)[0];
    return ERRORS[code] || 'Beklenmeyen hata: ' + e.message;
  }

  const loginMsg = (text, ok) => {
    const m = $('#loginMsg');
    m.hidden = !text;
    m.textContent = text || '';
    m.className = 'msg' + (ok ? '' : ' is-bad');
  };

  // Giriş yapılınca: yayındaki içerik çekilir, bu tarayıcıdaki taslak daha yeniyse o açılır.
  async function start() {
    const remote = await Cloud.fetchContent();
    publishedAt = remote ? remote.updatedAt : 0;
    data = Store.load(remote);
    $('#login').hidden = true;
    $('#app').hidden = false;
    $('#sideMark').textContent = data.brand.mark;
    $('#sideName').textContent = data.brand.name;
    renderNav();
    render();
    paintStatus();
  }

  // Henüz yönetici tanımlı değilse giriş ekranı ilk kurulum ekranına dönüşür.
  async function prepareLogin() {
    try {
      if (await Cloud.ownerUid()) return;
      $('#loginTitle').textContent = 'İlk kurulum.';
      $('#loginHint').hidden = false;
      $('#loginHint').textContent = 'Yönetici e-postanızı ve en az 8 karakterlik bir şifre belirleyin. Bu hesap panelin tek yöneticisi olarak kaydedilir.';
      $('#loginBtn').textContent = 'Yönetici hesabını oluştur';
      $('#loginPass').autocomplete = 'new-password';
      $('#forgot').hidden = true;
    } catch (e) {
      loginMsg(explain(e));
    }
  }

  $('#login').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('#loginEmail').value.trim(), pass = $('#loginPass').value;
    const btn = $('#loginBtn');
    btn.disabled = true;
    loginMsg('');
    try {
      const owner = await Cloud.ownerUid();
      if (!owner) {
        if (pass.length < 8) throw new Error('SHORT_PASSWORD');
        try { await Cloud.signUp(email, pass); }
        catch (err) { if (/^EMAIL_EXISTS/.test(err.message)) await Cloud.signIn(email, pass); else throw err; }
        await Cloud.claimOwner();
      } else {
        await Cloud.signIn(email, pass);
        if (Cloud.user.uid !== owner) { Cloud.signOut(); throw new Error('NOT_OWNER'); }
      }
      await start();
    } catch (err) {
      loginMsg(explain(err));
    }
    btn.disabled = false;
  });

  $('#forgot').addEventListener('click', async () => {
    const email = $('#loginEmail').value.trim();
    if (!email) return loginMsg('Önce e-posta adresinizi yazın.');
    try {
      await Cloud.sendReset(email);
      loginMsg('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.', true);
    } catch (err) {
      loginMsg(explain(err));
    }
  });

  $('#publish').addEventListener('click', publishNow);
  $('#logout').addEventListener('click', () => { if (savePending) saveNow(); Cloud.signOut(); location.reload(); });
  addEventListener('beforeunload', () => { if (savePending) saveNow(); });

  // Açık oturum varsa ve hâlâ yöneticiyse doğrudan panele geç.
  (async () => {
    if (Cloud.user) {
      try {
        if (await Cloud.ownerUid() === Cloud.user.uid) return await start();
      } catch (e) {}
      Cloud.signOut();
    }
    prepareLogin();
  })();
})();
