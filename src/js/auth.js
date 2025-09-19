(function(window, document){
  var STORAGE_KEY = 'ht_auth_v1';
  var USERS_KEY = 'ht_users_v1';
  var ROLES = { farmer: 'Farmer', distributor: 'Distributor', consumer: 'Consumer' };

  function read(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch(e){ return null; } }
  function write(data){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data || null)); }
  function clear(){ localStorage.removeItem(STORAGE_KEY); }

  function readUsers(){ try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); } catch(e){ return {}; } }
  function writeUsers(db){ localStorage.setItem(USERS_KEY, JSON.stringify(db || {})); }
  function normalizeId(id){ return String(id || '').trim().toLowerCase(); }

  async function hashPassword(pw){
    try {
      var enc = new TextEncoder();
      var data = enc.encode(String(pw || ''));
      var digest = await crypto.subtle.digest('SHA-256', data);
      var bytes = Array.from(new Uint8Array(digest));
      return bytes.map(function(b){ return b.toString(16).padStart(2, '0'); }).join('');
    } catch(e){
      // Fallback naive hash
      var h = 0, i, chr, s = String(pw || '');
      for(i=0;i<s.length;i++){ chr=s.charCodeAt(i); h=((h<<5)-h)+chr; h|=0; }
      return 'x'+Math.abs(h);
    }
  }

  async function register(role, address, password){
    var users = readUsers();
    var id = normalizeId(address);
    if(!role || !id || !password) throw new Error('Role, address and password are required');
    if(users[id]) throw new Error('User already exists');
    users[id] = { role: role, pass: await hashPassword(password), createdAt: Date.now() };
    writeUsers(users);
    return { role: role, address: id };
  }

  async function authenticate(address, password){
    var users = readUsers();
    var id = normalizeId(address);
    var u = users[id];
    if(!u) throw new Error('User not found');
    var hp = await hashPassword(password);
    if(u.pass !== hp) throw new Error('Invalid password');
    return { role: u.role, address: id };
  }

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
        '<a href="login.html" class="btn btn-warning" style="margin-left:8px" id="signInBtn">Sign Up</a>';
    }
  }

  function init(){ try { ensureAccess(); renderNav(); } catch(e) { /* no-op */ } }
  if(document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(init, 0);
  else document.addEventListener('DOMContentLoaded', init);

  window.HTAuth = { ROLES: ROLES, getUser: getUser, isLoggedIn: isLoggedIn, login: login, logout: logout, redirectToRoleHome: redirectToRoleHome, register: register, authenticate: authenticate };
})(window, document);



