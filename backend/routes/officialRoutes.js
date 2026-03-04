const express = require('express');
const router = express.Router();
const officialController = require('../controllers/officialController');

// Referees
router.get('/referees', officialController.getAllReferees);
router.post('/referees', officialController.createReferee);
router.put('/referees/:id', officialController.updateReferee);
router.delete('/referees/:id', officialController.deleteReferee);

// Scorers
router.get('/scorers', officialController.getAllScorers);
router.post('/scorers', officialController.createScorer);
router.put('/scorers/:id', officialController.updateScorer);
router.delete('/scorers/:id', officialController.deleteScorer);

// Line Judges
router.get('/line-judges', officialController.getAllLineJudges);
router.post('/line-judges', officialController.createLineJudge);
router.put('/line-judges/:id', officialController.updateLineJudge);
router.delete('/line-judges/:id', officialController.deleteLineJudge);

module.exports = router;
