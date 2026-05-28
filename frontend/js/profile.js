// ===== GET USER ID FROM URL =====
// URL: profile.html?id=65abc123...
const profileParams = new URLSearchParams(window.location.search);
const profileUserId = profileParams.get('id');

// Store author data globally
let authorData = null;

// ===== ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();

  if (!profileUserId) {
    window.location.href = '../index.html';
    return;
  }

  loadProfile();
});

// ===== NAVBAR =====
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

// ===== LOAD PROFILE =====
async function loadProfile() {
  try {
    const token = getToken();
    const headers = token
      ? { 'Authorization': `Bearer ${token}` }
      : {};

    // Fetch user profile from API
    const response = await fetch(
      `${API_URL}/users/${profileUserId}`,
      { headers }
    );
    const data = await response.json();

    if (!data.success) {
      document.getElementById('profileHero').innerHTML = `
        <div class="empty-state" style="padding:80px 20px;">
          <h3>User not found 😕</h3>
          <a href="../index.html"
             class="btn btn-primary"
             style="width:auto;padding:10px 24px;
                    margin-top:16px;display:inline-block;">
            ← Back to Home
          </a>
        </div>
      `;
      return;
    }

    authorData = data.user;

    // Update page title
    document.title = `${authorData.name} — BlogSpace`;

    // Render hero
    renderProfileHero(authorData);

    // Load author's posts
    loadAuthorPosts();

  } catch (error) {
    document.getElementById('profileHero').innerHTML = `
      <div class="empty-state">
        <h3>Failed to load profile 😕</h3>
        <p>Make sure your backend is running!</p>
      </div>
    `;
  }
}

// ===== RENDER PROFILE HERO =====
function renderProfileHero(author) {
  const currentUser = getUser();

  // Check if current user is following this author
  const isFollowing = currentUser &&
    author.followers &&
    author.followers.includes(currentUser.id);

  // Check if this is the user's own profile
  const isOwnProfile = currentUser &&
    currentUser.id === profileUserId;

  const joinDate = new Date(author.createdAt)
    .toLocaleDateString('en-US', {
      year: 'numeric', month: 'long'
    });

  document.getElementById('profileHero').innerHTML = `
    <div class="profile-hero">
      <div class="profile-hero-inner">

        <!-- Avatar -->
        <div class="profile-avatar-large">
          ${author.name.charAt(0).toUpperCase()}
        </div>

        <!-- Info -->
        <div class="profile-info">
          <div class="profile-name">${author.name}</div>
          <div class="profile-bio">
            ${author.bio || 'No bio yet.'}
          </div>

          <!-- Stats -->
          <div class="profile-stats">
            <div class="profile-stat">
              <div class="profile-stat-value" id="followersCount">
                ${author.followers ? author.followers.length : 0}
              </div>
              <div class="profile-stat-label">Followers</div>
            </div>
            <div class="profile-stat">
              <div class="profile-stat-value">
                ${author.following ? author.following.length : 0}
              </div>
              <div class="profile-stat-label">Following</div>
            </div>
          </div>

          <!-- Follow Button (only show if not own profile) -->
          ${!isOwnProfile ? `
            <button
              id="followBtn"
              class="follow-btn ${isFollowing ? 'following' : 'follow'}"
              onclick="toggleFollow()">
              ${isFollowing ? '✅ Following' : '➕ Follow'}
            </button>
          ` : `
            <a href="dashboard.html"
               class="follow-btn follow"
               style="display:inline-block;text-decoration:none;
                      text-align:center;">
              ⚙️ Edit Profile
            </a>
          `}

          <div style="margin-top:10px;
                      font-size:0.82rem;
                      opacity:0.7;">
            📅 Member since ${joinDate}
          </div>
        </div>

      </div>
    </div>
  `;
}

// ===== LOAD AUTHOR POSTS =====
async function loadAuthorPosts() {
  try {
    const response = await fetch(
      `${API_URL}/posts?author=${profileUserId}&status=published`
    );
    const data = await response.json();

    const container  = document.getElementById('profilePosts');
    const titleEl    = document.getElementById('postsTitle');

    if (data.success && data.posts.length > 0) {
      titleEl.textContent =
        `✍️ Posts by ${authorData.name} (${data.posts.length})`;

      container.innerHTML = `
        <div class="profile-posts-grid">
          ${data.posts.map(post => createPostCard(post)).join('')}
        </div>
      `;
    } else {
      titleEl.textContent = `✍️ Posts by ${authorData.name}`;
      container.innerHTML = `
        <div class="empty-state">
          <h3>No posts yet 📭</h3>
          <p>${authorData.name} hasn't published any posts yet.</p>
        </div>
      `;
    }

  } catch (error) {
    document.getElementById('profilePosts').innerHTML = `
      <div class="empty-state">
        <h3>Failed to load posts 😕</h3>
      </div>
    `;
  }
}

// ===== TOGGLE FOLLOW =====
async function toggleFollow() {
  const token = getToken();

  if (!token) {
    alert('Please login to follow authors!');
    window.location.href = 'login.html';
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/users/${profileUserId}/follow`,
      {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    const data = await response.json();

    if (data.success) {
      const followBtn = document.getElementById('followBtn');
      const followersCount =
        document.getElementById('followersCount');

      if (data.followed) {
        followBtn.className   = 'follow-btn following';
        followBtn.textContent = '✅ Following';
        followersCount.textContent =
          parseInt(followersCount.textContent) + 1;
      } else {
        followBtn.className   = 'follow-btn follow';
        followBtn.textContent = '➕ Follow';
        followersCount.textContent =
          parseInt(followersCount.textContent) - 1;
      }
    }

  } catch (error) {
    console.log('Follow error:', error);
  }
}