const express = require('express');
const router = express.Router();
const scorerController = require('../controllers/scorerController');

// --- DEBUG SECTION ---
// ถ้า Controller โหลดไม่ติด บรรทัดนี้จะช่วยบอกว่าเราได้ object อะไรมา
console.log("Scorer Controller Loaded:", scorerController);

if (!scorerController.saveMatchEvent) {
    console.error("❌ ERROR: saveMatchEvent function is missing in scorerController!");
}
// ---------------------

// GET Data
router.get('/match/:matchId', scorerController.getMatchDetails);
router.get('/match/:matchId/events', scorerController.getMatchEvents);
router.get('/match/:matchId/lineup', scorerController.getMatchLineup);

// POST Actions
// เช็คให้แน่ใจว่าชื่อฟังก์ชันตรงกับใน Controller (saveMatchEvent)
router.post('/match/:matchId/event', scorerController.saveMatchEvent);
router.post('/match/:matchId/lineup', scorerController.saveLineup);

// หมายเหตุ: URL จะเป็น /api/scorer/referees (เพราะไฟล์นี้ถูก mount ที่ /api/scorer)
router.get('/referees', scorerController.getAllReferees);
router.get('/scorers', scorerController.getAllScorers);
router.get('/line-judges', scorerController.getAllLineJudges);

// Update Officials
router.put('/match/:matchId/officials', scorerController.updateMatchOfficials);

// End Set
router.post('/match/:matchId/end-set', scorerController.endSet);

module.exports = router;