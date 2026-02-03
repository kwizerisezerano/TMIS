const checkTontineStatus = async (req, res, next) => {
  const db = req.app.get('db');
  const tontineId = req.params.tontineId || req.params.id || req.body.tontine_id;
  
  if (!tontineId) {
    return next(); // Skip check if no tontine ID
  }
  
  try {
    const [tontines] = await db.execute(
      'SELECT status FROM tontines WHERE id = ?',
      [tontineId]
    );
    
    if (tontines.length === 0) {
      return res.status(404).json({ message: 'Tontine not found' });
    }
    
    if (tontines[0].status !== 'active') {
      return res.status(403).json({ 
        message: 'This tontine is currently inactive. No operations are allowed.',
        tontineStatus: tontines[0].status
      });
    }
    
    next();
  } catch (error) {
    console.error('Tontine status check error:', error);
    res.status(500).json({ message: 'Failed to check tontine status' });
  }
};

module.exports = checkTontineStatus;