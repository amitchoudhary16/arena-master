const db = require('../config/db');

// List all tournaments (Public)
exports.getAllTournaments = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tournaments ORDER BY start_date DESC');
    res.json({ success: true, tournaments: rows });
  } catch (err) {
    console.error('Error getting tournaments:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve tournaments.' });
  }
};

// Get a single tournament detail (Public)
exports.getTournamentById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM tournaments WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tournament not found.' });
    }
    res.json({ success: true, tournament: rows[0] });
  } catch (err) {
    console.error('Error getting tournament:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve tournament.' });
  }
};

// Create a new tournament (Admin only)
exports.createTournament = async (req, res) => {
  try {
    const { name, game, start_date, end_date, prize_pool, slots } = req.body;

    // Validation
    if (!name || !game || !start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'Name, Game, Start Date, and End Date are required.' });
    }

    const query = `
      INSERT INTO tournaments (name, game, start_date, end_date, prize_pool, slots, status) 
      VALUES (?, ?, ?, ?, ?, ?, 'upcoming')
    `;
    const [result] = await db.query(query, [
      name, 
      game, 
      start_date, 
      end_date, 
      prize_pool || '0', 
      slots || 16
    ]);

    res.status(201).json({
      success: true,
      message: 'Tournament created successfully!',
      tournamentId: result.insertId
    });

  } catch (err) {
    console.error('Error creating tournament:', err);
    res.status(500).json({ success: false, message: 'Failed to create tournament.' });
  }
};

// Edit tournament details (Admin only)
exports.updateTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, game, start_date, end_date, prize_pool, slots, status } = req.body;

    // Validation
    if (!name || !game || !start_date || !end_date || !status) {
      return res.status(400).json({ success: false, message: 'Name, Game, Start Date, End Date, and Status are required.' });
    }

    const query = `
      UPDATE tournaments 
      SET name = ?, game = ?, start_date = ?, end_date = ?, prize_pool = ?, slots = ?, status = ?
      WHERE id = ?
    `;
    const [result] = await db.query(query, [
      name, 
      game, 
      start_date, 
      end_date, 
      prize_pool, 
      slots, 
      status, 
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Tournament not found.' });
    }

    res.json({ success: true, message: 'Tournament updated successfully!' });

  } catch (err) {
    console.error('Error updating tournament:', err);
    res.status(500).json({ success: false, message: 'Failed to update tournament.' });
  }
};

// Delete a tournament (Admin only)
exports.deleteTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM tournaments WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Tournament not found.' });
    }

    res.json({ success: true, message: 'Tournament deleted successfully!' });

  } catch (err) {
    console.error('Error deleting tournament:', err);
    res.status(500).json({ success: false, message: 'Failed to delete tournament.' });
  }
};
