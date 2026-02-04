const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('paypal-rest-sdk');
const axios = require('axios');
const router = express.Router();

// Configure PayPal
paypal.configure({
  mode: process.env.PAYPAL_MODE,
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET
});

// Process contribution payment
router.post('/contribution', async (req, res) => {
  console.log('Payment request body:', req.body);
  
  const { userId, tontineId, amount, paymentMethod, paymentData } = req.body;
  
  // Validate required fields
  if (!userId || !tontineId || !amount || !paymentMethod) {
    return res.status(400).json({ 
      success: false,
      message: 'Missing required fields: userId, tontineId, amount, paymentMethod' 
    });
  }
  
  if (paymentMethod === 'mobile_money' && (!paymentData || !paymentData.phone)) {
    return res.status(400).json({ 
      success: false,
      message: 'Phone number required for mobile money payments' 
    });
  }
  
  // Validate phone number format for Rwanda
  if (paymentMethod === 'mobile_money' && paymentData.phone) {
    const phone = paymentData.phone.toString();
    if (phone.length < 10 || !phone.match(/^(078|079|072|073)/)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid phone number. Use format: 0781234567' 
      });
    }
  }
  
  const db = req.app.get('db');
  const io = req.app.get('io');

  try {
    let paymentResult = { success: true }; // Default success for testing
    let transactionRef = generateTransactionRef();

    // Process payment based on method
    switch (paymentMethod) {
      case 'mobile_money':
        paymentResult = await processMobileMoneyPayment(paymentData, amount, io, userId, tontineId, db, transactionRef);
        break;
      default:
        paymentResult = { success: true, transactionId: `TEST_${Date.now()}` };
    }

    if (paymentResult.success && paymentResult.gatewaySuccess) {
      const paymentStatus = paymentResult.lanariSuccess ? 'Approved' : (paymentMethod === 'mobile_money' ? 'Pending' : 'Approved');
      
      const [result] = await db.execute(
        `INSERT INTO contributions (user_id, tontine_id, amount, payment_method, 
         contribution_date, transaction_ref, payment_status) 
         VALUES (?, ?, ?, ?, NOW(), ?, ?)`,
        [userId, tontineId, amount, paymentMethod, transactionRef, paymentStatus]
      );

      // Add notification for successful contribution
      if (paymentStatus === 'Approved') {
        await db.execute(
          'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
          [userId, 'Contribution Successful', `Your contribution of RWF ${amount.toLocaleString()} has been approved successfully.`, 'success']
        );
      }

      io.to(`tontine-${tontineId}`).emit('contribution-received', {
        userId,
        amount,
        contributionId: result.insertId,
        status: paymentStatus,
        timestamp: new Date()
      });

      // Emit refresh event for auto-refresh
      io.to(`user-${userId}`).emit('auto-refresh', {
        type: 'contribution',
        message: 'Contribution processed - refreshing data'
      });

      res.json({
        success: true,
        message: 'Payment completed successfully',
        contributionId: result.insertId,
        transactionRef,
        status: paymentStatus
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment was not completed. Please try again.',
        error: paymentResult.error
      });
    }

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ success: false, message: 'Payment processing failed' });
  }
});

