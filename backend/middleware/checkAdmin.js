const checkAdmin = async (req, res, next) => {
  const db = req.app.get('db');
  const userId = req.body.userId || req.headers['user-id'];
  
  if (!userId) {
    return res.status(401).json({ message: 'User ID required' });
  }
  
  try {
    const [users] = await db.execute(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (users[0].role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ message: 'Failed to verify admin status' });
  }
};

module.exports = checkAdmin;