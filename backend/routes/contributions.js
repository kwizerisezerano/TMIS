const express = require('express');
const router = express.Router();

// Get contributions for a tontine
router.get('/tontine/:tontineId', async (req, res) => {
  const { tontineId } = req.params;
  const db = req.app.get('db');

  try {
    const [contributions] = await db.execute(
      `SELECT c.*, u.names as member_name, u.phone, tm.shares,
       (tm.shares * t.contribution_amount) as expected_amount
       FROM contributions c 
       JOIN users u ON c.user_id = u.id 
       JOIN tontines t ON c.tontine_id = t.id
       JOIN tontine_members tm ON c.tontine_id = tm.tontine_id AND c.user_id = tm.user_id
       WHERE c.tontine_id = ? 
       ORDER BY c.contribution_date DESC`,
      [tontineId]
    );

    res.json(contributions);
  } catch (error) {
    console.error('Fetch contributions error:', error);
    res.status(500).json({ message: 'Failed to fetch contributions' });
  }
});

// Approve contribution
router.put('/:id/approve', async (req, res) => {
  const { id } = req.params;
  const db = req.app.get('db');

  try {
    await db.execute(
      'UPDATE contributions SET payment_status = "Completed" WHERE id = ?',
      [id]
    );

    res.json({ success: true, message: 'Contribution approved successfully' });
  } catch (error) {
    console.error('Error approving contribution:', error);
    res.status(500).json({ success: false, message: 'Failed to approve contribution' });
  }
});

// Reject contribution
router.put('/:id/reject', async (req, res) => {
  const { id } = req.params;
  const db = req.app.get('db');

  try {
    await db.execute(
      'UPDATE contributions SET payment_status = "Failed" WHERE id = ?',
      [id]
    );

    res.json({ success: true, message: 'Contribution rejected successfully' });
  } catch (error) {
    console.error('Error rejecting contribution:', error);
    res.status(500).json({ success: false, message: 'Failed to reject contribution' });
  }
});

// Get user contributions
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  const db = req.app.get('db');

  try {
    const [contributions] = await db.execute(
      `SELECT c.*, t.name as tontine_name, tm.shares,
       (tm.shares * t.contribution_amount) as expected_amount
       FROM contributions c 
       JOIN tontines t ON c.tontine_id = t.id 
       JOIN tontine_members tm ON c.tontine_id = tm.tontine_id AND c.user_id = tm.user_id
       WHERE c.user_id = ? 
       ORDER BY c.contribution_date DESC`,
      [userId]
    );

    res.json(contributions);
  } catch (error) {
    console.error('Fetch user contributions error:', error);
    res.status(500).json({ message: 'Failed to fetch contributions' });
  }
});

// Get missed contributions
router.get('/missed/:userId', async (req, res) => {
  const { userId } = req.params;
  const db = req.app.get('db');

  try {
    const [missedContributions] = await db.execute(
      `SELECT mc.*, t.name as tontine_name 
       FROM missed_contributions mc 
       JOIN tontines t ON mc.tontine_id = t.id 
       WHERE mc.user_id = ? AND mc.status = 'Unpaid' 
       ORDER BY mc.missed_date DESC`,
      [userId]
    );

    res.json(missedContributions);
  } catch (error) {
    console.error('Fetch missed contributions error:', error);
    res.status(500).json({ message: 'Failed to fetch missed contributions' });
  }
});

// Submit contribution
router.post('/', async (req, res) => {
  const { userId, tontineId, paymentMethod, phoneNumber, user_id, tontine_id, payment_method, phone_number } = req.body;
  const db = req.app.get('db');
  const io = req.app.get('io');

  try {
    // Handle both camelCase and snake_case field names
    const finalUserId = userId || user_id;
    const finalTontineId = tontineId || tontine_id;
    const finalPaymentMethod = paymentMethod || payment_method;
    
    // Validate required fields
    if (!finalUserId || !finalTontineId || !finalPaymentMethod) {
      return res.status(400).json({ 
        message: 'Missing required fields: userId, tontineId, paymentMethod' 
      });
    }

    // Get user shares and tontine contribution amount
    const [memberResult] = await db.execute(
      'SELECT shares FROM tontine_members WHERE user_id = ? AND tontine_id = ?',
      [finalUserId, finalTontineId]
    );
    
    const [tontineResult] = await db.execute(
      'SELECT contribution_amount FROM tontines WHERE id = ?',
      [finalTontineId]
    );
    
    if (!memberResult.length || !tontineResult.length) {
      return res.status(404).json({ message: 'User not a member of this tontine or tontine not found' });
    }
    
    const shares = memberResult[0].shares || 1;
    const baseAmount = tontineResult[0].contribution_amount;
    const amount = shares * baseAmount;

    const transactionRef = require('crypto').randomBytes(16).toString('hex');

    const [result] = await db.execute(
      `INSERT INTO contributions (user_id, tontine_id, amount, payment_method, 
       contribution_date, transaction_ref, payment_status) 
       VALUES (?, ?, ?, ?, NOW(), ?, 'Pending')`,
      [finalUserId, finalTontineId, amount, finalPaymentMethod, transactionRef]
    );

    // Emit real-time notification if io exists
    if (io) {
      io.to(`tontine-${finalTontineId}`).emit('contribution-submitted', {
        contributionId: result.insertId,
        userId: finalUserId,
        amount,
        timestamp: new Date()
      });
    }

    res.status(201).json({
      message: 'Contribution submitted successfully',
      contributionId: result.insertId,
      transactionRef,
      amount
    });

  } catch (error) {
    console.error('Submit contribution error:', error);
    res.status(500).json({ message: 'Failed to submit contribution' });
  }
});

// Update contribution status
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = req.app.get('db');
  const io = req.app.get('io');

  try {
    await db.execute(
      'UPDATE contributions SET payment_status = ? WHERE id = ?',
      [status, id]
    );

    // Get contribution details for notification
    const [contribution] = await db.execute(
      'SELECT * FROM contributions WHERE id = ?',
      [id]
    );

    if (contribution.length > 0) {
      // Emit real-time notification
      io.to(`tontine-${contribution[0].tontine_id}`).emit('contribution-status-updated', {
        contributionId: id,
        status,
        userId: contribution[0].user_id,
        timestamp: new Date()
      });
    }

    res.json({ message: 'Contribution status updated successfully' });

  } catch (error) {
    console.error('Update contribution status error:', error);
    res.status(500).json({ message: 'Failed to update contribution status' });
  }
});

// Get user contribution amount based on shares
router.get('/amount/:userId/:tontineId', async (req, res) => {
  const { userId, tontineId } = req.params;
  const db = req.app.get('db');

  try {
    const [result] = await db.execute(
      `SELECT tm.shares, t.contribution_amount,
       (tm.shares * t.contribution_amount) as required_amount
       FROM tontine_members tm
       JOIN tontines t ON tm.tontine_id = t.id
       WHERE tm.user_id = ? AND tm.tontine_id = ?`,
      [userId, tontineId]
    );

    if (!result.length) {
      return res.status(404).json({ message: 'User not a member of this tontine' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Get contribution amount error:', error);
    res.status(500).json({ message: 'Failed to get contribution amount' });
  }
});

module.exports = router;