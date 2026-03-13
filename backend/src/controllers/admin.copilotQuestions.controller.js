import { query } from '../config/db.js';

export async function list(req, res) {
  try {
    const result = await query(
      `SELECT id, question, answer, sort_order, created_at, updated_at
       FROM copilot_quick_questions
       ORDER BY sort_order ASC, created_at ASC`
    );
    res.json({ questions: result.rows });
  } catch (err) {
    console.error('admin copilot questions list:', err);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
}

export async function update(req, res) {
  try {
    const { id } = req.params;
    const { question, answer, sort_order } = req.body;

    const result = await query(
      `UPDATE copilot_quick_questions
       SET question = COALESCE($2, question),
           answer = COALESCE($3, answer),
           sort_order = COALESCE($4, sort_order),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, question ?? null, answer ?? null, sort_order ?? null]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('admin copilot questions update:', err);
    res.status(500).json({ error: 'Failed to update question' });
  }
}
