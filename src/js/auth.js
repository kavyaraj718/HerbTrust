(function(window, document){
  var STORAGE_KEY = 'ht_auth_v1';
  var ROLES = { farmer: 'Farmer', distributor: 'Distributor', consumer: 'Consumer' };

  function read(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch(e){ return null; }
  }
  function write(data){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data || null)); }
  function clear(){ localStorage.removeItem(STORAGE_KEY); }

  function getUser(){ return read(); }
  function isLoggedIn(){ return !!(read() && read().role && read().address); }
  function login(role, address){ write({ role: role, address: address, ts: Date.now() }); }
  function logout(){ clear(); }

  function requiredRolesForPage(){
    // Page can define window.REQUIRED_ROLES = ['Farmer'] etc.
    if(Array.isArray(window.REQUIRED_ROLES)) return window.REQUIRED_ROLES;
    return [];
  }

  function redirectToRoleHome(role){
    if(role === ROLES.farmer) { window.location.href = 'manufacturer.html'; return; }
    if(role === ROLES.distributor) { window.location.href = 'seller.html'; return; }
    if(role === ROLES.consumer) { window.location.href = 'consumer.html'; return; }
    window.location.href = 'index.html';
  }

  function ensureAccess(){
    var req = requiredRolesForPage();
    if(req.length === 0) return; // Public or unguarded
    var user = getUser();
    if(!user || !user.role){ window.location.href = 'login.html'; return; }
    if(req.indexOf(user.role) === -1){ window.location.href = 'login.html'; }
  }

  function renderNav(){
    var container = document.getElementById('auth-nav');
    if(!container) return;
    var user = getUser();
    if(user && user.role){
      container.innerHTML = ''+
        '<span class="nav-link text-success" style="font-weight:700">' + user.role + '</span>'+
        '<button id="logoutBtn" class="btn btn-outline-light" style="margin-left:8px">Logout</button>';
      var btn = document.getElementById('logoutBtn');
      if(btn){ btn.addEventListener('click', function(){ logout(); window.location.href = 'login.html'; }); }
    } else {
      container.innerHTML = ''+
        '<a href="login.html" class="btn btn-primary" id="loginBtn">Login</a>'+
        '<a href="login.html" class="btn btn-warning" style="margin-left:8px" id="signInBtn">Sign In</a>';
    }
  }

  function init(){ try { ensureAccess(); renderNav(); } catch(e) { /* no-op */ } }
  if(document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(init, 0);
  else document.addEventListener('DOMContentLoaded', init);

  window.HTAuth = { ROLES: ROLES, getUser: getUser, isLoggedIn: isLoggedIn, login: login, logout: logout, redirectToRoleHome: redirectToRoleHome };
})(window, document);



