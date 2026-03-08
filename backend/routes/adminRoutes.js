const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

console.log("✅ Admin Routes Loaded");

// Player Management Routes
router.post('/teams/:teamId/players', adminController.addPlayerToTeam);
router.put('/players/:id', adminController.updatePlayer);
router.delete('/players/:id', adminController.deletePlayer);

module.exports = router;