// Dashboard Module
window.DashboardModule = (() => {
  
  // Fetch statistics and populate widgets
  const loadStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();

      if (data.success) {
        const stats = data.stats;

        // Update counts
        document.getElementById('stat-tournaments').textContent = stats.tournaments;
        document.getElementById('stat-teams').textContent = stats.teams;
        document.getElementById('stat-players').textContent = stats.players;
        document.getElementById('stat-live-matches').textContent = stats.liveMatches;
        
        document.getElementById('stat-upcoming-matches').textContent = stats.upcomingMatches;
        document.getElementById('stat-completed-matches').textContent = stats.completedMatches;
        document.getElementById('stat-matches').textContent = stats.matches;

        // Render Live Matches overview
        renderLiveMatches();

        // Render Pending Registrations list
        renderPendingTeams();
      } else {
        window.App.showToast('Failed to load stats.', 'error');
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  // Fetch only live matches and list them
  const renderLiveMatches = async () => {
    const container = document.getElementById('dashboardLiveMatches');
    if (!container) return;

    try {
      const response = await fetch('/api/matches?status=live');
      const data = await response.json();

      if (data.success && data.matches.length > 0) {
        container.innerHTML = data.matches.map(m => `
          <div class="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-4 relative overflow-hidden">
            <!-- Pulsing red light -->
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
            
            <div class="flex-1 min-w-0">
              <span class="inline-block text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-red-950/60 border border-red-500/30 text-red-400 mb-2">
                ${m.game} Live Match
              </span>
              <div class="flex items-center gap-3">
                <span class="text-sm font-bold text-slate-100 truncate">${m.team1_name}</span>
                <span class="text-xs font-semibold text-slate-500 font-mono">VS</span>
                <span class="text-sm font-bold text-slate-100 truncate">${m.team2_name}</span>
              </div>
              <p class="text-[11px] text-slate-500 mt-1 font-semibold truncate">${m.tournament_name}</p>
            </div>
            
            <!-- Live score block -->
            <div class="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 font-mono shrink-0">
              <span class="text-base font-bold text-white">${m.team1_score}</span>
              <span class="text-xs text-slate-600">:</span>
              <span class="text-base font-bold text-white">${m.team2_score}</span>
            </div>
          </div>
        `).join('');
      } else {
        container.innerHTML = `
          <div class="text-center py-8 border border-dashed border-slate-800 rounded-xl">
            <svg class="w-8 h-8 text-slate-700 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            <p class="text-xs text-slate-500">No matches are live right now.</p>
          </div>
        `;
      }
    } catch (err) {
      console.error('Error rendering live matches:', err);
    }
  };

  // Fetch pending registration requests (limit to teams in pending status)
  const renderPendingTeams = async () => {
    const container = document.getElementById('dashboardPendingTeams');
    if (!container) return;

    try {
      const response = await fetch('/api/teams');
      const data = await response.json();

      if (data.success) {
        const pending = data.teams.filter(t => t.status === 'pending');

        if (pending.length > 0) {
          container.innerHTML = pending.map(t => `
            <div class="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <img src="${t.logo_url}" alt="Logo" class="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 p-1 shrink-0">
                <div class="min-w-0">
                  <span class="block text-sm font-semibold text-slate-200 truncate">${t.name}</span>
                  <span class="block text-[10px] text-slate-500 font-mono truncate">${t.contact_email}</span>
                </div>
              </div>

              <!-- Quick action buttons (only if Admin) -->
              <div class="flex gap-1.5 shrink-0">
                ${window.App.isAdmin() ? `
                  <button onclick="DashboardModule.handleAction(${t.id}, 'approved')" 
                    class="p-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/60 border border-emerald-900/40 cursor-pointer transition-all" title="Approve">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                  </button>
                  <button onclick="DashboardModule.handleAction(${t.id}, 'rejected')"
                    class="p-1.5 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/60 border border-red-900/40 cursor-pointer transition-all" title="Reject">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                ` : `
                  <span class="text-[10px] bg-yellow-950/40 text-yellow-500 border border-yellow-900/30 px-2 py-0.5 rounded-md font-semibold shrink-0">
                    Pending
                  </span>
                `}
              </div>
            </div>
          `).join('');
        } else {
          container.innerHTML = `
            <div class="text-center py-8 border border-dashed border-slate-800 rounded-xl">
              <svg class="w-8 h-8 text-slate-700 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <p class="text-xs text-slate-500"> Roster queue clear. No pending approval requests.</p>
            </div>
          `;
        }
      }
    } catch (err) {
      console.error('Error rendering pending teams:', err);
    }
  };

  // Handle Quick Approve/Reject Action
  const handleAction = async (teamId, status) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.App.getToken()}`
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();
      if (data.success) {
        window.App.showToast(`Team registration ${status === 'approved' ? 'approved' : 'rejected'} successfully.`);
        // Reload Stats & lists
        loadStats();
      } else {
        window.App.showToast(data.message || 'Operation failed.', 'error');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      window.App.showToast('Network error, please try again.', 'error');
    }
  };

  return {
    loadStats,
    handleAction
  };
})();
