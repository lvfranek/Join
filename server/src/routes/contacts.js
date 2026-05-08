// @ts-check
const { Router } = require('express');
const { query } = require('../db');
const { authRequired } = require('../auth');

const router = Router();
router.use(authRequired);

const fromRow = (row) => ({
  id: String(row.id),
  firstName: row.first_name,
  lastName: row.last_name,
  email: row.email,
  phone: row.phone ?? '',
  message: row.message ?? '',
});

router.get('/', async (req, res, next) => {
  try {
    const rows = await query(
      'SELECT * FROM contacts WHERE created_by = ? ORDER BY first_name, last_name',
      [req.user.sub],
    );
    res.json(rows.map(fromRow));
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const c = req.body || {};
    const result = await query(
      `INSERT INTO contacts (first_name, last_name, email, phone, message, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        c.firstName,
        c.lastName || null,
        c.email || null,
        c.phone || null,
        c.message || null,
        req.user.sub,
      ],
    );
    const rows = await query('SELECT * FROM contacts WHERE id = ?', [result.insertId]);
    res.status(201).json(fromRow(rows[0]));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const c = req.body || {};
    const fields = [];
    const params = [];
    const map = {
      firstName: 'first_name',
      lastName: 'last_name',
      email: 'email',
      phone: 'phone',
      message: 'message',
    };
    for (const [k, col] of Object.entries(map)) {
      if (k in c) {
        fields.push(`${col} = ?`);
        params.push(c[k] ?? null);
      }
    }
    if (fields.length === 0) return res.status(400).json({ error: 'No updatable fields supplied' });
    params.push(req.params.id, req.user.sub);
    await query(`UPDATE contacts SET ${fields.join(', ')} WHERE id = ? AND created_by = ?`, params);
    const rows = await query('SELECT * FROM contacts WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Contact not found' });
    res.json(fromRow(rows[0]));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM contacts WHERE id = ? AND created_by = ?', [
      req.params.id,
      req.user.sub,
    ]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
