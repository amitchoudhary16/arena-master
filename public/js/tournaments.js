// Tournaments Module
window.TournamentsModule = (() => {
  const dialog = document.getElementById('tournamentDialog');
  const form = document.getElementById('tournamentForm');
  const createBtn = document.getElementById('createTourneyBtn');

  // Initialization
  document.addEventListener('DOMContentLoaded', () => {
    if (createBtn) {
      createBtn.addEventListener('click', () => openModal());
    }
    if (form) {
      form.addEventListener('submit', handleSubmit);
    }
  });

  // Open modal for Creating (no ID) or Editing (with ID)
  const openModal = (tournament = null) => {
    if (!dialog) return;

    form.reset();
    document.getElementById('tourney_id').value = '';
    document.getElementById('tourneyModalTitle').textContent = 'Create Tournament';
    document.getElementById('tourney_status_container').classList.add('hidden');

    if (tournament) {
      document.getElementById('tourneyModalTitle').textContent = 'Edit Tournament';
      document.getElementById('tourney_id').value = tournament.id;
      document.getElementById('tourney_name').value = tournament.name;
      document.getElementById('tourney_game').value = tournament.game;
      
      // Formats start and end dates from ISO to YYYY-MM-DD
      document.getElementById('tourney_start').value = tournament.start_date.split('T')[0];
      document.getElementById('tourney_end').value = tournament.end_date.split('T')[0];
      document.getElementById('tourney_prize').value = tournament.prize_pool;
      document.getElementById('tourney_slots').value = tournament.slots;
      
      const statusSelect = document.getElementById('tourney_status');
      statusSelect.value = tournament.status;
      document.getElementById('tourney_status_container').classList.remove('hidden');
    }

    dialog.showModal();
  };

  // Load and render tournaments list
  const loadTournaments = async () => {
    const grid = document.getElementById('tournamentsGrid');
    if (!grid) return;

    try {
      const response = await fetch('/api/tournaments');
      const data = await response.json();

      if (data.success) {
        if (data.tournaments.length === 0) {
          grid.innerHTML = `
            <div class="col-span-full text-center py-16 border border-dashed border-slate-800 rounded-3xl">
              <p class="text-slate-500">No tournaments created yet.</p>
              ${window.App.isAdmin() ? `
                <button onclick="document.getElementById('createTourneyBtn').click()" 
                  class="mt-4 px-4 py-2 text-sm font-semibold rounded-xl bg-orange-500 hover:bg-orange-600 text-white cursor-pointer transition-all">
                  + Create First Tournament
                </button>
              ` : ''}
            </div>
          `;
          return;
        }

        grid.innerHTML = data.tournaments.map(t => {
          let statusBadge = '';
          if (t.status === 'live') {
            statusBadge = `
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-950/60 border border-red-500/30 text-red-400">
                <span class="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                LIVE NOW
              </span>
            `;
          } else if (t.status === 'completed') {
            statusBadge = `
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                COMPLETED
              </span>
            `;
          } else {
            statusBadge = `
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-800 border border-slate-700/60 text-slate-300">
                UPCOMING
              </span>
            `;
          }

          const sDate = new Date(t.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          const eDate = new Date(t.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

          return `
            <div class="glass-panel rounded-3xl p-6 border border-slate-800/80 flex flex-col justify-between hover:border-slate-700/80 transition-all group">
              <div>
                <div class="flex justify-between items-start mb-4 gap-2">
                  <span class="text-xs font-bold text-orange-500 uppercase tracking-widest">${t.game}</span>
                  ${statusBadge}
                </div>
                
                <h4 class="text-lg font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">${t.name}</h4>
                
                <div class="grid grid-cols-2 gap-4 my-5 p-3 rounded-2xl bg-slate-950/40 border border-slate-900/80 text-xs font-semibold text-slate-400 font-mono">
                  <div>
                    <span class="block text-[10px] text-slate-500 uppercase">Prize Pool</span>
                    <span class="text-sm font-bold text-white">${t.prize_pool || '₹0'}</span>
                  </div>
                  <div>
                    <span class="block text-[10px] text-slate-500 uppercase">Max Slots</span>
                    <span class="text-sm font-bold text-white">${t.slots} Teams</span>
                  </div>
                </div>

                <div class="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
                  <svg class="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <span>${sDate} - ${eDate}</span>
                </div>
              </div>

              <!-- Admin controls -->
              ${window.App.isAdmin() ? `
                <div class="flex gap-2 pt-4 border-t border-slate-800/80 mt-2">
                  <button onclick="TournamentsModule.editTournament(${t.id})" 
                    class="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-all">
                    Edit Details
                  </button>
                  <button onclick="TournamentsModule.deleteTournament(${t.id})"
                    class="px-3 py-2 text-xs font-semibold rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-900/40 text-red-400 cursor-pointer transition-all">
                    Delete
                  </button>
                </div>
              ` : `
                <div class="pt-4 border-t border-slate-800/80 mt-2 flex justify-between items-center">
                  <a href="#leaderboard" onclick="document.getElementById('leaderboardTournamentSelect').value = ${t.id}" class="text-xs text-violet-400 hover:text-violet-300 hover:underline">View Standings →</a>
                </div>
              `}
            </div>
          `;
        }).join('');
      } else {
        window.App.showToast('Failed to load tournaments.', 'error');
      }
    } catch (err) {
      console.error('Error loading tournaments:', err);
    }
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    const id = document.getElementById('tourney_id').value;
    const name = document.getElementById('tourney_name').value.trim();
    const game = document.getElementById('tourney_game').value;
    const start_date = document.getElementById('tourney_start').value;
    const end_date = document.getElementById('tourney_end').value;
    const prize_pool = document.getElementById('tourney_prize').value.trim();
    const slots = document.getElementById('tourney_slots').value;
    const status = document.getElementById('tourney_status').value;

    const payload = { name, game, start_date, end_date, prize_pool, slots, status };
    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `/api/tournaments/${id}` : '/api/tournaments';

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.App.getToken()}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        window.App.showToast(data.message || 'Tournament saved successfully.');
        dialog.close();
        loadTournaments();
      } else {
        window.App.showToast(data.message || 'Failed to save tournament.', 'error');
      }
    } catch (err) {
      console.error('Error submitting tournament:', err);
      window.App.showToast('Network error, please try again.', 'error');
    }
  };

  // Fetch detail for editing
  const editTournament = async (id) => {
    try {
      const response = await fetch(`/api/tournaments/${id}`);
      const data = await response.json();

      if (data.success) {
        openModal(data.tournament);
      } else {
        window.App.showToast('Failed to load tournament detail.', 'error');
      }
    } catch (err) {
      console.error('Error getting details:', err);
    }
  };

  // Delete action with validation alert
  const deleteTournament = async (id) => {
    if (!confirm('Are you sure you want to delete this tournament? This will delete all matches and rankings inside it.')) return;

    try {
      const response = await fetch(`/api/tournaments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${window.App.getToken()}`
        }
      });

      const data = await response.json();
      if (data.success) {
        window.App.showToast('Tournament deleted successfully.');
        loadTournaments();
      } else {
        window.App.showToast(data.message || 'Failed to delete tournament.', 'error');
      }
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  return {
    loadTournaments,
    editTournament,
    deleteTournament
  };
})();
