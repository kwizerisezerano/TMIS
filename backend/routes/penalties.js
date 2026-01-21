const express = require('express');
const router = express.Router();

// Apply penalty for meeting absence (5000 RWF)
router.post('/meeting-absence', async (req, res) => {
  const { userId, tontineId, reason } = req.body;
  const db = req.app.get('db');

  try {
    await db.execute(
      `INSERT INTO penalties (user_id, tontine_id, penalty_type, amount, reason) 
       VALUES (?, ?, 'meeting_absence', 5000.00, ?)`,
      [userId, tontineId, reason || 'Unexcused absence from meeting']
    );

    res.json({ message: 'Meeting absence penalty applied: 5000 RWF' });
  } catch (error) {
    console.error('Apply penalty error:', error);
    res.status(500).json({ message: 'Failed to apply penalty' });
  }
});

// Apply penalty for late contribution
router.post('/late-contribution', async (req, res) => {
  const { userId, tontineId, daysLate } = req.body;
  const db = req.app.get('db');

  try {
    let amount = 1000; // Default for 10-17 days late
    let reason = 'Late contribution payment (10-17 days)';

    if (daysLate > 17) {
      amount = 200; // 1% of 20,000 RWF monthly share
      reason = 'Late contribution payment (after 17th)';
    }

    await db.execute(
      `INSERT INTO penalties (user_id, tontine_id, penalty_type, amount, reason) 
       VALUES (?, ?, 'late_contribution', ?, ?)`,
      [userId, tontineId, amount, reason]
    );

    res.json({ message: `Late contribution penalty applied: ${amount} RWF` });
  } catch (error) {
    console.error('Apply penalty error:', error);
    res.status(500).json({ message: 'Failed to apply penalty' });
  }
});

// Apply penalty for being late to meeting (1000 RWF)
router.post('/late-meeting', async (req, res) => {
  const { userId, tontineId, minutesLate } = req.body;
  const db = req.app.get('db');

  try {
    if (minutesLate > 15) {
      await db.execute(
        `INSERT INTO penalties (user_id, tontine_id, penalty_type, amount, reason) 
         VALUES (?, ?, 'late_meeting', 1000.00, ?)`,
        [userId, tontineId, `Late to meeting by ${minutesLate} minutes`]
      );

      res.json({ message: 'Late meeting penalty applied: 1000 RWF' });
    } else {
      res.json({ message: 'No penalty - within 15 minute grace period' });
    }
  } catch (error) {
    console.error('Apply penalty error:', error);
    res.status(500).json({ message: 'Failed to apply penalty' });
  }
});

// Apply penalty for loan default (10% of remaining balance)
router.post('/loan-default', async (req, res) => {
  const { userId, loanId, remainingBalance } = req.body;
  const db = req.app.get('db');

  try {
    const penaltyAmount = remainingBalance * 0.10; // 10% of remaining balance

    // Get loan details
    const [loan] = await db.execute(
      'SELECT tontine_id FROM loan_requests WHERE id = ?',
      [loanId]
    );

    if (loan.length > 0) {
      await db.execute(
        `INSERT INTO penalties (user_id, tontine_id, penalty_type, amount, reason) 
         VALUES (?, ?, 'loan_default', ?, ?)`,
        [userId, loan[0].tontine_id, penaltyAmount, `Loan default penalty - 10% of remaining balance (${remainingBalance} RWF)`]
      );

      res.json({ message: `Loan default penalty applied: ${penaltyAmount} RWF` });
    } else {
      res.status(404).json({ message: 'Loan not found' });
    }
  } catch (error) {
    console.error('Apply penalty error:', error);
    res.status(500).json({ message: 'Failed to apply penalty' });
  }
});

// Get user penalties
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  const db = req.app.get('db');

  try {
    const [penalties] = await db.execute(
      `SELECT p.*, t.name as tontine_name 
       FROM penalties p 
       JOIN tontines t ON p.tontine_id = t.id 
       WHERE p.user_id = ? 
       ORDER BY p.created_at DESC`,
      [userId]
    );

    res.json(penalties);
  } catch (error) {
    console.error('Fetch penalties error:', error);
    res.status(500).json({ message: 'Failed to fetch penalties' });
  }
});

// Pay penalty
router.post('/pay/:penaltyId', async (req, res) => {
  const { penaltyId } = req.params;
  const { paymentMethod, transactionRef } = req.body;
  const db = req.app.get('db');

  try {
    await db.execute(
      'UPDATE penalties SET status = "paid" WHERE id = ?',
      [penaltyId]
    );

    res.json({ message: 'Penalty payment recorded successfully' });
  } catch (error) {
    console.error('Pay penalty error:', error);
    res.status(500).json({ message: 'Failed to record penalty payment' });
  }
});

// Get tontine penalties (for executives)
router.get('/tontine/:tontineId', async (req, res) => {
  const { tontineId } = req.params;
  const db = req.app.get('db');

  try {
    const [penalties] = await db.execute(
      `SELECT p.*, u.names as member_name 
       FROM penalties p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.tontine_id = ? 
       ORDER BY p.created_at DESC`,
      [tontineId]
    );

    res.json(penalties);
  } catch (error) {
    console.error('Fetch tontine penalties error:', error);
    res.status(500).json({ message: 'Failed to fetch tontine penalties' });
  }
});

module.exports = router;