const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const router = express.Router();
const { sendVerificationEmail } = require('../utils/email');

// Register user directly to database
router.post('/register', async (req, res) => {
  const { names, email, password, phone, role = 'member' } = req.body;
  const db = req.app.get('db');

  console.log('Registration attempt:', { names, email, phone, role });

  try {
    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      console.log('Password validation failed');
      return res.status(400).json({ 
        message: 'Password must contain at least 8 characters with uppercase, lowercase, number and symbol',
        success: false
      });
    }

    console.log('Password validation passed');

    // Check if user already exists
    const [existingUser] = await db.execute(
      'SELECT * FROM users WHERE email = ? OR phone = ?',
      [email, phone]
    );

    if (existingUser.length > 0) {
      console.log('User already exists');
      return res.status(400).json({ 
        success: false,
        message: 'User with this email or phone already exists' 
      });
    }

    console.log('User does not exist, proceeding with registration');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert user (verified for admin registration)
    const [result] = await db.execute(
      'INSERT INTO users (names, email, password, phone, role, email_verified) VALUES (?, ?, ?, ?, ?, ?)',
      [names, email, hashedPassword, phone, role, 1]
    );
    
    // Send welcome email to new member
    try {
      const { sendEmail } = require('../utils/email');
      await sendEmail(
        email,
        'Welcome to The Future Tontine',
        `Dear ${names},\n\nWelcome to The Future Tontine! Your account has been created successfully.\n\nLogin Details:\nEmail: ${email}\nPassword: ${password}\n\nPlease login to access your dashboard.\n\nBest regards,\nThe Future Team`
      );
      console.log('Welcome email sent to:', email);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError.message);
    }

    // Add welcome notification
    await db.execute(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [result.insertId, 'Welcome to The Future!', 'Your account has been created successfully. Welcome to our tontine community!', 'success']
    );

    res.status(201).json({ 
      success: true,
      message: 'Member registered successfully and welcome email sent',
      userId: result.insertId 
    });

    console.log('Registration successful for user:', result.insertId);

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to register member: ' + error.message 
    });
  }
});

