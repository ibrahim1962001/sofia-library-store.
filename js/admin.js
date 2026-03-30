// ============================================================
// admin.js — Admin panel logic
// ============================================================
import { getProducts, addProduct, updateProduct, deleteProduct, getBoxes, addBox, updateBox, deleteBox, getOrders, updateOrderStatus, getReviews, approveReview, deleteReview, getSettings, updateSetting, uploadImage } from './api.js';

// ─── AUTH ────────────────────────────────────────────────────
const PASSWORD = 'sofia2025';

function checkAuth() {
  return localStorage.getItem('sofia_admin_auth') === 'yes';
}

document.getElementById('loginForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const pass = document.getElementById('loginPassword').value;
  if (pass === PASSWORD) {
    localStorage.setItem('sofia_admin_auth', 'yes');
    showApp();
  } else {
    document.getElementById('loginError').style.display = 'block';
  }
});

document.getElementById('logoutBtn')?.addEventListener('click', () => {
  localStorage.removeItem('sofia_admin_auth');
  location.reload();
});

function showApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminApp').style.display = 'flex';
  initApp();
}

if (checkAuth()) showApp();
else {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminApp').style.display = 'none';
}

// ─── STATE ───────────────────────────────────────────────────
let products = [], boxes = [], orders = [], reviews = [], settings = {};
let editingProduct = null, editingBox = null;

async function initApp() {
  [products, boxes, orders, reviews, settings] = await Promise.all([
    getProducts(), getBoxes(), getOrders(), getReviews(), getSettings()
  ]);
  renderDashboard();
  renderProductsTable();
  renderBoxesTable();
  renderOrdersTable();
  renderReviewsTable();
  loadSettings();
}

// ─── NAVIGATION ──────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const target = item.dataset.page;
    if (!target) return;
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(target)?.classList.add('active');
    document.getElementById('topbarTitle').textContent = item.querySelector('.label')?.textContent || '';
    closeSidebar();
  });
});

// Sidebar toggle (mobile)
document.getElementById('sidebarToggle')?.addEventListener('click', () => {
  document.getElementById('sidebar')?.classList.toggle('open');
});
function closeSidebar() {
  if (window.innerWidth <= 900) document.getElementById('sidebar')?.classList.remove('open');
}

// ─── DASHBOARD ───────────────────────────────────────────────
function renderDashboard() {
  document.getElementById('statProducts').textContent = products.length;
  document.getElementById('statOrders').textContent = orders.length;
  document.getElementById('statReviews').textContent = reviews.filter(r => r.approved !== 'true').length;
  document.getElementById('statBoxes').textContent = boxes.length;

  // Pending badge on nav
  const pendingReviews = reviews.filter(r => r.approved !== 'true').length;
  const badge = document.getElementById('reviewsBadge');
  if (badge) { badge.textContent = pendingReviews; badge.style.display = pendingReviews > 0 ? 'inline' : 'none'; }

  // Recent orders
  const tbody = document.getElementById('recentOrdersTbody');
  if (tbody) {
    const recent = [...orders].reverse().slice(0, 5);
    tbody.innerHTML = recent.length ? recent.map(o => `
      <tr>
        <td>${o.name || ''}</td>
        <td>${o.phone || ''}</td>
        <td>${o.product || ''}</td>
        <td><span class="badge ${statusBadge(o.status)}">${o.status || 'جديد'}</span></td>
        <td>${o.date ? o.date.split('T')[0] : ''}</td>
      </tr>
    `).join('') : '<tr><td colspan="5" class="tbl-empty">لا توجد طلبات بعد</td></tr>';
  }
}

function statusBadge(s) {
  if (!s || s === 'جديد') return 'badge-primary';
  if (s === 'قيد التنفيذ') return 'badge-warning';
  if (s === 'تم التوصيل') return 'badge-success';
  return 'badge-danger';
}

// ─── PRODUCTS ────────────────────────────────────────────────
function renderProductsTable(filter = '') {
  const tbody = document.getElementById('productsTbody');
  if (!tbody) return;
  const list = filter ? products.filter(p => p.name.includes(filter) || p.category.includes(filter)) : products;
  tbody.innerHTML = list.length ? list.map(p => `
    <tr>
      <td><img class="tbl-img" src="${p.image_url || 'https://via.placeholder.com/48'}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/48'"></td>
      <td>${p.name}</td>
      <td>${p.price} جنيه</td>
      <td>${p.old_price ? p.old_price + ' جنيه' : '—'}</td>
      <td>${p.category}</td>
      <td><span class="badge ${p.available !== 'false' ? 'badge-success' : 'badge-danger'}">${p.available !== 'false' ? 'متاح' : 'مخفي'}</span></td>
      <td>
        <button class="btn-primary btn-sm btn-icon-tbl" onclick="editProduct('${p.id}')" title="تعديل">✏️</button>
        <button class="btn-danger btn-sm btn-icon-tbl" onclick="deleteProductConfirm('${p.id}')" title="حذف">🗑</button>
      </td>
    </tr>
  `).join('') : '<tr><td colspan="7" class="tbl-empty">لا توجد منتجات</td></tr>';
}

