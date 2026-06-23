// Teams Module
window.TeamsModule = (() => {
  const dialog = document.getElementById('teamDialog');
  const form = document.getElementById('teamForm');
  const registerBtn = document.getElementById('registerTeamBtn');
  const searchInput = document.getElementById('searchTeamInput');
  const filterSelect = document.getElementById('filterTeamStatus');

  const assignDialog = document.getElementById('assignTeamDialog');
  const assignForm = document.getElementById('assignTeamForm');
  const assignBtn = document.getElementById('assignTeamBtn');

  let allTeamsList = [];

  // Initialization
  document.addEventListener('DOMContentLoaded', () => {
    if (registerBtn) {
      registerBtn.addEventListener('click', () => openModal());
    }
    if (form) {
      form.addEventListener('submit', handleSubmit);
    }
    if (searchInput) {
      searchInput.addEventListener('input', renderTeamsTable);
    }
    if (filterSelect) {
      filterSelect.addEventListener('change', renderTeamsTable);
    }

    // Assign to tournament bindings
    if (assignBtn) {
      assignBtn.addEventListener('click', openAssignModal);
    }
    if (assignForm) {
      assignForm.addEventListener('submit', handleAssignSubmit);
    }
  });

  const openModal = (team = null) => {
    if (!dialog) return;
    form.reset();
    document.getElementById('team_id').value = '';
    document.getElementById('teamModalTitle').textContent = 'Register Team';
    document.getElementById('team_status_container').classList.add('hidden');

    if (team) {
      document.getElementById('teamModalTitle').textContent = 'Edit Team Details';
      document.getElementById('team_id').value = team.id;
      document.getElementById('team_name').value = team.name;
      document.getElementById('team_logo').value = team.logo_url;
      document.getElementById('team_email').value = team.contact_email;
      document.getElementById('team_phone').value = team.contact_phone;
      
      if (window.App.isAdmin()) {
        const statusSelect = document.getElementById('team_status');
        statusSelect.value = team.status;
        document.getElementById('team_status_container').classList.remove('hidden');
      }
    }
    dialog.showModal();
  };

  const loadTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      const data = await response.json();

      if (data.success) {
        allTeamsList = data.teams;
        renderTeamsTable();
        populateRosterSelectors(); // Sync team listings for other modules
      } else {
        window.App.showToast('Failed to load teams.', 'error');
      }
    } catch (err) {
      console.error('Error loading teams:', err);
    }
  };

  const renderTeamsTable = () => {
    const tbody = document.getElementById('teamsTableBody');
    if (!tbody) return;

    const query = searchInput.value.toLowerCase().trim();
    const statusFilter = filterSelect.value;

    const filtered = allTeamsList.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(query) || 
                            t.contact_email.toLowerCase().includes(query) || 
                            t.contact_phone.includes(query);
      const matchesStatus = statusFilter === '' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="p-8 text-center text-slate-500">No teams found matching filters.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(t => {
      let badge = '';
      if (t.status === 'approved') {
        badge = '<span class="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-950/40 text-emerald-400 border border-emerald-900/30">Approved</span>';
      } else if (t.status === 'rejected') {
        badge = '<span class="px-2.5 py-1 text-xs font-bold rounded-md bg-red-950/40 text-red-400 border border-red-900/30">Rejected</span>';
      } else {
        badge = '<span class="px-2.5 py-1 text-xs font-bold rounded-md bg-yellow-950/40 text-yellow-500 border border-yellow-900/30">Pending</span>';
      }

      return `
        <tr data-id="${t.id}" class="hover:bg-slate-900/30 transition-all border-b border-slate-900/60">
          <td class="p-4">
            <img src="${t.logo_url}" alt="Logo" class="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 p-1.5 shrink-0">
          </td>
          <td class="p-4 font-bold text-white">${t.name}</td>
          <td class="p-4 font-mono text-slate-400 text-xs">${t.contact_email}</td>
          <td class="p-4 font-mono text-slate-400 text-xs">${t.contact_phone}</td>
          <td class="p-4">${badge}</td>
          <td class="p-4 text-right">
            <div class="flex gap-2 justify-end">
              <!-- Admin-specific approval options -->
              ${window.App.isAdmin() && t.status === 'pending' ? `
                <button onclick="TeamsModule.updateStatus(${t.id}, 'approved')" 
                  class="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-900/40 hover:bg-emerald-900/80 cursor-pointer transition-all">
                  Approve
                </button>
                <button onclick="TeamsModule.updateStatus(${t.id}, 'rejected')"
                  class="px-2.5 py-1 text-xs font-bold rounded-lg bg-red-950/60 text-red-400 border border-red-900/40 hover:bg-red-900/80 cursor-pointer transition-all">
                  Reject
                </button>
              ` : ''}

              <!-- Standard actions -->
              <button onclick="TeamsModule.editTeam(${t.id})" 
                class="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-all">
                Edit
              </button>
              
              ${window.App.isAdmin() ? `
                <button onclick="TeamsModule.deleteTeam(${t.id})"
                  class="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/40 cursor-pointer transition-all">
                  Delete
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const id = document.getElementById('team_id').value;
    const name = document.getElementById('team_name').value.trim();
    const logo_url = document.getElementById('team_logo').value.trim();
    const contact_email = document.getElementById('team_email').value.trim();
    const contact_phone = document.getElementById('team_phone').value.trim();
    
    const payload = { name, logo_url, contact_email, contact_phone };
    
    // Auth token is only required if modifying (PUT) or if admin is forcing (with status)
    const headers = { 'Content-Type': 'application/json' };
    if (window.App.isAdmin()) {
      headers['Authorization'] = `Bearer ${window.App.getToken()}`;
      if (id) {
        payload.status = document.getElementById('team_status').value;
      }
    }

    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `/api/teams/${id}` : '/api/teams';

    try {
      const response = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.success) {
        window.App.showToast(data.message || 'Team registration saved.');
        dialog.close();
        loadTeams();
      } else {
        window.App.showToast(data.message || 'Failed to save team.', 'error');
      }
    } catch (err) {
      console.error('Error submitting team:', err);
      window.App.showToast('Network error, please try again.', 'error');
    }
  };

  const editTeam = async (id) => {
    try {
      const response = await fetch(`/api/teams/${id}`);
      const data = await response.json();

      if (data.success) {
        openModal(data.team);
      } else {
        window.App.showToast('Failed to load team data.', 'error');
      }
    } catch (err) {
      console.error('Error fetching details:', err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const response = await fetch(`/api/teams/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.App.getToken()}`
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();
      if (data.success) {
        window.App.showToast(`Team status updated to ${status}.`);
        loadTeams();
      } else {
        window.App.showToast(data.message || 'Operation failed.', 'error');
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const deleteTeam = async (id) => {
    if (!confirm('Are you sure you want to delete this team? This deletes all players and registrations associated with it.')) return;

    try {
      const response = await fetch(`/api/teams/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${window.App.getToken()}`
        }
      });

      const data = await response.json();
      if (data.success) {
        window.App.showToast('Team records deleted.');
        loadTeams();
      } else {
        window.App.showToast(data.message || 'Failed to delete team.', 'error');
      }
    } catch (err) {
      console.error('Error deleting team:', err);
    }
  };

  // Assign to Tournament Dialog functions
  const openAssignModal = async () => {
    if (!assignDialog) return;
    
    // Clear selections
    const teamSelect = document.getElementById('assign_team_id');
    const tourneySelect = document.getElementById('assign_tournament_id');
    
    teamSelect.innerHTML = '<option value="">Loading teams...</option>';
    tourneySelect.innerHTML = '<option value="">Loading tournaments...</option>';

    try {
      // 1. Fetch approved teams
      const teamRes = await fetch('/api/teams');
      const teamData = await teamRes.json();
      
      // 2. Fetch tournaments
      const tourneyRes = await fetch('/api/tournaments');
      const tourneyData = await tourneyRes.json();

      if (teamData.success && tourneyData.success) {
        const approvedTeams = teamData.teams.filter(t => t.status === 'approved');
        
        teamSelect.innerHTML = approvedTeams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
        tourneySelect.innerHTML = tourneyData.tournaments.map(t => `<option value="${t.id}">${t.name} (${t.game})</option>`).join('');
        
        if (approvedTeams.length === 0) {
          teamSelect.innerHTML = '<option value="">No approved teams available</option>';
        }
      } else {
        window.App.showToast('Error loading details for assign dialog.', 'error');
      }
    } catch (err) {
      console.error('Error details for assign:', err);
    }

    assignDialog.showModal();
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    
    const team_id = document.getElementById('assign_team_id').value;
    const tournament_id = document.getElementById('assign_tournament_id').value;

    if (!team_id || !tournament_id) {
      window.App.showToast('Please select both a team and a tournament.', 'error');
      return;
    }

    try {
      const response = await fetch('/api/teams/register-tournament', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.App.getToken()}`
        },
        body: JSON.stringify({ team_id, tournament_id })
      });

      const data = await response.json();
      if (data.success) {
        window.App.showToast(data.message || 'Team registered to tournament.');
        assignDialog.close();
      } else {
        window.App.showToast(data.message || 'Registration failed.', 'error');
      }
    } catch (err) {
      console.error('Error assigning team:', err);
      window.App.showToast('Network error assigning team.', 'error');
    }
  };

  // Helper to sync selection options inside player views
  const populateRosterSelectors = () => {
    const playerTeamSelect = document.getElementById('player_team_id');
    const filterPlayerTeam = document.getElementById('filterPlayerTeam');
    
    if (playerTeamSelect && filterPlayerTeam) {
      const approved = allTeamsList.filter(t => t.status === 'approved');
      
      const teamOptions = approved.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
      playerTeamSelect.innerHTML = `<option value="">Select Team</option>` + teamOptions;
      
      const filterOptions = allTeamsList.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
      filterPlayerTeam.innerHTML = `<option value="">All Teams</option>` + filterOptions;
    }
  };

  return {
    loadTeams,
    editTeam,
    updateStatus,
    deleteTeam,
    allTeams: () => allTeamsList
  };
})();
