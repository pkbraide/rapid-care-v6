// ═══════════════════════════════════════════════════════════════
// RAPID CARE GHANA — Shared Utilities v5
// ═══════════════════════════════════════════════════════════════

// ─── API CLIENT ───────────────────────────────────────────────
const API = {
  base: '/api',
  getToken()  { return localStorage.getItem('rc_token'); },
  getUser()   { const u = localStorage.getItem('rc_user'); return u ? JSON.parse(u) : null; },
  setAuth(token, user) {
    localStorage.setItem('rc_token', token);
    localStorage.setItem('rc_user', JSON.stringify(user));
  },
  clearAuth() { localStorage.removeItem('rc_token'); localStorage.removeItem('rc_user'); },
  isLoggedIn(){ return !!this.getToken(); },

  async request(method, endpoint, body = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    const token = this.getToken();
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body)  opts.body = JSON.stringify(body);
    const res  = await fetch(this.base + endpoint, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },
  get:    (ep)       => API.request('GET',    ep),
  post:   (ep, body) => API.request('POST',   ep, body),
  put:    (ep, body) => API.request('PUT',    ep, body),
  patch:  (ep, body) => API.request('PATCH',  ep, body),
  delete: (ep)       => API.request('DELETE', ep),
};

// ─── DARK MODE ────────────────────────────────────────────────
function initDarkMode() {
  const saved = localStorage.getItem('rc_theme') || 'light';
  applyTheme(saved);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('rc_theme', theme);
  // Update all toggle buttons
  document.querySelectorAll('.dark-toggle').forEach(btn => {
    btn.innerHTML = theme === 'dark' ? icons.sun(20) : icons.moon(20);
    btn.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  });
}

function toggleDarkMode() {
  const current = localStorage.getItem('rc_theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// ─── ICON LIBRARY (Lucide SVG strings) ────────────────────────
const icons = {
  _svg: (path, size=20, extra='') =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${path}</svg>`,

  home:        s => icons._svg('<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',s),
  phone:       s => icons._svg('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.08 3.4 2 2 0 0 1 3.06 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',s),
  book:        s => icons._svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',s),
  activity:    s => icons._svg('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',s),
  users:       s => icons._svg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',s),
  heart:       s => icons._svg('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',s),
  ambulance:   s => icons._svg('<path d="M10 10H6"/><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.28a1 1 0 0 0-.684-.948l-1.923-.641a1 1 0 0 1-.578-.502l-1.539-3.076A1 1 0 0 0 16.382 8H14"/><path d="M8 8v4"/><path d="M9 18h6"/><circle cx="8" cy="18" r="2"/><circle cx="19" cy="18" r="2"/>',s),
  clipboard:   s => icons._svg('<rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',s),
  logout:      s => icons._svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',s),
  user:        s => icons._svg('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',s),
  settings:    s => icons._svg('<circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',s),
  trash:       s => icons._svg('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',s),
  moon:        s => icons._svg('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',s),
  sun:         s => icons._svg('<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',s),
  menu:        s => icons._svg('<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',s),
  x:           s => icons._svg('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',s),
  check:       s => icons._svg('<polyline points="20 6 9 11 4 16"/>',s),
  checkCircle: s => icons._svg('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',s),
  alertTri:    s => icons._svg('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',s),
  info:        s => icons._svg('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',s),
  stethoscope: s => icons._svg('<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>',s),
  shield:      s => icons._svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',s),
  map:         s => icons._svg('<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',s),
  refresh:     s => icons._svg('<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',s),
  plus:        s => icons._svg('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',s),
  send:        s => icons._svg('<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',s),
  thermometer: s => icons._svg('<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>',s),
  zap:         s => icons._svg('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',s),
  droplet:     s => icons._svg('<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',s),
  flame:       s => icons._svg('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',s),
  scissors:    s => icons._svg('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>',s),
  bone:        s => icons._svg('<path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5l7-7z"/>',s),
  skull:       s => icons._svg('<circle cx="12" cy="11" r="8"/><path d="M12 11v5"/><path d="M9 16h6"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0"/><path d="M8 11a2 2 0 1 0-4 0 2 2 0 0 0 4 0"/><path d="M20 11a2 2 0 1 0-4 0 2 2 0 0 0 4 0"/>',s),
  sunHot:      s => icons._svg('<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',s),
  cut:         s => icons._svg('<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>',s),
  google:      s => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>`,
  eye:         s => icons._svg('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',s),
  lock:        s => icons._svg('<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',s),
  broadcast:   s => icons._svg('<circle cx="12" cy="12" r="2"/><path d="M4.93 19.07A10 10 0 1 1 19.07 4.93"/><path d="M7.76 16.24A6 6 0 1 1 16.24 7.76"/>',s),
  arrowRight:  s => icons._svg('<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',s),
  save:        s => icons._svg('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',s),
};

// ─── TOAST ────────────────────────────────────────────────────
function showToast(message, type = 'default', duration = 3500) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const svgMap = {
    success: icons.checkCircle(16),
    error:   icons.x(16),
    warning: icons.alertTri(16),
    default: icons.info(16),
  };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `${svgMap[type] || svgMap.default}<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0'; toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ─── BUTTON LOADING ───────────────────────────────────────────
function setButtonLoading(btn, loading) {
  if (loading) {
    btn.dataset.originalHTML = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span>`;
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.originalHTML || btn.innerHTML;
    btn.disabled = false;
  }
}

