
(function () {
  const dot = document.getElementById('streamStatus');

  const VIDEOS = [
    { id:'dQw4w9WgXcQ', title:'Never Gonna Give You Up',  channel:'Rick Astley',       color:'#f87171' },
    { id:'9bZkp7q19f0', title:'GANGNAM STYLE',            channel:'PSY',               color:'#fbbf24' },
    { id:'kffacxfA7G4', title:'Baby',                     channel:'Justin Bieber',     color:'#00e5ff' },
    { id:'YQHsXMglC9A', title:'Hello',                    channel:'Adele',             color:'#a78bfa' },
    { id:'OPf0YbXqDm0', title:'Shape of You',             channel:'Ed Sheeran',        color:'#34d399' },
    { id:'ru0K8uYEZWw', title:'Blinding Lights',          channel:'The Weeknd',        color:'#e879f9' },
    { id:'JGwWNGJdvx8', title:'Shape of You (live)',      channel:'Ed Sheeran Live',   color:'#34d399' },
    { id:'hT_nvWreIhg', title:'Counting Stars',           channel:'OneRepublic',       color:'#1DB954' },
  ];

  let player   = null;
  let currentId = null;
  let allVideos = [...VIDEOS];

  /* ── YouTube IFrame API ── */
  window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player('ytPlayer', {
      height: '100%',
      width:  '100%',
      videoId: '',
      playerVars: { rel: 0, modestbranding: 1, controls: 1 },
      events: {
        onReady: () => {
          dot.className = 'sdot active';
          player.setVolume(70);
        },
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.PLAYING) setStat('hs-stream', '▶');
          if (e.data === YT.PlayerState.PAUSED)  setStat('hs-stream', '⏸');
          if (e.data === YT.PlayerState.ENDED)   setStat('hs-stream', '⏹');
        },
        onError: () => {
          toast('Error al cargar el video', 'err');
          dot.className = 'sdot error';
        }
      }
    });
  };

  const tag = document.createElement('script');
  tag.src   = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);

  /* ── Render lista ── */
  function renderPlaylist(items) {
    const pl = document.getElementById('playlist');
    pl.innerHTML = '';
    if (!items.length) {
      pl.innerHTML = '<div style="color:var(--text3);font-size:.75rem;padding:.5rem">Sin resultados</div>';
      return;
    }
    items.forEach(v => {
      const div = document.createElement('div');
      div.className = 'pl-item' + (v.id === currentId ? ' playing' : '');
      div.dataset.id = v.id;
      div.innerHTML = `
        <div style="flex-shrink:0;width:52px;height:30px;border-radius:4px;overflow:hidden">
          <img src="https://img.youtube.com/vi/${v.id}/default.jpg" style="width:100%;height:100%;object-fit:cover" />
        </div>
        <div style="flex:1;min-width:0">
          <div class="pl-title">${v.title}</div>
          <div class="pl-ch">${v.channel}</div>
        </div>`;
      div.onclick = () => playVideo(v);
      pl.appendChild(div);
    });
  }

  /* ── Reproducir ── */
  function playVideo(v) {
    currentId = v.id;
    document.getElementById('pcTitle').textContent   = v.title;
    document.getElementById('pcChannel').textContent = v.channel;
    document.querySelectorAll('.pl-item').forEach(el =>
      el.classList.toggle('playing', el.dataset.id === v.id)
    );
    if (player && player.loadVideoById) {
      player.loadVideoById(v.id);
      toast('▶ ' + v.title, 'info');
    }
  }

  /* ── Controles ── */
  document.getElementById('pcPlay').onclick  = () => player && player.playVideo();
  document.getElementById('pcPause').onclick = () => player && player.pauseVideo();
  document.getElementById('pcStop').onclick  = () => { if (player) { player.stopVideo(); setStat('hs-stream','⏹'); }};

  const vol  = document.getElementById('volSlider');
  const volL = document.getElementById('volLabel');
  ['pcPlay','pcPause','pcStop'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
  });
  if (vol)  vol.style.display  = '';
  if (volL) volL.style.display = '';

  vol.oninput = () => {
    if (player && player.setVolume) player.setVolume(+vol.value);
    volL.textContent = '🔊 ' + vol.value;
  };

  /* ── Buscar (filtra locales + acepta URL/ID de YT) ── */
  function search() {
    const q = document.getElementById('streamQ').value.trim();
    if (!q) { renderPlaylist(allVideos); return; }

    // Si es una URL o ID de YouTube, agrégalo al vuelo
    const ytMatch = q.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    const rawId   = q.match(/^[A-Za-z0-9_-]{11}$/);
    if (ytMatch || rawId) {
      const id = ytMatch ? ytMatch[1] : q;
      const tmp = { id, title: 'Video personalizado', channel: 'YouTube', color: '#f87171' };
      if (!allVideos.find(v => v.id === id)) allVideos.unshift(tmp);
      renderPlaylist(allVideos);
      playVideo(tmp);
      document.getElementById('streamQ').value = '';
      return;
    }

    const lq  = q.toLowerCase();
    const res = allVideos.filter(v =>
      v.title.toLowerCase().includes(lq) || v.channel.toLowerCase().includes(lq)
    );
    renderPlaylist(res.length ? res : allVideos);
  }

  document.getElementById('streamSearch').onclick = search;
  document.getElementById('streamQ').onkeydown = e => { if (e.key === 'Enter') search(); };

  /* ── Init ── */
  dot.className = 'sdot loading';
  renderPlaylist(allVideos);
})();
