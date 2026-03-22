/* app.php — Utilidades compartidas */

const API = 'api.php?route=';

window.api = {
  async get(route, params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = API + route + (qs ? '&' + qs : '');
    const r = await fetch(url);
    return r.json();
  },
  async post(route, body) {
    const r = await fetch(API + route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return r.json();
  },
  async del(route) {
    const r = await fetch(API + route, { method: 'DELETE' });
    return r.json();
  },
};

// Toast
(function () {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:999;display:flex;flex-direction:column;gap:.5rem;align-items:flex-end';
  document.body.appendChild(wrap);

  window.toast = function (msg, type = 'info', ms = 3000) {
    const el = document.createElement('div');
    const colors = { ok: '#34d399', err: '#f87171', info: '#00e5ff' };
    el.style.cssText = `background:var(--card);border:1px solid ${colors[type]||colors.info};border-radius:10px;padding:.65rem 1rem;font-size:.8rem;box-shadow:0 4px 20px rgba(0,0,0,.5);animation:fadeIn .3s ease;max-width:300px`;
    el.textContent = (type==='ok'?'✅':type==='err'?'❌':'ℹ️') + '  ' + msg;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), ms);
  };
})();

window.setStat = function (id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
};

// Verificar servidor
(async function () {
  const dot   = document.getElementById('serverDot');
  const label = document.getElementById('serverLabel');
  try {
    const d = await api.get('ping');
    if (d.ok) { dot.className = 'dot ok'; label.textContent = 'PHP · Online'; }
    else throw new Error();
  } catch {
    dot.className = 'dot error'; label.textContent = 'Sin conexión';
  }
})();

// Animación entrada
document.querySelectorAll('.card').forEach((c, i) => {
  c.style.cssText += 'opacity:0;transform:translateY(18px);transition:opacity .4s ease,transform .4s ease';
  setTimeout(() => { c.style.opacity='1'; c.style.transform='translateY(0)'; }, i * 80);
});