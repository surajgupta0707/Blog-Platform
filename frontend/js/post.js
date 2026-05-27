// ===== GET SLUG FROM URL =====
// URL looks like: post.html?slug=my-first-blog-post
const urlParams = new URLSearchParams(window.location.search);
const slug = urlParams.get('slug');

// Store post ID for comments and likes
let postId = null;

// ===== ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();

  // If no slug in URL redirect to home
  if (!slug) {
    window.location.href = '../index.html';
    return;
  }

  loadPost();
});

// ===== UPDATE NAVBAR =====
function updateNavbar() {
  const user = getUser();
  const navbarUser = document.getElementById('navbarUser');

  if (user) {
    navbarUser.innerHTML = `
      <span>👋 ${user.name}</span>
      <a href="dashboard.html" 
         style="color:var(--primary);font-weight:600;">
        Dashboard
      </a>
      <button onclick="logout()" 
              class="btn btn-primary" 
              style="width:auto;padding:8px 16px;font-size:0.9rem;">
        Logout
      </button>
    `;
  } else {
    navbarUser.innerHTML = `
      <a href="login.html">Sign In</a>
      <a href="register.html" 
         class="btn btn-primary" 
         style="width:auto;padding:8px 16px;font-size:0.9rem;">
        Get Started
      </a>
    `;
  }
}

// ===== LOAD POST =====
async function loadPost() {
  try {
    const response = await fetch(`${API_URL}/posts/${slug}`);
    const data = await response.json();

    if (!data.success) {
      document.getElementById('postHero').innerHTML = `
        <div class="empty-state" style="padding:80px 20px;">
          <h3>Post not found 😕</h3>
          <p>This post may have been deleted</p>
          <a href="../index.html" 
             class="btn btn-primary" 
             style="width:auto;padding:10px 24px;margin-top:16px;
                    display:inline-block;">
            ← Back to Home
          </a>
        </div>
      `;
      return;
    }

    const post = data.post;
    postId = post._id;

    // Update page title
    document.title = `${post.title} — BlogSpace`;

    // Render post hero
    renderPostHero(post);

    // Render post content
    renderPostContent(post);

    // Render sidebar
    renderSidebar(post);

    // Load comments
    loadComments();

  } catch (error) {
    document.getElementById('postHero').innerHTML = `
      <div class="empty-state">
        <h3>Failed to load post 😕</h3>
        <p>Make sure your backend server is running!</p>
      </div>
    `;
  }
}

