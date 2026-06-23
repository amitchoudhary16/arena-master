const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (req, res, next) => {
  // Get token from Authorization header (Format: Bearer <token>)
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. Please log in.' });
  }

  try {
    // Verify token using JWT secret
    const secret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // Attach admin user details to request object
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  }
};
