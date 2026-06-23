const db = require('../config/db');

// List all players with team details (Public)
exports.getAllPlayers = async (req, res) => {
  try {
    const query = `
      SELECT p.*, t.name AS team_name 
      FROM players p 
      INNER JOIN teams t ON p.team_id = t.id 
      ORDER BY p.real_name ASC
    `;
    const [rows] = await db.query(query);
    res.json({ success: true, players: rows });
  } catch (err) {
    console.error('Error getting players:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve players.' });
  }
};

// Get players for a specific team (Public)
exports.getPlayersByTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const [rows] = await db.query('SELECT * FROM players WHERE team_id = ? ORDER BY in_game_name ASC', [teamId]);
    res.json({ success: true, players: rows });
  } catch (err) {
    console.error('Error getting team players:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve team roster.' });
  }
};

// Add a player to a team (Admin only)
exports.createPlayer = async (req, res) => {
  try {
    const { team_id, in_game_name, real_name, role } = req.body;

    // Validation
    if (!team_id || !in_game_name || !real_name) {
      return res.status(400).json({ success: false, message: 'Team ID, In-Game Name, and Real Name are required.' });
    }

    const query = `
      INSERT INTO players (team_id, in_game_name, real_name, role) 
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await db.query(query, [team_id, in_game_name, real_name, role || 'Player']);

    res.status(201).json({
      success: true,
      message: 'Player added to team successfully!',
      playerId: result.insertId
    });

  } catch (err) {
    console.error('Error adding player:', err);
    res.status(500).json({ success: false, message: 'Failed to add player.' });
  }
};

// Update player details (Admin only)
exports.updatePlayer = async (req, res) => {
  try {
    const { id } = req.params;
    const { team_id, in_game_name, real_name, role } = req.body;

    // Validation
    if (!team_id || !in_game_name || !real_name) {
      return res.status(400).json({ success: false, message: 'Team ID, In-Game Name, and Real Name are required.' });
    }

    const query = `
      UPDATE players 
      SET team_id = ?, in_game_name = ?, real_name = ?, role = ?
      WHERE id = ?
    `;
    const [result] = await db.query(query, [team_id, in_game_name, real_name, role, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Player not found.' });
    }

    res.json({ success: true, message: 'Player details updated successfully!' });

  } catch (err) {
    console.error('Error updating player:', err);
    res.status(500).json({ success: false, message: 'Failed to update player.' });
  }
};

// Delete a player (Admin only)
exports.deletePlayer = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM players WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Player not found.' });
    }

    res.json({ success: true, message: 'Player deleted successfully!' });

  } catch (err) {
    console.error('Error deleting player:', err);
    res.status(500).json({ success: false, message: 'Failed to delete player.' });
  }
};
