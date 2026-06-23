const db = require('../config/db');

exports.getStats = async (req, res) => {
  try {
    // 1. Total Tournaments
    const [[{ totalTournaments }]] = await db.query('SELECT COUNT(*) AS totalTournaments FROM tournaments');

    // 2. Total Teams (Only count approved or all? Let's return total approved teams + pending teams separately or combined)
    const [[{ totalTeams }]] = await db.query('SELECT COUNT(*) AS totalTeams FROM teams WHERE status = "approved"');
    const [[{ pendingTeams }]] = await db.query('SELECT COUNT(*) AS pendingTeams FROM teams WHERE status = "pending"');

    // 3. Total Players
    const [[{ totalPlayers }]] = await db.query('SELECT COUNT(*) AS totalPlayers FROM players');

    // 4. Matches stats
    const [[{ totalMatches }]] = await db.query('SELECT COUNT(*) AS totalMatches FROM matches');
    const [[{ liveMatches }]] = await db.query('SELECT COUNT(*) AS liveMatches FROM matches WHERE status = "live"');
    const [[{ completedMatches }]] = await db.query('SELECT COUNT(*) AS completedMatches FROM matches WHERE status = "completed"');
    const [[{ upcomingMatches }]] = await db.query('SELECT COUNT(*) AS upcomingMatches FROM matches WHERE status = "upcoming"');

    res.json({
      success: true,
      stats: {
        tournaments: totalTournaments,
        teams: totalTeams,
        pendingTeams,
        players: totalPlayers,
        matches: totalMatches,
        liveMatches,
        completedMatches,
        upcomingMatches
      }
    });

  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve dashboard stats.' });
  }
};
