// ===== CHECK LOGIN =====
document.addEventListener('DOMContentLoaded', () => {
  if (!getToken()) {
    window.location.href = 'login.html';
    return;
  }
  updateNavbar();
  loadDashboard();
});

// ===== NAVBAR =====
function updateNavbar() {
  const user = getUser();
  const navbarUser = document.getElementById('navbarUser');
  if (user) {
    navbarUser.innerHTML = `
      <span>👋 ${user.name}</span>
      <button onclick="logout()"
              class="btn btn-primary"
              style="width:auto;padding:8px 16px;font-size:0.9rem;">
        Logout
      </button>
    `;
  }
}

// ===== LOAD DASHBOARD =====
async function loadDashboard() {
  const token = getToken();
  const user  = getUser();

  // Fill hero section
  document.getElementById('dashAvatar').textContent =
    user.name.charAt(0).toUpperCase();
  document.getElementById('dashName').textContent   = user.name;
  document.getElementById('dashEmail').textContent  = user.email;

  try {
    // Get all posts by this user from API
    const response = await fetch(
      `${API_URL}/posts/user/${user.id}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    const data = await response.json();

    if (data.success) {
      const posts = data.posts;

      // Calculate stats
      const totalViews = posts.reduce(
        (sum, p) => sum + (p.views || 0), 0
      );
      const totalLikes = posts.reduce(
        (sum, p) => sum + (p.likes ? p.likes.length : 0), 0
      );

      // Update stat cards
      document.getElementById('statPosts').textContent =
        posts.length;
      document.getElementById('statViews').textContent =
        totalViews;
      document.getElementById('statLikes').textContent =
        totalLikes;

      // Get followers from current user
      const meResponse = await fetch(
        `${API_URL}/auth/me`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const meData = await meResponse.json();
      if (meData.success) {
        document.getElementById('statFollowers').textContent =
          meData.user.followers
            ? meData.user.followers.length
            : 0;

        const joined = new Date(meData.user.createdAt)
          .toLocaleDateString('en-US', {
            year: 'numeric', month: 'long'
          });
        document.getElementById('dashJoined').textContent =
          `📅 Member since ${joined}`;
      }

      // Show published posts by default
      renderPostsTable(posts, 'published');

    } else {
      document.getElementById('postsTableWrap').innerHTML = `
        <div class="empty-state">
          <h3>No posts yet 😕</h3>
          <p>Start writing your first post!</p>
          <a href="editor.html"
             class="btn btn-primary"
             style="width:auto;padding:10px 24px;
                    display:inline-block;margin-top:16px;">
            ✍️ Write a Post
          </a>
        </div>
      `;
    }

  } catch (error) {
    document.getElementById('postsTableWrap').innerHTML = `
      <div class="empty-state">
        <h3>Failed to load posts 😕</h3>
        <p>Make sure your backend is running!</p>
      </div>
    `;
  }
}

// ===== RENDER POSTS TABLE =====
let allPosts = [];

async function renderPostsTable(posts, status) {
  allPosts = posts;
  const filtered = posts.filter(p => p.status === status);
  const wrap = document.getElementById('postsTableWrap');

  if (filtered.length === 0) {
    wrap.innerHTML = `
      <div class="empty-state" style="padding:40px;">
        <h3>${status === 'published'
          ? '📭 No published posts yet'
          : '📝 No drafts yet'}</h3>
        <p>${status === 'published'
          ? 'Publish your first post!'
          : 'Save a post as draft to see it here'}</p>
        <a href="editor.html"
           class="btn btn-primary"
           style="width:auto;padding:10px 24px;
                  display:inline-block;margin-top:16px;">
          ✍️ Write a Post
        </a>
      </div>
    `;
    return;
  }

  wrap.innerHTML = `
    <div class="posts-table-wrap">
      <table class="posts-table">
        <thead>
          <tr>
            <th>Post</th>
            <th>Status</th>
            <th>Views</th>
            <th>Likes</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(post => {
            const date = new Date(post.createdAt)
              .toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });

            return `
              <tr>
                <td>
                  <div class="post-table-title"
                       onclick="viewPost('${post.slug}')">
                    ${post.title}
                  </div>
                  <div class="post-table-excerpt">
                    ${post.category} •
                    ⏱ ${post.readTime || 1} min read
                  </div>
                </td>
                <td>
                  <span class="status-pill ${post.status}">
                    ${post.status === 'published' ? '🌍' : '📝'}
                    ${post.status}
                  </span>
                </td>
                <td style="color:var(--gray);font-size:0.9rem;">
                  👁 ${post.views || 0}
                </td>
                <td style="color:var(--gray);font-size:0.9rem;">
                  ❤️ ${post.likes ? post.likes.length : 0}
                </td>
                <td style="color:var(--gray);font-size:0.85rem;">
                  ${date}
                </td>
                <td>
                  <div class="post-actions">
                    <button class="action-btn view"
                            onclick="viewPost('${post.slug}')">
                      👁 View
                    </button>
                    <button class="action-btn delete"
                            onclick="deletePost('${post._id}')">
                      🗑 Delete
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ===== SWITCH TABS =====
function switchTab(status) {
  // Update active tab
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  // Re-render table with new filter
  renderPostsTable(allPosts, status);
}

// ===== VIEW POST =====
function viewPost(slug) {
  window.location.href = `post.html?slug=${slug}`;
}

// ===== DELETE POST =====
async function deletePost(postId) {
  if (!confirm(
    'Are you sure you want to delete this post? This cannot be undone!'
  )) return;

  const token = getToken();

  try {
    const response = await fetch(`${API_URL}/posts/${postId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();

    if (data.success) {
      // Remove post from allPosts array
      allPosts = allPosts.filter(p => p._id !== postId);

      // Re-render table
      const activeTab = document.querySelector('.tab-btn.active');
      const status = activeTab.textContent.includes('Published')
        ? 'published'
        : 'draft';

      renderPostsTable(allPosts, status);

      // Update stats
      document.getElementById('statPosts').textContent =
        allPosts.length;

    } else {
      alert(data.message || 'Failed to delete post');
    }

  } catch (error) {
    alert('Server error. Try again!');
  }
}
