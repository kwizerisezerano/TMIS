const express = require('express');
const router = express.Router();

// Get user notifications
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  const db = req.app.get('db');

  try {
    const [notifications] = await db.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [userId]
    );

    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  const { id } = req.params;
  const db = req.app.get('db');

  try {
    await db.execute(
      'UPDATE notifications SET is_read = 1 WHERE id = ?',
      [id]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Cleanup old notifications (older than 5 days)
router.delete('/cleanup', async (req, res) => {
  const db = req.app.get('db');

  try {
    const [result] = await db.execute(
      'DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL 5 DAY)'
    );

    res.json({ 
      success: true, 
      message: `Cleaned up ${result.affectedRows} old notifications`,
      deletedCount: result.affectedRows
    });
  } catch (error) {
    console.error('Cleanup notifications error:', error);
    res.status(500).json({ message: 'Failed to cleanup notifications' });
  }
});

module.exports = router;