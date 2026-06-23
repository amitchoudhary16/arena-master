const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');
const auth = require('../middleware/auth');

// Public routes
router.get('/', playerController.getAllPlayers);
router.get('/team/:teamId', playerController.getPlayersByTeam);

// Admin-only protected routes
router.post('/', auth, playerController.createPlayer);
router.put('/:id', auth, playerController.updatePlayer);
router.delete('/:id', auth, playerController.deletePlayer);

module.exports = router;
