const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const { protect } = require('../middleware/auth');

// ================================================
// @route   GET /api/users/:id
// @desc    Get user profile by ID
// @access  Public
// ================================================
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({ success: true, user });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ================================================
// @route   PUT /api/users/:id/follow
// @desc    Follow or unfollow a user
// @access  Private
// ================================================
router.put('/:id/follow', protect, async (req, res) => {
  try {
    // Can't follow yourself
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself'
      });
    }

    const userToFollow = await User.findById(req.params.id);
    const currentUser  = await User.findById(req.user.id);

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isFollowing = userToFollow.followers.includes(req.user.id);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(req.params.id, {
        $pull: { followers: req.user.id }
      });
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { following: req.params.id }
      });

      res.json({
        success: true,
        followed: false,
        message: 'Unfollowed successfully'
      });

    } else {
      // Follow
      await User.findByIdAndUpdate(req.params.id, {
        $push: { followers: req.user.id }
      });
      await User.findByIdAndUpdate(req.user.id, {
        $push: { following: req.params.id }
      });

      res.json({
        success: true,
        followed: true,
        message: 'Followed successfully'
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;