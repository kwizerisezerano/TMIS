const express = require('express');
const checkTontineStatus = require('../middleware/checkTontineStatus');
const router = express.Router();

// Get all loan requests (for admin reports)
router.get('/', async (req, res) => {
  const db = req.app.get('db');

  try {
    const [loans] = await db.execute(
      `SELECT lr.*, u.names as user_name, t.name as tontine_name
       FROM loan_requests lr 
       JOIN users u ON lr.user_id = u.id 
       JOIN tontines t ON lr.tontine_id = t.id
       ORDER BY lr.created_at DESC`
    );

    res.json(loans);
  } catch (error) {
    console.error('Fetch all loans error:', error);
    res.status(500).json({ message: 'Failed to fetch loans' });
  }
});

// Get loan requests for a tontine
router.get('/tontine/:tontineId', async (req, res) => {
  const { tontineId } = req.params;
  const db = req.app.get('db');

  try {
    const [loans] = await db.execute(
      `SELECT lr.*, u.names as member_name, u.phone 
       FROM loan_requests lr 
       JOIN users u ON lr.user_id = u.id 
       WHERE lr.tontine_id = ? 
       ORDER BY lr.created_at DESC`,
      [tontineId]
    );

    res.json(loans);
  } catch (error) {
    console.error('Fetch loans error:', error);
    res.status(500).json({ message: 'Failed to fetch loans' });
  }
});

// Approve loan
router.put('/:id/approve', async (req, res) => {
  const { id } = req.params;
  const db = req.app.get('db');

  try {
    await db.execute(
      'UPDATE loan_requests SET status = "Approved" WHERE id = ?',
      [id]
    );

    res.json({ success: true, message: 'Loan approved successfully' });
  } catch (error) {
    console.error('Error approving loan:', error);
    res.status(500).json({ success: false, message: 'Failed to approve loan' });
  }
});

// Reject loan
router.put('/:id/reject', async (req, res) => {
  const { id } = req.params;
  const db = req.app.get('db');

  try {
    await db.execute(
      'UPDATE loan_requests SET status = "Rejected" WHERE id = ?',
      [id]
    );

    res.json({ success: true, message: 'Loan rejected successfully' });
  } catch (error) {
    console.error('Error rejecting loan:', error);
    res.status(500).json({ success: false, message: 'Failed to reject loan' });
  }
});

// Get user loans
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  const db = req.app.get('db');

  try {
    const [loans] = await db.execute(
      `SELECT lr.*, t.name as tontine_name 
       FROM loan_requests lr 
       JOIN tontines t ON lr.tontine_id = t.id 
       WHERE lr.user_id = ? 
       ORDER BY lr.created_at DESC`,
      [userId]
    );

    res.json(loans);
  } catch (error) {
    console.error('Fetch user loans error:', error);
    res.status(500).json({ message: 'Failed to fetch user loans' });
  }
});

