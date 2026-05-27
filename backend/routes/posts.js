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