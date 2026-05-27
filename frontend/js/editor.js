// ===== CHECK LOGIN =====
document.addEventListener('DOMContentLoaded', () => {
  if (!getToken()) {
    window.location.href = 'login.html';
    return;
  }
  updateNavbar();
  initEditor();
});

// ===== NAVBAR =====
function updateNavbar() {
  const user = getUser();
  const navbarUser = document.getElementById('navbarUser');
  if (user) {
    navbarUser.innerHTML = `
      <span style="font-size:0.85rem;color:#6b7280;margin-left:8px;">
        👋 ${user.name}
      </span>
    `;
  }
}

// ===== QUILL INIT =====
let quill;
function initEditor() {
  quill = new Quill('#quillEditor', {
    theme: 'snow',
    placeholder: 'Tell your story...',
    modules: {
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['link', 'image', 'blockquote', 'code-block'],
        ['clean']
      ]
    }
  });

  // Live word count + checklist update
  quill.on('text-change', () => {
    updateWordCount();
    updateChecklist();
  });
}

// ===== WORD COUNT =====
function updateWordCount() {
  const text  = quill.getText().trim();
  const words = text ? text.split(/\s+/).filter(w => w).length : 0;
  const chars = text.length;
  const mins  = Math.max(1, Math.ceil(words / 200));

  document.getElementById('wc').textContent  = `${words} words`;
  document.getElementById('cc').textContent  = `${chars} characters`;
  document.getElementById('rt').textContent  = `~${mins} min read`;
  document.getElementById('wordCountBadge').textContent = `${words} words`;
  document.getElementById('readTimeBadge').textContent  = `⏱ ${mins} min read`;
}

// ===== AUTO RESIZE TEXTAREA =====
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

// ===== CHECKLIST =====
function updateChecklist() {
  const title    = document.getElementById('postTitle').value.trim();
  const text     = quill ? quill.getText().trim() : '';
  const words    = text ? text.split(/\s+/).filter(w=>w).length : 0;
  const category = document.getElementById('postCategory').value;

  setCheck('chk-title',    title.length > 0);
  setCheck('chk-content',  words >= 10);
  setCheck('chk-category', category !== '');
  setCheck('chk-tags',     tags.length > 0);
  setCheck('chk-image',
    document.getElementById('imgPreviewBox').style.display === 'block');
}

function setCheck(id, done) {
  const el = document.getElementById(id);
  if (el) el.className = `check-dot ${done ? 'done' : ''}`;
}

// ===== STATUS TOGGLE =====
let selectedStatus = 'published';
function setStatus(status) {
  selectedStatus = status;
  document.getElementById('opt-published')
    .className = `status-opt ${status === 'published' ? 'active' : ''}`;
  document.getElementById('opt-draft')
    .className = `status-opt ${status === 'draft' ? 'active' : ''}`;
}

// ===== TAGS =====
let tags = [];

function addTag(event) {
  if (event.key !== 'Enter') return;
  const input    = document.getElementById('tagInput');
  const tagValue = input.value.trim().toLowerCase();
  if (!tagValue || tags.includes(tagValue)) { input.value=''; return; }
  if (tags.length >= 5) { alert('Max 5 tags!'); return; }

  tags.push(tagValue);

  const chip = document.createElement('div');
  chip.className = 'wtag-chip';
  chip.id = `wtag-${tagValue}`;
  chip.innerHTML = `
    #${tagValue}
    <button onclick="removeTag('${tagValue}')">×</button>
  `;
  const tagsRow = document.getElementById('tagsRow');
  tagsRow.insertBefore(chip, document.getElementById('tagInput'));
  input.value = '';
  updateChecklist();
}

function removeTag(tagValue) {
  tags = tags.filter(t => t !== tagValue);
  const chip = document.getElementById(`wtag-${tagValue}`);
  if (chip) chip.remove();
  updateChecklist();
}

// ===== IMAGE =====
function previewImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  const preview = document.getElementById('imagePreview');
  const box     = document.getElementById('imgPreviewBox');
  preview.src         = URL.createObjectURL(file);
  box.style.display   = 'block';
  updateChecklist();
}

function removeImage() {
  document.getElementById('imageInput').value    = '';
  document.getElementById('imagePreview').src    = '';
  document.getElementById('imgPreviewBox').style.display = 'none';
  updateChecklist();
}

// ===== STATUS BADGE =====
function setStatusBadge(msg, type) {
  const badge = document.getElementById('statusBadge');
  badge.textContent = msg;
  badge.className = `status-badge ${type}`;
}

// ===== VALIDATE =====
function validateForm() {
  const title    = document.getElementById('postTitle').value.trim();
  const text     = quill.getText().trim();
  const category = document.getElementById('postCategory').value;

  if (!title) {
    setStatusBadge('Add a title!', 'error');
    document.getElementById('postTitle').focus();
    return false;
  }
  if (!text || text.split(/\s+/).length < 5) {
    setStatusBadge('Write more content!', 'error');
    return false;
  }
  if (!category) {
    setStatusBadge('Select a category!', 'error');
    return false;
  }
  return true;
}

// ===== PUBLISH =====
async function publishPost() {
  setStatus('published');
  if (!validateForm()) return;
  await submitPost('published');
}

// ===== SAVE DRAFT =====
async function saveDraft() {
  setStatus('draft');
  const title = document.getElementById('postTitle').value.trim();
  if (!title) { setStatusBadge('Add a title first!', 'error'); return; }
  await submitPost('draft');
}

// ===== SUBMIT =====
async function submitPost(status) {
  const title    = document.getElementById('postTitle').value.trim();
  const content  = quill.root.innerHTML;
  const category = document.getElementById('postCategory').value;
  const token    = getToken();

  setStatusBadge('Saving...', '');
  document.querySelector('.btn-publish-top').disabled = true;
  document.querySelector('.btn-save-draft').disabled  = true;

  try {
    const response = await fetch(`${API_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, content, category, tags, status })
    });

    const data = await response.json();

    if (data.success) {
      if (status === 'published') {
        setStatusBadge('✅ Published!', 'saved');
        setTimeout(() => {
          window.location.href = `post.html?slug=${data.post.slug}`;
        }, 1200);
      } else {
        setStatusBadge('✅ Draft saved!', 'saved');
      }
    } else {
      setStatusBadge(data.message || 'Error!', 'error');
    }

  } catch (err) {
    setStatusBadge('Server error!', 'error');
  } finally {
    document.querySelector('.btn-publish-top').disabled = false;
    document.querySelector('.btn-save-draft').disabled  = false;
  }
}