// Submit loan request (max 2/3 of share, 1.7% monthly interest)
router.post('/', checkTontineStatus, async (req, res) => {
  const {
    userId,
    tontineId,
    loanAmount,
    phoneNumber,
    user_id,
    tontine_id,
    amount,
    phone_number,
    purpose
  } = req.body;
  
  const db = req.app.get('db');
  const io = req.app.get('io');

  try {
    // Handle both camelCase and snake_case field names
    const finalUserId = userId || user_id;
    const finalTontineId = tontineId || tontine_id;
    const finalLoanAmount = loanAmount || amount;
    const finalPhoneNumber = phoneNumber || phone_number;
    const loanPurpose = purpose || 'Loan request';
    
    // Validate required fields
    if (!finalUserId || !finalTontineId || !finalLoanAmount) {
      return res.status(400).json({ 
        message: 'Missing required fields: userId, tontineId, and amount are required' 
      });
    }
    
    // Get user's phone number if not provided
    let userPhoneNumber = finalPhoneNumber;
    if (!userPhoneNumber) {
      const [userRecord] = await db.execute(
        'SELECT phone FROM users WHERE id = ?',
        [finalUserId]
      );
      userPhoneNumber = userRecord[0]?.phone || null;
    }
    
    if (!userPhoneNumber) {
      return res.status(400).json({ 
        message: 'Phone number is required for loan requests' 
      });
    }
    // Check if user has existing unpaid loan
    const [existingLoan] = await db.execute(
      'SELECT id FROM loan_requests WHERE user_id = ? AND status IN ("Approved", "Disbursed") AND id NOT IN (SELECT DISTINCT loan_id FROM loan_payments WHERE payment_status = "Approved")',
      [finalUserId]
    );

    if (existingLoan.length > 0) {
      return res.status(400).json({ message: 'You have an outstanding loan. Please repay before requesting a new loan.' });
    }

    // Get user's total share value
    const [userShare] = await db.execute(
      `SELECT COALESCE(SUM(amount), 0) as total_share 
       FROM contributions 
       WHERE user_id = ? AND tontine_id = ? AND payment_status = 'Approved'`,
      [finalUserId, finalTontineId]
    );

    const maxLoanAmount = (userShare[0].total_share * 2) / 3; // 2/3 of share

    if (finalLoanAmount > maxLoanAmount) {
      return res.status(400).json({ 
        message: `Loan amount exceeds maximum allowed (${maxLoanAmount.toFixed(2)} RWF)` 
      });
    }

    const interestRate = 1.7; // Fixed 1.7% monthly
    const repaymentPeriod = 6; // Max 6 months
    const monthlyInterest = (finalLoanAmount * interestRate) / 100;
    const totalInterest = monthlyInterest * repaymentPeriod;
    const totalAmount = finalLoanAmount + totalInterest;

    const [result] = await db.execute(
      `INSERT INTO loan_requests (user_id, tontine_id, amount, interest_rate, 
       total_amount, repayment_period, phone_number, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', NOW())`,
      [finalUserId, finalTontineId, finalLoanAmount, interestRate, totalAmount, repaymentPeriod, userPhoneNumber]
    );

    // Add notification for loan request submission
    await db.execute(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [finalUserId, 'Loan Request Submitted', `Your loan request of RWF ${finalLoanAmount.toLocaleString()} has been submitted successfully and is under review.`, 'info']
    );

    // Send email notification to user about loan approval
    if (userPhoneNumber) {
      try {
        await sendLoanApprovalEmail(userPhoneNumber, finalLoanAmount, result.insertId, db);
      } catch (emailError) {
        console.error('Email notification error:', emailError);
      }
    }

    // Auto-approve loan if within limits and send email notification
    if (finalLoanAmount <= maxLoanAmount) {
      // Update loan status to approved
      await db.execute(
        'UPDATE loan_requests SET status = "Approved" WHERE id = ?',
        [result.insertId]
      );

      // Add approval notification
      await db.execute(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [finalUserId, 'Loan Approved', `Your loan request of RWF ${finalLoanAmount.toLocaleString()} has been approved successfully.`, 'success']
      );

      // Send email notification about loan approval (no payment disbursement)
      try {
        await sendLoanApprovalEmail(userPhoneNumber, finalLoanAmount, result.insertId, db);
      } catch (emailError) {
        console.error('Email notification error:', emailError);
      }
    }

    // Emit real-time notification if io exists
    if (io) {
      io.to(`tontine-${finalTontineId}`).emit('loan-request-submitted', {
        loanId: result.insertId,
        userId: finalUserId,
        amount: finalLoanAmount,
        timestamp: new Date()
      });

      // Emit refresh event for auto-refresh
      io.to(`user-${finalUserId}`).emit('auto-refresh', {
        type: 'loan-request',
        message: 'Loan request processed - refreshing data'
      });
    }

    res.status(201).json({
      message: 'Loan request submitted successfully',
      loanId: result.insertId,
      maxRepaymentPeriod: '6 months',
      interestRate: '1.7% monthly'
    });

  } catch (error) {
    console.error('Submit loan request error:', error);
    res.status(500).json({ message: 'Failed to submit loan request' });
  }
});

