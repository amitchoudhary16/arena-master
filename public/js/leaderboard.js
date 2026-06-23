// Leaderboard Module
window.LeaderboardModule = (() => {
  const select = document.getElementById('leaderboardTournamentSelect');

  // Initialization
  document.addEventListener('DOMContentLoaded', () => {
    if (select) {
      select.addEventListener('change', (e) => {
        loadLeaderboard(e.target.value);
      });
    }
  });

  const initLeaderboard = async () => {
    if (!select) return;

    try {
      const response = await fetch('/api/tournaments');
      const data = await response.json();

      if (data.success) {
        if (data.tournaments.length === 0) {
          select.innerHTML = '<option value="">No tournaments available</option>';
          document.getElementById('leaderboardTableBody').innerHTML = `
            <tr>
              <td colspan="7" class="p-8 text-center text-slate-500">Create a tournament to view standings.</td>
            </tr>
          `;
          return;
        }

        // Save selected value before reloading options
        const previousSelect = select.value;

        select.innerHTML = data.tournaments.map(t => `
          <option value="${t.id}">${t.name} (${t.game})</option>
        `).join('');

        // Restore previous value or load first tournament
        if (previousSelect && data.tournaments.some(t => t.id == previousSelect)) {
          select.value = previousSelect;
        } else {
          select.value = data.tournaments[0].id;
        }

        // Load points table for the active selection
        loadLeaderboard(select.value);
      }
    } catch (err) {
      console.error('Error initializing leaderboard selector:', err);
    }
  };

  const loadLeaderboard = async (tournamentId) => {
    const tbody = document.getElementById('leaderboardTableBody');
    if (!tbody || !tournamentId) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="p-8 text-center text-slate-500">Loading standings...</td>
      </tr>
    `;

    try {
      const response = await fetch(`/api/matches/leaderboard/${tournamentId}`);
      const data = await response.json();

      if (data.success) {
        if (data.leaderboard.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="7" class="p-8 text-center text-slate-500">No teams assigned to this tournament yet.</td>
            </tr>
          `;
          return;
        }

        tbody.innerHTML = data.leaderboard.map((row, index) => {
          const rank = index + 1;
          let rankBadge = '';

          // Highlighting top 3 spots with custom badges
          if (rank === 1) {
            rankBadge = '<span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-500 text-white font-extrabold text-xs shadow-lg shadow-orange-500/20">1st</span>';
          } else if (rank === 2) {
            rankBadge = '<span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-300 text-slate-900 font-extrabold text-xs shadow-lg shadow-slate-300/20">2nd</span>';
          } else if (rank === 3) {
            rankBadge = '<span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-700 text-white font-extrabold text-xs shadow-lg shadow-amber-700/20">3rd</span>';
          } else {
            rankBadge = `<span class="font-mono text-slate-400 font-bold">${rank}</span>`;
          }

          return `
            <tr class="hover:bg-slate-900/30 transition-all border-b border-slate-900/60 ${rank <= 3 ? 'bg-orange-500/[0.01]' : ''}">
              <td class="p-4 text-center">${rankBadge}</td>
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <img src="${row.team_logo}" alt="Logo" class="w-8 h-8 rounded bg-slate-900 border border-slate-800 p-1 shrink-0">
                  <span class="font-bold text-slate-200">${row.team_name}</span>
                </div>
              </td>
              <td class="p-4 text-center font-mono text-slate-300">${row.matches_played}</td>
              <td class="p-4 text-center font-mono text-emerald-400 font-bold">${row.wins}</td>
              <td class="p-4 text-center font-mono text-red-400">${row.losses}</td>
              <td class="p-4 text-center font-mono text-slate-400">${row.kills}</td>
              <td class="p-4 text-center font-mono text-orange-400 font-extrabold text-base">${row.points}</td>
            </tr>
          `;
        }).join('');
      } else {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="p-8 text-center text-red-400">Failed to load standings.</td>
          </tr>
        `;
      }
    } catch (err) {
      console.error('Error loading standings details:', err);
    }
  };

  return {
    initLeaderboard,
    loadLeaderboard
  };
})();
