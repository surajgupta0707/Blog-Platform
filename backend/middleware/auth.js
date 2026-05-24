const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {

  let token;

  // Check if token exists in request headers
  // Token is sent as: Authorization: Bearer <token>
  if (req.headers.authorization && 
      req.headers.authorization.startsWith('Bearer')) {

    // Extract just the token part (remove "Bearer ")
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token found, block the request
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized, no token provided' 
    });
  }

  try {
    // Verify the token is valid and not expired
    // This decodes the token and gives us the user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user in database using ID from token
    // This attaches user info to the request object
    req.user = await User.findById(decoded.id);

    // Move on to the actual route
    next();

  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized, token is invalid or expired' 
    });
  }
};

module.exports = { protect };