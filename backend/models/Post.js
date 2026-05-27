const mongoose = require('mongoose');
const slugify  = require('slugify');

const PostSchema = new mongoose.Schema({

  // Post title — required, max 200 characters
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },

  // URL-friendly version of title
  // Example: "My First Post" → "my-first-post"
  // Generated automatically from title before saving
  slug: {
    type: String,
    unique: true
  },

  // Full post content — stored as HTML from rich text editor
  content: {
    type: String,
    required: [true, 'Please add content']
  },

  // Short preview text — first 150 characters of content
  excerpt: {
    type: String
  },

  // Path to uploaded featured image
  featuredImage: {
    type: String,
    default: 'default-post.jpg'
  },

  // Category of the post
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: [
      'Technology',
      'Travel',
      'Food',
      'Health',
      'Business',
      'Education',
      'Entertainment',
      'Sports',
      'Other'
    ]
  },

  // Array of tags/keywords for the post
  tags: [{
    type: String,
    trim: true
  }],

  // Draft = saved but not visible to public
  // Published = visible to everyone
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },

  // How many times the post was viewed
  views: {
    type: Number,
    default: 0
  },

  // Estimated read time in minutes (auto-calculated)
  readTime: {
    type: Number,
    default: 1
  },

  // Array of user IDs who liked this post
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // The user who wrote this post
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }

});

// ===== TEXT INDEX =====
// This allows us to search posts by title and content
PostSchema.index({ title: 'text', content: 'text' });

// ===== PRE-SAVE MIDDLEWARE =====
// Runs automatically BEFORE saving a post
PostSchema.pre('save', async function() {

  // Generate slug from title
  if (this.isModified('title')) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
      trim: true
    });
  }

  // Auto generate excerpt and read time
  if (this.isModified('content')) {
    const plainText = this.content.replace(/<[^>]+>/g, '');
    this.excerpt = plainText.substring(0, 150) + '...';
    const wordCount = plainText.split(/\s+/).length;
    this.readTime = Math.ceil(wordCount / 200);
  }

  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Post', PostSchema);
