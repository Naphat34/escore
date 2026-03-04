const db = require('../config/db');

const ageGroupController = {
  async getAllAgeGroups(req, res) {
    try {
      const result = await db.query('SELECT * FROM age_groups ORDER BY id');
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'Database error' });
    }
  }
};

module.exports = ageGroupController;