// ─── AVATAR DROPDOWN ──────────────────────────────────────────
function initAvatarDropdown() {
  const btn = document.getElementById('avatarBtn');
  const dropdown = document.getElementById('avatarDropdown');
  if (!btn || !dropdown) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  document.addEventListener('click', () => dropdown.classList.remove('open'));
  dropdown.addEventListener('click', e => e.stopPropagation());
}

// ─── SIDEBAR TOGGLE ───────────────────────────────────────────
function initSidebar() {
  const hamburger = document.getElementById('hamburgerBtn');
  const sidebar   = document.getElementById('mainSidebar');
  const overlay   = document.getElementById('sidebarOverlay');
  if (!hamburger || !sidebar) return;

  hamburger.addEventListener('click', () => {
    sidebar.classList.toggle('mobile-open');
    overlay && overlay.classList.toggle('open');
  });
  overlay && overlay.addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('open');
  });
}

// ─── PAGE SWITCHING ───────────────────────────────────────────
function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  const target = document.getElementById(`page-${pageId}`);
  if (target) target.style.display = 'block';
  document.querySelectorAll('[data-page]').forEach(item =>
    item.classList.toggle('active', item.dataset.page === pageId)
  );
  // Close mobile sidebar
  document.getElementById('mainSidebar')?.classList.remove('mobile-open');
  document.getElementById('sidebarOverlay')?.classList.remove('open');
}

// ─── AUTH ─────────────────────────────────────────────────────
function requireAuth(expectedRole = null) {
  if (!API.isLoggedIn()) { window.location.href = '/'; return false; }
  const user = API.getUser();
  if (expectedRole && user.role !== expectedRole) { window.location.href = '/'; return false; }
  return true;
}

function logout() {
  API.clearAuth();
  window.location.href = '/';
}

async function deleteAccount() {
  if (!confirm('Are you sure you want to permanently delete your account? This cannot be undone.')) return;
  try {
    await API.delete('/auth/account');
    API.clearAuth();
    showToast('Account deleted', 'success');
    setTimeout(() => window.location.href = '/', 1000);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─── POPULATE USER INFO ───────────────────────────────────────
function populateUserInfo() {
  const user = API.getUser();
  if (!user) return;

  const initial = user.full_name?.charAt(0).toUpperCase() || 'U';

  document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user.full_name || '');
  document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = user.email || '');
  document.querySelectorAll('[data-user-role]').forEach(el =>
    el.textContent = user.role === 'professional' ? 'Medical Professional' : 'General User'
  );

  // Avatar buttons — show Google photo if available, else initial
  document.querySelectorAll('.avatar-btn').forEach(btn => {
    if (user.avatar_url) {
      btn.innerHTML = `<img src="${user.avatar_url}" alt="${user.full_name}" referrerpolicy="no-referrer">`;
    } else {
      btn.textContent = initial;
    }
  });

  // Sidebar avatar
  document.querySelectorAll('.sidebar-avatar').forEach(el => {
    if (user.avatar_url) {
      el.innerHTML = `<img src="${user.avatar_url}" alt="${user.full_name}" referrerpolicy="no-referrer">`;
    } else {
      el.textContent = initial;
    }
  });

  // Dropdown header
  const dName  = document.querySelector('.d-name');
  const dEmail = document.querySelector('.d-email');
  if (dName)  dName.textContent  = user.full_name;
  if (dEmail) dEmail.textContent = user.email;
}

// ─── TIME / STATUS HELPERS ────────────────────────────────────
function timeAgo(timestamp) {
  const now = Date.now();
  const ts = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp * 1000;
  const diff = now - ts;
  if (diff < 60000)    return 'Just now';
  if (diff < 3600000)  return `${Math.floor(diff/60000)} min ago`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
  return new Date(ts).toLocaleDateString('en-GH');
}

function statusBadge(status) {
  const map = {
    pending:    `<span class="badge badge-orange">${icons.alertTri(10)} Pending</span>`,
    accepted:   `<span class="badge badge-blue">${icons.checkCircle(10)} Accepted</span>`,
    on_the_way: `<span class="badge badge-green">${icons.ambulance(10)} On the Way</span>`,
    completed:  `<span class="badge badge-gray">${icons.check(10)} Completed</span>`,
    cancelled:  `<span class="badge badge-gray">${icons.x(10)} Cancelled</span>`,
  };
  return map[status] || `<span class="badge badge-gray">${status}</span>`;
}

// ─── GOOGLE OAUTH TOKEN FROM URL ──────────────────────────────
function checkOAuthToken() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (token) {
    // Fetch user info and store
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          API.setAuth(token, data.user);
          // Clean URL
          window.history.replaceState({}, '', window.location.pathname);
          populateUserInfo();
        }
      });
  }
}

// ─── AUTO INIT ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  initSidebar();
  initAvatarDropdown();
  populateUserInfo();
  checkOAuthToken();

  // Wire data-page nav items
  document.querySelectorAll('[data-page]').forEach(item => {
    item.addEventListener('click', () => switchPage(item.dataset.page));
  });
});