// Process loan payment
router.post('/loan-payment', async (req, res) => {
  const { loanId, userId, paymentAmount, paymentMethod, paymentData } = req.body;
  const db = req.app.get('db');
  const io = req.app.get('io');

  // Validate required fields
  if (!loanId || !userId || !paymentAmount || !paymentMethod) {
    return res.status(400).json({ 
      success: false,
      message: 'Missing required fields: loanId, userId, paymentAmount, paymentMethod' 
    });
  }
  
  if (paymentMethod === 'mobile_money' && (!paymentData || !paymentData.phone)) {
    return res.status(400).json({ 
      success: false,
      message: 'Phone number required for mobile money payments' 
    });
  }

  try {
    // Get loan details
    const [loan] = await db.execute(
      'SELECT * FROM loan_requests WHERE id = ? AND user_id = ? AND status = "Approved"',
      [loanId, userId]
    );

    if (loan.length === 0) {
      return res.status(404).json({ message: 'Approved loan not found' });
    }

    // Check if loan is already fully paid
    const [paidAmount] = await db.execute(
      'SELECT COALESCE(SUM(amount), 0) as total_paid FROM loan_payments WHERE loan_id = ? AND payment_status = "Approved"',
      [loanId]
    );

    const remainingAmount = parseFloat(paidAmount[0].total_paid) > 0 
      ? parseFloat(loan[0].total_amount) - parseFloat(paidAmount[0].total_paid)
      : parseFloat(loan[0].total_amount);
    
    if (remainingAmount <= 0) {
      return res.status(400).json({ message: 'Loan is already fully paid' });
    }

    if (parseFloat(paymentAmount) > remainingAmount) {
      return res.status(400).json({ 
        message: `Payment amount exceeds remaining balance (${remainingAmount.toFixed(2)} RWF)` 
      });
    }

    let paymentResult = { success: true }; // Default success for testing
    let transactionRef = generateTransactionRef();

    // Process payment based on method
    switch (paymentMethod) {
      case 'mobile_money':
        paymentResult = await processLoanMobileMoneyPayment(paymentData, paymentAmount, io, userId, loan[0].tontine_id, db, transactionRef);
        break;
      default:
        paymentResult = { success: true, transactionId: `TEST_${Date.now()}` };
    }

    if (paymentResult.success && paymentResult.gatewaySuccess) {
      const paymentStatus = paymentResult.lanariSuccess ? 'Approved' : (paymentMethod === 'mobile_money' ? 'Pending' : 'Approved');

      // Record loan payment
      const [result] = await db.execute(
        `INSERT INTO loan_payments (loan_id, user_id, amount, payment_method, 
         payment_status, transaction_ref, payment_date) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [loanId, userId, paymentAmount, paymentMethod, paymentStatus, transactionRef]
      );

      // Add notification for successful loan payment
      if (paymentStatus === 'Approved') {
        await db.execute(
          'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
          [userId, 'Loan Payment Successful', `Your loan payment of RWF ${paymentAmount.toLocaleString()} has been processed successfully.`, 'success']
        );
      }

      // Emit real-time update
      io.to(`tontine-${loan[0].tontine_id}`).emit('loan-payment-submitted', {
        loanId,
        userId,
        paymentAmount,
        paymentStatus,
        transactionRef,
        timestamp: new Date()
      });

      // Emit refresh event for auto-refresh
      io.to(`user-${userId}`).emit('auto-refresh', {
        type: 'loan-payment',
        message: 'Loan payment processed - refreshing data'
      });

      res.status(201).json({
        success: true,
        message: 'Loan payment completed successfully',
        paymentId: result.insertId,
        transactionRef,
        paymentStatus,
        remainingAmount: (remainingAmount - parseFloat(paymentAmount)).toFixed(2)
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Loan payment was not completed. Please try again.',
        error: paymentResult.error
      });
    }

  } catch (error) {
    console.error('Loan payment error:', error);
    res.status(500).json({ message: 'Failed to process loan payment' });
  }
});

// Lanari payment processing for loan payments with automatic status checking
async function processLoanMobileMoneyPayment(paymentData, amount, io, userId, tontineId, db, transactionRef) {
  try {
    if (io && tontineId) {
      io.to(`tontine-${tontineId}`).emit('payment-status', {
        userId,
        status: 'initiated',
        message: 'Loan payment request sent to Lanari Pay',
        timestamp: new Date()
      });
    }

    const lanariPayload = {
      api_key: '5a257d53460ade03b19daf2ed8195938d0586ff6297e8fc5ab840958200ceeb8',
      api_secret: '1b0903514c0d2192a3b0f9e57857807287ef2da754396a5c63d7d586eba4c4f2b8929a4e069f65d27aec05a3d3b0a47226e432236076ea6e0e9fde51a85c164a',
      amount: parseInt(amount),
      customer_phone: paymentData.phone,
      currency: 'RWF',
      description: (paymentData.description || 'Loan payment').replace(/[^a-zA-Z0-9\s]/g, '')
    };

    console.log('Sending loan payment to Lanari:', lanariPayload);

    const response = await axios.post('https://www.lanari.rw/lanari_pay/api/payment/process.php', lanariPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });

    console.log('Lanari loan payment response:', response.data);
    const result = response.data;
    
    const isLanariSuccess = result.success || 
                           result.status === 'success' || 
                           (result.transaction_id && result.transaction_id !== 'pending' && result.transaction_id !== 'failed') ||
                           (result.message && result.message.toLowerCase().includes('successfully')) ||
                           (result.message && result.message.toLowerCase().includes('confirmed')) ||
                           (result.message && result.message.toLowerCase().includes('completed'));
    
    const isGatewaySuccess = result.gateway_response && result.gateway_response.status === 200;
    
    // If successful, start automatic status checking for loan payments
    if (isLanariSuccess) {
      setTimeout(() => checkLoanPaymentStatus(result.transaction_id, transactionRef, db, io, tontineId, userId, 0), 10000);
    }
    
    if (io && tontineId) {
      io.to(`tontine-${tontineId}`).emit('payment-status', {
        userId,
        status: isLanariSuccess ? 'completed' : 'failed',
        message: result.message || (isLanariSuccess ? 'Loan payment completed successfully' : 'Loan payment failed'),
        transactionId: result.transaction_id,
        timestamp: new Date()
      });
    }
    
    return {
      success: true,
      lanariSuccess: isLanariSuccess,
      gatewaySuccess: isGatewaySuccess,
      transactionId: result.transaction_id || `LANARI_${Date.now()}`,
      error: !isLanariSuccess || !isGatewaySuccess ? result.message : null
    };
  } catch (error) {
    console.log('Lanari loan payment error:', error.message);
    if (io && tontineId) {
      io.to(`tontine-${tontineId}`).emit('payment-status', {
        userId,
        status: 'error',
        message: `Loan payment error: ${error.message}`,
        timestamp: new Date()
      });
    }
    
    return {
      success: false,
      error: error.response?.data ? JSON.stringify(error.response.data) : error.message
    };
  }
}

// Lanari payment processing with automatic status checking
async function processMobileMoneyPayment(paymentData, amount, io, userId, tontineId, db, transactionRef) {
  try {
    if (io && tontineId) {
      io.to(`tontine-${tontineId}`).emit('payment-status', {
        userId,
        status: 'initiated',
        message: 'Payment request sent to Lanari Pay',
        timestamp: new Date()
      });
    }

    const lanariPayload = {
      api_key: '5a257d53460ade03b19daf2ed8195938d0586ff6297e8fc5ab840958200ceeb8',
      api_secret: '1b0903514c0d2192a3b0f9e57857807287ef2da754396a5c63d7d586eba4c4f2b8929a4e069f65d27aec05a3d3b0a47226e432236076ea6e0e9fde51a85c164a',
      amount: parseInt(amount),
      customer_phone: paymentData.phone,
      currency: 'RWF',
      description: (paymentData.description || 'Tontine payment').replace(/[^a-zA-Z0-9\s]/g, '')
    };

    console.log('Sending to Lanari:', lanariPayload);

    const response = await axios.post('https://www.lanari.rw/lanari_pay/api/payment/process.php', lanariPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });

    console.log('Lanari response:', response.data);
    const result = response.data;
    
    // Check if payment was successful and gateway status is 200
    const isLanariSuccess = result.success || 
                           result.status === 'success' || 
                           (result.transaction_id && result.transaction_id !== 'pending' && result.transaction_id !== 'failed') ||
                           (result.message && result.message.toLowerCase().includes('successfully')) ||
                           (result.message && result.message.toLowerCase().includes('confirmed')) ||
                           (result.message && result.message.toLowerCase().includes('completed'));
    
    const isGatewaySuccess = result.gateway_response && result.gateway_response.status === 200;
    
    // If successful, start automatic status checking immediately and repeatedly
    if (isLanariSuccess) {
      // Check status after 10 seconds, then every 30 seconds for up to 5 minutes
      setTimeout(() => checkLoanPaymentStatus(result.transaction_id, transactionRef, db, io, tontineId, userId, 0), 10000);
    }
    
    if (io && tontineId) {
      io.to(`tontine-${tontineId}`).emit('payment-status', {
        userId,
        status: isLanariSuccess ? 'completed' : 'failed',
        message: result.message || (isLanariSuccess ? 'Payment completed successfully' : 'Payment failed'),
        transactionId: result.transaction_id,
        timestamp: new Date()
      });
    }
    
    return {
      success: true,
      lanariSuccess: isLanariSuccess,
      gatewaySuccess: isGatewaySuccess,
      transactionId: result.transaction_id || `LANARI_${Date.now()}`,
      error: !isLanariSuccess || !isGatewaySuccess ? result.message : null
    };
  } catch (error) {
    console.log('Lanari error:', error.message);
    console.log('Lanari error response:', error.response?.data);
    if (io && tontineId) {
      io.to(`tontine-${tontineId}`).emit('payment-status', {
        userId,
        status: 'error',
        message: `Payment error: ${error.message}`,
        timestamp: new Date()
      });
    }
    
    return {
      success: false,
      error: error.response?.data ? JSON.stringify(error.response.data) : error.message
    };
  }
}

// Automatic payment status checker with Lanari API verification
function checkPaymentStatus(lanariTransactionId, transactionRef, db, io, tontineId, userId, attempt = 0) {
  setTimeout(async () => {
    try {
      console.log(`Checking Lanari payment status for transaction ${lanariTransactionId}, attempt ${attempt + 1}`);
      
      // Check actual payment status with Lanari API
      const statusResponse = await axios.post('https://www.lanari.rw/lanari_pay/api/payment/status.php', {
        api_key: '5a257d53460ade03b19daf2ed8195938d0586ff6297e8fc5ab840958200ceeb8',
        api_secret: '1b0903514c0d2192a3b0f9e57857807287ef2da754396a5c63d7d586eba4c4f2b8929a4e069f65d27aec05a3d3b0a47226e432236076ea6e0e9fde51a85c164a',
        transaction_id: lanariTransactionId
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });

      console.log(`Lanari status response:`, statusResponse.data);
      const statusResult = statusResponse.data;
      
      // Check if Lanari confirms payment is successful
      const isPaymentConfirmed = statusResult.status === 'success' || 
                                statusResult.status === 'completed' ||
                                (statusResult.message && statusResult.message.toLowerCase().includes('successful')) ||
                                (statusResult.message && statusResult.message.toLowerCase().includes('completed'));
      
      const [contribution] = await db.execute(
        'SELECT * FROM contributions WHERE transaction_ref = ? AND payment_status = "Pending"',
        [transactionRef]
      );

      if (contribution.length > 0 && isPaymentConfirmed) {
        // Update to Approved only if Lanari confirms payment
        await db.execute(
          'UPDATE contributions SET payment_status = "Approved" WHERE transaction_ref = ?',
          [transactionRef]
        );

        // Add success notification
        await db.execute(
          'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
          [userId, 'Contribution Successful', `Your contribution of RWF ${contribution[0].amount.toLocaleString()} has been approved successfully.`, 'success']
        );

        // Emit status update
        io.to(`tontine-${tontineId}`).emit('payment-status-updated', {
          userId,
          contributionId: contribution[0].id,
          status: 'Approved',
          transactionRef: transactionRef,
          message: 'Payment confirmed by Lanari API',
          timestamp: new Date()
        });

        console.log(`Payment ${transactionRef} confirmed and approved by Lanari`);
        return; // Stop checking once confirmed
      } else if (contribution.length > 0 && statusResult.status === 'failed') {
        // Update to Failed if Lanari confirms failure
        await db.execute(
          'UPDATE contributions SET payment_status = "Failed" WHERE transaction_ref = ?',
          [transactionRef]
        );

        io.to(`tontine-${tontineId}`).emit('payment-status-updated', {
          userId,
          contributionId: contribution[0].id,
          status: 'Failed',
          transactionRef: transactionRef,
          message: 'Payment failed - confirmed by Lanari API',
          timestamp: new Date()
        });

        console.log(`Payment ${transactionRef} confirmed as failed by Lanari`);
        return; // Stop checking
      }
      
      // Continue checking for up to 10 attempts (5 minutes) if still pending
      if (attempt < 10) {
        checkPaymentStatus(lanariTransactionId, transactionRef, db, io, tontineId, userId, attempt + 1);
      }
    } catch (error) {
      console.error('Lanari status check error:', error);
      // Retry on error
      if (attempt < 10) {
        checkPaymentStatus(lanariTransactionId, transactionRef, db, io, tontineId, userId, attempt + 1);
      }
    }
  }, 30000);
}

// Check loan payment status with Lanari
function checkLoanPaymentStatus(lanariTransactionId, transactionRef, db, io, tontineId, userId, attempt = 0) {
  setTimeout(async () => {
    try {
      console.log(`Checking Lanari loan payment status for transaction ${lanariTransactionId}, attempt ${attempt + 1}`);
      
      const statusResponse = await axios.post('https://www.lanari.rw/lanari_pay/api/payment/status.php', {
        api_key: '5a257d53460ade03b19daf2ed8195938d0586ff6297e8fc5ab840958200ceeb8',
        api_secret: '1b0903514c0d2192a3b0f9e57857807287ef2da754396a5c63d7d586eba4c4f2b8929a4e069f65d27aec05a3d3b0a47226e432236076ea6e0e9fde51a85c164a',
        transaction_id: lanariTransactionId
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });

      const statusResult = statusResponse.data;
      console.log(`Lanari loan payment status:`, statusResult);
      
      const isPaymentConfirmed = statusResult.status === 'success' || 
                                statusResult.status === 'completed' ||
                                (statusResult.message && statusResult.message.toLowerCase().includes('successful')) ||
                                (statusResult.message && statusResult.message.toLowerCase().includes('completed'));
      
      const [loanPayment] = await db.execute(
        'SELECT * FROM loan_payments WHERE transaction_ref = ? AND payment_status = "Pending"',
        [transactionRef]
      );

      if (loanPayment.length > 0 && isPaymentConfirmed) {
        await db.execute(
          'UPDATE loan_payments SET payment_status = "Approved" WHERE transaction_ref = ?',
          [transactionRef]
        );

        // Add success notification
        await db.execute(
          'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
          [userId, 'Loan Payment Successful', `Your loan payment of RWF ${loanPayment[0].amount.toLocaleString()} has been processed successfully.`, 'success']
        );

        io.to(`tontine-${tontineId}`).emit('loan-payment-status-updated', {
          userId,
          paymentId: loanPayment[0].id,
          status: 'Approved',
          transactionRef,
          message: 'Loan payment confirmed by Lanari API',
          timestamp: new Date()
        });

        console.log(`Loan payment ${transactionRef} confirmed and approved`);
        return;
      } else if (loanPayment.length > 0 && statusResult.status === 'failed') {
        await db.execute(
          'UPDATE loan_payments SET payment_status = "Failed" WHERE transaction_ref = ?',
          [transactionRef]
        );

        io.to(`tontine-${tontineId}`).emit('loan-payment-status-updated', {
          userId,
          paymentId: loanPayment[0].id,
          status: 'Failed',
          transactionRef,
          message: 'Loan payment failed - confirmed by Lanari API',
          timestamp: new Date()
        });

        console.log(`Loan payment ${transactionRef} confirmed as failed`);
        return;
      }
      
      if (attempt < 10) {
        checkLoanPaymentStatus(lanariTransactionId, transactionRef, db, io, tontineId, userId, attempt + 1);
      }
    } catch (error) {
      console.error('Lanari loan payment status check error:', error);
      if (attempt < 10) {
        checkLoanPaymentStatus(lanariTransactionId, transactionRef, db, io, tontineId, userId, attempt + 1);
      }
    }
  }, 30000);
}

function generateTransactionRef() {
  return require('crypto').randomBytes(16).toString('hex');
}

// Get payment history with real-time Lanari status check
router.get('/history/:userId', async (req, res) => {
  const { userId } = req.params;
  const db = req.app.get('db');
  const io = req.app.get('io');

  try {
    const [contributions] = await db.execute(
      `SELECT c.*, t.name as tontine_name 
       FROM contributions c 
       JOIN tontines t ON c.tontine_id = t.id 
       WHERE c.user_id = ? 
       ORDER BY c.contribution_date DESC`,
      [userId]
    );

    // Get approved loan payments with real-time data
    const [loanPayments] = await db.execute(
      `SELECT lp.*, lr.tontine_id, t.name as tontine_name 
       FROM loan_payments lp 
       JOIN loan_requests lr ON lp.loan_id = lr.id 
       JOIN tontines t ON lr.tontine_id = t.id 
       WHERE lp.user_id = ?
       ORDER BY lp.payment_date DESC`,
      [userId]
    );

    // Get penalty payments
    const [penaltyPayments] = await db.execute(
      `SELECT p.id, p.amount, p.reason, p.status, p.paid_at as payment_date, 
              'penalty' as payment_type, t.name as tontine_name
       FROM penalties p 
       LEFT JOIN tontines t ON p.tontine_id = t.id
       WHERE p.user_id = ? AND p.status = 'paid'
       ORDER BY p.paid_at DESC`,
      [userId]
    );

    // Check pending payments with Lanari API
    for (const contribution of contributions) {
      if (contribution.payment_status === 'Pending' && contribution.payment_method === 'mobile_money') {
        // Trigger immediate status check for pending payments
        setTimeout(() => {
          checkLanariStatusForContribution(contribution, db, io);
        }, 1000);
      }
    }

    res.json({ contributions, loanPayments, penaltyPayments });

  } catch (error) {
    console.error('Payment history error:', error);
    res.status(500).json({ message: 'Failed to fetch payment history' });
  }
});

// Get payment history for all users (admin only)
router.get('/history/all', async (req, res) => {
  const db = req.app.get('db');

  try {
    const [payments] = await db.execute(
      `SELECT c.id, c.user_id, c.amount, c.payment_method, c.contribution_date as created_at, 
              c.payment_status as status, u.names as member_name, 'contribution' as payment_type
       FROM contributions c 
       JOIN users u ON c.user_id = u.id 
       UNION ALL
       SELECT lp.id, lp.user_id, lp.amount, lp.payment_method, lp.payment_date as created_at, 
              lp.payment_status as status, u.names as member_name, 'loan_payment' as payment_type
       FROM loan_payments lp 
       JOIN users u ON lp.user_id = u.id 
       UNION ALL
       SELECT p.id, p.user_id, p.amount, 'mobile_money' as payment_method, p.paid_at as created_at,
              p.status, u.names as member_name, 'penalty' as payment_type
       FROM penalties p 
       JOIN users u ON p.user_id = u.id 
       WHERE p.status = 'paid'
       ORDER BY created_at DESC`
    );

    res.json(payments);
  } catch (error) {
    console.error('Fetch all payments error:', error);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
});

// Check Lanari status for existing contribution
async function checkLanariStatusForContribution(contribution, db, io) {
  try {
    // Extract transaction ID from transaction_ref or use it directly
    const transactionId = contribution.transaction_ref;
    
    console.log(`Checking existing contribution ${contribution.id} with Lanari`);
    
    const statusResponse = await axios.post('https://www.lanari.rw/lanari_pay/api/payment/status.php', {
      api_key: '5a257d53460ade03b19daf2ed8195938d0586ff6297e8fc5ab840958200ceeb8',
      api_secret: '1b0903514c0d2192a3b0f9e57857807287ef2da754396a5c63d7d586eba4c4f2b8929a4e069f65d27aec05a3d3b0a47226e432236076ea6e0e9fde51a85c164a',
      transaction_id: transactionId
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    const statusResult = statusResponse.data;
    console.log(`Lanari status for contribution ${contribution.id}:`, statusResult);
    
    const isPaymentConfirmed = statusResult.status === 'success' || 
                              statusResult.status === 'completed' ||
                              (statusResult.message && statusResult.message.toLowerCase().includes('successful')) ||
                              (statusResult.message && statusResult.message.toLowerCase().includes('completed'));
    
    if (isPaymentConfirmed) {
      // Update to Approved
      await db.execute(
        'UPDATE contributions SET payment_status = "Approved" WHERE id = ?',
        [contribution.id]
      );

      // Emit real-time update
      io.to(`tontine-${contribution.tontine_id}`).emit('payment-status-updated', {
        userId: contribution.user_id,
        contributionId: contribution.id,
        status: 'Approved',
        transactionRef: contribution.transaction_ref,
        message: 'Payment confirmed by Lanari API',
        timestamp: new Date()
      });

      console.log(`Existing contribution ${contribution.id} approved by Lanari`);
    } else if (statusResult.status === 'failed') {
      // Update to Failed
      await db.execute(
        'UPDATE contributions SET payment_status = "Failed" WHERE id = ?',
        [contribution.id]
      );

      io.to(`tontine-${contribution.tontine_id}`).emit('payment-status-updated', {
        userId: contribution.user_id,
        contributionId: contribution.id,
        status: 'Failed',
        transactionRef: contribution.transaction_ref,
        message: 'Payment failed - confirmed by Lanari API',
        timestamp: new Date()
      });

      console.log(`Existing contribution ${contribution.id} marked as failed by Lanari`);
    }
  } catch (error) {
    console.error(`Error checking Lanari status for contribution ${contribution.id}:`, error.message);
  }
}
 
// Update payment status by reference number
router.post('/update-status', async (req, res) => {
  const { transactionRef, status } = req.body;
  const db = req.app.get('db');
  const io = req.app.get('io');

  try {
    const [result] = await db.execute(
      'UPDATE contributions SET payment_status = ? WHERE transaction_ref = ?',
      [status, transactionRef]
    );

    if (result.affectedRows > 0) {
      // Get contribution details for socket emission
      const [contribution] = await db.execute(
        'SELECT * FROM contributions WHERE transaction_ref = ?',
        [transactionRef]
      );

      if (contribution.length > 0) {
        io.to(`tontine-${contribution[0].tontine_id}`).emit('payment-status-updated', {
          userId: contribution[0].user_id,
          contributionId: contribution[0].id,
          status: status,
          transactionRef: transactionRef,
          timestamp: new Date()
        });
      }

      res.json({ success: true, message: 'Payment status updated successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Transaction not found' });
    }
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

// Get all loan payments (admin only)
router.get('/loan-payments/all', async (req, res) => {
  const db = req.app.get('db');

  try {
    const [loanPayments] = await db.execute(
      `SELECT lp.*, u.names as user_name, lr.tontine_id
       FROM loan_payments lp 
       JOIN users u ON lp.user_id = u.id 
       JOIN loan_requests lr ON lp.loan_id = lr.id
       ORDER BY lp.payment_date DESC`
    );

    res.json(loanPayments);
  } catch (error) {
    console.error('Fetch all loan payments error:', error);
    res.status(500).json({ message: 'Failed to fetch loan payments' });
  }
});

// Process penalty payment
router.post('/penalty-payment', async (req, res) => {
  const { penaltyId, amount, phoneNumber } = req.body;
  const db = req.app.get('db');
  const io = req.app.get('io');

  try {
    // Get penalty details
    const [penalty] = await db.execute(
      'SELECT p.*, u.names, u.phone FROM penalties p JOIN users u ON p.user_id = u.id WHERE p.id = ?',
      [penaltyId]
    );

    if (penalty.length === 0) {
      return res.status(404).json({ error: 'Penalty not found' });
    }

    const penaltyData = penalty[0];
    const transactionRef = `PEN-${Date.now()}-${penaltyId}`;

    // Process mobile money payment
    const paymentData = {
      phone: phoneNumber,
      description: `Penalty payment - ${penaltyData.reason}`
    };

    const paymentResult = await processMobileMoneyPayment(paymentData, amount, io, penaltyData.user_id, penaltyData.tontine_id, db, transactionRef);

    if (paymentResult.success && paymentResult.gatewaySuccess) {
      // Update penalty status to paid only if gateway confirms success
      await db.execute(
        'UPDATE penalties SET status = "paid", paid_at = NOW() WHERE id = ?',
        [penaltyId]
      );

      // Add success notification
      await db.execute(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [penaltyData.user_id, 'Penalty Payment Successful', `Your penalty payment of RWF ${amount} has been processed successfully.`, 'success']
      );

      if (io) {
        io.to(`user-${penaltyData.user_id}`).emit('penalty-paid', {
          penaltyId,
          amount,
          transactionRef
        });
      }

      res.json({
        message: 'Penalty payment completed successfully',
        penaltyId,
        transactionRef,
        status: 'completed'
      });
    } else {
      res.status(400).json({
        message: 'Payment could not be processed at this time. Please contact support.'
      });
    }
  } catch (error) {
    console.error('Penalty payment error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

module.exports = router;