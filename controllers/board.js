// boards.js
const express = require('express');
const router = express.Router();


// Create a new board (room)
router.post('/', async (req, res) => {
  const { name, user_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO boards (name, user_id, created_at) VALUES ($1, $2, NOW()) RETURNING *`,
      [name, user_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create board' });
  }
});

// Get board info and last drawing data
router.get('/:id', async (req, res) => {
  const boardId = req.params.id;
  try {
    const boardResult = await pool.query(`SELECT * FROM boards WHERE id = $1`, [boardId]);
    if (boardResult.rows.length === 0) return res.status(404).json({ error: 'Board not found' });

    const drawingResult = await pool.query(
      `SELECT * FROM drawing WHERE board_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [boardId]
    );

    res.json({
      board: boardResult.rows[0],
      drawing: drawingResult.rows[0] || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get board data' });
  }
});

// Save drawing data
router.post('/:id/drawings', async (req, res) => {
  const boardId = req.params.id;
  const { data } = req.body;
  try {
    await pool.query(
      `INSERT INTO drawing (board_id, data, created_at) VALUES ($1, $2, NOW())`,
      [boardId, data]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save drawing data' });
  }
});

module.exports = router;
