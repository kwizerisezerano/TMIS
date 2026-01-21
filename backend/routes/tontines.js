const express = require('express');
const router = express.Router();

// Get all tontines
router.get('/', async (req, res) => {
  const db = req.app.get('db');

  try {
    const [tontines] = await db.execute(
      `SELECT t.*, u.names as creator_name, 
       COUNT(DISTINCT tm.user_id) as member_count,
       COALESCE(SUM(c.amount), 0) as total_contributions
       FROM tontines t 
       LEFT JOIN users u ON t.creator_id = u.id 
       LEFT JOIN tontine_members tm ON t.id = tm.tontine_id AND tm.status = 'approved'
       LEFT JOIN contributions c ON t.id = c.tontine_id AND c.payment_status = 'Approved'
       GROUP BY t.id, t.name, t.description, t.contribution_amount, t.contribution_frequency, 
                t.max_members, t.creator_id, t.start_date, t.end_date, t.status, t.created_at, u.names
       ORDER BY t.created_at DESC`
    );

    res.json(tontines);
  } catch (error) {
    console.error('Fetch tontines error:', error);
    res.status(500).json({ message: 'Failed to fetch tontines' });
  }
});

// Get tontine by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const db = req.app.get('db');

  try {
    const [tontines] = await db.execute(
      `SELECT t.*, u.names as creator_name 
       FROM tontines t 
       LEFT JOIN users u ON t.creator_id = u.id 
       WHERE t.id = ?`,
      [id]
    );

    if (tontines.length === 0) {
      return res.status(404).json({ message: 'Tontine not found' });
    }

    // Get members
    const [members] = await db.execute(
      `SELECT u.id, u.names, u.email, u.phone, tm.joined_at, tm.status 
       FROM tontine_members tm 
       JOIN users u ON tm.user_id = u.id 
       WHERE tm.tontine_id = ?`,
      [id]
    );

    // Get contributions
    const [contributions] = await db.execute(
      `SELECT c.*, u.names 
       FROM contributions c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.tontine_id = ? 
       ORDER BY c.contribution_date DESC`,
      [id]
    );

    res.json({
      ...tontines[0],
      members,
      contributions
    });

  } catch (error) {
    console.error('Fetch tontine error:', error);
    res.status(500).json({ message: 'Failed to fetch tontine' });
  }
});

// Get user tontines
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  const db = req.app.get('db');

  try {
    const [tontines] = await db.execute(
      `SELECT t.*, u.names as creator_name, 
       COUNT(DISTINCT tm2.user_id) as member_count,
       COALESCE(SUM(c.amount), 0) as total_contributions,
       tm.shares as user_shares
       FROM tontines t 
       LEFT JOIN users u ON t.creator_id = u.id 
       JOIN tontine_members tm ON t.id = tm.tontine_id AND tm.user_id = ?
       LEFT JOIN tontine_members tm2 ON t.id = tm2.tontine_id AND tm2.status = 'approved'
       LEFT JOIN contributions c ON t.id = c.tontine_id AND c.payment_status = 'Approved'
       WHERE tm.status = 'approved'
       GROUP BY t.id, t.name, t.description, t.contribution_amount, t.contribution_frequency, 
                t.max_members, t.creator_id, t.start_date, t.end_date, t.status, t.created_at, u.names, tm.shares
       ORDER BY t.created_at DESC`,
      [userId]
    );

    res.json(tontines);
  } catch (error) {
    console.error('Fetch user tontines error:', error);
    res.status(500).json({ message: 'Failed to fetch user tontines' });
  }
});

// Create new tontine
router.post('/', async (req, res) => {
  const {
    name,
    description,
    contribution_amount,
    contribution_frequency = 'monthly',
    max_members = 20,
    creator_id,
    start_date,
    end_date = null
  } = req.body;
  
  const db = req.app.get('db');
  const io = req.app.get('io');

  try {
    // Validate required fields
    if (!name || !contribution_amount || !creator_id) {
      return res.status(400).json({ message: 'Missing required fields: name, contribution_amount, creator_id' });
    }

    const [result] = await db.execute(
      `INSERT INTO tontines (name, description, contribution_amount, 
       contribution_frequency, max_members, creator_id, start_date, end_date, 
       status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())`,
      [
        name, 
        description || null, 
        contribution_amount, 
        contribution_frequency, 
        max_members, 
        creator_id, 
        start_date || null, 
        end_date
      ]
    );

    // Add creator as first member
    await db.execute(
      `INSERT INTO tontine_members (tontine_id, user_id, joined_at, status) 
       VALUES (?, ?, NOW(), 'approved')`,
      [result.insertId, creator_id]
    );

    // Emit real-time notification if io exists
    if (io) {
      io.emit('tontine-created', {
        id: result.insertId,
        name,
        creator_id,
        timestamp: new Date()
      });
    }

    res.status(201).json({
      message: 'Tontine created successfully',
      tontineId: result.insertId,
      success: true
    });

  } catch (error) {
    console.error('Create tontine error:', error);
    res.status(500).json({ message: 'Failed to create tontine', error: error.message });
  }
});

