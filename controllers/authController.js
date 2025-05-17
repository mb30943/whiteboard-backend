const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Register user
async function registerUser(req, res) {
  const { email, password } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *',
      [email, hashedPassword]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, 'secretkey', { expiresIn: '1h' });

    res.json({ token ,user: {
        id: user.id,
        email: user.email
      }});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Login user
async function loginUser(req, res) {
  const { email, password } = req.body;
  console.log('Login attempt:', email, password);  // <-- add this
console.log('===');
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
     console.log('result',  result.rows[0]);  // <-- add this
    const user = result.rows[0];

    if (!user) {
          console.log('1');
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
     console.log('isMatch',isMatch);
    if (!isMatch) {
    console.log('2');
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, 'secretkey', { expiresIn: '1h' });
    res.json({ token ,user: {
        id: user.id,
        email: user.email
      }});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}


module.exports = { registerUser, loginUser };
