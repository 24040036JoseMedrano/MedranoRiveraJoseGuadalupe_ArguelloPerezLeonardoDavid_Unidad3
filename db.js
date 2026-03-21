/* db.php — Base de Datos */
(function () {
  const dot = document.getElementById('dbStatus');
  const ROLES = {admin:'#f87171',editor:'#a78bfa',viewer:'#00e5ff',user:'#34d399'};

  function log(msg, type='ok') {
    const el=document.getElementById('dbLog');
    const s=document.createElement('div');
    s.style.cssText='animation:fadeIn .2s ease';
    s.innerHTML=`<span style="color:var(--text3)">[${new Date().toLocaleTimeString('es-MX')}]</span> <span style="color:${type==='ok'?'var(--c4)':type==='err'?'var(--c3)':'var(--c1)'}">${msg}</span>`;
    el.prepend(s);
    while(el.children.length>6) el.lastChild.remove();
  }

  function fmt(iso) { return new Date(iso).toLocaleDateString('es-MX',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}); }

  async function load() {
    dot.className='sdot loading';
    const d = await api.get('db/users');
    if (!d.ok) { dot.className='sdot error'; return; }
    const body=document.getElementById('dbBody');
    const empty=document.getElementById('dbEmpty');
    body.innerHTML='';
    if (!d.users.length) { empty.style.display='block'; dot.className='sdot active'; setStat('hs-db',0); return; }
    empty.style.display='none';
    d.users.forEach(u => {
      const tr=document.createElement('tr');
      tr.innerHTML=`
        <td style="font-family:var(--font-mono);font-size:.6rem;color:var(--text3)">${u._id}</td>
        <td style="font-weight:600">${u.username}</td>
        <td style="color:var(--text2)">${u.email}</td>
        <td><span style="background:${ROLES[u.role]||'#34d399'}22;color:${ROLES[u.role]||'#34d399'};border:1px solid ${ROLES[u.role]||'#34d399'}44;border-radius:4px;padding:.1rem .4rem;font-size:.65rem;font-family:var(--font-mono)">${u.role}</span></td>
        <td style="font-size:.72rem;color:var(--text2)">${fmt(u.createdAt)}</td>
        <td><button onclick="delUser('${u._id}')" style="background:none;border:none;cursor:pointer;color:var(--text3);font-size:.8rem" title="Eliminar">🗑</button></td>`;
      body.appendChild(tr);
    });
    setStat('hs-db', d.total);
    dot.className='sdot active';
  }

  window.delUser = async function(id) {
    const d = await api.del('db/users/'+id);
    if (d.ok) { log('DELETE → '+id,'info'); toast('Usuario eliminado','info'); load(); }
    else { log('ERROR: '+d.error,'err'); toast(d.error,'err'); }
  };

  document.getElementById('dbForm').onsubmit = async () => {
    const username=document.getElementById('dbUser').value.trim();
    const email=document.getElementById('dbEmail').value.trim();
    const role=document.getElementById('dbRole').value;
    if (!username||!email) return toast('Completa todos los campos','err');
    const btn=document.getElementById('dbSubmit');
    btn.disabled=true; btn.textContent='Guardando…';
    dot.className='sdot loading';
    const d = await api.post('db/users',{username,email,role});
    if (d.ok) { log('INSERT → '+d.user._id+' ('+username+')','ok'); toast('✅ Usuario "'+username+'" registrado','ok'); document.getElementById('dbUser').value=''; document.getElementById('dbEmail').value=''; load(); }
    else { log('ERROR: '+d.error,'err'); toast(d.error,'err'); dot.className='sdot error'; }
    btn.disabled=false; btn.textContent='＋ Registrar';
  };

  load();
})();