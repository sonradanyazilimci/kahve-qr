/* Firebase bağlantısı (REST): içerik Firestore'da site/content belgesinde durur,
   yönetici girişi Firebase Authentication ile yapılır. */
window.Cloud = (function () {
  'use strict';
  const C = window.FIREBASE_CONFIG;
  const DOCS = `https://firestore.googleapis.com/v1/projects/${C.projectId}/databases/(default)/documents`;
  const AUTH = 'https://identitytoolkit.googleapis.com/v1/accounts:';
  const TOKEN = 'https://securetoken.googleapis.com/v1/token';
  const SESSION = 'kahveqr:auth';
  const CACHE = 'kahveqr:cache';

  async function call(url, opts) {
    const res = await fetch(url, opts);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error((body.error && body.error.message) || 'HTTP ' + res.status);
      err.status = res.status;
      throw err;
    }
    return body;
  }
  const post = (url, data, token) => call(url, {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}),
    body: JSON.stringify(data)
  });
  const orNull = promise => promise.catch(e => { if (e.status === 404) return null; throw e; });

  /* ---------- Herkese açık okuma ---------- */
  const fetchContent = () => orNull(call(`${DOCS}/site/content?key=${C.apiKey}`)
    .then(doc => JSON.parse(doc.fields.json.stringValue)));

  const ownerUid = () => orNull(call(`${DOCS}/meta/owner?key=${C.apiKey}`)
    .then(doc => doc.fields.uid.stringValue));

  // Menü sayfası: önce Firestore, yavaşsa bu telefondaki son kopya, o da yoksa varsayılan içerik.
  async function loadForSite() {
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem(CACHE)); } catch (e) {}
    const fresh = fetchContent().then(d => {
      try { d ? localStorage.setItem(CACHE, JSON.stringify(d)) : localStorage.removeItem(CACHE); } catch (e) {}
      return d;
    }).catch(() => undefined);
    const timeout = new Promise(r => setTimeout(r, cached ? 1500 : 4500));
    const got = await Promise.race([fresh, timeout]);
    const remote = got === undefined ? cached : got;
    return { data: Store.load(remote), shown: remote ? remote.updatedAt : 0, late: got === undefined ? fresh : null };
  }

  /* ---------- Yönetici oturumu ---------- */
  let session = null;
  try { session = JSON.parse(sessionStorage.getItem(SESSION)); } catch (e) {}

  function setSession(s) {
    session = s;
    try { s ? sessionStorage.setItem(SESSION, JSON.stringify(s)) : sessionStorage.removeItem(SESSION); } catch (e) {}
  }
  const fromAuth = r => setSession({
    uid: r.localId, email: r.email, idToken: r.idToken, refreshToken: r.refreshToken,
    exp: Date.now() + Number(r.expiresIn) * 1000
  });

  const signIn = (email, password) =>
    post(`${AUTH}signInWithPassword?key=${C.apiKey}`, { email, password, returnSecureToken: true }).then(fromAuth);
  const signUp = (email, password) =>
    post(`${AUTH}signUp?key=${C.apiKey}`, { email, password, returnSecureToken: true }).then(fromAuth);
  const sendReset = email =>
    post(`${AUTH}sendOobCode?key=${C.apiKey}`, { requestType: 'PASSWORD_RESET', email });

  async function token() {
    if (!session) throw new Error('NO_SESSION');
    if (Date.now() > session.exp - 60000) {
      const r = await call(`${TOKEN}?key=${C.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(session.refreshToken)
      });
      setSession(Object.assign({}, session, { idToken: r.id_token, refreshToken: r.refresh_token, exp: Date.now() + Number(r.expires_in) * 1000 }));
    }
    return session.idToken;
  }

  async function changePassword(password) {
    const r = await post(`${AUTH}update?key=${C.apiKey}`, { idToken: await token(), password, returnSecureToken: true });
    setSession(Object.assign({}, session, { idToken: r.idToken, refreshToken: r.refreshToken, exp: Date.now() + Number(r.expiresIn) * 1000 }));
  }

  /* ---------- Yönetici yazma işlemleri ---------- */
  // İlk kurulum: giriş yapan hesabı kalıcı yönetici olarak kaydeder.
  const claimOwner = async () =>
    post(`${DOCS}/meta?documentId=owner`, { fields: { uid: { stringValue: session.uid } } }, await token());

  const publish = async data => call(`${DOCS}/site/content`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await token() },
    body: JSON.stringify({ fields: { json: { stringValue: JSON.stringify(data) }, updatedAt: { integerValue: String(data.updatedAt) } } })
  });

  return {
    fetchContent, ownerUid, loadForSite,
    signIn, signUp, sendReset, changePassword, claimOwner, publish,
    signOut: () => setSession(null),
    get user() { return session && { uid: session.uid, email: session.email }; }
  };
})();