// Update loan status
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = req.app.get('db');
  const io = req.app.get('io');

  try {
    await db.execute(
      'UPDATE loan_requests SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    // Get loan details for notification
    const [loan] = await db.execute(
      'SELECT * FROM loan_requests WHERE id = ?',
      [id]
    );

    if (loan.length > 0) {
      // Emit real-time notification
      io.to(`tontine-${loan[0].tontine_id}`).emit('loan-status-updated', {
        loanId: id,
        status,
        userId: loan[0].user_id,
        timestamp: new Date()
      });
    }

    res.json({ message: 'Loan status updated successfully' });

  } catch (error) {
    console.error('Update loan status error:', error);
    res.status(500).json({ message: 'Failed to update loan status' });
  }
});

// Get loan payments
router.get('/:loanId/payments', async (req, res) => {
  const { loanId } = req.params;
  const db = req.app.get('db');

  try {
    const [payments] = await db.execute(
      `SELECT lp.*, u.names 
       FROM loan_payments lp 
       JOIN users u ON lp.user_id = u.id 
       WHERE lp.loan_id = ? 
       ORDER BY lp.payment_date DESC`,
      [loanId]
    );

    res.json(payments);
  } catch (error) {
    console.error('Fetch loan payments error:', error);
    res.status(500).json({ message: 'Failed to fetch loan payments' });
  }
});

// Enforce loan payment (for overdue loans)
router.post('/:loanId/enforce-payment', async (req, res) => {
  const { loanId } = req.params;
  const { enforcedBy, paymentAmount } = req.body;
  const db = req.app.get('db');
  const io = req.app.get('io');

  try {
    // Get loan details and verify enforcer is tontine owner
    const [loan] = await db.execute(
      `SELECT lr.*, t.creator_id, t.name as tontine_name, u.names as borrower_name, u.phone
       FROM loan_requests lr 
       JOIN tontines t ON lr.tontine_id = t.id 
       JOIN users u ON lr.user_id = u.id
       WHERE lr.id = ?`,
      [loanId]
    );

    if (loan.length === 0) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    if (loan[0].creator_id !== enforcedBy) {
      return res.status(403).json({ message: 'Only tontine owner can enforce payments' });
    }

    // Mark loan as payment enforced
    await db.execute(
      'UPDATE loan_requests SET payment_enforced = TRUE, enforced_at = NOW() WHERE id = ?',
      [loanId]
    );

    // Send notification to borrower
    io.to(`user-${loan[0].user_id}`).emit('payment-enforced', {
      loanId,
      tontineName: loan[0].tontine_name,
      amount: paymentAmount,
      message: 'Your loan payment is now enforced. Please pay immediately.',
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Payment enforcement activated',
      borrowerPhone: loan[0].phone
    });

  } catch (error) {
    console.error('Enforce payment error:', error);
    res.status(500).json({ message: 'Failed to enforce payment' });
  }
});

// Send email notification for loan approval
async function sendLoanApprovalEmail(phoneNumber, loanAmount, loanId, db) {
  const { sendLoanEmail } = require('../utils/email');
  
  try {
    // Get user email from phone number
    const [users] = await db.execute(
      'SELECT email, names FROM users WHERE phone = ?',
      [phoneNumber]
    );
    
    if (users.length > 0) {
      const user = users[0];
      const subject = 'Loan Approved - The Future Tontine';
      
      const loanData = {
        userName: user.names,
        loanId: loanId.toString().padStart(4, '0'),
        amount: loanAmount.toLocaleString()
      };
      
      await sendLoanEmail(user.email, loanData);
      
      // Send notification to tontine admin
      const { sendAdminLoanNotification } = require('../utils/email');
      const [tontineAdmin] = await db.execute(
        'SELECT u.email FROM users u JOIN tontines t ON u.id = t.creator_id WHERE t.id = ?',
        [1]
      );
      
      if (tontineAdmin.length > 0) {
        await sendAdminLoanNotification(tontineAdmin[0].email, loanData);
      }
      console.log(`Loan approval email sent to ${user.email} for loan ${loanId}`);
    }
  } catch (error) {
    console.error('Email sending error:', error.message);
  }
}

module.exports = router;