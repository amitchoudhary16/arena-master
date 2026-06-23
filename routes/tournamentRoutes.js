const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');
const auth = require('../middleware/auth');

// Public routes
router.get('/', tournamentController.getAllTournaments);
router.get('/:id', tournamentController.getTournamentById);

// Admin-only protected routes
router.post('/', auth, tournamentController.createTournament);
router.put('/:id', auth, tournamentController.updateTournament);
router.delete('/:id', auth, tournamentController.deleteTournament);

module.exports = router;
