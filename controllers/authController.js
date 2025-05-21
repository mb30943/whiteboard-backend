const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/syncUser', async (req, res) => {
  const { user_id, email } = req.body;
console.log('Incoming /syncUser:', user_id, email);
  try {
    const existing = await pool.query('SELECT id FROM users WHERE id = $1', [user_id]);

    if (existing.rowCount === 0) {
     await pool.query(
        'INSERT INTO users (id, email, password, created_at) VALUES ($1, $2, $3, NOW())',
        [user_id, email, 'firebase_managed']
      );

    }
    res.status(200).json({ message: 'User synced' });
  } catch (err) {
    console.error('Error syncing user:', err);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

module.exports = router;