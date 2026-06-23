const db = require('../config/db');

// Recalculate leaderboard stats for a tournament to prevent desync
const recalculateLeaderboard = async (tournamentId, connection) => {
  const conn = connection || await db.getConnection();
  try {
    // 1. Get all registered teams in this tournament
    const [registrations] = await conn.query(
      'SELECT team_id FROM registrations WHERE tournament_id = ?',
      [tournamentId]
    );

    const teamStats = {};
    registrations.forEach(r => {
      teamStats[r.team_id] = {
        wins: 0,
        losses: 0,
        matches_played: 0,
        kills: 0, // kills represents aggregate score/kills
        points: 0
      };
    });

    // 2. Fetch all completed matches for this tournament
    const [matches] = await conn.query(
      `SELECT team1_id, team2_id, winner_id, team1_score, team2_score 
       FROM matches 
       WHERE tournament_id = ? AND status = 'completed'`,
      [tournamentId]
    );

    // 3. Process each match and accumulate stats
    matches.forEach(m => {
      const t1 = m.team1_id;
      const t2 = m.team2_id;
      const winner = m.winner_id;
      const s1 = m.team1_score || 0;
      const s2 = m.team2_score || 0;

      // Initialize team stats if not present (in case of unregistered teams playing)
      if (!teamStats[t1]) teamStats[t1] = { wins: 0, losses: 0, matches_played: 0, kills: 0, points: 0 };
      if (!teamStats[t2]) teamStats[t2] = { wins: 0, losses: 0, matches_played: 0, kills: 0, points: 0 };

      teamStats[t1].matches_played += 1;
      teamStats[t2].matches_played += 1;
      teamStats[t1].kills += s1;
      teamStats[t2].kills += s2;

      // Win bonus: +10 points for the winner. Plus total kills/score added to points.
      teamStats[t1].points += s1;
      teamStats[t2].points += s2;

      if (winner === t1) {
        teamStats[t1].wins += 1;
        teamStats[t1].points += 10; // Win bonus
        teamStats[t2].losses += 1;
      } else if (winner === t2) {
        teamStats[t2].wins += 1;
        teamStats[t2].points += 10; // Win bonus
        teamStats[t1].losses += 1;
      } else {
        // Draw (if any, though rare in esports)
      }
    });

    // 4. Update the leaderboard table for each team
    for (const teamId in teamStats) {
      const stats = teamStats[teamId];
      const query = `
        INSERT INTO leaderboard (tournament_id, team_id, wins, losses, matches_played, kills, points)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
          wins = VALUES(wins), 
          losses = VALUES(losses), 
          matches_played = VALUES(matches_played), 
          kills = VALUES(kills), 
          points = VALUES(points)
      `;
      await conn.query(query, [
        tournamentId,
        teamId,
        stats.wins,
        stats.losses,
        stats.matches_played,
        stats.kills,
        stats.points
      ]);
    }

  } catch (err) {
    console.error('Error in recalculateLeaderboard:', err);
    throw err;
  } finally {
    if (!connection) conn.release();
  }
};

// List all matches (Public)
// Can filter by tournament, game, and status
exports.getAllMatches = async (req, res) => {
  try {
    const { tournament_id, game, status } = req.query;
    let query = `
      SELECT m.*, t.name AS tournament_name, t.game,
             t1.name AS team1_name, t1.logo_url AS team1_logo,
             t2.name AS team2_name, t2.logo_url AS team2_logo,
             tw.name AS winner_name
      FROM matches m
      INNER JOIN tournaments t ON m.tournament_id = t.id
      INNER JOIN teams t1 ON m.team1_id = t1.id
      INNER JOIN teams t2 ON m.team2_id = t2.id
      LEFT JOIN teams tw ON m.winner_id = tw.id
      WHERE 1=1
    `;
    const params = [];

    if (tournament_id) {
      query += ` AND m.tournament_id = ?`;
      params.push(tournament_id);
    }
    if (game) {
      query += ` AND t.game = ?`;
      params.push(game);
    }
    if (status) {
      query += ` AND m.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY m.match_time ASC`;

    const [rows] = await db.query(query, params);
    res.json({ success: true, matches: rows });
  } catch (err) {
    console.error('Error getting matches:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve matches.' });
  }
};

