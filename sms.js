
(function () {
  const dot = document.getElementById('smsStatus');
  let ch = 'SMS', sent = 0;
  const CH_COLORS = {SMS:'var(--c1)',WhatsApp:'var(--c4)',Email:'var(--c2)',Push:'var(--c5)'};

  document.querySelectorAll('.ch-btn').forEach(b => {
    b.onclick = () => {
      document.querySelectorAll('.ch-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active'); ch=b.dataset.ch;
      const inp=document.getElementById('smsTo');
      inp.placeholder=ch==='Email'?'correo@ejemplo.com':ch==='Push'?'Token del dispositivo':'+52 555 000 0000';
    };
  });

  const msg=document.getElementById('smsMsg');
  msg.oninput=()=>{ document.getElementById('smsCount').textContent=msg.value.length+'/'+(ch==='SMS'?160:4096); };

  async function loadHistory() {
    const d = await api.get('sms/history');
    if (!d.ok) return;
    const list=document.getElementById('smsList'); list.innerHTML='';
    d.messages.forEach(m=>addBubble(m,false));
  }

  function addBubble(m, pre=true) {
    const list=document.getElementById('smsList');
    const div=document.createElement('div');
    div.className='sms-bubble';
    const ts=new Date(m.createdAt).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'});
    div.innerHTML=`
      <span class="sms-ch" style="color:${CH_COLORS[m.channel]||'var(--c1)'}">${m.channel}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:.78rem;font-weight:600">→ ${m.to}</div>
        <div style="font-size:.73rem;color:var(--text2)">${m.message}</div>
        <div style="font-size:.62rem;color:var(--text3);font-family:var(--font-mono);margin-top:.2rem">✓✓ ${m.status} · ${ts}</div>
      </div>`;
    if (pre) list.prepend(div); else list.appendChild(div);
    while(list.children.length>10) list.lastChild.remove();
  }

  document.getElementById('smsForm').onsubmit = async (e) => {
    e.preventDefault();
    const to=document.getElementById('smsTo').value.trim();
    const message=document.getElementById('smsMsg').value.trim();
    if (!to||!message) return toast('Completa destinatario y mensaje','err');
    const btn=document.getElementById('smsSend');
    btn.disabled=true; btn.textContent='⏳ Enviando…';
    dot.className='sdot loading';
    await new Promise(r=>setTimeout(r,800+Math.random()*500));
    const d=await api.post('sms/send',{to,message,channel:ch});
    if (d.ok) {
      addBubble({to,message,channel:d.channel,status:d.status,createdAt:d.dateCreated},true);
      toast('✅ '+ch+' enviado a '+to,'ok');
      document.getElementById('smsMsg').value='';
      document.getElementById('smsCount').textContent='0/160';
      sent++; setStat('hs-sms',sent);
      dot.className='sdot active';
    } else { toast(d.error,'err'); dot.className='sdot error'; }
    btn.disabled=false; btn.textContent='⚡ Enviar';
  };

  loadHistory();
  dot.className='sdot active';
})();