document.getElementById('productSearch')?.addEventListener('input', e => renderProductsTable(e.target.value));

document.getElementById('addProductBtn')?.addEventListener('click', () => {
  editingProduct = null;
  document.getElementById('productFormTitle').textContent = 'إضافة منتج جديد';
  document.getElementById('productForm').reset();
  document.getElementById('productImgPreview').style.display = 'none';
  document.getElementById('productModal').classList.add('open');
});

window.editProduct = function(id) {
  const p = products.find(p => p.id === id);
  if (!p) return;
  editingProduct = p;
  document.getElementById('productFormTitle').textContent = 'تعديل المنتج';
  document.getElementById('pName').value = p.name;
  document.getElementById('pPrice').value = p.price;
  document.getElementById('pOldPrice').value = p.old_price || '';
  document.getElementById('pCategory').value = p.category;
  document.getElementById('pDescription').value = p.description || '';
  document.getElementById('pImageUrl').value = p.image_url || '';
  document.getElementById('pAvailable').checked = p.available !== 'false';
  document.getElementById('pFeatured').checked = p.featured === 'true';
  const preview = document.getElementById('productImgPreview');
  if (p.image_url) { preview.src = p.image_url; preview.style.display = 'block'; }
  else preview.style.display = 'none';
  document.getElementById('productModal').classList.add('open');
};

window.deleteProductConfirm = async function(id) {
  if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
  try {
    await deleteProduct(id);
    products = products.filter(p => p.id !== id);
    renderProductsTable();
    renderDashboard();
    showToast('تم حذف المنتج', 'success');
  } catch { showToast('حدث خطأ أثناء الحذف', 'danger'); }
};

document.getElementById('productForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled = true; btn.textContent = 'جاري الحفظ...';

  const data = {
    name: document.getElementById('pName').value.trim(),
    price: document.getElementById('pPrice').value.trim(),
    old_price: document.getElementById('pOldPrice').value.trim(),
    category: document.getElementById('pCategory').value,
    description: document.getElementById('pDescription').value.trim(),
    image_url: document.getElementById('pImageUrl').value.trim(),
    available: document.getElementById('pAvailable').checked ? 'true' : 'false',
    featured: document.getElementById('pFeatured').checked ? 'true' : 'false',
  };

  // If file selected, upload to cloudinary first
  const fileInput = document.getElementById('pImageFile');
  if (fileInput?.files[0]) {
    try {
      const progress = document.getElementById('uploadProgress');
      const bar = document.getElementById('uploadBar');
      if (progress) progress.style.display = 'block';
      data.image_url = await uploadImage(fileInput.files[0], pct => { if (bar) bar.style.width = pct + '%'; });
      if (progress) progress.style.display = 'none';
    } catch { showToast('فشل رفع الصورة، استخدم رابطاً بدلاً من ذلك', 'danger'); }
  }

  try {
    if (editingProduct) {
      await updateProduct({ ...data, id: editingProduct.id });
      const idx = products.findIndex(p => p.id === editingProduct.id);
      if (idx !== -1) products[idx] = { ...products[idx], ...data };
      showToast('تم تحديث المنتج بنجاح', 'success');
    } else {
      const res = await addProduct(data);
      products.push({ ...data, id: res?.id || Date.now().toString() });
      showToast('تم إضافة المنتج بنجاح', 'success');
    }
    renderProductsTable();
    renderDashboard();
    document.getElementById('productModal').classList.remove('open');
  } catch { showToast('حدث خطأ أثناء الحفظ', 'danger'); }

  btn.disabled = false; btn.textContent = 'حفظ';
});

// Helper to fix Google Drive links automatically
function formatDriveUrl(url) {
  if (!url) return '';
  const m = url.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]{25,})/);
  if (m && url.includes('drive')) {
    return 'https://drive.google.com/uc?export=view&id=' + m[1];
  }
  return url;
}

