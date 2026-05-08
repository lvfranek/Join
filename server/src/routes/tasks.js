// @ts-check
const { Router } = require('express');
const { query } = require('../db');
const { authRequired } = require('../auth');

const router = Router();
router.use(authRequired);

const parseJson = (val, fallback) => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
};

const fromRow = (row) => ({
  id: String(row.id),
  title: row.title,
  description: row.description ?? '',
  status: row.status,
  priority: row.priority,
  dueDate: row.due_date ? new Date(row.due_date).toISOString().slice(0, 10) : '',
  category: row.category ?? '',
  assignees: parseJson(row.assignees, []),
  subtasks: parseJson(row.subtasks, []),
});

router.get('/', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT * FROM tasks
       WHERE created_by = ? OR assigned_to = ?
       ORDER BY created_at ASC`,
      [req.user.sub, req.user.sub],
    );
    res.json(rows.map(fromRow));
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const t = req.body || {};
    const result = await query(
      `INSERT INTO tasks
        (title, description, status, priority, due_date, category, assignees, subtasks, assigned_to, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t.title,
        t.description || null,
        t.status || 'todo',
        t.priority || 'medium',
        t.dueDate || null,
        t.category || null,
        JSON.stringify(t.assignees || []),
        JSON.stringify(t.subtasks || []),
        Array.isArray(t.assignees) && t.assignees[0]?.id ? t.assignees[0].id : null,
        req.user.sub,
      ],
    );
    const rows = await query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    res.status(201).json(fromRow(rows[0]));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const t = req.body || {};
    const fields = [];
    const params = [];
    const map = {
      title: 'title',
      description: 'description',
      status: 'status',
      priority: 'priority',
      dueDate: 'due_date',
      category: 'category',
    };
    for (const [k, col] of Object.entries(map)) {
      if (k in t) {
        fields.push(`${col} = ?`);
        params.push(t[k] ?? null);
      }
    }
    if ('assignees' in t) {
      fields.push('assignees = ?');
      params.push(JSON.stringify(t.assignees || []));
      fields.push('assigned_to = ?');
      params.push(Array.isArray(t.assignees) && t.assignees[0]?.id ? t.assignees[0].id : null);
    }
    if ('subtasks' in t) {
      fields.push('subtasks = ?');
      params.push(JSON.stringify(t.subtasks || []));
    }
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No updatable fields supplied' });
    }
    params.push(req.params.id, req.user.sub, req.user.sub);
    await query(
      `UPDATE tasks SET ${fields.join(', ')}
       WHERE id = ? AND (created_by = ? OR assigned_to = ?)`,
      params,
    );
    const rows = await query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json(fromRow(rows[0]));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM tasks WHERE id = ? AND (created_by = ? OR assigned_to = ?)', [
      req.params.id,
      req.user.sub,
      req.user.sub,
    ]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
