
(function () {
  const dot = document.getElementById('shopStatus');

  const KINDS = [
    {value:'',         label:'🔍 Todo'},
    {value:'song',     label:'🎵 Música'},
    {value:'movie',    label:'🎬 Películas'},
    {value:'software', label:'📱 Apps'},
    {value:'ebook',    label:'📚 Libros'},
    {value:'tvEpisode',label:'📺 Series'},
  ];

  function fmtPrice(p, cur) {
    if (!p || p <= 0) return '<span style="color:#34d399;font-weight:700">GRATIS</span>';
    return (cur==='USD'?'USD $':'$') + (+p).toLocaleString('es-MX',{minimumFractionDigits:2});
  }
  function stars(n) { const f=Math.round(n||0); return '★'.repeat(f)+'☆'.repeat(5-f); }

  function loadCats() {
    const sel = document.getElementById('shopCat');
    sel.innerHTML = '';
    KINDS.forEach(k => {
      const o = document.createElement('option');
      o.value=k.value; o.textContent=k.label; sel.appendChild(o);
    });
    dot.className = 'sdot active';
  }

  async function search() {
    const q    = document.getElementById('shopQuery').value.trim() || 'marvel';
    const kind = document.getElementById('shopCat').value;
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '<div class="loading">🔍 Buscando en iTunes…</div>';
    dot.className = 'sdot loading';
    try {
      let url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&limit=16&country=MX&lang=es_mx`;
      if (kind) url += `&entity=${kind}`;
      const r    = await fetch(url);
      const data = await r.json();
      if (!data.results?.length) {
        grid.innerHTML = '<div class="loading">Sin resultados para "'+q+'"</div>';
        dot.className = 'sdot error'; return;
      }
      renderProducts(data.results);
      setStat('hs-shop', data.resultCount);
      dot.className = 'sdot active';
      toast('✅ '+data.resultCount+' resultados de Apple iTunes','ok');
    } catch(e) {
      grid.innerHTML = '<div class="loading">Error de conexión</div>';
      dot.className = 'sdot error';
    }
  }

  function getInfo(p) {
    const kind = p.kind || p.wrapperType || '';
    const img  = (p.artworkUrl100||p.artworkUrl60||'').replace('100x100bb','600x600bb').replace('100x100','300x300');
    if (kind.includes('song')||kind.includes('music-track'))
      return {badge:'🎵',type:'Música',title:p.trackName||p.collectionName,sub:p.artistName,img,price:p.trackPrice||p.collectionPrice,cur:p.currency,link:p.trackViewUrl};
    if (kind.includes('movie'))
      return {badge:'🎬',type:'Película',title:p.trackName||p.collectionName,sub:p.directorName||p.artistName||'',img,price:p.trackPrice,cur:p.currency,link:p.trackViewUrl};
    if (kind.includes('software')||p.wrapperType==='software')
      return {badge:'📱',type:'App',title:p.trackName,sub:p.artistName,img,price:p.price,cur:p.currency,rating:p.averageUserRating,reviews:p.userRatingCount,link:p.trackViewUrl};
    if (kind.includes('ebook'))
      return {badge:'📚',type:'Libro',title:p.trackName,sub:p.artistName,img,price:p.price,cur:p.currency,link:p.trackViewUrl};
    return {badge:'📦',type:'Producto',title:p.trackName||p.collectionName||p.artistName||'Sin título',sub:p.artistName||'',img,price:p.trackPrice||p.price,cur:p.currency,link:p.trackViewUrl||p.collectionViewUrl};
  }

  function renderProducts(results) {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';
    results.forEach(p => {
      const info = getInfo(p);
      const div  = document.createElement('div');
      div.className = 'product-card';
      div.innerHTML = `
        <div class="product-img-wrap" style="position:relative">
          <img src="${info.img}" alt="${info.title}" loading="lazy"
               onerror="this.src='https://placehold.co/300x300/1a1a2e/475569?text=${encodeURIComponent(info.badge)}'" />
          <span style="position:absolute;bottom:.3rem;left:.3rem;background:rgba(0,0,0,.7);color:#fff;font-size:.55rem;padding:.1rem .35rem;border-radius:4px;font-family:var(--font-mono)">${info.badge} ${info.type}</span>
        </div>
        <div class="product-body">
          <p class="product-title">${info.title}</p>
          <p style="font-size:.65rem;color:var(--text3);margin-top:-.1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${info.sub}</p>
          ${info.rating?`<span style="color:var(--c5);font-size:.68rem">${stars(info.rating)} (${Number(info.reviews||0).toLocaleString()})</span>`:''}
          <div class="product-footer">
            <span class="product-price">${fmtPrice(info.price,info.cur)}</span>
            <button style="background:var(--c5);color:#000;border:none;border-radius:5px;padding:.15rem .45rem;font-size:.65rem;font-weight:700;cursor:pointer">Ver →</button>
          </div>
        </div>`;
      div.onclick = () => openModal(p, info);
      grid.appendChild(div);
    });
  }

  function openModal(p, info) {
    document.getElementById('modalImg').src              = info.img;
    document.getElementById('modalName').textContent     = info.title || 'Sin título';
    document.getElementById('modalCat').textContent      = info.badge+' '+info.type+(p.primaryGenreName?' · '+p.primaryGenreName:'');
    document.getElementById('modalDesc').textContent     = p.longDescription||p.shortDescription||p.description||info.sub||'Sin descripción';
    document.getElementById('modalPrice').innerHTML      = fmtPrice(info.price, info.cur);
    document.getElementById('modalStars').textContent    = info.rating ? stars(info.rating)+' '+info.rating?.toFixed(1) : info.sub;
    const btn = document.getElementById('modalCart');
    btn.textContent = info.price&&info.price>0 ? '🛒 Comprar en iTunes' : '⬇️ Obtener Gratis';
    btn.onclick = () => { if(info.link) window.open(info.link,'_blank'); };
    document.getElementById('productModal').classList.remove('hidden');
  }

  document.getElementById('modalClose').onclick = () => document.getElementById('productModal').classList.add('hidden');
  document.getElementById('productModal').onclick = e => { if(e.target===document.getElementById('productModal')) document.getElementById('productModal').classList.add('hidden'); };
  document.getElementById('shopSearch').onclick = search;
  document.getElementById('shopQuery').onkeydown = e => { if(e.key==='Enter') search(); };
  document.getElementById('shopCat').onchange = search;

  loadCats(); search();
})();


(function () {
  const dot = document.getElementById('shopStatus');

  const KINDS = [
    {value:'',         label:'🔍 Todo'},
    {value:'song',     label:'🎵 Música'},
    {value:'movie',    label:'🎬 Películas'},
    {value:'software', label:'📱 Apps'},
    {value:'ebook',    label:'📚 Libros'},
    {value:'tvEpisode',label:'📺 Series'},
  ];

  function fmtPrice(p, cur) {
    if (!p || p <= 0) return '<span style="color:#34d399;font-weight:700">GRATIS</span>';
    return (cur==='USD'?'USD $':'$') + (+p).toLocaleString('es-MX',{minimumFractionDigits:2});
  }
  function stars(n) { const f=Math.round(n||0); return '★'.repeat(f)+'☆'.repeat(5-f); }

  function loadCats() {
    const sel = document.getElementById('shopCat');
    sel.innerHTML = '';
    KINDS.forEach(k => {
      const o = document.createElement('option');
      o.value=k.value; o.textContent=k.label; sel.appendChild(o);
    });
    dot.className = 'sdot active';
  }

  async function search() {
    const q    = document.getElementById('shopQuery').value.trim() || 'marvel';
    const kind = document.getElementById('shopCat').value;
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '<div class="loading">🔍 Buscando en iTunes…</div>';
    dot.className = 'sdot loading';
    try {
      let url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&limit=16&country=MX&lang=es_mx`;
      if (kind) url += `&entity=${kind}`;
      const r    = await fetch(url);
      const data = await r.json();
      if (!data.results?.length) {
        grid.innerHTML = '<div class="loading">Sin resultados para "'+q+'"</div>';
        dot.className = 'sdot error'; return;
      }
      renderProducts(data.results);
      setStat('hs-shop', data.resultCount);
      dot.className = 'sdot active';
      toast('✅ '+data.resultCount+' resultados de Apple iTunes','ok');
    } catch(e) {
      grid.innerHTML = '<div class="loading">Error de conexión</div>';
      dot.className = 'sdot error';
    }
  }

  function getInfo(p) {
    const kind = p.kind || p.wrapperType || '';
    const img  = (p.artworkUrl100||p.artworkUrl60||'').replace('100x100bb','600x600bb').replace('100x100','300x300');
    if (kind.includes('song')||kind.includes('music-track'))
      return {badge:'🎵',type:'Música',title:p.trackName||p.collectionName,sub:p.artistName,img,price:p.trackPrice||p.collectionPrice,cur:p.currency,link:p.trackViewUrl};
    if (kind.includes('movie'))
      return {badge:'🎬',type:'Película',title:p.trackName||p.collectionName,sub:p.directorName||p.artistName||'',img,price:p.trackPrice,cur:p.currency,link:p.trackViewUrl};
    if (kind.includes('software')||p.wrapperType==='software')
      return {badge:'📱',type:'App',title:p.trackName,sub:p.artistName,img,price:p.price,cur:p.currency,rating:p.averageUserRating,reviews:p.userRatingCount,link:p.trackViewUrl};
    if (kind.includes('ebook'))
      return {badge:'📚',type:'Libro',title:p.trackName,sub:p.artistName,img,price:p.price,cur:p.currency,link:p.trackViewUrl};
    return {badge:'📦',type:'Producto',title:p.trackName||p.collectionName||p.artistName||'Sin título',sub:p.artistName||'',img,price:p.trackPrice||p.price,cur:p.currency,link:p.trackViewUrl||p.collectionViewUrl};
  }

  function renderProducts(results) {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';
    results.forEach(p => {
      const info = getInfo(p);
      const div  = document.createElement('div');
      div.className = 'product-card';
      div.innerHTML = `
        <div class="product-img-wrap" style="position:relative">
          <img src="${info.img}" alt="${info.title}" loading="lazy"
               onerror="this.src='https://placehold.co/300x300/1a1a2e/475569?text=${encodeURIComponent(info.badge)}'" />
          <span style="position:absolute;bottom:.3rem;left:.3rem;background:rgba(0,0,0,.7);color:#fff;font-size:.55rem;padding:.1rem .35rem;border-radius:4px;font-family:var(--font-mono)">${info.badge} ${info.type}</span>
        </div>
        <div class="product-body">
          <p class="product-title">${info.title}</p>
          <p style="font-size:.65rem;color:var(--text3);margin-top:-.1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${info.sub}</p>
          ${info.rating?`<span style="color:var(--c5);font-size:.68rem">${stars(info.rating)} (${Number(info.reviews||0).toLocaleString()})</span>`:''}
          <div class="product-footer">
            <span class="product-price">${fmtPrice(info.price,info.cur)}</span>
            <button style="background:var(--c5);color:#000;border:none;border-radius:5px;padding:.15rem .45rem;font-size:.65rem;font-weight:700;cursor:pointer">Ver →</button>
          </div>
        </div>`;
      div.onclick = () => openModal(p, info);
      grid.appendChild(div);
    });
  }

  function openModal(p, info) {
    document.getElementById('modalImg').src              = info.img;
    document.getElementById('modalName').textContent     = info.title || 'Sin título';
    document.getElementById('modalCat').textContent      = info.badge+' '+info.type+(p.primaryGenreName?' · '+p.primaryGenreName:'');
    document.getElementById('modalDesc').textContent     = p.longDescription||p.shortDescription||p.description||info.sub||'Sin descripción';
    document.getElementById('modalPrice').innerHTML      = fmtPrice(info.price, info.cur);
    document.getElementById('modalStars').textContent    = info.rating ? stars(info.rating)+' '+info.rating?.toFixed(1) : info.sub;
    const btn = document.getElementById('modalCart');
    btn.textContent = info.price&&info.price>0 ? '🛒 Comprar en iTunes' : '⬇️ Obtener Gratis';
    btn.onclick = () => { if(info.link) window.open(info.link,'_blank'); };
    document.getElementById('productModal').classList.remove('hidden');
  }

  document.getElementById('modalClose').onclick = () => document.getElementById('productModal').classList.add('hidden');
  document.getElementById('productModal').onclick = e => { if(e.target===document.getElementById('productModal')) document.getElementById('productModal').classList.add('hidden'); };
  document.getElementById('shopSearch').onclick = search;
  document.getElementById('shopQuery').onkeydown = e => { if(e.key==='Enter') search(); };
  document.getElementById('shopCat').onchange = search;

  loadCats(); search();
})();