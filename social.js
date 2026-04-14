
(function () {
  const dot = document.getElementById('socialStatus');
  let sub = 'mexico', sort = 'hot';

  // Lista estática de subreddits (ya no depende del servidor PHP)
  const SUBS = [
    {name:'mexico',       icon:'🇲🇽', color:'#ef4444'},
    {name:'programacion', icon:'💻',  color:'#3b82f6'},
    {name:'gaming',       icon:'🎮',  color:'#8b5cf6'},
    {name:'memes',        icon:'😂',  color:'#f59e0b'},
    {name:'worldnews',    icon:'🌍',  color:'#10b981'},
    {name:'technology',   icon:'🤖',  color:'#06b6d4'},
    {name:'movies',       icon:'🎬',  color:'#f43f5e'},
    {name:'music',        icon:'🎵',  color:'#a855f7'},
    {name:'space',        icon:'🚀',  color:'#6366f1'},
    {name:'funny',        icon:'🤣',  color:'#eab308'},
    {name:'sports',       icon:'⚽',  color:'#22c55e'},
    {name:'science',      icon:'🔬',  color:'#0ea5e9'},
  ];
  const COLORS = {};
  SUBS.forEach(s => COLORS[s.name] = s.color);
  const color = n => COLORS[n] || '#ff4500';
  const fmtN  = n => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n || 0);
  const ago   = u => { const d = Math.floor(Date.now() / 1000) - u; if (d < 60) return 'ahora'; if (d < 3600) return Math.floor(d / 60) + 'm'; if (d < 86400) return Math.floor(d / 3600) + 'h'; return Math.floor(d / 86400) + 'd'; };

  function buildList(list) {
    const c = document.getElementById('subList'); c.innerHTML = '';
    list.forEach(s => {
      const b = document.createElement('button');
      b.className = 'sub-btn' + (s.name === sub ? ' active' : '');
      b.dataset.sub = s.name;
      b.style.setProperty('--sc', s.color || '#ff4500');
      b.innerHTML = `<span>${s.icon || '🔍'}</span><span class="sub-name">r/${s.name}</span>`;
      b.onclick = () => switchSub(s.name);
      c.appendChild(b);
    });
  }

  async function switchSub(name) {
    sub = name;
    document.querySelectorAll('.sub-btn').forEach(b => b.classList.toggle('active', b.dataset.sub === name));
    loadAbout(); loadPosts();
  }

  async function loadAbout() {
    try {
      const r = await fetch(`https://www.reddit.com/r/${sub}/about.json?raw_json=1`);
      if (!r.ok) return;
      const data = await r.json();
      const d = data.data;
      if (!d) return;
      document.getElementById('subTitle').textContent   = 'r/' + d.display_name;
      document.getElementById('subDesc').textContent    = d.public_description || d.title || '';
      document.getElementById('subMembers').textContent = fmtN(d.subscribers) + ' miembros';
      document.getElementById('subOnline').textContent  = fmtN(d.accounts_active || 0) + ' online';
      const c = d.primary_color || color(sub);
      document.getElementById('subTitle').style.color = c || '#ff4500';
      document.getElementById('subAccent').style.background = c || '#ff4500';
      const iconUrl = (d.icon_img || d.community_icon || '').replace(/&amp;/g, '&');
      const icon = document.getElementById('subIcon');
      if (iconUrl) { icon.src = iconUrl; icon.style.display = 'block'; } else icon.style.display = 'none';
    } catch (e) { /* fallo silencioso */ }
  }

  async function loadPosts() {
    const feed = document.getElementById('redditFeed');
    feed.innerHTML = '<div class="loading">Cargando r/' + sub + '…</div>';
    dot.className = 'sdot loading';
    try {
      // Fetch directo al API público de Reddit (soporta CORS desde el navegador)
      const r = await fetch(`https://www.reddit.com/r/${sub}/${sort}.json?limit=15&raw_json=1`);
      if (!r.ok) throw new Error('r/' + sub + ' no disponible (HTTP ' + r.status + ')');
      const data = await r.json();
      if (!data.data || !data.data.children || !data.data.children.length) throw new Error('r/' + sub + ' sin posts');

      feed.innerHTML = '';
      const posts = data.data.children
        .filter(c => c.kind === 't3' && !c.data.over_18)
        .map(c => {
          const p = c.data;
          let img = null;
          if (p.preview && p.preview.images && p.preview.images[0]) {
            const res = p.preview.images[0].resolutions;
            if (res) { for (const ri of res) { if (ri.width >= 320) { img = ri.url.replace(/&amp;/g, '&'); break; } } }
            if (!img && p.preview.images[0].source) img = p.preview.images[0].source.url.replace(/&amp;/g, '&');
          }
          if (!img && p.thumbnail && p.thumbnail.startsWith('http')) img = p.thumbnail;
          return {
            id: p.id, title: p.title, author: p.author, subreddit: p.subreddit,
            score: p.score, upvoteRatio: p.upvote_ratio, numComments: p.num_comments,
            permalink: 'https://reddit.com' + p.permalink,
            selftext: (p.selftext || '').substring(0, 280),
            image: img, flair: p.link_flair_text || null, created: p.created_utc,
          };
        });

      posts.forEach(p => {
        const div = document.createElement('div');
        div.className = 'reddit-card';
        const c = color(sub);
        div.innerHTML = `
          <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:.62rem">
            <span style="color:${c};font-weight:700">r/${p.subreddit}</span>
            <span style="color:var(--text3)">${ago(p.created)}</span>
          </div>
          <div class="rc-title">${p.title}</div>
          ${p.flair ? `<span class="rc-flair">${p.flair}</span>` : ''}
          ${p.image ? `<img src="${p.image}" alt="" class="rc-img" onerror="this.style.display='none'" />` : ''}
          ${!p.image && p.selftext ? `<p class="rc-text">${p.selftext}</p>` : ''}
          <div class="rc-footer">
            <div style="display:flex;gap:.6rem;font-family:var(--font-mono);font-size:.62rem;color:var(--text3)">
              <span style="color:var(--c5);font-weight:700">▲ ${fmtN(p.score)}</span>
              <span>💬 ${fmtN(p.numComments)}</span>
              <span>${Math.round(p.upvoteRatio * 100)}%</span>
            </div>
            <div style="display:flex;gap:.5rem;font-size:.62rem;align-items:center">
              <span style="color:var(--text3);font-family:var(--font-mono)">u/${p.author}</span>
              <a href="${p.permalink}" target="_blank" class="rc-link">Ver →</a>
            </div>
          </div>`;
        feed.appendChild(div);
      });
      setStat('hs-soc', 'r/' + sub);
      dot.className = 'sdot active';
      toast('✅ r/' + sub + ' — ' + posts.length + ' posts', 'ok');
    } catch (err) {
      feed.innerHTML = '<div class="loading" style="color:var(--c3)">⚠️ ' + err.message + '</div>';
      dot.className = 'sdot error';
      toast('Error Reddit: ' + err.message, 'err');
    }
  }

  // Buscador de subreddits
  let timer;
  document.getElementById('subSearch').oninput = e => {
    clearTimeout(timer);
    const q = e.target.value.trim();
    if (!q) { buildList(SUBS); return; }
    timer = setTimeout(async () => {
      try {
        const r = await fetch(`https://www.reddit.com/subreddits/search.json?q=${encodeURIComponent(q)}&limit=8&raw_json=1`);
        if (!r.ok) return;
        const data = await r.json();
        const results = (data.data.children || []).map(c => ({
          name: c.data.display_name,
          icon: '🔍',
          color: '#ff4500',
        }));
        if (!results.length) return;
        const c = document.getElementById('subList'); c.innerHTML = '';
        results.forEach(s => {
          const b = document.createElement('button');
          b.className = 'sub-btn'; b.dataset.sub = s.name;
          b.style.setProperty('--sc', '#ff4500');
          b.innerHTML = `<span>🔍</span><span class="sub-name">r/${s.name}</span>`;
          b.onclick = () => { switchSub(s.name); e.target.value = ''; buildList(SUBS); };
          c.appendChild(b);
        });
      } catch (err) { /* búsqueda falló */ }
    }, 400);
  };

  document.querySelectorAll('.sort-btn').forEach(b => {
    b.onclick = () => {
      document.querySelectorAll('.sort-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active'); sort = b.dataset.sort; loadPosts();
    };
  });

  document.getElementById('redditRefresh').onclick = loadPosts;

  buildList(SUBS); loadAbout(); loadPosts();
})();