// Image preview
document.getElementById('pImageUrl')?.addEventListener('input', e => {
  const preview = document.getElementById('productImgPreview');
  const finalUrl = formatDriveUrl(e.target.value.trim());
  if (finalUrl !== e.target.value) e.target.value = finalUrl;
  if (finalUrl) { preview.src = finalUrl; preview.style.display = 'block'; }
  else preview.style.display = 'none';
});

// Also fix box image URL on input
document.getElementById('bImageUrl')?.addEventListener('input', e => {
  const finalUrl = formatDriveUrl(e.target.value.trim());
  if (finalUrl !== e.target.value) e.target.value = finalUrl;
});
document.getElementById('pImageFile')?.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const preview = document.getElementById('productImgPreview');
  preview.src = URL.createObjectURL(file);
  preview.style.display = 'block';
});

// ─── BOXES ───────────────────────────────────────────────────
function renderBoxesTable() {
  const tbody = document.getElementById('boxesTbody');
  if (!tbody) return;
  tbody.innerHTML = boxes.length ? boxes.map(b => `
    <tr>
      <td><img class="tbl-img" src="${b.image_url || 'https://via.placeholder.com/48'}" alt="${b.name}" onerror="this.src='https://via.placeholder.com/48'"></td>
      <td>${b.name}</td>
      <td>${b.price} جنيه</td>
      <td>${b.items || ''}</td>
      <td>
        <button class="btn-primary btn-sm btn-icon-tbl" onclick="editBox('${b.id}')">✏️</button>
        <button class="btn-danger btn-sm btn-icon-tbl" onclick="deleteBoxConfirm('${b.id}')">🗑</button>
      </td>
    </tr>
  `).join('') : '<tr><td colspan="5" class="tbl-empty">لا توجد بوكسات</td></tr>';
}

document.getElementById('addBoxBtn')?.addEventListener('click', () => {
  editingBox = null;
  document.getElementById('boxFormTitle').textContent = 'إضافة بوكس جديد';
  document.getElementById('boxForm').reset();
  document.getElementById('boxModal').classList.add('open');
});

window.editBox = function(id) {
  const b = boxes.find(b => b.id === id);
  if (!b) return;
  editingBox = b;
  document.getElementById('boxFormTitle').textContent = 'تعديل البوكس';
  document.getElementById('bName').value = b.name;
  document.getElementById('bPrice').value = b.price;
  document.getElementById('bItems').value = b.items || '';
  document.getElementById('bDescription').value = b.description || '';
  document.getElementById('bImageUrl').value = b.image_url || '';
  document.getElementById('boxModal').classList.add('open');
};

window.deleteBoxConfirm = async function(id) {
  if (!confirm('هل أنت متأكد من حذف هذا البوكس؟')) return;
  try {
    await deleteBox(id);
    boxes = boxes.filter(b => b.id !== id);
    renderBoxesTable();
    renderDashboard();
    showToast('تم حذف البوكس', 'success');
  } catch { showToast('حدث خطأ', 'danger'); }
};

document.getElementById('boxForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('[type=submit]');
  btn.disabled = true; btn.textContent = 'جاري الحفظ...';
  const data = {
    name: document.getElementById('bName').value.trim(),
    price: document.getElementById('bPrice').value.trim(),
    items: document.getElementById('bItems').value.trim(),
    description: document.getElementById('bDescription').value.trim(),
    image_url: document.getElementById('bImageUrl').value.trim(),
  };
  try {
    if (editingBox) {
      await updateBox({ ...data, id: editingBox.id });
      const idx = boxes.findIndex(b => b.id === editingBox.id);
      if (idx !== -1) boxes[idx] = { ...boxes[idx], ...data };
    } else {
      const res = await addBox(data);
      boxes.push({ ...data, id: res?.id || Date.now().toString() });
    }
    renderBoxesTable();
    renderDashboard();
    document.getElementById('boxModal').classList.remove('open');
    showToast('تم الحفظ بنجاح', 'success');
  } catch { showToast('حدث خطأ أثناء الحفظ', 'danger'); }
  btn.disabled = false; btn.textContent = 'حفظ';
});

// ─── ORDERS ──────────────────────────────────────────────────
function renderOrdersTable() {
  const tbody = document.getElementById('ordersTbody');
  if (!tbody) return;
  const list = [...orders].reverse();
  tbody.innerHTML = list.length ? list.map(o => `
    <tr>
      <td>${o.name || ''}</td>
      <td>${o.phone || ''}</td>
      <td>${o.product || ''}</td>
      <td>${o.qty || 1}</td>
      <td>${o.address || ''}</td>
      <td>
        <select class="tbl-search" onchange="changeOrderStatus('${o.id}', this.value)" style="width:140px">
          <option ${!o.status || o.status==='جديد' ? 'selected' : ''}>جديد</option>
          <option ${o.status==='قيد التنفيذ' ? 'selected' : ''}>قيد التنفيذ</option>
          <option ${o.status==='تم التوصيل' ? 'selected' : ''}>تم التوصيل</option>
          <option ${o.status==='ملغي' ? 'selected' : ''}>ملغي</option>
        </select>
      </td>
      <td>${o.date ? o.date.split('T')[0] : ''}</td>
    </tr>
  `).join('') : '<tr><td colspan="7" class="tbl-empty">لا توجد طلبات</td></tr>';
}

