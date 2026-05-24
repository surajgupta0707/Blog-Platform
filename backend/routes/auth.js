const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// ===== HELPER FUNCTION =====
// Generates a JWT token using the user's ID
// Token expires in 30 days (set in .env)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};


// ================================================
// @route   POST /api/auth/register
// @desc    Register a brand new user
// @access  Public (anyone can access)
// ================================================
router.post('/register', async (req, res) => {
  try {

    // Get name, email, password from request body
    const { name, email, password } = req.body;

    // Check all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }

    // Check if a user already exists with this email
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'A user already exists with this email' 
      });
    }

    // Create the new user in database
    // Password is automatically hashed by our User model middleware
    const user = await User.create({ name, email, password });

    // Generate token for the new user
    const token = generateToken(user._id);

    // Send back token and user info
    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});


// ================================================
// @route   POST /api/auth/login
// @desc    Login existing user and return token
// @access  Public (anyone can access)
// ================================================
router.post('/login', async (req, res) => {
  try {

    const { email, password } = req.body;

    // Check both fields are provided
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }

    // Find user by email
    // We add .select('+password') because password has select:false
    // in the model (it's hidden by default for security)
    const user = await User.findOne({ email }).select('+password');

    // If no user found with that email
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check if entered password matches hashed password in database
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Send back token and user info
    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});


// ================================================
// @route   GET /api/auth/me
// @desc    Get currently logged in user info
// @access  Private (must be logged in)
// ================================================
router.get('/me', protect, async (req, res) => {
  try {

    // req.user is set by our protect middleware
    // We find the user again to get fresh data
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        role: user.role,
        followers: user.followers,
        following: user.following,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});


module.exports = router;