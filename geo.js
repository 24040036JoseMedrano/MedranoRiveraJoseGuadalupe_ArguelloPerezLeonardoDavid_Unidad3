
(function () {
  let map, marker;
  const dot = document.getElementById('geoStatus');

  function initMap(lat, lon) {
    if (map) { map.setView([lat, lon], 13); return; }
    map = L.map('map', { zoomControl: true, attributionControl: false }).setView([lat, lon], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      setMarker(lat, lng); setCoords(lat, lng);
      const d = await api.get('geo/reverse', { lat, lon: lng });
      if (d.ok) setInfo(lat, lng, d.result.display_name, d.result.address?.country || '');
    });
  }

  function setMarker(lat, lon) {
    const icon = L.divIcon({
      html: '<div style="width:18px;height:18px;border-radius:50%;background:var(--c1);border:3px solid #fff;box-shadow:0 0 10px rgba(0,229,255,.6)"></div>',
      iconSize: [18,18], iconAnchor: [9,9], className: '',
    });
    if (marker) marker.remove();
    marker = L.marker([lat, lon], { icon }).addTo(map);
  }

  function setCoords(lat, lon) {
    document.getElementById('geoLat').textContent = (+lat).toFixed(6);
    document.getElementById('geoLon').textContent = (+lon).toFixed(6);
  }

  function setInfo(lat, lon, place, country) {
    setCoords(lat, lon);
    document.getElementById('geoPlace').textContent   = place   || '—';
    document.getElementById('geoCountry').textContent = country || '—';
  }

  async function search() {
    const q = document.getElementById('geoQuery').value.trim();
    if (!q) return;
    dot.className = 'sdot loading';
    const d = await api.get('geo/search', { q });
    if (!d.ok || !d.results.length) { toast('Sin resultados', 'err'); dot.className='sdot error'; return; }
    const res = document.getElementById('geoResults');
    res.innerHTML = '';
    d.results.forEach((r, i) => {
      const btn = document.createElement('button');
      btn.className = 'geo-btn';
      btn.textContent = r.display_name.split(',').slice(0,2).join(',');
      btn.onclick = () => {
        const lat = +r.lat, lon = +r.lon;
        map.setView([lat, lon], 14); setMarker(lat, lon);
        setInfo(lat, lon, r.display_name, r.address?.country || '');
        toast('📍 ' + r.display_name.split(',')[0], 'ok');
      };
      res.appendChild(btn);
      if (i === 0) { initMap(+r.lat, +r.lon); setMarker(+r.lat, +r.lon); setInfo(+r.lat, +r.lon, r.display_name, r.address?.country||''); }
    });
    dot.className = 'sdot active';
  }

  document.getElementById('geoSearch').onclick = search;
  document.getElementById('geoQuery').onkeydown = e => { if (e.key==='Enter') search(); };
  document.getElementById('geoLocate').onclick = () => {
    if (!navigator.geolocation) return toast('No disponible','err');
    dot.className = 'sdot loading';
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude: lat, longitude: lon } = pos.coords;
      initMap(lat, lon); map.setView([lat, lon], 15); setMarker(lat, lon); setCoords(lat, lon);
      const d = await api.get('geo/reverse', { lat, lon });
      if (d.ok) setInfo(lat, lon, d.result.display_name, d.result.address?.country||'');
      dot.className = 'sdot active';
      toast('📍 Ubicación obtenida','ok');
    }, e => { toast('Error GPS: '+e.message,'err'); dot.className='sdot error'; });
  };

  initMap(19.4326, -99.1332);
  setMarker(19.4326, -99.1332);
  setInfo(19.4326, -99.1332, 'Ciudad de México, México', 'México');
  dot.className = 'sdot active';
})();