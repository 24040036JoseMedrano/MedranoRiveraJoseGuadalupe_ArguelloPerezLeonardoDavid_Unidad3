
(function () {
  const dot   = document.getElementById('dbStatus');
  const ROLES = { admin:'#f87171', editor:'#a78bfa', viewer:'#00e5ff', user:'#34d399' };

  function log(msg, type = 'ok') {
    const el = document.getElementById('dbLog');
    const s  = document.createElement('div');
    s.style.cssText = 'animation:fadeIn .2s ease';
    s.innerHTML = `<span style="color:var(--text3)">[${new Date().toLocaleTimeString('es-MX')}]</span> <span style="color:${type==='ok'?'var(--c4)':type==='err'?'var(--c3)':'var(--c1)'}">${msg}</span>`;
    el.prepend(s);
    while (el.children.length > 6) el.lastChild.remove();
  }

  function fmt(ts) {
    const d = ts && ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-MX', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
  }

  const db = firebase.firestore();

  async function load() {
    dot.className = 'sdot loading';
    try {
      const snap = await db.collection('users').orderBy('createdAt', 'desc').limit(50).get();
      const body  = document.getElementById('dbBody');
      const empty = document.getElementById('dbEmpty');
      body.innerHTML = '';

      if (snap.empty) {
        empty.style.display = 'block';
        setStat('hs-db', 0);
        dot.className = 'sdot active';
        return;
      }

      empty.style.display = 'none';
      snap.forEach(doc => {
        const u  = { _id: doc.id, ...doc.data() };
        const tr = document.createElement('tr');
        const c  = ROLES[u.role] || '#34d399';
        tr.innerHTML = `
          <td style="font-family:var(--font-mono);font-size:.6rem;color:var(--text3)">${u._id.slice(0,8)}</td>
          <td style="font-weight:600">${u.username}</td>
          <td style="color:var(--text2)">${u.email}</td>
          <td><span style="background:${c}22;color:${c};border:1px solid ${c}44;border-radius:4px;padding:.1rem .4rem;font-size:.65rem;font-family:var(--font-mono)">${u.role}</span></td>
          <td style="font-size:.72rem;color:var(--text2)">${fmt(u.createdAt)}</td>
          <td><button onclick="delUser('${u._id}')" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:.8rem" title="Eliminar">🗑</button></td>`;
        body.appendChild(tr);
      });

      setStat('hs-db', snap.size);
      dot.className = 'sdot active';
    } catch (e) {
      console.error('Firestore error:', e);
      dot.className = 'sdot error';
      log('Firebase: ' + e.message, 'err');
      toast('Error al conectar con Firebase', 'err');
    }
  }

  window.delUser = async function (id) {
    try {
      await db.collection('users').doc(id).delete();
      log('DELETE → ' + id.slice(0,8), 'info');
      toast('Usuario eliminado', 'info');
      load();
    } catch (e) {
      log('ERROR: ' + e.message, 'err');
      toast(e.message, 'err');
    }
  };

  document.getElementById('dbForm').onsubmit = async (e) => {
    e.preventDefault();
    const username = document.getElementById('dbUser').value.trim();
    const email    = document.getElementById('dbEmail').value.trim();
    const role     = document.getElementById('dbRole').value;

    if (!username || !email) return toast('Completa todos los campos', 'err');

    const btn = document.getElementById('dbSubmit');
    btn.disabled  = true;
    btn.textContent = 'Guardando…';
    dot.className = 'sdot loading';

    try {
      const dup = await db.collection('users').where('email', '==', email).get();
      if (!dup.empty) {
        toast('Email ya registrado', 'err');
        log('ERROR: Email duplicado → ' + email, 'err');
        dot.className = 'sdot error';
        btn.disabled = false; btn.textContent = '＋ Registrar';
        return;
      }

      const ref = await db.collection('users').add({
        username,
        email,
        role,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      log('INSERT → ' + ref.id.slice(0,8) + ' (' + username + ')', 'ok');
      toast('✅ Usuario "' + username + '" registrado', 'ok');
      document.getElementById('dbUser').value  = '';
      document.getElementById('dbEmail').value = '';
      load();
    } catch (e) {
      log('ERROR: ' + e.message, 'err');
      toast(e.message, 'err');
      dot.className = 'sdot error';
    }

    btn.disabled = false; btn.textContent = '＋ Registrar';
  };

  load();
})();
