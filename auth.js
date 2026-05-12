// ===== AUTH MODULE =====
const Auth = {
  SESSION_KEY: 'los_session',
  USERS_KEY: 'los_users',

  _hash(str) {
    // Simple but effective hash for offline use
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + c;
      hash |= 0;
    }
    // Convert to positive hex
    const h = (hash >>> 0).toString(16).padStart(8, '0');
    // Add salt
    let hash2 = 0;
    for (let i = str.length - 1; i >= 0; i--) {
      hash2 = ((hash2 << 3) + str.charCodeAt(i)) ^ hash;
      hash2 |= 0;
    }
    return h + (hash2 >>> 0).toString(16).padStart(8, '0');
  },

  getUsers() {
    try { return JSON.parse(localStorage.getItem(this.USERS_KEY) || '{}'); }
    catch { return {}; }
  },

  saveUsers(users) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  },

  register(username, password, name) {
    const users = this.getUsers();
    const key = username.toLowerCase().trim();
    if (!key || !password || password.length < 6) return { ok: false, msg: 'Password must be at least 6 characters.' };
    if (users[key]) return { ok: false, msg: 'Username already exists.' };
    users[key] = { username: key, name: name || username, hash: this._hash(password), created: Date.now() };
    this.saveUsers(users);
    return { ok: true, user: users[key] };
  },

  login(username, password) {
    const users = this.getUsers();
    const key = username.toLowerCase().trim();
    const user = users[key];
    if (!user) return { ok: false, msg: 'User not found.' };
    if (user.hash !== this._hash(password)) return { ok: false, msg: 'Incorrect password.' };
    const session = { username: key, name: user.name, loginAt: Date.now() };
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    LifeOS.init(key + password.slice(0, 4));
    return { ok: true, user };
  },

  logout() {
    sessionStorage.removeItem(this.SESSION_KEY);
    window.location.href = './index.html';
  },

  getSession() {
    try { return JSON.parse(sessionStorage.getItem(this.SESSION_KEY) || 'null'); }
    catch { return null; }
  },

  require() {
    const s = this.getSession();
    if (!s) { window.location.href = './index.html'; return null; }
    const users = this.getUsers();
    const u = users[s.username];
    if (u) LifeOS.init(s.username + '');
    return s;
  },

  isLoggedIn() { return !!this.getSession(); }
};

window.Auth = Auth;
