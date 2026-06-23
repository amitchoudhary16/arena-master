// Matches Module
window.MatchesModule = (() => {
  const scheduleDialog = document.getElementById('matchDialog');
  const scheduleForm = document.getElementById('matchForm');
  const scheduleBtn = document.getElementById('scheduleMatchBtn');

  const scoreDialog = document.getElementById('matchScoreDialog');
  const scoreForm = document.getElementById('matchScoreForm');

  // Initialization
  document.addEventListener('DOMContentLoaded', () => {
    if (scheduleBtn) {
      scheduleBtn.addEventListener('click', openScheduleModal);
    }
    if (scheduleForm) {
      scheduleForm.addEventListener('submit', handleScheduleSubmit);
    }
    if (scoreForm) {
      scoreForm.addEventListener('submit', handleScoreSubmit);
    }

    // Connect filters to reload matches list
    const fTourney = document.getElementById('filterMatchTournament');
    const fGame = document.getElementById('filterMatchGame');
    const fStatus = document.getElementById('filterMatchStatus');

    if (fTourney) fTourney.addEventListener('change', () => loadMatches(false));
    if (fGame) fGame.addEventListener('change', () => loadMatches(false));
    if (fStatus) fStatus.addEventListener('change', () => loadMatches(false));

    // Dynamic team loading when tournament select changes in schedule modal
    const scheduleTourneySelect = document.getElementById('match_tournament_id');
    if (scheduleTourneySelect) {
      scheduleTourneySelect.addEventListener('change', (e) => {
        loadTournamentTeamsForScheduling(e.target.value);
      });
    }
  });

  // Open scheduling modal & load tournaments options
  const openScheduleModal = async () => {
    if (!scheduleDialog) return;
    scheduleForm.reset();
    
    const tourneySelect = document.getElementById('match_tournament_id');
    const team1Select = document.getElementById('match_team1_id');
    const team2Select = document.getElementById('match_team2_id');

    tourneySelect.innerHTML = '<option value="">Loading tournaments...</option>';
    team1Select.innerHTML = '<option value="">Select Tournament first</option>';
    team2Select.innerHTML = '<option value="">Select Tournament first</option>';

    try {
      const response = await fetch('/api/tournaments');
      const data = await response.json();

      if (data.success) {
        // Only allow scheduling in upcoming and live tournaments
        const activeTourneys = data.tournaments.filter(t => t.status !== 'completed');
        
        tourneySelect.innerHTML = '<option value="">Select Tournament</option>' + 
          activeTourneys.map(t => `<option value="${t.id}">${t.name} (${t.game})</option>`).join('');

        if (activeTourneys.length === 0) {
          tourneySelect.innerHTML = '<option value="">No active tournaments available</option>';
        }
      }
    } catch (err) {
      console.error('Error loading tournaments:', err);
    }

    scheduleDialog.showModal();
  };

  // Load teams registered in select tournament
  const loadTournamentTeamsForScheduling = async (tournamentId) => {
    const team1Select = document.getElementById('match_team1_id');
    const team2Select = document.getElementById('match_team2_id');

    if (!tournamentId) {
      team1Select.innerHTML = '<option value="">Select Tournament first</option>';
      team2Select.innerHTML = '<option value="">Select Tournament first</option>';
      return;
    }

    team1Select.innerHTML = '<option value="">Loading teams...</option>';
    team2Select.innerHTML = '<option value="">Loading teams...</option>';

    try {
      const response = await fetch(`/api/teams/tournament/${tournamentId}`);
      const data = await response.json();

      if (data.success) {
        if (data.teams.length < 2) {
          const errorMsg = '<option value="">Need at least 2 teams assigned</option>';
          team1Select.innerHTML = errorMsg;
          team2Select.innerHTML = errorMsg;
          window.App.showToast('Please assign at least 2 approved teams to this tournament first!', 'error');
          return;
        }

        const options = data.teams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
        team1Select.innerHTML = '<option value="">Select Team 1</option>' + options;
        team2Select.innerHTML = '<option value="">Select Team 2</option>' + options;
      }
    } catch (err) {
      console.error('Error loading teams for tournament:', err);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();

    const tournament_id = document.getElementById('match_tournament_id').value;
    const team1_id = document.getElementById('match_team1_id').value;
    const team2_id = document.getElementById('match_team2_id').value;
    const match_time = document.getElementById('match_time').value;

    if (team1_id === team2_id) {
      window.App.showToast('Teams must be different.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.App.getToken()}`
        },
        body: JSON.stringify({ tournament_id, team1_id, team2_id, match_time })
      });

      const data = await response.json();
      if (data.success) {
        window.App.showToast(data.message || 'Match scheduled successfully.');
        scheduleDialog.close();
        loadMatches(false);
      } else {
        window.App.showToast(data.message || 'Failed to schedule match.', 'error');
      }
    } catch (err) {
      console.error('Error scheduling:', err);
    }
  };

  // Open Score/Winner/Status edit modal
  const openScoreModal = (match) => {
    if (!scoreDialog) return;

    scoreForm.reset();
    document.getElementById('score_match_id').value = match.id;
    document.getElementById('score_match_status').value = match.status;

    // Set scores
    document.getElementById('score_team1_score').value = match.team1_score || 0;
    document.getElementById('score_team2_score').value = match.team2_score || 0;

    // Set team labels
    document.getElementById('score_team1_label').textContent = `${match.team1_name} Score`;
    document.getElementById('score_team2_label').textContent = `${match.team2_name} Score`;

    // Populate Winner Dropdown dynamically with match teams
    const winnerSelect = document.getElementById('score_winner_id');
    winnerSelect.innerHTML = `
      <option value="">Draw / No Winner</option>
      <option value="${match.team1_id}" ${match.winner_id == match.team1_id ? 'selected' : ''}>${match.team1_name}</option>
      <option value="${match.team2_id}" ${match.winner_id == match.team2_id ? 'selected' : ''}>${match.team2_name}</option>
    `;

    // Toggle score containers based on status
    const statusSelect = document.getElementById('score_match_status');
    const winnerContainer = document.getElementById('winner_id_container');

    const toggleInputsByStatus = () => {
      const isCompleted = statusSelect.value === 'completed';
      if (isCompleted) {
        winnerContainer.classList.remove('hidden');
      } else {
        winnerContainer.classList.add('hidden');
      }
    };

    statusSelect.removeEventListener('change', toggleInputsByStatus);
    statusSelect.addEventListener('change', toggleInputsByStatus);
    toggleInputsByStatus();

    scoreDialog.showModal();
  };

  const handleScoreSubmit = async (e) => {
    e.preventDefault();

    const id = document.getElementById('score_match_id').value;
    const status = document.getElementById('score_match_status').value;
    const team1_score = document.getElementById('score_team1_score').value;
    const team2_score = document.getElementById('score_team2_score').value;
    const winner_id = document.getElementById('score_winner_id').value;

    const payload = { status, team1_score, team2_score, winner_id: winner_id || null };

    try {
      const response = await fetch(`/api/matches/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.App.getToken()}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        window.App.showToast(data.message || 'Match score updated.');
        scoreDialog.close();
        loadMatches(false);
      } else {
        window.App.showToast(data.message || 'Failed to update match scores.', 'error');
      }
    } catch (err) {
      console.error('Error updating score:', err);
    }
  };

  // Load and render matches list
  const loadMatches = async (isHistoryOnly = false) => {
    const container = document.getElementById(isHistoryOnly ? 'historyMatchesList' : 'matchesList');
    if (!container) return;

    // Sync filter dropdown options if scheduling
    if (!isHistoryOnly) {
      syncFilterSelectors();
    }

    try {
      let endpoint = '/api/matches';
      if (isHistoryOnly) {
        endpoint += '?status=completed';
      } else {
        // Collect filters from DOM
        const tourneyId = document.getElementById('filterMatchTournament').value;
        const game = document.getElementById('filterMatchGame').value;
        const status = document.getElementById('filterMatchStatus').value;

        const queries = [];
        if (tourneyId) queries.push(`tournament_id=${tourneyId}`);
        if (game) queries.push(`game=${encodeURIComponent(game)}`);
        if (status) queries.push(`status=${status}`);

        if (queries.length > 0) {
          endpoint += '?' + queries.join('&');
        }
      }

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.success) {
        if (data.matches.length === 0) {
          container.innerHTML = `
            <div class="text-center py-16 border border-dashed border-slate-800 rounded-3xl">
              <p class="text-slate-500">No matches found matching criteria.</p>
            </div>
          `;
          return;
        }

        container.innerHTML = data.matches.map(m => {
          let statusBadge = '';
          if (m.status === 'live') {
            statusBadge = '<span class="status-badge px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-red-950/60 border border-red-500/30 text-red-400 animate-pulse">LIVE</span>';
          } else if (m.status === 'completed') {
            statusBadge = '<span class="status-badge px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-green-950/60 border border-green-500/30 text-green-400">COMPLETED</span>';
          } else {
            statusBadge = '<span class="status-badge px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-slate-800 border border-slate-700/60 text-slate-300">UPCOMING</span>';
          }

          const matchDateTime = new Date(m.match_time).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
          });

          return `
            <div class="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 relative">
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-2 mb-3">
                  <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">${m.tournament_name}</span>
                  <span class="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-semibold">${m.game}</span>
                  ${statusBadge}
                </div>
                
                <!-- Arena Row: Team 1 VS Team 2 -->
                <div class="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 my-2">
                  <div class="flex items-center gap-3 w-48 shrink-0">
                    <img src="${m.team1_logo}" alt="Logo" class="w-8 h-8 rounded bg-slate-900 border border-slate-800 p-1 shrink-0">
                    <span class="team-1-name text-sm font-bold text-slate-200 truncate ${m.winner_id == m.team1_id ? 'text-orange-400' : ''}">
                      ${m.team1_name}
                    </span>
                  </div>
                  
                  <div class="flex items-center gap-3 shrink-0 font-mono text-slate-500 text-xs">
                    <div class="bg-slate-950 border border-slate-850 px-2 py-1 rounded text-white font-bold text-sm min-w-[28px] text-center">
                      <span class="team-1-score">${m.team1_score || 0}</span>
                    </div>
                    <span>VS</span>
                    <div class="bg-slate-950 border border-slate-850 px-2 py-1 rounded text-white font-bold text-sm min-w-[28px] text-center">
                      <span class="team-2-score">${m.team2_score || 0}</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-3 w-48 shrink-0">
                    <img src="${m.team2_logo}" alt="Logo" class="w-8 h-8 rounded bg-slate-900 border border-slate-800 p-1 shrink-0">
                    <span class="team-2-name text-sm font-bold text-slate-200 truncate ${m.winner_id == m.team2_id ? 'text-orange-400' : ''}">
                      ${m.team2_name}
                    </span>
                  </div>
                </div>

                <!-- Match Schedule Time -->
                <div class="text-[11px] font-semibold text-slate-500 font-mono flex items-center gap-1.5 mt-3">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span>${matchDateTime}</span>
                </div>
              </div>

              <!-- Winner announcements & Admin panel buttons -->
              <div class="flex flex-col justify-center items-end shrink-0 gap-3 border-t md:border-t-0 border-slate-800/80 pt-4 md:pt-0">
                ${m.status === 'completed' ? `
                  <div class="bg-orange-950/20 text-orange-400 border border-orange-900/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 winner-announcement">
                    <svg class="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                    Winner: ${m.winner_name || 'Draw'}
                  </div>
                ` : ''}

                ${window.App.isAdmin() ? `
                  <div class="flex gap-2">
                    <button onclick='MatchesModule.editScore(${JSON.stringify({
                      id: m.id,
                      status: m.status,
                      team1_id: m.team1_id,
                      team1_name: m.team1_name,
                      team1_score: m.team1_score,
                      team2_id: m.team2_id,
                      team2_name: m.team2_name,
                      team2_score: m.team2_score,
                      winner_id: m.winner_id
                    }).replace(/'/g, "&apos;")})' 
                      class="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer transition-all border border-slate-700/60">
                      Update Score
                    </button>
                    <button onclick="MatchesModule.deleteMatch(${m.id})"
                      class="p-2 text-xs font-semibold rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-900/40 text-red-400 cursor-pointer transition-all">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        }).join('');
      }
    } catch (err) {
      console.error('Error rendering matches:', err);
    }
  };

  const deleteMatch = async (id) => {
    if (!confirm('Are you sure you want to cancel and delete this scheduled match? This will recalculate the tournament standings.')) return;

    try {
      const response = await fetch(`/api/matches/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${window.App.getToken()}`
        }
      });

      const data = await response.json();
      if (data.success) {
        window.App.showToast('Match deleted successfully.');
        loadMatches(false);
      } else {
        window.App.showToast(data.message || 'Failed to delete match.', 'error');
      }
    } catch (err) {
      console.error('Error deleting match:', err);
    }
  };

  // Sync matches filter dropdown with current tournaments
  const syncFilterSelectors = async () => {
    const filterSelect = document.getElementById('filterMatchTournament');
    if (!filterSelect) return;

    try {
      const response = await fetch('/api/tournaments');
      const data = await response.json();

      if (data.success) {
        const currentValue = filterSelect.value;
        
        filterSelect.innerHTML = '<option value="">All Tournaments</option>' + 
          data.tournaments.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
        
        filterSelect.value = currentValue;
      }
    } catch (err) {
      console.log('Error syncing filter:', err);
    }
  };

  return {
    loadMatches,
    deleteMatch,
    editScore: openScoreModal
  };
})();