// Create match schedule (Admin only)
exports.createMatch = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { tournament_id, team1_id, team2_id, match_time } = req.body;

    // Validation
    if (!tournament_id || !team1_id || !team2_id || !match_time) {
      return res.status(400).json({ success: false, message: 'Tournament, Team 1, Team 2, and Match Time are required.' });
    }

    if (team1_id === team2_id) {
      return res.status(400).json({ success: false, message: 'Team 1 and Team 2 must be different.' });
    }

    // Verify both teams are registered in the tournament
    const [regs] = await connection.query(
      'SELECT team_id FROM registrations WHERE tournament_id = ? AND team_id IN (?, ?)',
      [tournament_id, team1_id, team2_id]
    );

    if (regs.length < 2) {
      connection.release();
      return res.status(400).json({ success: false, message: 'Both teams must be registered in the selected tournament.' });
    }

    const query = `
      INSERT INTO matches (tournament_id, team1_id, team2_id, match_time, status) 
      VALUES (?, ?, ?, ?, 'upcoming')
    `;
    await connection.query(query, [tournament_id, team1_id, team2_id, match_time]);
    connection.release();

    res.status(201).json({ success: true, message: 'Match scheduled successfully!' });

  } catch (err) {
    connection.release();
    console.error('Error scheduling match:', err);
    res.status(500).json({ success: false, message: 'Failed to schedule match.' });
  }
};

// Update match score & status (Admin only)
exports.updateMatch = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;
    const { status, team1_score, team2_score, winner_id } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Match status is required.' });
    }

    // Start transaction
    await connection.beginTransaction();

    // Get current match details to know tournament ID
    const [matchRows] = await connection.query('SELECT tournament_id, team1_id, team2_id FROM matches WHERE id = ?', [id]);
    if (matchRows.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }

    const match = matchRows[0];

    // Set score and winner values based on status
    let fTeam1Score = 0;
    let fTeam2Score = 0;
    let fWinnerId = null;

    if (status === 'completed') {
      fTeam1Score = parseInt(team1_score) || 0;
      fTeam2Score = parseInt(team2_score) || 0;
      fWinnerId = winner_id ? parseInt(winner_id) : null;

      if (fWinnerId && fWinnerId !== match.team1_id && fWinnerId !== match.team2_id) {
        connection.release();
        return res.status(400).json({ success: false, message: 'Winner must be one of the participating teams.' });
      }
    } else if (status === 'live') {
      // Live matches can have current scores
      fTeam1Score = parseInt(team1_score) || 0;
      fTeam2Score = parseInt(team2_score) || 0;
    }

    const updateQuery = `
      UPDATE matches 
      SET status = ?, team1_score = ?, team2_score = ?, winner_id = ?
      WHERE id = ?
    `;
    await connection.query(updateQuery, [status, fTeam1Score, fTeam2Score, fWinnerId, id]);

    // Recalculate leaderboards if status changed
    await recalculateLeaderboard(match.tournament_id, connection);

    await connection.commit();
    connection.release();

    res.json({ success: true, message: 'Match updated successfully!' });

  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error('Error updating match:', err);
    res.status(500).json({ success: false, message: 'Failed to update match.' });
  }
};

// Delete a scheduled match (Admin only)
exports.deleteMatch = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;

    // Get match detail first to get tournamentId for recalculating leaderboard
    const [matchRows] = await connection.query('SELECT tournament_id FROM matches WHERE id = ?', [id]);
    if (matchRows.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Match not found.' });
    }

    const tournamentId = matchRows[0].tournament_id;

    await connection.beginTransaction();
    await connection.query('DELETE FROM matches WHERE id = ?', [id]);
    await recalculateLeaderboard(tournamentId, connection);
    await connection.commit();
    connection.release();

    res.json({ success: true, message: 'Match deleted successfully!' });

  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error('Error deleting match:', err);
    res.status(500).json({ success: false, message: 'Failed to delete match.' });
  }
};

// Get leaderboard/points table for a tournament (Public)
exports.getLeaderboard = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const query = `
      SELECT l.*, t.name AS team_name, t.logo_url AS team_logo
      FROM leaderboard l
      INNER JOIN teams t ON l.team_id = t.id
      WHERE l.tournament_id = ?
      ORDER BY l.points DESC, l.kills DESC, l.wins DESC
    `;
    const [rows] = await db.query(query, [tournamentId]);
    res.json({ success: true, leaderboard: rows });
  } catch (err) {
    console.error('Error getting leaderboard:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve leaderboard.' });
  }
};