window.changeOrderStatus = async function(id, status) {
  try {
    await updateOrderStatus(id, status);
    const o = orders.find(o => o.id === id);
    if (o) o.status = status;
    showToast('تم تحديث حالة الطلب', 'success');
  } catch { showToast('حدث خطأ', 'danger'); }
};

// ─── REVIEWS ─────────────────────────────────────────────────
function renderReviewsTable() {
  const tbody = document.getElementById('reviewsTbody');
  if (!tbody) return;
  tbody.innerHTML = reviews.length ? reviews.map(r => `
    <tr>
      <td>${r.name || ''}</td>
      <td>${r.city || ''}</td>
      <td>${'★'.repeat(parseInt(r.rating) || 5)}</td>
      <td>${r.review || ''}</td>
      <td><span class="badge ${r.approved === 'true' ? 'badge-success' : 'badge-warning'}">${r.approved === 'true' ? 'معتمد' : 'في الانتظار'}</span></td>
      <td>
        ${r.approved !== 'true' ? `<button class="btn-success btn-sm" onclick="approveReviewItem('${r.id}')">اعتماد ✔</button>` : ''}
        <button class="btn-danger btn-sm" onclick="deleteReviewItem('${r.id}')">حذف 🗑</button>
      </td>
    </tr>
  `).join('') : '<tr><td colspan="6" class="tbl-empty">لا توجد آراء</td></tr>';
}

window.approveReviewItem = async function(id) {
  try {
    await approveReview(id);
    const r = reviews.find(r => r.id === id);
    if (r) r.approved = 'true';
    renderReviewsTable();
    renderDashboard();
    showToast('تم اعتماد الرأي', 'success');
  } catch { showToast('حدث خطأ', 'danger'); }
};

window.deleteReviewItem = async function(id) {
  if (!confirm('هل أنت متأكد من حذف هذا الرأي؟')) return;
  try {
    await deleteReview(id);
    reviews = reviews.filter(r => r.id !== id);
    renderReviewsTable();
    renderDashboard();
    showToast('تم حذف الرأي', 'success');
  } catch { showToast('حدث خطأ', 'danger'); }
};

// ─── SETTINGS ────────────────────────────────────────────────
function loadSettings() {
  document.getElementById('settingWhatsapp') && (document.getElementById('settingWhatsapp').value = settings.whatsapp || '');
  document.getElementById('settingFacebook') && (document.getElementById('settingFacebook').value = settings.facebook || '');
  document.getElementById('settingWelcome') && (document.getElementById('settingWelcome').value = settings.welcome_text || '');
  document.getElementById('settingCountdown') && (document.getElementById('settingCountdown').value = settings.countdown_date || '');
  document.getElementById('settingImgbb') && (document.getElementById('settingImgbb').value = settings.imgbb_key || '');
}

document.getElementById('settingsForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const updates = [
    ['whatsapp', document.getElementById('settingWhatsapp')?.value],
    ['facebook', document.getElementById('settingFacebook')?.value],
    ['welcome_text', document.getElementById('settingWelcome')?.value],
    ['countdown_date', document.getElementById('settingCountdown')?.value],
    ['imgbb_key', document.getElementById('settingImgbb')?.value],
  ];
  try {
    await Promise.all(updates.map(([k, v]) => updateSetting(k, v)));
    showToast('تم حفظ الإعدادات بنجاح', 'success');
  } catch { showToast('حدث خطأ أثناء الحفظ', 'danger'); }
});

// ─── MODAL CLOSE ─────────────────────────────────────────────
document.querySelectorAll('.btn-close-modal').forEach(btn => {
  btn.addEventListener('click', () => btn.closest('.modal-overlay')?.classList.remove('open'));
});
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
});

// ─── INIT ───────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const d = document.createElement('div');
  d.className = `toast ${type}`;
  d.textContent = msg;
  c.appendChild(d);
  setTimeout(() => { d.style.opacity = '0'; setTimeout(() => d.remove(), 400); }, 3000);
}
