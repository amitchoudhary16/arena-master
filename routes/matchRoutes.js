const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const auth = require('../middleware/auth');

// Public routes
router.get('/', matchController.getAllMatches);
router.get('/leaderboard/:tournamentId', matchController.getLeaderboard);

// Admin-only protected routes
router.post('/', auth, matchController.createMatch);
router.put('/:id', auth, matchController.updateMatch);
router.delete('/:id', auth, matchController.deleteMatch);

module.exports = router;
