const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// This defines the structure of a User in the database
const UserSchema = new mongoose.Schema({

  // User's full name — required, max 50 characters
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },

  // Email — must be unique, validates format automatically
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },

  // Password — minimum 6 chars, "select: false" means it won't 
  // be returned in normal queries (security)
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },

  // Profile picture — defaults to a placeholder image
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },

  // Short bio about the user
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters'],
    default: ''
  },

  // User role — either normal user or admin
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  // List of users who follow this user (stores their IDs)
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // List of users this user is following (stores their IDs)
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Posts this user has saved/bookmarked
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],

  // Automatically set when user registers
  createdAt: {
    type: Date,
    default: Date.now
  }

});

// ===== MIDDLEWARE =====
// This runs automatically BEFORE saving a user to the database
// It hashes (encrypts) the password so we never store plain text passwords
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
// ===== CUSTOM METHOD =====
// This method lets us check if an entered password matches 
// the hashed password stored in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export the model so other files can use it
module.exports = mongoose.model('User', UserSchema);

