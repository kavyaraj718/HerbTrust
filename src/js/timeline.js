/* Minimal, dependency-free timeline renderer
   Usage: renderTimeline('timelineContainer', stagesArray)
   stage: { key, title, icon, timestamp, locationText, actor, batchId, extra }
*/
(function(window){
  function escapeHtml(str){
    if(str === undefined || str === null) return '';
    return String(str).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\' : '&#39;'}[m]) || m; });
  }

  function renderTimeline(containerId, stages){
    var el = document.getElementById(containerId);
    if(!el) return;
    if(!Array.isArray(stages) || stages.length === 0){ el.innerHTML = '<div class="text-muted-soft">No lifecycle data.</div>'; return; }

    var html = '<ul class="ht-timeline">';
    stages.forEach(function(s){
      html += '<li class="ht-tl-item">'
        + '<div class="ht-tl-icon">' + escapeHtml(s.icon || '•') + '</div>'
        + '<div class="ht-tl-body">'
        +   '<div class="ht-tl-title">' + escapeHtml(s.title || '') + '</div>'
        +   '<div class="ht-tl-meta">' + escapeHtml(s.timestamp || '') + (s.locationText ? ' • ' + escapeHtml(s.locationText) : '') + '</div>'
        +   '<div class="ht-tl-sub">' + (s.actor ? ('By: ' + escapeHtml(s.actor)) : '') + (s.batchId ? (' • Batch: ' + escapeHtml(s.batchId)) : '') + '</div>'
        +   (s.extra ? ('<div class="ht-tl-extra">' + escapeHtml(s.extra) + '</div>') : '')
        + '</div>'
        + '</li>';
    });
    html += '</ul>';
    el.innerHTML = html;
  }

  // lightweight styles injected once
  (function injectStyles(){
    if(document.getElementById('ht-timeline-style')) return;
    var css = '.ht-timeline{list-style:none;margin:0;padding:0;position:relative}'+
      '.ht-timeline::before{content:"";position:absolute;left:16px;top:0;bottom:0;width:2px;background:rgba(255,255,255,.15)}'+
      '.ht-tl-item{position:relative;display:flex;margin:14px 0;padding-left:44px}'+
      '.ht-tl-icon{position:absolute;left:8px;top:2px;width:16px;height:16px;border-radius:50%;background:rgba(34,197,94,.2);display:flex;align-items:center;justify-content:center;font-size:12px}'+
      '.ht-tl-body{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 12px;flex:1}'+
      '.ht-tl-title{font-weight:600;color:#86efac;margin-bottom:2px}'+
      '.ht-tl-meta{color:#b7d6c6;font-size:12px;margin-bottom:4px}'+
      '.ht-tl-sub{color:#cfe7db;font-size:12px}'+
      '.ht-tl-extra{margin-top:6px;color:#e7f6ee;font-size:13px}';
    var style = document.createElement('style');
    style.id = 'ht-timeline-style';
    style.innerHTML = css;
    document.head.appendChild(style);
  })();

  window.renderTimeline = renderTimeline;
})(window);


