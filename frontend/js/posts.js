// Track current state
let currentPage     = 1;
let currentCategory = '';
let currentSearch   = '';

// ===== ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();
  loadPosts();
  loadTrending();
});

// ===== UPDATE NAVBAR =====
function updateNavbar() {
  const user = getUser();
  const navbarUser = document.getElementById('navbarUser');

  if (user) {
    navbarUser.innerHTML = `
      <span>👋 ${user.name}</span>
      <a href="pages/dashboard.html" 
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
      <a href="pages/login.html">Sign In</a>
      <a href="pages/register.html" 
         class="btn btn-primary" 
         style="width:auto;padding:8px 16px;font-size:0.9rem;">
        Get Started
      </a>
    `;
  }
}

// ===== LOAD ALL POSTS =====
async function loadPosts() {
  const container = document.getElementById('postsContainer');

  container.innerHTML = `
    <div class="loading">
      <div class="loading-spinner"></div>
      <p>Loading posts...</p>
    </div>
  `;

  try {
    let url = `${API_URL}/posts?page=${currentPage}&limit=9`;
    if (currentCategory) url += `&category=${currentCategory}`;
    if (currentSearch)   url += `&search=${currentSearch}`;

    const response = await fetch(url);
    const data     = await response.json();

    if (data.success && data.posts.length > 0) {
      container.innerHTML = `
        <div class="posts-grid">
          ${data.posts.map(post => createPostCard(post)).join('')}
        </div>
      `;
      buildPagination(data.totalPages, data.currentPage);
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No posts found 😕</h3>
          <p>Try a different category or search term</p>
        </div>
      `;
    }

  } catch (error) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>Failed to load posts 😕</h3>
        <p>Make sure your backend server is running!</p>
      </div>
    `;
  }
}

// ===== CREATE POST CARD =====
function createPostCard(post) {
  const date = new Date(post.createdAt).toLocaleDateString('en-US', {
    year:  'numeric',
    month: 'short',
    day:   'numeric'
  });

  return `
    <div class="post-card" onclick="goToPost('${post.slug}')">
      <div class="post-card-image">
        ${post.featuredImage !== 'default-post.jpg'
          ? `<img src="${API_URL.replace('/api','')}/uploads/${post.featuredImage}" 
               alt="${post.title}" 
               style="width:100%;height:100%;object-fit:cover;" />`
          : '📝'
        }
      </div>
      <div class="post-card-body">
        <span class="post-card-category">${post.category}</span>
        <div class="post-card-title">${post.title}</div>
        <div class="post-card-excerpt">
          ${post.excerpt || 'Click to read more...'}
        </div>
        <div class="post-card-footer">
          <div class="post-card-author">
            <div style="width:30px;height:30px;border-radius:50%;
                        background:var(--primary);display:flex;
                        align-items:center;justify-content:center;
                        color:white;font-size:0.8rem;font-weight:bold;">
              ${post.author.name.charAt(0).toUpperCase()}
            </div>
            <span>${post.author.name}</span>
          </div>
          <div class="post-card-meta">
            <span>⏱ ${post.readTime} min</span>
            <span>👁 ${post.views}</span>
            <span>❤️ ${post.likes ? post.likes.length : 0}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ===== BUILD PAGINATION =====
function buildPagination(totalPages, currentPage) {
  const pagination = document.getElementById('pagination');

  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let html = '';

  if (currentPage > 1) {
    html += `
      <button class="page-btn" onclick="goToPage(${currentPage - 1})">
        ← Prev
      </button>
    `;
  }

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button class="page-btn ${i === currentPage ? 'active' : ''}" 
              onclick="goToPage(${i})">
        ${i}
      </button>
    `;
  }

  if (currentPage < totalPages) {
    html += `
      <button class="page-btn" onclick="goToPage(${currentPage + 1})">
        Next →
      </button>
    `;
  }

  pagination.innerHTML = html;
}

// ===== GO TO PAGE =====
function goToPage(page) {
  currentPage = page;
  loadPosts();
  window.scrollTo({ top: 300, behavior: 'smooth' });
}

// ===== FILTER BY CATEGORY =====
function filterByCategory(category) {
  currentCategory = category;
  currentPage     = 1;

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  loadPosts();
}

// ===== SEARCH POSTS =====
function searchPosts() {
  const input   = document.getElementById('searchInput');
  currentSearch   = input.value.trim();
  currentPage     = 1;
  currentCategory = '';
  loadPosts();
}

// Enter key to search
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') searchPosts();
    });
  }
});

// ===== LOAD TRENDING =====
async function loadTrending() {
  try {
    const response = await fetch(`${API_URL}/posts?sort=popular&limit=4`);
    const data     = await response.json();
    const container = document.getElementById('trendingPosts');

    if (data.success && data.posts.length > 0) {
      container.innerHTML = data.posts.map(post => `
        <div class="sidebar-post" onclick="goToPost('${post.slug}')">
          <div>
            <div class="sidebar-post-title">${post.title}</div>
            <div class="sidebar-post-meta">
              👁 ${post.views} views • 
              ❤️ ${post.likes ? post.likes.length : 0} likes
            </div>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = `
        <p style="color:var(--gray);font-size:0.9rem;">
          No trending posts yet
        </p>
      `;
    }
  } catch (error) {
    console.log('Could not load trending posts');
  }
}

// ===== NAVIGATION =====
function goToPost(slug) {
  window.location.href = `pages/post.html?slug=${slug}`;
}

function goToEditor() {
  if (!getToken()) {
    window.location.href = 'pages/login.html';
  } else {
    window.location.href = 'pages/editor.html';
  }
}