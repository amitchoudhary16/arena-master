// Global Application State & Router
window.App = {
  // Check if admin is logged in
  isAdmin: () => !!localStorage.getItem('adminToken'),
  
  // Get auth token for requests
  getToken: () => localStorage.getItem('adminToken'),

  // Get active panel name
  getActivePanel: () => {
    const hash = window.location.hash.substring(1);
    return ['dashboard', 'tournaments', 'teams', 'players', 'matches', 'leaderboard', 'history'].includes(hash) ? hash : 'dashboard';
  },

  // Toast Notification Helper
  showToast: (message, type = 'success') => {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `p-4 rounded-xl shadow-lg border text-sm flex items-center justify-between pointer-events-auto min-w-[280px] animate-bounce-short ${
      type === 'error'
        ? 'bg-red-950/90 border-red-500/40 text-red-200'
        : 'bg-slate-900/95 border-emerald-500/40 text-emerald-200'
    }`;
    
    toast.innerHTML = `
      <span>${message}</span>
      <button class="ml-4 text-slate-400 hover:text-white font-bold cursor-pointer" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
};

// Initial Setup when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  setupAuthenticationUI();
  setupNavigationRouter();
  setupMobileSidebar();
  setupDialogBackdropListeners();
  setupCSVExportButton();

  // Populate dynamic header date
  const headerDate = document.getElementById('headerDate');
  if (headerDate) {
    headerDate.textContent = new Date().toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  // Trigger initial routing
  navigatePanel();
});

// 1. Authentication State UI management
function setupAuthenticationUI() {
  const adminBox = document.getElementById('adminStatusBox');
  const adminOnlyElements = document.querySelectorAll('.admin-only');

  if (window.App.isAdmin()) {
    // Show Admin UI elements
    adminOnlyElements.forEach(el => el.classList.remove('hidden'));

    // Render Admin Logged In box
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    if (adminBox) {
      adminBox.innerHTML = `
        <div class="flex items-center gap-2 mb-1">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="text-xs font-bold text-slate-300">Admin Mode</span>
        </div>
        <div class="text-[11px] text-slate-500 font-mono mb-2 truncate">User: ${adminUser.username || 'admin'}</div>
        <button id="logoutBtn" class="w-full py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-400 border border-slate-700/60 transition-all cursor-pointer">
          Logout
        </button>
      `;
      document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        window.App.showToast('Logged out successfully.');
        setTimeout(() => window.location.reload(), 800);
      });
    }
  } else {
    // Hide Admin UI elements
    adminOnlyElements.forEach(el => el.classList.add('hidden'));

    // Render Guest login links
    if (adminBox) {
      adminBox.innerHTML = `
        <a href="login.html" class="w-full py-2.5 text-center text-xs font-bold rounded-xl bg-linear-to-r from-orange-500/10 to-violet-600/10 hover:from-orange-500/20 hover:to-violet-600/20 text-orange-400 hover:text-orange-300 border border-orange-500/20 hover:border-orange-500/40 transition-all block">
          Admin Portal Login
        </a>
      `;
    }
  }
}

// 2. Client Side Routing and view switching
function setupNavigationRouter() {
  window.addEventListener('hashchange', navigatePanel);
  
  // Sidebar links click
  const links = document.querySelectorAll('.sidebar-link');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      // Close mobile drawer on link click
      closeMobileSidebar();
    });
  });
}

function navigatePanel() {
  const activePanel = window.App.getActivePanel();
  
  // 1. Hide all panels
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  
  // 2. Show active panel
  const panelEl = document.getElementById(`${activePanel}-panel`);
  if (panelEl) {
    panelEl.classList.remove('hidden');
  }

  // 3. Update Title in header
  const titleEl = document.getElementById('panel-title');
  if (titleEl) {
    titleEl.textContent = activePanel === 'history' ? 'Match History' : activePanel;
  }

  // 4. Update sidebar link active class
  document.querySelectorAll('.sidebar-link').forEach(link => {
    if (link.getAttribute('data-panel') === activePanel) {
      link.classList.add('sidebar-link-active');
      link.classList.remove('text-slate-400');
    } else {
      link.classList.remove('sidebar-link-active');
      link.classList.add('text-slate-400');
    }
  });

  // 5. Toggle Export CSV button visibility (only show on Teams, Matches, Leaderboard, History)
  const exportBtn = document.getElementById('exportCsvBtn');
  if (exportBtn) {
    if (['teams', 'matches', 'history'].includes(activePanel)) {
      exportBtn.classList.remove('hidden');
      exportBtn.classList.add('flex');
    } else {
      exportBtn.classList.add('hidden');
      exportBtn.classList.remove('flex');
    }
  }

  // 6. Trigger data fetch for active panel
  triggerPanelDataFetch(activePanel);
}

// Map panel names to their update triggers
function triggerPanelDataFetch(panelName) {
  switch (panelName) {
    case 'dashboard':
      if (window.DashboardModule) window.DashboardModule.loadStats();
      break;
    case 'tournaments':
      if (window.TournamentsModule) window.TournamentsModule.loadTournaments();
      break;
    case 'teams':
      if (window.TeamsModule) window.TeamsModule.loadTeams();
      break;
    case 'players':
      if (window.PlayersModule) window.PlayersModule.loadPlayers();
      break;
    case 'matches':
      if (window.MatchesModule) window.MatchesModule.loadMatches(false);
      break;
    case 'leaderboard':
      if (window.LeaderboardModule) window.LeaderboardModule.initLeaderboard();
      break;
    case 'history':
      if (window.MatchesModule) window.MatchesModule.loadMatches(true);
      break;
  }
}

// 3. Mobile Navigation Drawers
function setupMobileSidebar() {
  const menuBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (menuBtn && sidebar && overlay) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.remove('-translate-x-full');
      overlay.classList.remove('hidden');
    });
    overlay.addEventListener('click', closeMobileSidebar);
  }
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar && overlay) {
    sidebar.classList.add('-translate-x-full');
    overlay.classList.add('hidden');
  }
}

// 4. Fallback Light Dismiss Check for Safari (Dialog Element Click Outside Close)
function setupDialogBackdropListeners() {
  const dialogs = document.querySelectorAll('dialog');
  
  // Only apply custom JS handler if the browser does NOT natively support closedby attribute
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    dialogs.forEach(dialog => {
      dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;
        
        const rect = dialog.getBoundingClientRect();
        const isClickInside = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );

        if (!isClickInside) {
          dialog.close();
        }
      });
    });
  }
}

// 5. CSV Export Helper
function setupCSVExportButton() {
  const exportBtn = document.getElementById('exportCsvBtn');
  if (!exportBtn) return;

  exportBtn.addEventListener('click', () => {
    const activePanel = window.App.getActivePanel();
    
    if (activePanel === 'teams') {
      exportTeamsToCSV();
    } else if (activePanel === 'matches' || activePanel === 'history') {
      exportMatchesToCSV(activePanel === 'history');
    }
  });
}

// Helper to convert arrays of objects to downloadable CSV files
function downloadCSV(csvContent, fileName) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 5a. Team List CSV Exporter
function exportTeamsToCSV() {
  // Query team list elements
  const rows = document.querySelectorAll('#teamsTableBody tr');
  if (rows.length === 0) {
    window.App.showToast('No team records available to export.', 'error');
    return;
  }

  let csv = 'ID,Team Name,Contact Email,Phone,Status\n';
  
  rows.forEach(tr => {
    // If it's the "No teams found" placeholder, skip
    if (tr.querySelector('td[colspan]')) return;

    const cells = tr.querySelectorAll('td');
    if (cells.length < 5) return;
    
    const id = tr.getAttribute('data-id') || '';
    const name = cells[1].textContent.trim();
    const email = cells[2].textContent.trim();
    const phone = cells[3].textContent.trim();
    const status = cells[4].textContent.trim();

    csv += `"${id}","${name}","${email}","${phone}","${status}"\n`;
  });

  downloadCSV(csv, 'esports_teams.csv');
  window.App.showToast('Teams data exported to CSV!');
}

// 5b. Match Schedule CSV Exporter
function exportMatchesToCSV(isHistory) {
  const matchCards = document.querySelectorAll(isHistory ? '#historyMatchesList > div' : '#matchesList > div');
  if (matchCards.length === 0) {
    window.App.showToast('No matches available to export.', 'error');
    return;
  }

  let csv = 'Tournament,Game,Team 1,Score 1,Team 2,Score 2,Status,Winner\n';
  
  matchCards.forEach(card => {
    if (card.querySelector('p')?.textContent.includes('No matches')) return;

    const tourney = card.querySelector('.text-xs.font-bold')?.textContent.trim() || '';
    const game = card.querySelector('.text-xs.bg-slate-800')?.textContent.trim() || '';
    
    // Parse team details
    const team1El = card.querySelector('.team-1-name');
    const team2El = card.querySelector('.team-2-name');
    const score1El = card.querySelector('.team-1-score');
    const score2El = card.querySelector('.team-2-score');
    
    const team1 = team1El ? team1El.textContent.trim() : '';
    const team2 = team2El ? team2El.textContent.trim() : '';
    const score1 = score1El ? score1El.textContent.trim() : '0';
    const score2 = score2El ? score2El.textContent.trim() : '0';
    
    // Parse status and winner
    const statusEl = card.querySelector('.status-badge');
    const status = statusEl ? statusEl.textContent.trim() : '';
    
    const winnerEl = card.querySelector('.winner-announcement');
    const winner = winnerEl ? winnerEl.textContent.replace('Winner:', '').trim() : 'None';

    csv += `"${tourney}","${game}","${team1}","${score1}","${team2}","${score2}","${status}","${winner}"\n`;
  });

  downloadCSV(csv, isHistory ? 'esports_match_history.csv' : 'esports_match_schedule.csv');
  window.App.showToast('Matches data exported to CSV!');
}