// Join tontine
router.post('/:id/join', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const db = req.app.get('db');
  const io = req.app.get('io');

  try {
    // Check if user is already a member
    const [existingMember] = await db.execute(
      'SELECT * FROM tontine_members WHERE tontine_id = ? AND user_id = ?',
      [id, userId]
    );

    if (existingMember.length > 0) {
      return res.status(400).json({ message: 'Already a member of this tontine' });
    }

    // Check if tontine is full (max 20 members)
    const [memberCount] = await db.execute(
      `SELECT COUNT(*) as count FROM tontine_members 
       WHERE tontine_id = ? AND status = 'approved'`,
      [id]
    );

    if (memberCount[0].count >= 20) {
      return res.status(400).json({ message: 'Tontine is full (maximum 20 members)' });
    }

    // Get tontine and user details
    const [tontine] = await db.execute('SELECT name FROM tontines WHERE id = ?', [id]);
    const [user] = await db.execute('SELECT names FROM users WHERE id = ?', [userId]);

    // Add member with approved status (auto-approve for now)
    await db.execute(
      `INSERT INTO tontine_members (tontine_id, user_id, joined_at, status) 
       VALUES (?, ?, NOW(), 'approved')`,
      [id, userId]
    );

    // Create notification for the user
    await db.execute(
      `INSERT INTO notifications (user_id, title, message, type, created_at) 
       VALUES (?, ?, ?, 'success', NOW())`,
      [
        userId,
        'Welcome to Tontine!',
        `You have successfully joined "${tontine[0].name}". Start contributing to build your savings together!`
      ]
    );

    // Emit real-time notification if io exists
    if (io) {
      io.to(`tontine-${id}`).emit('member-joined', {
        tontineId: id,
        userId,
        timestamp: new Date()
      });
    }

    res.json({ message: 'Successfully joined the tontine!', success: true });

  } catch (error) {
    console.error('Join tontine error:', error);
    res.status(500).json({ message: 'Failed to join tontine' });
  }
});

// Get tontine members
router.get('/:id/members', async (req, res) => {
  const { id } = req.params;
  const db = req.app.get('db');

  try {
    const [members] = await db.execute(
      `SELECT u.id, u.names, u.email, u.phone, u.role, u.email_verified, 
       tm.joined_at, tm.status, tm.shares
       FROM tontine_members tm 
       JOIN users u ON tm.user_id = u.id 
       WHERE tm.tontine_id = ? AND tm.status = 'approved'
       ORDER BY tm.joined_at ASC`,
      [id]
    );

    res.json(members);
  } catch (error) {
    console.error('Fetch tontine members error:', error);
    res.status(500).json({ message: 'Failed to fetch tontine members' });
  }
});

// Update tontine
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, contribution_amount, max_members } = req.body;
  const db = req.app.get('db');

  try {
    await db.execute(
      `UPDATE tontines SET name = ?, description = ?, contribution_amount = ?, max_members = ? WHERE id = ?`,
      [name, description, contribution_amount, max_members, id]
    );

    res.json({ message: 'Tontine updated successfully', success: true });
  } catch (error) {
    console.error('Update tontine error:', error);
    res.status(500).json({ message: 'Failed to update tontine' });
  }
});

// Remove member from tontine
router.delete('/:id/members/:memberId', async (req, res) => {
  const { id, memberId } = req.params;
  const db = req.app.get('db');

  try {
    await db.execute(
      'DELETE FROM tontine_members WHERE tontine_id = ? AND user_id = ?',
      [id, memberId]
    );

    res.json({ message: 'Member removed successfully', success: true });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Failed to remove member' });
  }
});

// Update member shares in tontine
router.put('/:id/members/:memberId/shares', async (req, res) => {
  const { id, memberId } = req.params;
  const { shares } = req.body;
  const db = req.app.get('db');

  try {
    // Validate shares (1-10)
    if (shares < 1 || shares > 10) {
      return res.status(400).json({ 
        success: false,
        message: 'Shares must be between 1 and 10' 
      });
    }

    await db.execute(
      'UPDATE tontine_members SET shares = ? WHERE tontine_id = ? AND user_id = ?',
      [shares, id, memberId]
    );

    res.json({ message: 'Member shares updated successfully', success: true });
  } catch (error) {
    console.error('Update member shares error:', error);
    res.status(500).json({ message: 'Failed to update member shares' });
  }
});

module.exports = router;