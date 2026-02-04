const express = require('express');
const checkAdmin = require('../middleware/checkAdmin');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get penalties for logged user (from all their tontines)
router.get('/user', authenticateToken, async (req, res) => {
  const db = req.app.get('db');
  const userId = req.user.userId;

  if (!userId) {
    return res.status(400).json({ error: 'User ID not found' });
  }

  try {
    const [penalties] = await db.execute(`
      SELECT p.*, t.name as tontine_name, lr.amount as loan_amount
      FROM penalties p
      LEFT JOIN tontines t ON p.tontine_id = t.id
      LEFT JOIN loan_requests lr ON p.loan_id = lr.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `, [userId]);
    
    res.json(penalties);
  } catch (error) {
    console.error('Error fetching user penalties:', error);
    res.status(500).json({ error: 'Failed to fetch penalties' });
  }
});

// Get penalty stats for dashboard
router.get('/stats', authenticateToken, async (req, res) => {
  const db = req.app.get('db');
  const userId = req.user.userId;

  try {
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_penalties,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
      FROM penalties 
      WHERE user_id = ?
    `, [userId]);
    
    res.json(stats[0] || { total_penalties: 0, pending_amount: 0, paid_amount: 0, pending_count: 0 });
  } catch (error) {
    console.error('Error fetching penalty stats:', error);
    res.status(500).json({ error: 'Failed to fetch penalty stats' });
  }
});

// Get penalties for a tontine (admin management)
router.get('/tontine/:tontineId', async (req, res) => {
  const { tontineId } = req.params;
  const db = req.app.get('db');

  try {
    const [penalties] = await db.execute(`
      SELECT p.*, u.names as member_name, u.email, lr.amount as loan_amount
      FROM penalties p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN loan_requests lr ON p.loan_id = lr.id
      WHERE p.tontine_id = ?
      ORDER BY p.created_at DESC
    `, [tontineId]);

    res.json(penalties);
  } catch (error) {
    console.error('Fetch penalties error:', error);
    res.status(500).json({ message: 'Failed to fetch penalties' });
  }
});

// Get user penalties
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  const db = req.app.get('db');

  try {
    const [penalties] = await db.execute(`
      SELECT p.*, t.name as tontine_name, lr.amount as loan_amount
      FROM penalties p
      JOIN tontines t ON p.tontine_id = t.id
      LEFT JOIN loan_requests lr ON p.loan_id = lr.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `, [userId]);

    res.json(penalties);
  } catch (error) {
    console.error('Fetch user penalties error:', error);
    res.status(500).json({ message: 'Failed to fetch user penalties' });
  }
});

// Update penalty status (allow users to pay their own penalties)
router.put('/:penaltyId/status', authenticateToken, async (req, res) => {
  const { penaltyId } = req.params;
  const { status } = req.body;
  const db = req.app.get('db');
  const userId = req.user.userId;

  try {
    // Check if penalty belongs to user or if user is admin
    const [penalty] = await db.execute(
      'SELECT user_id FROM penalties WHERE id = ?',
      [penaltyId]
    );

    if (penalty.length === 0) {
      return res.status(404).json({ message: 'Penalty not found' });
    }

    // Get user role
    const [user] = await db.execute(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    );

    const isAdmin = user[0]?.role === 'admin' || user[0]?.role === 'president';
    const isOwner = penalty[0].user_id === userId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to update this penalty' });
    }

    const updateData = { status };
    if (status === 'paid') {
      updateData.paid_at = new Date();
    }

    await db.execute(
      'UPDATE penalties SET status = ?, paid_at = ? WHERE id = ?',
      [status, status === 'paid' ? new Date() : null, penaltyId]
    );

    res.json({ message: 'Penalty status updated successfully', success: true });
  } catch (error) {
    console.error('Update penalty status error:', error);
    res.status(500).json({ message: 'Failed to update penalty status' });
  }
});

module.exports = router;