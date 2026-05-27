const express  = require('express');
const router   = express.Router();
const Post     = require('../models/Post');
const { protect } = require('../middleware/auth');

// POST /api/posts — Create a post
router.post('/', protect, async (req, res) => {
  try {
    const { title, content, category, tags, status } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, content and category'
      });
    }

    const post = await Post.create({
      title,
      content,
      category,
      tags: tags || [],
      status: status || 'draft',
      author: req.user.id
    });

    await post.populate('author', 'name avatar');

    res.status(201).json({
      success: true,
      message: 'Post created successfully!',
      post
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A post with this title already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/posts — Get all posts
router.get('/', async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const filter = { status: 'published' };

    if (req.query.category) filter.category = req.query.category;
    if (req.query.search)   filter.$text = { $search: req.query.search };

    const posts = await Post.find(filter)
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-content');

    const total = await Post.countDocuments(filter);

    res.json({
      success: true,
      count: posts.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      posts
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// GET /api/posts/:slug — Get single post
router.get('/:slug', async (req, res) => {
  try {
    const post = await Post.findOne({
      slug: req.params.slug,
      status: 'published'
    }).populate('author', 'name avatar bio');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    await Post.findByIdAndUpdate(post._id, { $inc: { views: 1 } });

    res.json({
      success: true,
      post
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


module.exports = router;
// ================================================
// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private (author only)
// ================================================
router.put('/:id', protect, async (req, res) => {
  try {

    // Find the post by ID
    let post = await Post.findById(req.params.id);

    // Check if post exists
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if logged in user is the author
    // post.author is ObjectId so we convert to string
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own posts'
      });
    }

    // Get updated fields from request body
    const { title, content, category, tags, status, featuredImage } = req.body;

    // Update the post
    post = await Post.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content,
        category,
        tags,
        status,
        featuredImage,
        updatedAt: Date.now()
      },
      {
        new: true,           // return updated post
        runValidators: true  // run schema validators
      }
    ).populate('author', 'name avatar');

    res.json({
      success: true,
      message: 'Post updated successfully!',
      post
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// ================================================
// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private (author only)
// ================================================
router.delete('/:id', protect, async (req, res) => {
  try {

    // Find the post by ID
    const post = await Post.findById(req.params.id);

    // Check if post exists
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if logged in user is the author
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts'
      });
    }

    // Delete the post
    await Post.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Post deleted successfully!'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


// ================================================
// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private (author only)
// ================================================
router.delete('/:id', protect, async (req, res) => {
  try {

    // Find the post by ID
    const post = await Post.findById(req.params.id);

    // Check if post exists
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if logged in user is the author
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts'
      });
    }

    // Delete the post
    await Post.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Post deleted successfully!'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ================================================
// @route   PUT /api/posts/:id/like
// @desc    Like or Unlike a post (toggle)
// @access  Private (must be logged in)
// ================================================
router.put('/:id/like', protect, async (req, res) => {
  try {

    // Find the post
    const post = await Post.findById(req.params.id);

    // Check if post exists
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user already liked this post
    // .includes() checks if user ID exists in likes array
    const alreadyLiked = post.likes.includes(req.user.id);

    if (alreadyLiked) {

      // User already liked → UNLIKE
      // $pull removes the user ID from likes array
      await Post.findByIdAndUpdate(req.params.id, {
        $pull: { likes: req.user.id }
      });

      res.json({
        success: true,
        message: 'Post unliked!',
        liked: false,
        likesCount: post.likes.length - 1
      });

    } else {

      // User has not liked → LIKE
      // $push adds the user ID to likes array
      await Post.findByIdAndUpdate(req.params.id, {
        $push: { likes: req.user.id }
      });

      res.json({
        success: true,
        message: 'Post liked!',
        liked: true,
        likesCount: post.likes.length + 1
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

