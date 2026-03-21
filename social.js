/* social.php — Reddit */
(function () {
  const dot = document.getElementById('socialStatus');
  let sub = 'mexico', sort = 'hot';
  const COLORS = {mexico:'#ef4444',programacion:'#3b82f6',gaming:'#8b5cf6',memes:'#f59e0b',worldnews:'#10b981',technology:'#06b6d4',movies:'#f43f5e',music:'#a855f7',space:'#6366f1',funny:'#eab308',sports:'#22c55e',science:'#0ea5e9'};
  const color = n => COLORS[n] || '#ff4500';
  const fmtN  = n => n>=1000?(n/1000).toFixed(1)+'k':String(n||0);
  const ago   = u => { const d=Math.floor(Date.now()/1000)-u; if(d<60)return'ahora';if(d<3600)return Math.floor(d/60)+'m';if(d<86400)return Math.floor(d/3600)+'h';return Math.floor(d/86400)+'d'; };

  async function buildList() {
    const d = await api.get('reddit/subreddits');
    if (!d.ok) return;
    const c = document.getElementById('subList'); c.innerHTML='';
    d.subreddits.forEach(s => {
      const b = document.createElement('button');
      b.className = 'sub-btn' + (s.name===sub?' active':'');
      b.dataset.sub = s.name;
      b.style.setProperty('--sc', s.color);
      b.innerHTML = `<span>${s.icon}</span><span class="sub-name">r/${s.name}</span>`;
      b.onclick = () => switchSub(s.name);
      c.appendChild(b);
    });
  }

  async function switchSub(name) {
    sub = name;
    document.querySelectorAll('.sub-btn').forEach(b => b.classList.toggle('active', b.dataset.sub===name));
    loadAbout(); loadPosts();
  }

  async function loadAbout() {
    const d = await api.get('reddit/about', { sub });
    if (!d.ok) return;
    document.getElementById('subTitle').textContent   = 'r/'+d.name;
    document.getElementById('subDesc').textContent    = d.description || d.title || '';
    document.getElementById('subMembers').textContent = fmtN(d.subscribers)+' miembros';
    document.getElementById('subOnline').textContent  = fmtN(d.online||0)+' online';
    const c = d.color || color(sub);
    document.getElementById('subTitle').style.color = c;
    document.getElementById('subAccent').style.background = c;
    const icon = document.getElementById('subIcon');
    if (d.icon) { icon.src=d.icon; icon.style.display='block'; } else icon.style.display='none';
  }

  async function loadPosts() {
    const feed = document.getElementById('redditFeed');
    feed.innerHTML = '<div class="loading">Cargando r/'+sub+'…</div>';
    dot.className = 'sdot loading';
    const d = await api.get('reddit/posts', { sub, sort, limit: 15 });
    if (!d.ok) { feed.innerHTML='<div class="loading" style="color:var(--c3)">⚠️ '+d.error+'</div>'; dot.className='sdot error'; return; }
    feed.innerHTML = '';
    d.posts.forEach(p => {
      const div = document.createElement('div');
      div.className = 'reddit-card';
      const c = color(sub);
      div.innerHTML = `
        <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:.62rem">
          <span style="color:${c};font-weight:700">r/${p.subreddit}</span>
          <span style="color:var(--text3)">${ago(p.created)}</span>
        </div>
        <div class="rc-title">${p.title}</div>
        ${p.flair?`<span class="rc-flair">${p.flair}</span>`:''}
        ${p.image?`<img src="${p.image}" alt="" class="rc-img" onerror="this.style.display='none'" />`:''}
        ${!p.image&&p.selftext?`<p class="rc-text">${p.selftext}</p>`:''}
        <div class="rc-footer">
          <div style="display:flex;gap:.6rem;font-family:var(--font-mono);font-size:.62rem;color:var(--text3)">
            <span style="color:var(--c5);font-weight:700">▲ ${fmtN(p.score)}</span>
            <span>💬 ${fmtN(p.numComments)}</span>
            <span>${Math.round(p.upvoteRatio*100)}%</span>
          </div>
          <div style="display:flex;gap:.5rem;font-size:.62rem;align-items:center">
            <span style="color:var(--text3);font-family:var(--font-mono)">u/${p.author}</span>
            <a href="${p.permalink}" target="_blank" class="rc-link">Ver →</a>
          </div>
        </div>`;
      feed.appendChild(div);
    });
    setStat('hs-soc','r/'+sub);
    dot.className = 'sdot active';
    toast('✅ r/'+sub+' — '+d.posts.length+' posts','ok');
  }

  // Buscador de subreddits
  let timer;
  document.getElementById('subSearch').oninput = e => {
    clearTimeout(timer);
    const q = e.target.value.trim();
    if (!q) { buildList(); return; }
    timer = setTimeout(async () => {
      const d = await api.get('reddit/search', { q });
      if (!d.ok || !d.results.length) return;
      const c = document.getElementById('subList'); c.innerHTML='';
      d.results.forEach(s => {
        const b = document.createElement('button');
        b.className='sub-btn'; b.dataset.sub=s.name;
        b.style.setProperty('--sc','#ff4500');
        b.innerHTML=`<span>🔍</span><span class="sub-name">r/${s.name}</span>`;
        b.onclick=()=>{ switchSub(s.name); e.target.value=''; buildList(); };
        c.appendChild(b);
      });
    }, 400);
  };

  document.querySelectorAll('.sort-btn').forEach(b => {
    b.onclick = () => {
      document.querySelectorAll('.sort-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active'); sort=b.dataset.sort; loadPosts();
    };
  });

  document.getElementById('redditRefresh').onclick = loadPosts;

  buildList(); loadAbout(); loadPosts();
})();