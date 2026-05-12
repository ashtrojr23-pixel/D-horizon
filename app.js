// ===== APP.JS — Core utilities, island, toast, init =====

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// ===== TOAST SYSTEM =====
const Toast = {
  container: null,
  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  show(msg, type = 'info', duration = 3500) {
    if (!this.container) this.init();
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warn: '⚠️' };
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span>${icons[type] || '💬'}</span><span>${msg}</span>`;
    this.container.appendChild(t);
    setTimeout(() => {
      t.classList.add('removing');
      setTimeout(() => t.remove(), 350);
    }, duration);
  }
};
window.Toast = Toast;
Toast.init();

// ===== DYNAMIC ISLAND =====
const Island = {
  el: null,
  timeEl: null,
  _interval: null,

  init() {
    this.el = document.getElementById('dynamic-island');
    this.timeEl = document.getElementById('island-time');
    if (!this.el) return;

    // Click to expand/contract
    const compact = document.getElementById('island-compact');
    if (compact) {
      compact.addEventListener('click', () => this.expand());
    }

    const closeBtn = document.getElementById('island-close');
    if (closeBtn) closeBtn.addEventListener('click', (e) => { e.stopPropagation(); this.contract(); });

    // Clock
    this._updateTime();
    this._interval = setInterval(() => this._updateTime(), 1000);

    // Mark active nav
    const links = this.el.querySelectorAll('.island-nav-link');
    const path = window.location.pathname.split('/').pop() || 'index.html';
    links.forEach(l => {
      const href = l.getAttribute('href') || '';
      if (href.includes(path) || (path === 'index.html' && href.includes('index'))) {
        l.classList.add('active');
      }
    });

    // Sidebar links
    const sideLinks = document.querySelectorAll('.sidebar-link');
    sideLinks.forEach(l => {
      const href = l.getAttribute('href') || '';
      if (href.includes(path)) l.classList.add('active');
    });

    // Sidebar toggle
    const sbBtn = document.getElementById('sidebar-btn');
    const sbOverlay = document.getElementById('sidebar-overlay');
    const sb = document.getElementById('sidebar');
    if (sbBtn && sb) {
      sbBtn.addEventListener('click', () => { sb.classList.toggle('active'); sbOverlay.classList.toggle('active'); });
      sbOverlay.addEventListener('click', () => { sb.classList.remove('active'); sbOverlay.classList.remove('active'); });
    }
  },

  _updateTime() {
    if (!this.timeEl) return;
    const now = new Date();
    this.timeEl.textContent = now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true });
  },

  expand() {
    if (this.el) this.el.classList.add('expanded');
  },

  contract() {
    if (this.el) this.el.classList.remove('expanded');
  }
};
window.Island = Island;

// ===== RIPPLE EFFECT =====
document.addEventListener('click', (e) => {
  const target = e.target.closest('.btn, .cat-tab');
  if (!target) return;
  const rect = target.getBoundingClientRect();
  const r = document.createElement('span');
  r.className = 'ripple-effect';
  const size = Math.max(rect.width, rect.height);
  r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px;`;
  target.style.position = 'relative';
  target.style.overflow = 'hidden';
  target.appendChild(r);
  setTimeout(() => r.remove(), 700);
});

// ===== FORMAT HELPERS =====
const fmt = {
  ksh: (n) => `KSh ${Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
  date: (d) => new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }),
  daysLeft: (targetDate) => {
    const now = new Date(); now.setHours(0,0,0,0);
    const t = new Date(targetDate); t.setHours(0,0,0,0);
    return Math.ceil((t - now) / (1000 * 60 * 60 * 24));
  },
  countdown: (targetDate) => {
    const now = new Date();
    const t = new Date(targetDate);
    const diff = t - now;
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, expired: true };
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s, expired: false };
  },
  planCategory: (targetDate) => {
    const days = fmt.daysLeft(targetDate);
    if (days < 0) return 'expired';
    if (days <= 180) return 'short'; // 0–6 months
    if (days <= 1095) return 'long'; // 6 months–3 years
    return 'future'; // 3+ years
  },
  categoryLabel: (cat) => {
    return { short: 'Short-Term', long: 'Long-Term', future: 'The Future', expired: 'Expired' }[cat] || cat;
  }
};
window.fmt = fmt;

// ===== PAGE ENTRANCE ANIMATION =====
document.addEventListener('DOMContentLoaded', () => {
  const pw = document.querySelector('.page-wrapper');
  if (pw) {
    pw.style.opacity = '0';
    pw.style.transform = 'translateY(10px)';
    requestAnimationFrame(() => {
      pw.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      pw.style.opacity = '1';
      pw.style.transform = 'translateY(0)';
    });
  }
  Island.init();
});

// ===== MODAL HELPER =====
const Modal = {
  open(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.add('active'); document.body.style.overflow = 'hidden'; }
  },
  close(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.remove('active'); document.body.style.overflow = ''; }
  },
  closeAll() {
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
  }
};
window.Modal = Modal;

// Close modals on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) Modal.closeAll();
});

// ===== FINANCIAL WIDGET UPDATER =====
function updateFinanceWidget() {
  const goals = LifeOS.getGoals();
  const total = goals.reduce((s, g) => s + (Number(g.price) || 0), 0);
  const achieved = goals.filter(g => g.achieved).reduce((s, g) => s + (Number(g.price) || 0), 0);
  const pending = total - achieved;

  const totalEl = document.getElementById('fw-total');
  const achievedEl = document.getElementById('fw-achieved');
  const pendingEl = document.getElementById('fw-pending');
  if (totalEl) totalEl.textContent = fmt.ksh(total);
  if (achievedEl) achievedEl.textContent = fmt.ksh(achieved);
  if (pendingEl) pendingEl.textContent = fmt.ksh(pending);
}
window.updateFinanceWidget = updateFinanceWidget;

// ===== STAR FIELD =====
function initStarField(container) {
  if (!container) return;
  for (let i = 0; i < 40; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 2 + 1;
    star.style.cssText = `
      width:${size}px;height:${size}px;
      left:${Math.random()*100}%;top:${Math.random()*100}%;
      --dur:${2 + Math.random()*4}s;
      --del:${Math.random()*4}s;
      opacity:${0.1 + Math.random()*0.3};
    `;
    container.appendChild(star);
  }
}
window.initStarField = initStarField;

// ===== ANIMATE COUNT UP =====
function animateCount(el, from, to, duration = 800, prefix = '', suffix = '') {
  const start = performance.now();
  const update = (time) => {
    const progress = Math.min((time - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const val = Math.round(from + (to - from) * ease);
    el.textContent = prefix + val.toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}
window.animateCount = animateCount;

// ===== UUID =====
function uuid() {
  return 'xxxx-xxxx-4xxx-yxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}
window.uuid = uuid;
