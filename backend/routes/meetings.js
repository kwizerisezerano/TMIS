const express = require('express');
const checkAdmin = require('../middleware/checkAdmin');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get meetings for logged user (from all their tontines)
router.get('/user', authenticateToken, async (req, res) => {
  const db = req.app.get('db');
  const userId = req.user.userId;

  if (!userId) {
    return res.status(400).json({ error: 'User ID not found' });
  }

  try {
    const [meetings] = await db.execute(`
      SELECT m.*, t.name as tontine_name, u.names as created_by_name,
             COALESCE(ma.status, 'absent') as attendance_status, ma.arrival_time, ma.penalty_applied
      FROM meetings m
      JOIN tontines t ON m.tontine_id = t.id
      JOIN tontine_members tm ON t.id = tm.tontine_id AND tm.user_id = ? AND tm.status = 'approved'
      JOIN users u ON m.created_by = u.id
      LEFT JOIN meeting_attendance ma ON m.id = ma.meeting_id AND ma.user_id = ?
      ORDER BY m.meeting_date DESC
    `, [userId, userId]);
    
    res.json(meetings);
  } catch (error) {
    console.error('Error fetching user meetings:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// Get meetings for a tontine (admin management)
router.get('/tontine/:tontineId', async (req, res) => {
  const { tontineId } = req.params;
  const db = req.app.get('db');

  try {
    const [meetings] = await db.execute(`
      SELECT m.*, u.names as created_by_name,
             COUNT(ma.id) as total_members,
             SUM(CASE WHEN ma.status = 'present' THEN 1 ELSE 0 END) as present_count,
             SUM(CASE WHEN ma.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
             SUM(CASE WHEN ma.status = 'late' THEN 1 ELSE 0 END) as late_count
      FROM meetings m
      LEFT JOIN users u ON m.created_by = u.id
      LEFT JOIN meeting_attendance ma ON m.id = ma.meeting_id
      WHERE m.tontine_id = ?
      GROUP BY m.id
      ORDER BY m.meeting_date DESC
    `, [tontineId]);

    res.json(meetings);
  } catch (error) {
    console.error('Fetch meetings error:', error);
    res.status(500).json({ message: 'Failed to fetch meetings' });
  }
});

// Create new meeting
router.post('/', async (req, res) => {
  const { tontineId, title, description, meetingDate, location, createdBy } = req.body;
  const db = req.app.get('db');
  const io = req.app.get('io');

  // Validate required fields
  if (!tontineId || !title || !meetingDate || !location || !createdBy) {
    return res.status(400).json({ 
      success: false,
      message: 'Missing required fields: tontineId, title, meetingDate, location, createdBy' 
    });
  }

  // Validate meeting date is in the future
  const meetingDateTime = new Date(meetingDate);
  const now = new Date();
  if (meetingDateTime <= now) {
    return res.status(400).json({ 
      success: false,
      message: 'Meeting date must be in the future' 
    });
  }

  try {
    const [result] = await db.execute(`
      INSERT INTO meetings (tontine_id, title, description, meeting_date, location, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [tontineId, title, description, meetingDate, location, createdBy]);

    // Get tontine members to create attendance records
    const [members] = await db.execute(`
      SELECT user_id FROM tontine_members 
      WHERE tontine_id = ? AND status = 'approved'
    `, [tontineId]);

    // Create attendance records for all members
    for (const member of members) {
      await db.execute(`
        INSERT INTO meeting_attendance (meeting_id, user_id, status)
        VALUES (?, ?, 'absent')
      `, [result.insertId, member.user_id]);
    }

    // Send notifications to all members
    const [tontine] = await db.execute('SELECT name FROM tontines WHERE id = ?', [tontineId]);
    
    for (const member of members) {
      await db.execute(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, ?, ?, 'info')
      `, [
        member.user_id,
        'New Meeting Scheduled',
        `A new meeting "${title}" has been scheduled for ${tontine[0].name} on ${new Date(meetingDate).toLocaleDateString()}.`
      ]);

      if (io) {
        io.to(`user-${member.user_id}`).emit('meeting-scheduled', {
          meetingId: result.insertId,
          title,
          date: meetingDate,
          tontine: tontine[0].name
        });
      }
    }

    res.json({ message: 'Meeting scheduled successfully', meetingId: result.insertId, success: true });
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({ message: 'Failed to schedule meeting' });
  }
});

// Get meeting attendance
router.get('/:meetingId/attendance', async (req, res) => {
  const { meetingId } = req.params;
  const db = req.app.get('db');

  try {
    const [attendance] = await db.execute(`
      SELECT ma.*, u.names, u.email
      FROM meeting_attendance ma
      JOIN users u ON ma.user_id = u.id
      WHERE ma.meeting_id = ?
      ORDER BY u.names
    `, [meetingId]);

    res.json(attendance);
  } catch (error) {
    console.error('Fetch attendance error:', error);
    res.status(500).json({ message: 'Failed to fetch attendance' });
  }
});

// Mark attendance
router.put('/:meetingId/attendance', async (req, res) => {
  const { meetingId } = req.params;
  const { attendance, markedBy } = req.body;
  const db = req.app.get('db');
  const io = req.app.get('io');

  try {
    // Get meeting and tontine info
    const [meeting] = await db.execute(`
      SELECT m.*, t.name as tontine_name 
      FROM meetings m 
      JOIN tontines t ON m.tontine_id = t.id 
      WHERE m.id = ?
    `, [meetingId]);

    if (meeting.length === 0) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    const meetingInfo = meeting[0];

    for (const record of attendance) {
      // Update attendance
      await db.execute(`
        UPDATE meeting_attendance 
        SET status = ?
        WHERE meeting_id = ? AND user_id = ?
      `, [record.status, meetingId, record.user_id]);

      // Apply penalty for absence or lateness
      if (record.status === 'absent') {
        const [existingPenalty] = await db.execute(`
          SELECT id FROM penalties 
          WHERE user_id = ? AND reason = 'Meeting absence'
        `, [record.user_id]);

        if (existingPenalty.length === 0) {
          await db.execute(`
            INSERT INTO penalties (user_id, tontine_id, amount, reason)
            VALUES (?, ?, 5000, 'Meeting absence')
          `, [record.user_id, meetingInfo.tontine_id]);

          // Send penalty email
          const [userInfo] = await db.execute('SELECT names, email FROM users WHERE id = ?', [record.user_id]);
          if (userInfo.length > 0) {
            const { sendPenaltyEmail } = require('../utils/email');
            await sendPenaltyEmail(userInfo[0].email, {
              userName: userInfo[0].names,
              amount: '5,000',
              reason: 'Meeting absence'
            });
          }

          // Notify user about penalty
          await db.execute(`
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (?, ?, ?, 'warning')
          `, [
            record.user_id,
            'Meeting Absence Penalty',
            `A penalty of RWF 5,000 has been applied for missing the meeting "${meetingInfo.title}".`
          ]);

          if (io) {
            io.to(`user-${record.user_id}`).emit('penalty-applied', {
              type: 'meeting',
              amount: 5000,
              reason: 'Meeting absence',
              meeting: meetingInfo.title
            });
          }
        }
      } else if (record.status === 'late') {
        const [existingPenalty] = await db.execute(`
          SELECT id FROM penalties 
          WHERE user_id = ? AND reason = 'Late arrival to meeting'
        `, [record.user_id]);

        if (existingPenalty.length === 0) {
          await db.execute(`
            INSERT INTO penalties (user_id, tontine_id, amount, reason)
            VALUES (?, ?, 1000, 'Late arrival to meeting')
          `, [record.user_id, meetingInfo.tontine_id]);

          // Send penalty email
          const [userInfo] = await db.execute('SELECT names, email FROM users WHERE id = ?', [record.user_id]);
          if (userInfo.length > 0) {
            const { sendPenaltyEmail } = require('../utils/email');
            await sendPenaltyEmail(userInfo[0].email, {
              userName: userInfo[0].names,
              amount: '1,000',
              reason: 'Late arrival to meeting'
            });
          }

          // Notify user about penalty
          await db.execute(`
            INSERT INTO notifications (user_id, title, message, type)
            VALUES (?, ?, ?, 'warning')
          `, [
            record.user_id,
            'Late Arrival Penalty',
            `A penalty of RWF 1,000 has been applied for arriving late to the meeting "${meetingInfo.title}".`
          ]);

          if (io) {
            io.to(`user-${record.user_id}`).emit('penalty-applied', {
              type: 'meeting',
              amount: 1000,
              reason: 'Late arrival to meeting',
              meeting: meetingInfo.title
            });
          }
        }
      }
    }

    // Mark meeting as completed
    await db.execute('UPDATE meetings SET status = "completed" WHERE id = ?', [meetingId]);

    res.json({ message: 'Attendance marked successfully', success: true });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ message: 'Failed to mark attendance' });
  }
});

module.exports = router;