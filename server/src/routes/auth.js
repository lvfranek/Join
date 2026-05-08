// @ts-check
const { Router } = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../db');
const { signToken, authRequired } = require('../auth');

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, fullName } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
      [email, passwordHash, fullName || null, 'user'],
    );
    const id = result.insertId;
    const token = signToken({ sub: String(id), email, role: 'user' });
    res.status(201).json({
      token,
      user: { id, email, fullName: fullName || null, role: 'user' },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const rows = await query(
      'SELECT id, email, password_hash, full_name, role FROM users WHERE email = ?',
      [email],
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = signToken({ sub: String(user.id), email: user.email, role: user.role });
    res.json({
      token,
      user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authRequired, async (req, res, next) => {
  try {
    const rows = await query('SELECT id, email, full_name, role FROM users WHERE id = ?', [
      req.user.sub,
    ]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const u = rows[0];
    res.json({ id: u.id, email: u.email, fullName: u.full_name, role: u.role });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
