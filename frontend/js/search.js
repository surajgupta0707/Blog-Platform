// ===== STATE =====
let searchPage     = 1;
let searchQuery    = '';
let searchCategory = '';
let searchSort     = '';

// ===== ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();

  // Check if search query in URL
  // Example: search.html?q=nodejs
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (q) {
    document.getElementById('searchInput').value = q;
    searchQuery = q;
    doSearch();
  }

  // Enter key to search
  document.getElementById('searchInput')
    .addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSearch();
    });

  // Back to top button
  window.addEventListener('scroll', () => {
    const btn = document.getElementById('backToTop');
    if (window.scrollY > 300) {
      btn.classList.add('show');
    } else {
      btn.classList.remove('show');
    }
  });
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

// ===== DO SEARCH =====
async function doSearch() {
  searchQuery    = document.getElementById('searchInput').value.trim();
  searchCategory = document.getElementById('categoryFilter').value;
  searchSort     = document.getElementById('sortFilter').value;
  searchPage     = 1;

  await fetchResults();
}

// ===== FETCH RESULTS =====
async function fetchResults() {
  const resultsContainer = document.getElementById('searchResults');
  const searchInfo       = document.getElementById('searchInfo');

  resultsContainer.innerHTML = `
    <div class="loading">
      <div class="loading-spinner"></div>
      <p>Searching...</p>
    </div>
  `;

  try {
    // Build query URL
    let url = `${API_URL}/posts?page=${searchPage}&limit=9`;
    if (searchQuery)    url += `&search=${encodeURIComponent(searchQuery)}`;
    if (searchCategory) url += `&category=${searchCategory}`;
    if (searchSort)     url += `&sort=${searchSort}`;

    const response = await fetch(url);
    const data     = await response.json();

    if (data.success && data.posts.length > 0) {

      // Search info text
      searchInfo.innerHTML = `
        Found <strong>${data.total}</strong> post${data.total !== 1 ? 's' : ''}
        ${searchQuery
          ? ` for <strong>"${searchQuery}"</strong>`
          : ''}
        ${searchCategory
          ? ` in <strong>${searchCategory}</strong>`
          : ''}
      `;

      // Render post cards grid
      resultsContainer.innerHTML = `
        <div class="posts-grid">
          ${data.posts.map(post => createPostCard(post)).join('')}
        </div>
      `;

      // Pagination
      buildSearchPagination(data.totalPages, data.currentPage);

    } else {
      searchInfo.innerHTML = '';
      resultsContainer.innerHTML = `
        <div class="empty-state" style="padding:60px 20px;">
          <h3>No posts found 😕</h3>
          <p>Try different keywords or remove filters</p>
        </div>
      `;
      document.getElementById('pagination').innerHTML = '';
    }

  } catch (error) {
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <h3>Search failed 😕</h3>
        <p>Make sure your backend is running!</p>
      </div>
    `;
  }
}

// ===== PAGINATION =====
function buildSearchPagination(totalPages, current) {
  const pagination = document.getElementById('pagination');

  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let html = '';

  if (current > 1) {
    html += `
      <button class="page-btn"
              onclick="goSearchPage(${current - 1})">
        ← Prev
      </button>
    `;
  }

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button class="page-btn ${i === current ? 'active' : ''}"
              onclick="goSearchPage(${i})">
        ${i}
      </button>
    `;
  }

  if (current < totalPages) {
    html += `
      <button class="page-btn"
              onclick="goSearchPage(${current + 1})">
        Next →
      </button>
    `;
  }

  pagination.innerHTML = html;
}

function goSearchPage(page) {
  searchPage = page;
  fetchResults();
  window.scrollTo({ top: 300, behavior: 'smooth' });
}

// ===== BACK TO TOP =====
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== TOAST NOTIFICATION =====
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent  = message;
  toast.className    = `toast ${type} show`;
  setTimeout(() => {
    toast.className = `toast ${type}`;
  }, 3000);
}