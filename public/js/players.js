// Players Module
window.PlayersModule = (() => {
  const dialog = document.getElementById('playerDialog');
  const form = document.getElementById('playerForm');
  const addBtn = document.getElementById('addPlayerBtn');
  const searchInput = document.getElementById('searchPlayerInput');
  const filterTeamSelect = document.getElementById('filterPlayerTeam');

  let allPlayersList = [];

  // Initialization
  document.addEventListener('DOMContentLoaded', () => {
    if (addBtn) {
      addBtn.addEventListener('click', () => openModal());
    }
    if (form) {
      form.addEventListener('submit', handleSubmit);
    }
    if (searchInput) {
      searchInput.addEventListener('input', renderPlayersTable);
    }
    if (filterTeamSelect) {
      filterTeamSelect.addEventListener('change', renderPlayersTable);
    }
  });

  const openModal = (player = null) => {
    if (!dialog) return;
    form.reset();
    document.getElementById('player_id').value = '';
    document.getElementById('playerModalTitle').textContent = 'Add Player';

    if (player) {
      document.getElementById('playerModalTitle').textContent = 'Edit Player Details';
      document.getElementById('player_id').value = player.id;
      document.getElementById('player_team_id').value = player.team_id;
      document.getElementById('player_ign').value = player.in_game_name;
      document.getElementById('player_real_name').value = player.real_name;
      document.getElementById('player_role').value = player.role;
    }
    dialog.showModal();
  };

  const loadPlayers = async () => {
    try {
      const response = await fetch('/api/players');
      const data = await response.json();

      if (data.success) {
        allPlayersList = data.players;
        renderPlayersTable();
      } else {
        window.App.showToast('Failed to load players roster.', 'error');
      }
    } catch (err) {
      console.error('Error loading players:', err);
    }
  };

  const renderPlayersTable = () => {
    const tbody = document.getElementById('playersTableBody');
    if (!tbody) return;

    const query = searchInput.value.toLowerCase().trim();
    const teamFilter = filterTeamSelect.value;

    const filtered = allPlayersList.filter(p => {
      const matchesSearch = p.in_game_name.toLowerCase().includes(query) || 
                            p.real_name.toLowerCase().includes(query) ||
                            p.role.toLowerCase().includes(query);
      const matchesTeam = teamFilter === '' || p.team_id == teamFilter;
      return matchesSearch && matchesTeam;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="p-8 text-center text-slate-500">No players found matching roster search criteria.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(p => `
      <tr class="hover:bg-slate-900/30 transition-all border-b border-slate-900/60">
        <td class="p-4 font-bold text-white font-mono text-xs">${p.in_game_name}</td>
        <td class="p-4 text-slate-200">${p.real_name}</td>
        <td class="p-4 text-slate-400 text-xs font-semibold">${p.team_name}</td>
        <td class="p-4">
          <span class="px-2 py-0.5 text-xs rounded bg-slate-800 text-slate-300 border border-slate-700/50">
            ${p.role || 'Player'}
          </span>
        </td>
        ${window.App.isAdmin() ? `
          <td class="p-4 text-right">
            <div class="flex gap-2 justify-end">
              <button onclick="PlayersModule.editPlayer(${p.id})" 
                class="px-2 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-all">
                Edit
              </button>
              <button onclick="PlayersModule.deletePlayer(${p.id})"
                class="px-2 py-1 text-xs font-semibold rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/40 cursor-pointer transition-all">
                Delete
              </button>
            </div>
          </td>
        ` : ''}
      </tr>
    `).join('');

    // Toggle column visibility based on role
    const headerActions = document.querySelector('th.admin-only');
    if (headerActions) {
      if (window.App.isAdmin()) {
        headerActions.classList.remove('hidden');
      } else {
        headerActions.classList.add('hidden');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const id = document.getElementById('player_id').value;
    const team_id = document.getElementById('player_team_id').value;
    const in_game_name = document.getElementById('player_ign').value.trim();
    const real_name = document.getElementById('player_real_name').value.trim();
    const role = document.getElementById('player_role').value.trim();

    if (!team_id) {
      window.App.showToast('Please select a team for the player.', 'error');
      return;
    }

    const payload = { team_id, in_game_name, real_name, role };
    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `/api/players/${id}` : '/api/players';

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
        window.App.showToast(data.message || 'Player details saved.');
        dialog.close();
        loadPlayers();
      } else {
        window.App.showToast(data.message || 'Failed to save player.', 'error');
      }
    } catch (err) {
      console.error('Error submitting player:', err);
      window.App.showToast('Network error, please try again.', 'error');
    }
  };

  const editPlayer = (id) => {
    const player = allPlayersList.find(p => p.id === id);
    if (player) {
      openModal(player);
    } else {
      window.App.showToast('Player details not found.', 'error');
    }
  };

  const deletePlayer = async (id) => {
    if (!confirm('Are you sure you want to remove this player from the roster?')) return;

    try {
      const response = await fetch(`/api/players/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${window.App.getToken()}`
        }
      });

      const data = await response.json();
      if (data.success) {
        window.App.showToast('Player removed from roster.');
        loadPlayers();
      } else {
        window.App.showToast(data.message || 'Failed to remove player.', 'error');
      }
    } catch (err) {
      console.error('Error deleting player:', err);
    }
  };

  return {
    loadPlayers,
    editPlayer,
    deletePlayer
  };
})();
