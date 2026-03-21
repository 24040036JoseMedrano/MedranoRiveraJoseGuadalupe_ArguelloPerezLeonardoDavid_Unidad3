/* stream.php — Streaming YouTube */
(function () {
  const dot = document.getElementById('streamStatus');
  let player=null, ready=false, curId=null;

  window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player('ytPlayer', {
      height:'100%', width:'100%', videoId:'',
      playerVars:{autoplay:0,controls:1,rel:0,modestbranding:1,origin:window.location.origin},
      events:{
        onReady: () => { ready=true; player.setVolume(70); loadPlaylist(); dot.className='sdot active'; },
        onError: e => { toast('Error reproductor: '+e.data,'err'); },
      },
    });
  };

  async function loadPlaylist(q='') {
    dot.className='sdot loading';
    const d = await api.get('stream/search', { q });
    if (!d.ok) { dot.className='sdot error'; return; }
    renderPlaylist(d.results);
    dot.className='sdot active';
  }

  function renderPlaylist(items) {
    const pl=document.getElementById('playlist'); pl.innerHTML='';
    items.forEach(v => {
      const div=document.createElement('div');
      div.className='pl-item'+(v.id===curId?' playing':'');
      div.dataset.id=v.id;
      div.innerHTML=`
        <img class="pl-thumb" src="${v.thumb}" alt="" loading="lazy" onerror="this.src='https://placehold.co/52x30/111827/475569?text=YT'" />
        <div style="flex:1;min-width:0">
          <div class="pl-title">${v.title}</div>
          <div class="pl-ch">${v.channel}</div>
        </div>
        ${v.duration==='LIVE'?'<span class="pl-live">● LIVE</span>':''}`;
      div.onclick = () => play(v);
      pl.appendChild(div);
    });
  }

  function play(v) {
    curId=v.id;
    document.getElementById('pcTitle').textContent=v.title;
    document.getElementById('pcChannel').textContent=v.channel;
    document.querySelectorAll('.pl-item').forEach(el=>el.classList.toggle('playing',el.dataset.id===v.id));
    if (ready&&player) {
      player.loadVideoById(v.id);
      player.setVolume(+document.getElementById('volSlider').value);
    } else {
      document.getElementById('ytWrap').innerHTML=`<iframe src="https://www.youtube.com/embed/${v.id}?autoplay=1&controls=1&modestbranding=1" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen style="width:100%;height:100%;border:none"></iframe>`;
    }
    setStat('hs-stream','▶');
    toast('▶ '+v.title.slice(0,35)+'…','info');
  }

  document.getElementById('pcPlay').onclick   = () => ready&&player&&player.playVideo();
  document.getElementById('pcPause').onclick  = () => ready&&player&&player.pauseVideo();
  document.getElementById('pcStop').onclick   = () => ready&&player&&player.stopVideo();
  document.getElementById('volSlider').oninput = function() {
    const v=+this.value;
    document.getElementById('volLabel').textContent=(v===0?'🔇':v<40?'🔉':'🔊')+' '+v;
    if(ready&&player) player.setVolume(v);
  };
  document.getElementById('streamSearch').onclick = () => loadPlaylist(document.getElementById('streamQ').value.trim());
  document.getElementById('streamQ').onkeydown = e => { if(e.key==='Enter') loadPlaylist(document.getElementById('streamQ').value.trim()); };

  document.getElementById('ytWrap').innerHTML='<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:.5rem;color:var(--text3)"><span style="font-size:2rem">▶</span><span style="font-size:.78rem;font-family:var(--font-mono)">Selecciona un video</span></div>';
  dot.className='sdot active';
})();
