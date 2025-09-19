/* Minimal Leaflet wrapper. If Leaflet is unavailable, fallback to a static list. */
(function(window){
  function renderMap(containerId, points){
    var el = document.getElementById(containerId);
    if(!el) return;
    if(!Array.isArray(points) || points.length === 0){ el.innerHTML = '<div class="text-muted-soft">No location data.</div>'; return; }

    // Try Leaflet
    if(window.L){
      var avgLat = 0, avgLng = 0, count = 0;
      points.forEach(function(p){ if(typeof p.lat === 'number' && typeof p.lng === 'number'){ avgLat += p.lat; avgLng += p.lng; count++; } });
      var center = count ? [avgLat / count, avgLng / count] : [0,0];
      var map = L.map(containerId).setView(center, count ? 5 : 2);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
      points.forEach(function(p){
        if(typeof p.lat === 'number' && typeof p.lng === 'number'){
          var marker = L.marker([p.lat, p.lng]).addTo(map);
          var content = (p.icon || '') + ' ' + (p.title || '') + (p.subtitle ? ('<br/>' + p.subtitle) : '');
          marker.bindPopup(content);
        }
      });
      return;
    }

    // Fallback
    var html = '<div class="text-muted-soft">Map unavailable. Locations:</div><ul>';
    points.forEach(function(p){
      html += '<li>' + (p.icon || '') + ' ' + (p.title || '') + (p.subtitle ? (' - ' + p.subtitle) : '') + '</li>';
    });
    html += '</ul>';
    el.innerHTML = html;
  }

  window.renderMap = renderMap;
})(window);