// ===== RENDER POST HERO =====
function renderPostHero(post) {
  const date = new Date(post.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  document.getElementById('postHero').innerHTML = `
    <div class="post-hero">
      <span class="post-hero-category">${post.category}</span>
      <h1 class="post-hero-title">${post.title}</h1>
      <div class="post-hero-meta">
        <div class="post-hero-author">
          <div class="post-hero-avatar">
            ${post.author.name.charAt(0).toUpperCase()}
          </div>
          <span>${post.author.name}</span>
        </div>
        <span>📅 ${date}</span>
        <span>⏱ ${post.readTime} min read</span>
        <span>👁 ${post.views} views</span>
        <span>❤️ ${post.likes ? post.likes.length : 0} likes</span>
      </div>
    </div>
  `;
}

// ===== RENDER POST CONTENT =====
function renderPostContent(post) {
  const user = getUser();
  const isLiked = user && post.likes &&
                  post.likes.includes(user.id);

  document.getElementById('postContent').innerHTML = `
    <div class="post-content-wrap">

      <!-- Full Post Content -->
      <div class="post-content">
        ${post.content}
      </div>

      <!-- Tags -->
      ${post.tags && post.tags.length > 0 ? `
        <div class="post-tags">
          ${post.tags.map(tag =>
            `<span class="post-tag">#${tag}</span>`
          ).join('')}
        </div>
      ` : ''}

      <!-- Like Button -->
      <div class="like-section">
        <button 
          class="like-btn ${isLiked ? 'liked' : ''}" 
          id="likeBtn"
          onclick="toggleLike()">
          ${isLiked ? '❤️' : '🤍'} 
          ${isLiked ? 'Liked' : 'Like this post'}
        </button>
        <span class="like-count" id="likeCount">
          ${post.likes ? post.likes.length : 0} likes
        </span>
      </div>

      <!-- Comments Section -->
      <div class="comments-section">
        <div class="comments-title" id="commentsTitle">
          💬 Comments
        </div>

        <!-- Add Comment Form (only if logged in) -->
        ${user ? `
          <div class="comment-form">
            <textarea 
              id="commentText" 
              placeholder="Write a comment...">
            </textarea>
            <div class="comment-form-footer">
              <button 
                class="btn btn-primary" 
                style="width:auto;padding:10px 24px;"
                onclick="addComment()">
                Post Comment
              </button>
            </div>
          </div>
        ` : `
          <div style="background:var(--light-gray);border-radius:12px;
                      padding:16px;margin-bottom:20px;text-align:center;
                      color:var(--gray);">
            <a href="login.html" style="font-weight:600;">
              Sign in
            </a> to leave a comment
          </div>
        `}

        <!-- Comments List -->
        <div id="commentsList">
          <div class="loading">
            <div class="loading-spinner"></div>
          </div>
        </div>

      </div>
    </div>
  `;
}

// ===== RENDER SIDEBAR =====
function renderSidebar(post) {
  document.getElementById('postSidebar').innerHTML = `

    <!-- Author Card -->
    <div class="author-card">
      <div class="author-card-avatar">
        ${post.author.name.charAt(0).toUpperCase()}
      </div>
      <div class="author-card-name">${post.author.name}</div>
      <div class="author-card-bio">
        ${post.author.bio || 'No bio yet.'}
      </div>
      <a href="profile.html?id=${post.author._id}" 
         class="btn btn-primary"
         style="width:100%;display:block;">
        View Profile
      </a>
    </div>

    <!-- Share Card -->
    <div class="sidebar-card">
      <h3>📤 Share Post</h3>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <button onclick="copyLink()" 
                class="btn" 
                style="background:var(--light-gray);
                       color:var(--dark);border:none;">
          🔗 Copy Link
        </button>
      </div>
    </div>

  `;
}

// ===== TOGGLE LIKE =====
async function toggleLike() {
  const token = getToken();

  if (!token) {
    alert('Please login to like posts!');
    window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch(`${API_URL}/posts/${postId}/like`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (data.success) {
      // Update like button
      const likeBtn   = document.getElementById('likeBtn');
      const likeCount = document.getElementById('likeCount');

      if (data.liked) {
        likeBtn.className = 'like-btn liked';
        likeBtn.innerHTML = '❤️ Liked';
      } else {
        likeBtn.className = 'like-btn';
        likeBtn.innerHTML = '🤍 Like this post';
      }

      likeCount.textContent = `${data.likesCount} likes`;
    }

  } catch (error) {
    console.log('Like error:', error);
  }
}

// ===== LOAD COMMENTS =====
async function loadComments() {
  try {
    const response = await fetch(
      `${API_URL}/posts/${postId}/comments`
    );
    const data = await response.json();

    const commentsList = document.getElementById('commentsList');
    const commentsTitle = document.getElementById('commentsTitle');

    if (data.success && data.comments.length > 0) {
      commentsTitle.textContent =
        `💬 Comments (${data.comments.length})`;

      commentsList.innerHTML = data.comments.map(comment => {
        const date = new Date(comment.createdAt)
          .toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
          });

        const user = getUser();
        const isOwner = user && comment.author._id === user.id;

        return `
          <div class="comment" id="comment-${comment._id}">
            <div class="comment-avatar">
              ${comment.author.name.charAt(0).toUpperCase()}
            </div>
            <div class="comment-body">
              <div class="comment-header">
                <span class="comment-author">
                  ${comment.author.name}
                </span>
                <span class="comment-date">${date}</span>
                ${isOwner ? `
                  <button 
                    class="comment-delete"
                    onclick="deleteComment('${comment._id}')">
                    🗑 Delete
                  </button>
                ` : ''}
              </div>
              <div class="comment-text">${comment.content}</div>
            </div>
          </div>
        `;
      }).join('');

    } else {
      commentsList.innerHTML = `
        <div class="empty-state" style="padding:30px 20px;">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      `;
    }

  } catch (error) {
    console.log('Comments error:', error);
  }
}

// ===== ADD COMMENT =====
async function addComment() {
  const token = getToken();
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  const commentText = document.getElementById('commentText');
  const content = commentText.value.trim();

  if (!content) {
    alert('Please write a comment first!');
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/posts/${postId}/comments`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      }
    );

    const data = await response.json();

    if (data.success) {
      commentText.value = '';  // clear the text box
      loadComments();          // reload comments
    } else {
      alert(data.message || 'Failed to add comment');
    }

  } catch (error) {
    alert('Server error. Try again!');
  }
}

// ===== DELETE COMMENT =====
async function deleteComment(commentId) {
  if (!confirm('Delete this comment?')) return;

  const token = getToken();

  try {
    const response = await fetch(
      `${API_URL}/comments/${commentId}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    const data = await response.json();

    if (data.success) {
      // Remove comment from DOM
      document.getElementById(`comment-${commentId}`).remove();
    }

  } catch (error) {
    console.log('Delete comment error:', error);
  }
}

// ===== COPY LINK =====
function copyLink() {
  navigator.clipboard.writeText(window.location.href);
  alert('Link copied to clipboard!');
}

// ===== NAVIGATION =====
function goToEditor() {
  if (!getToken()) {
    window.location.href = 'login.html';
  } else {
    window.location.href = 'editor.html';
  }
}