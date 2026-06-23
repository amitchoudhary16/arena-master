const db = require('../config/db');

// List all teams (Public)
exports.getAllTeams = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM teams ORDER BY created_at DESC');
    res.json({ success: true, teams: rows });
  } catch (err) {
    console.error('Error getting teams:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve teams.' });
  }
};

// Get team by ID (Public)
exports.getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM teams WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }
    res.json({ success: true, team: rows[0] });
  } catch (err) {
    console.error('Error getting team:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve team details.' });
  }
};

// Register a team (Public / Admin)
// Default status is 'pending' when registered by users
exports.registerTeam = async (req, res) => {
  try {
    const { name, logo_url, contact_email, contact_phone } = req.body;

    // Validation
    if (!name || !contact_email || !contact_phone) {
      return res.status(400).json({ success: false, message: 'Team Name, Contact Email, and Phone number are required.' });
    }

    // Default logo using Dicebear if empty
    const finalLogo = logo_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`;

    const query = `
      INSERT INTO teams (name, logo_url, contact_email, contact_phone, status)
      VALUES (?, ?, ?, ?, 'pending')
    `;

    const [result] = await db.query(query, [name, finalLogo, contact_email, contact_phone]);

    res.status(201).json({
      success: true,
      message: 'Team registration request submitted successfully! Pending approval.',
      teamId: result.insertId
    });

  } catch (err) {
    console.error('Error registering team:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'A team with this name already exists.' });
    }
    res.status(500).json({ success: false, message: 'Failed to register team.' });
  }
};

// Update team details (Admin only)
exports.updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, logo_url, contact_email, contact_phone, status } = req.body;

    if (!name || !contact_email || !contact_phone || !status) {
      return res.status(400).json({ success: false, message: 'Team Name, Email, Phone, and Status are required.' });
    }

    const query = `
      UPDATE teams 
      SET name = ?, logo_url = ?, contact_email = ?, contact_phone = ?, status = ?
      WHERE id = ?
    `;
    const [result] = await db.query(query, [name, logo_url, contact_email, contact_phone, status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    res.json({ success: true, message: 'Team details updated successfully!' });

  } catch (err) {
    console.error('Error updating team:', err);
    res.status(500).json({ success: false, message: 'Failed to update team.' });
  }
};

// Approve/Reject a team registration (Admin only)
exports.updateTeamStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid status (approved/rejected/pending) is required.' });
    }

    const [result] = await db.query('UPDATE teams SET status = ? WHERE id = ?', [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    res.json({ success: true, message: `Team registration status updated to ${status}!` });

  } catch (err) {
    console.error('Error updating team status:', err);
    res.status(500).json({ success: false, message: 'Failed to update team status.' });
  }
};

// Assign team to a tournament (Admin only)
exports.registerForTournament = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { tournament_id, team_id } = req.body;

    if (!tournament_id || !team_id) {
      return res.status(400).json({ success: false, message: 'Tournament ID and Team ID are required.' });
    }

    // Start transaction
    await connection.beginTransaction();

    // 1. Check if team is approved
    const [teamRows] = await connection.query('SELECT status FROM teams WHERE id = ?', [team_id]);
    if (teamRows.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }
    if (teamRows[0].status !== 'approved') {
      connection.release();
      return res.status(400).json({ success: false, message: 'Only approved teams can be assigned to tournaments.' });
    }

    // 2. Check if tournament exists
    const [tournamentRows] = await connection.query('SELECT slots FROM tournaments WHERE id = ?', [tournament_id]);
    if (tournamentRows.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Tournament not found.' });
    }

    // 3. Check slots available
    const [regCountRows] = await connection.query('SELECT COUNT(*) AS count FROM registrations WHERE tournament_id = ?', [tournament_id]);
    if (regCountRows[0].count >= tournamentRows[0].slots) {
      connection.release();
      return res.status(400).json({ success: false, message: 'This tournament is already full!' });
    }

    // 4. Insert registration
    await connection.query(
      'INSERT INTO registrations (tournament_id, team_id) VALUES (?, ?)',
      [tournament_id, team_id]
    );

    // 5. Initialize leaderboard row with 0 points
    await connection.query(
      `INSERT INTO leaderboard (tournament_id, team_id, wins, losses, matches_played, kills, points) 
       VALUES (?, ?, 0, 0, 0, 0, 0)
       ON DUPLICATE KEY UPDATE tournament_id = tournament_id`,
      [tournament_id, team_id]
    );

    await connection.commit();
    connection.release();

    res.json({ success: true, message: 'Team successfully assigned to the tournament!' });

  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error('Error assigning team to tournament:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'This team is already registered for this tournament.' });
    }
    res.status(500).json({ success: false, message: 'Failed to assign team to tournament.' });
  }
};

// Get all teams assigned to a specific tournament (Public)
exports.getTournamentTeams = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const query = `
      SELECT t.* FROM teams t
      INNER JOIN registrations r ON t.id = r.team_id
      WHERE r.tournament_id = ?
      ORDER BY t.name ASC
    `;
    const [rows] = await db.query(query, [tournamentId]);
    res.json({ success: true, teams: rows });
  } catch (err) {
    console.error('Error getting tournament teams:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve tournament teams.' });
  }
};

// Delete a team (Admin only)
exports.deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM teams WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Team not found.' });
    }

    res.json({ success: true, message: 'Team deleted successfully!' });

  } catch (err) {
    console.error('Error deleting team:', err);
    res.status(500).json({ success: false, message: 'Failed to delete team.' });
  }
};