// Verify account
router.post('/verify-email', async (req, res) => {
  const { verificationKey, verificationCode } = req.body;
  const db = req.app.get('db');

  try {
    const [users] = await db.execute(
      'SELECT * FROM users WHERE verification_key = ? AND created_at > DATE_SUB(NOW(), INTERVAL 20 MINUTE)',
      [verificationKey]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Verification session expired. Please register again.', expired: true });
    }

    const user = users[0];

    // Check attempts
    if (user.verification_attempts >= 3) {
      return res.status(400).json({ 
        message: 'Too many attempts. Please wait 60 seconds before trying again.', 
        maxAttemptsReached: true 
      });
    }

    // Check code
    if (user.verification_code !== verificationCode) {
      // Increment attempts
      await db.execute(
        'UPDATE users SET verification_attempts = verification_attempts + 1 WHERE verification_key = ?',
        [verificationKey]
      );
      
      const remainingAttempts = 3 - (user.verification_attempts + 1);
      
      if (remainingAttempts <= 0) {
        return res.status(400).json({ 
          message: 'Too many attempts. Please wait 60 seconds before trying again.', 
          maxAttemptsReached: true 
        });
      }
      
      return res.status(400).json({ 
        message: `Invalid code. ${remainingAttempts} attempts remaining.`,
        remainingAttempts 
      });
    }

    // Get user ID before updating
    const [currentUsers] = await db.execute('SELECT id FROM users WHERE verification_key = ?', [verificationKey]);
    const userId = currentUsers[0]?.id;

    // Mark as verified and clear verification data
    await db.execute(
      'UPDATE users SET email_verified = 1, verification_code = NULL, verification_key = NULL, verification_attempts = 0 WHERE verification_key = ?',
      [verificationKey]
    );

    // Add success notification
    if (userId) {
      await db.execute(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [userId, 'Email Verified', 'Your account has been successfully verified! You can now login.', 'success']
      );
    }

    res.json({ message: 'Account verified successfully! You can now login.', success: true });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  const { verificationKey } = req.body;
  const db = req.app.get('db');

  try {
    const [users] = await db.execute(
      'SELECT * FROM users WHERE verification_key = ? AND email_verified = 0',
      [verificationKey]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid verification key or account already verified' });
    }

    const user = users[0];
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Update verification code and reset attempts
    await db.execute(
      'UPDATE users SET verification_code = ?, created_at = NOW(), verification_attempts = 0 WHERE verification_key = ?',
      [newCode, verificationKey]
    );

    // Send email
    const emailSent = await sendVerificationEmail(user.email, newCode);

    res.json({
      message: emailSent ? 'New verification code sent to your email' : 'New verification code generated',
      verificationCode: emailSent ? undefined : newCode
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const db = req.app.get('db');

  try {
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(400).json({ 
        message: 'Please verify your account first',
        requiresVerification: true,
        email: user.email
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    // Add login notification
    await db.execute(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [user.id, 'Login Successful', 'Welcome back to The Future!', 'success']
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        names: user.names,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      success: true
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Validate user exists
router.get('/validate/:id', async (req, res) => {
  const { id } = req.params;
  const db = req.app.get('db');

  try {
    const [users] = await db.execute(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ exists: false, message: 'User not found' });
    }

    res.json({ exists: true });

  } catch (error) {
    console.error('Validate user error:', error);
    res.status(500).json({ exists: false, message: 'Server error' });
  }
});

// Get user profile
router.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  const db = req.app.get('db');

  try {
    const [users] = await db.execute(
      'SELECT id, names, email, phone, id_number, role, email_verified, created_at FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(users[0]);

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { names, id_number } = req.body;
  const db = req.app.get('db');

  try {
    // Get current user data
    const [currentUser] = await db.execute(
      'SELECT id_number FROM users WHERE id = ?',
      [id]
    );

    if (currentUser.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prepare update data
    let updateFields = [];
    let updateValues = [];

    if (names) {
      updateFields.push('names = ?');
      updateValues.push(names);
    }

    // Only allow ID number update if it's currently empty
    if (id_number && !currentUser[0].id_number) {
      updateFields.push('id_number = ?');
      updateValues.push(id_number);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    updateValues.push(id);

    await db.execute(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Profile updated successfully', success: true });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user (admin management)
router.put('/manage/users/:id', async (req, res) => {
  const { id } = req.params;
  const { names, email, phone, role } = req.body;
  const db = req.app.get('db');

  try {
    const [user] = await db.execute('SELECT id FROM users WHERE id = ?', [id]);
    
    if (!user.length) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Check if email or phone already exists for other users
    const [existingUser] = await db.execute(
      'SELECT id FROM users WHERE (email = ? OR phone = ?) AND id != ?',
      [email, phone, id]
    );
    
    if (existingUser.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Email or phone already exists for another user' 
      });
    }
    
    await db.execute(
      'UPDATE users SET names = ?, email = ?, phone = ?, role = ? WHERE id = ?',
      [names, email, phone, role, id]
    );

    res.json({ 
      success: true,
      message: 'Member updated successfully' 
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update member' 
    });
  }
});

// Delete user (admin management)
router.delete('/manage/users/:id', async (req, res) => {
  const { id } = req.params;
  const db = req.app.get('db');

  try {
    const [user] = await db.execute('SELECT id, names FROM users WHERE id = ?', [id]);
    
    if (!user.length) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Check if user has related records
    const [notifications] = await db.execute('SELECT COUNT(*) as count FROM notifications WHERE user_id = ?', [id]);
    const [contributions] = await db.execute('SELECT COUNT(*) as count FROM contributions WHERE user_id = ?', [id]);
    const [loans] = await db.execute('SELECT COUNT(*) as count FROM loan_requests WHERE user_id = ?', [id]);
    const [payments] = await db.execute('SELECT COUNT(*) as count FROM loan_payments WHERE user_id = ?', [id]);
    
    if (notifications[0].count > 0 || contributions[0].count > 0 || loans[0].count > 0 || payments[0].count > 0) {
      return res.status(400).json({ 
        success: false,
        message: `Cannot delete ${user[0].names} - member has referenced records and cannot be removed.` 
      });
    }
    
    await db.execute('DELETE FROM users WHERE id = ?', [id]);
    
    res.json({ 
      success: true,
      message: 'Member removed successfully' 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      res.status(400).json({ 
        success: false,
        message: 'Member has referenced records and cannot be deleted.' 
      });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Failed to remove member' 
      });
    }
  }
});

module.exports = router;