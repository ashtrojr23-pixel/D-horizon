// ===== ISLAND INJECTOR =====
// Call injectIsland() in each page to inject the dynamic island and sidebar
function injectIsland(activePage) {
  const session = Auth.require();
  if (!session) return null;

  const navLinks = [
    { href: './dashboard.html', icon: '⬡', label: 'Dashboard' },
    { href: './goals.html', icon: '🎯', label: 'Goals' },
    { href: './habits.html', icon: '🔥', label: 'Habits' },
    { href: './finances.html', icon: '💰', label: 'Finances' },
    { href: './analytics.html', icon: '📊', label: 'Analytics' },
  ];

  const islandHTML = `
  <div id="dynamic-island" class="glass-strong">
    <!-- Compact state -->
    <div id="island-compact">
      <div class="island-dot"></div>
      <div class="island-logo">LifeOS</div>
      <div class="island-time" id="island-time">--:--</div>
    </div>
    <!-- Expanded state -->
    <div id="island-expanded">
      <div class="island-header-row">
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="island-dot"></div>
          <div class="island-logo">LifeOS</div>
          <div class="island-time" id="island-time-exp"></div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="text-xs text-dim">👋 ${session.name}</span>
          <button onclick="Auth.logout()" class="btn btn-glass btn-sm" style="padding:6px 12px;font-size:0.75rem;">Sign Out</button>
          <button id="island-close" class="island-close-btn">✕</button>
        </div>
      </div>
      <nav class="island-nav">
        ${navLinks.map(l => `
          <a href="${l.href}" class="island-nav-link ${l.href.includes(activePage) ? 'active' : ''}">
            <span class="nav-icon">${l.icon}</span>${l.label}
          </a>`).join('')}
      </nav>
    </div>
  </div>

  <!-- Sidebar (mobile) -->
  <div id="sidebar-overlay"></div>
  <div id="sidebar">
    <div style="margin-bottom:16px;padding:0 8px;">
      <div class="island-logo" style="font-size:1.2rem;">LifeOS</div>
      <div class="text-xs text-dim mt-4">👋 ${session.name}</div>
    </div>
    ${navLinks.map(l => `
      <a href="${l.href}" class="sidebar-link ${l.href.includes(activePage) ? 'active' : ''}">
        ${l.icon} ${l.label}
      </a>`).join('')}
    <div style="margin-top:auto;padding-top:24px;">
      <button onclick="Auth.logout()" class="btn btn-glass w-full" style="justify-content:center;">Sign Out</button>
    </div>
  </div>

  <!-- Finance Widget -->
  <div id="finance-widget">
    <div class="fw-item">
      <div class="fw-label">Total Dreams</div>
      <div class="fw-value text-blue" id="fw-total">KSh 0</div>
    </div>
    <div class="fw-divider"></div>
    <div class="fw-item">
      <div class="fw-label">Achieved</div>
      <div class="fw-value text-green" id="fw-achieved">KSh 0</div>
    </div>
    <div class="fw-divider"></div>
    <div class="fw-item">
      <div class="fw-label">Pending</div>
      <div class="fw-value text-pink" id="fw-pending">KSh 0</div>
    </div>
  </div>

  <div id="toast-container"></div>
  `;

  document.body.insertAdjacentHTML('beforeend', islandHTML);
  return session;
}

window.injectIsland = injectIsland;
