const express = require('express');
const router = express.Router();

// Member resignation request
router.post('/resign', async (req, res) => {
  const { userId, tontineId, reason } = req.body;
  const db = req.app.get('db');

  try {
    const [contributions] = await db.execute(
      `SELECT COALESCE(SUM(amount), 0) as total_contributions 
       FROM contributions 
       WHERE user_id = ? AND tontine_id = ? AND payment_status = 'Approved'`,
      [userId, tontineId]
    );

    const totalContributions = contributions[0].total_contributions;
    const retentionAmount = totalContributions * 0.20;
    const finalPayoutAmount = totalContributions - retentionAmount;

    await db.execute(
      'UPDATE users SET status = "resigned" WHERE id = ?',
      [userId]
    );

    res.json({
      message: 'Resignation processed successfully',
      payoutAmount: finalPayoutAmount
    });

  } catch (error) {
    console.error('Resignation request error:', error);
    res.status(500).json({ message: 'Failed to process resignation request' });
  }
});

// Process member expulsion
router.post('/expel', async (req, res) => {
  const { userId, tontineId, reason, processedBy } = req.body;
  const db = req.app.get('db');

  try {
    const [processor] = await db.execute(
      'SELECT role FROM users WHERE id = ?',
      [processedBy]
    );

    if (!processor.length || !['ceo', 'cto'].includes(processor[0].role)) {
      return res.status(403).json({ message: 'Only executives can initiate expulsion' });
    }

    const [contributions] = await db.execute(
      `SELECT COALESCE(SUM(amount), 0) as total_contributions 
       FROM contributions 
       WHERE user_id = ? AND tontine_id = ? AND payment_status = 'Approved'`,
      [userId, tontineId]
    );

    const totalContributions = contributions[0].total_contributions;
    const retentionAmount = totalContributions * 0.20;
    const finalPayoutAmount = totalContributions - retentionAmount;

    await db.execute(
      'UPDATE users SET status = "expelled" WHERE id = ?',
      [userId]
    );

    res.json({
      message: 'Member expulsion processed successfully',
      payoutAmount: finalPayoutAmount
    });

  } catch (error) {
    console.error('Expulsion processing error:', error);
    res.status(500).json({ message: 'Failed to process expulsion' });
  }
});

module.exports = router;