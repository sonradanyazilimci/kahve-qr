/* İçerik deposu: varsayılanlar + Firebase'de yayınlanan içerik + bu tarayıcıdaki admin taslağı. */
window.Store = (function () {
  'use strict';
  const KEY = 'kahveqr:data';

  const clone = o => JSON.parse(JSON.stringify(o));

  // Nesneler derin birleştirilir, diziler olduğu gibi değiştirilir.
  function merge(base, over) {
    if (over === undefined) return base;
    if (Array.isArray(over)) return clone(over);
    if (over && typeof over === 'object') {
      const out = base && typeof base === 'object' && !Array.isArray(base) ? base : {};
      for (const k in over) out[k] = merge(out[k], over[k]);
      return out;
    }
    return over;
  }

  function readLocal() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  // published: Firestore'dan gelen yayınlanmış içerik (yoksa null).
  function load(published) {
    published = published || null;
    const local = readLocal();
    // Hangisi daha yeniyse o geçerli olur.
    let chosen = local || published;
    if (local && published && (published.updatedAt || 0) > (local.updatedAt || 0)) chosen = published;
    return merge(clone(window.DEFAULT_DATA), chosen || {});
  }

  function save(data) {
    data.updatedAt = Date.now();
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function reset() {
    localStorage.removeItem(KEY);
  }

  return { KEY, load, save, reset, clone, merge, defaults: () => clone(window.DEFAULT_DATA) };
})();
