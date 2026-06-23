const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const auth = require('../middleware/auth');

// Public routes
router.get('/', teamController.getAllTeams);
router.get('/:id', teamController.getTeamById);
router.get('/tournament/:tournamentId', teamController.getTournamentTeams);
router.post('/', teamController.registerTeam); // Anyone can submit team registration request

// Admin-only protected routes
router.put('/:id', auth, teamController.updateTeam);
router.put('/:id/status', auth, teamController.updateTeamStatus); // Approve or Reject
router.post('/register-tournament', auth, teamController.registerForTournament); // Assign to tournament
router.delete('/:id', auth, teamController.deleteTeam);

module.exports = router;
