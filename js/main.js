// ============================================================
// main.js — Client page logic
// ============================================================
import { getProducts, getBoxes, getReviews, addReview, addOrder, getSettings, getDemoProducts, getDemoBoxes, getDemoReviews, getDefaultSettings } from './api.js';

// ─── State ──────────────────────────────────────────────────
let allProducts = [];
let allBoxes = [];
let allReviews = [];
let settings = {};
let activeCategory = 'all';
let searchQuery = '';
let visibleCount = 8;
const WHATSAPP = '201026400415';

// ─── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initCountdown();
  initFAQ();
  initStarPicker();
  initModals();

  // Load data
  [allProducts, allBoxes, allReviews, settings] = await Promise.all([
    getProducts(), getBoxes(), getReviews(), getSettings()
  ]);

  renderCategories();
  renderProducts();
  renderBoxes();
  renderReviews();
  applySettings();

  initFakePurchaseNotifications();
  initAbandonedCartReminder();
});

// ─── NAVBAR ─────────────────────────────────────────────────
function initNavbar() {
  // Mobile menu toggle
  document.getElementById('hamburger')?.addEventListener('click', () => {
    document.getElementById('mobileMenu')?.classList.toggle('open');
  });
  
  // Close mobile menu on clicking a link
  document.querySelectorAll('#mobileMenu a').forEach(link => {
    link.addEventListener('click', () => {
      document.getElementById('mobileMenu')?.classList.remove('open');
    });
  });

  // Search toggle
  document.getElementById('searchBtn')?.addEventListener('click', () => {
    document.getElementById('searchBar')?.classList.toggle('open');
    document.getElementById('navSearchInput')?.focus();
  });

  // Navbar search
  document.getElementById('navSearchInput')?.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    visibleCount = 8;
    renderProducts();
    document.getElementById('productsSection')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Product search in section  
  document.getElementById('productSearchInput')?.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    visibleCount = 8;
    renderProducts();
  });

  // Hamburger
  const ham = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  ham?.addEventListener('click', () => mobileMenu?.classList.toggle('open'));
  mobileMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileMenu?.classList.remove('open')));
}

// ─── COUNTDOWN ───────────────────────────────────────────────
function initCountdown() {
  const target = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000);
  function tick() {
    const diff = target - Date.now();
    if (diff <= 0) return;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const pad = n => String(n).padStart(2, '0');
    document.getElementById('cdDays') && (document.getElementById('cdDays').textContent = pad(d));
    document.getElementById('cdHours') && (document.getElementById('cdHours').textContent = pad(h));
    document.getElementById('cdMins') && (document.getElementById('cdMins').textContent = pad(m));
    document.getElementById('cdSecs') && (document.getElementById('cdSecs').textContent = pad(s));
  }
  tick();
  setInterval(tick, 1000);
}

// ─── CATEGORIES ──────────────────────────────────────────────
const CATEGORIES = [
  { id: 'ادوات_مكتبية', emoji: '✏️', name: 'الأدوات المكتبية' },
  { id: 'تجميل', emoji: '💄', name: 'مستحضرات التجميل' },
  { id: 'خردوات', emoji: '🔧', name: 'الخردوات' },
  { id: 'هدايا', emoji: '🎁', name: 'الهدايا واللعب' },
  { id: 'عروض', emoji: '🔥', name: 'العروض والجديد' },
];

function renderCategories() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;
  grid.innerHTML = CATEGORIES.map(cat => {
    const count = allProducts.filter(p => p.category === cat.id).length;
    return `
      <div class="cat-card ${activeCategory === cat.id ? 'active' : ''}" onclick="filterCategory('${cat.id}')">
        <div class="cat-emoji">${cat.emoji}</div>
        <div class="cat-name">${cat.name}</div>
        <div class="cat-count">${count} منتج</div>
      </div>
    `;
  }).join('');
}

window.filterCategory = function(catId) {
  activeCategory = catId;
  searchQuery = '';
  visibleCount = 8;
  document.getElementById('productSearchInput') && (document.getElementById('productSearchInput').value = '');
  document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.filter-btn').forEach(b => { b.classList.toggle('active', b.dataset.cat === catId); });
  event.currentTarget?.classList.add('active');
  renderProducts();
  document.getElementById('productsSection')?.scrollIntoView({ behavior: 'smooth' });
};

// ─── PRODUCTS ────────────────────────────────────────────────
function getFilteredProducts() {
  return allProducts.filter(p => {
    if (p.available === 'false') return false;
    if (activeCategory !== 'all' && p.category !== activeCategory) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery) && !p.category.toLowerCase().includes(searchQuery)) return false;
    return true;
  });
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  const filtered = getFilteredProducts();
  const visible = filtered.slice(0, visibleCount);
  const showMoreBtn = document.getElementById('showMoreBtn');

  if (!grid) return;

  if (visible.length === 0) {
    grid.innerHTML = '<div class="loading-spinner" style="animation:none">لا توجد منتجات في هذا القسم</div>';
    if (showMoreBtn) showMoreBtn.style.display = 'none';
    return;
  }

  grid.innerHTML = visible.map(p => renderProductCard(p)).join('');

  if (showMoreBtn) {
    showMoreBtn.style.display = filtered.length > visibleCount ? 'inline-flex' : 'none';
  }

  // Update filter bar counts
  document.querySelectorAll('.filter-btn').forEach(b => {
    const cat = b.dataset.cat;
    if (cat === 'all') return;
    const count = allProducts.filter(p => p.category === cat && p.available !== 'false').length;
    b.textContent = `${CATEGORIES.find(c => c.id === cat)?.name || cat} (${count})`;
  });
}

function renderProductCard(p) {
  const hasDiscount = p.old_price && parseFloat(p.old_price) > parseFloat(p.price);
  const discountPct = hasDiscount ? Math.round((1 - parseFloat(p.price) / parseFloat(p.old_price)) * 100) : 0;
  const catName = CATEGORIES.find(c => c.id === p.category)?.name || p.category;
  const img = p.image_url || 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400';
  
  const cartItem = window.cart ? window.cart.items.find(i => i.id === p.id) : null;
  const qty = cartItem ? cartItem.qty : 0;
  let cartBtnHtml = `<button class="btn-cart" title="أضف للسلة" onclick="addToCart('${p.id}')">🛒</button>`;
  
  if (qty > 0) {
    cartBtnHtml = `
      <div class="qty-controls" style="display:flex;align-items:center;background:var(--primary);color:#fff;border-radius:6px;overflow:hidden;flex:0 0 auto;height:40px">
        <button onclick="window.cart.changeQty('${p.id}', -1)" style="background:none;border:none;color:#fff;padding:0 12px;cursor:pointer;font-size:1.1rem;height:100%">−</button>
        <span style="padding:0 4px;font-weight:bold;min-width:20px;text-align:center">${qty}</span>
        <button onclick="window.cart.changeQty('${p.id}', 1)" style="background:none;border:none;color:#fff;padding:0 12px;cursor:pointer;font-size:1.1rem;height:100%">+</button>
      </div>
    `;
  }

  return `
    <div class="product-card" data-id="${p.id}">
      <div class="product-img-wrap">
        <img src="${img}" alt="${p.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/240x220'">
        ${hasDiscount ? `<div class="product-badge">خصم ${discountPct}%</div>` : ''}
        ${p.featured === 'true' ? '<div class="product-badge new-badge" style="top:42px">مميز ⭐</div>' : ''}
        <div class="product-actions-top">
          <button class="btn-action-top" title="عرض التفاصيل" onclick="openProductModal('${p.id}')">👁</button>
          <button class="btn-action-top" title="مشاركة" onclick="shareProduct('${p.id}')">🔗</button>
        </div>
      </div>
      <div class="product-info">
        <div class="product-cat">${catName}</div>
        <div class="product-name">${p.name}</div>
        <div class="product-price">
          <span class="price-new">${p.price} جنيه</span>
          ${hasDiscount ? `<span class="price-old">${p.old_price} جنيه</span>` : ''}
        </div>
        <div class="product-btns">
          <button class="btn-order" onclick="openOrderModal('${p.id}')">📲 اطلبي الآن</button>
          ${cartBtnHtml}
        </div>
      </div>
    </div>
  `;
}

window.updateProductCartButtons = function() {
  document.querySelectorAll('.product-card').forEach(card => {
    const id = card.dataset.id;
    const item = window.cart ? window.cart.items.find(i => i.id === id) : null;
    const qty = item ? item.qty : 0;
    const btnsContainer = card.querySelector('.product-btns');
    if (!btnsContainer) return;
    
    let cartBtnHtml = `<button class="btn-cart" title="أضف للسلة" onclick="addToCart('${id}')">🛒</button>`;
    if (qty > 0) {
      cartBtnHtml = `
        <div class="qty-controls" style="display:flex;align-items:center;background:var(--primary);color:#fff;border-radius:6px;overflow:hidden;flex:0 0 auto;height:40px">
          <button onclick="window.cart.changeQty('${id}', -1)" style="background:none;border:none;color:#fff;padding:0 12px;cursor:pointer;font-size:1.1rem;height:100%">−</button>
          <span style="padding:0 4px;font-weight:bold;min-width:20px;text-align:center">${qty}</span>
          <button onclick="window.cart.changeQty('${id}', 1)" style="background:none;border:none;color:#fff;padding:0 12px;cursor:pointer;font-size:1.1rem;height:100%">+</button>
        </div>
      `;
    }
    
    btnsContainer.innerHTML = `<button class="btn-order" onclick="openOrderModal('${id}')">📲 اطلبي الآن</button>\n          ${cartBtnHtml}`;
  });
};

window.addToCart = function(id) {
  const p = allProducts.find(p => p.id === id);
  if (p && window.cart) window.cart.add(p);
};

document.getElementById('showMoreBtn')?.addEventListener('click', () => {
  visibleCount += 8;
  renderProducts();
});

// Filter bar click
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    activeCategory = btn.dataset.cat || 'all';
    searchQuery = '';
    visibleCount = 8;
    document.getElementById('productSearchInput') && (document.getElementById('productSearchInput').value = '');
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProducts();
  });
});

// ─── BOXES ───────────────────────────────────────────────────
function renderBoxes() {
  const grid = document.getElementById('boxesGrid');
  if (!grid) return;
  if (!allBoxes.length) { grid.innerHTML = '<div style="text-align:center;color:var(--text-muted)">لا توجد بوكسات متاحة حالياً</div>'; return; }
  grid.innerHTML = allBoxes.map(b => `
    <div class="box-card">
      <div class="box-img"><img src="${b.image_url || 'https://via.placeholder.com/260x200'}" alt="${b.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/260x200'"></div>
      <div class="box-info">
        <div class="box-name">${b.name}</div>
        <div class="box-items">📦 ${b.items}</div>
        <div class="box-price">${b.price} جنيه</div>
        <button class="btn-order" onclick="openOrderModalBox('${b.id}')">📲 اطلبي هذا البوكس</button>
      </div>
    </div>
  `).join('');
}

// ─── REVIEWS ─────────────────────────────────────────────────
function renderReviews() {
  const grid = document.getElementById('reviewsGrid');
  if (!grid) return;
  const approved = allReviews.filter(r => r.approved === 'true' || r.approved === true);
  if (!approved.length) { grid.innerHTML = '<div style="text-align:center;color:var(--text-muted)">لا توجد آراء بعد</div>'; return; }
  grid.innerHTML = approved.map(r => `
    <div class="review-card">
      <div class="review-header">
        <div class="review-avatar">${r.name?.charAt(0) || '؟'}</div>
        <div><div class="review-name">${r.name}</div><div class="review-city">📍 ${r.city}</div></div>
      </div>
      <div class="stars">${'★'.repeat(parseInt(r.rating) || 5)}${'☆'.repeat(5 - (parseInt(r.rating) || 5))}</div>
      <div class="review-text">${r.review}</div>
    </div>
  `).join('');
}

// Review form
document.getElementById('reviewForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const rating = document.querySelector('.star-picker input:checked')?.value || 5;
  const review = {
    name: form.rName.value.trim(),
    city: form.rCity.value.trim(),
    rating,
    review: form.rText.value.trim(),
    date: new Date().toISOString().split('T')[0]
  };
  if (!review.name || !review.review) return;
  const btn = form.querySelector('button[type=submit]');
  btn.disabled = true; btn.textContent = 'جاري الإرسال...';
  try {
    await addReview(review);
    showToast('✅ شكراً! سيتم مراجعة رأيك ونشره قريباً');
    form.reset();
  } catch {
    showToast('⚠️ حدث خطأ، حاولي مرة أخرى', 'warning');
  }
  btn.disabled = false; btn.textContent = 'إرسال الرأي';
});

// ─── SETTINGS ────────────────────────────────────────────────
function applySettings() {
  document.querySelectorAll('.wa-link').forEach(el => el.setAttribute('href', `https://wa.me/${settings.whatsapp || WHATSAPP}`));
  document.querySelectorAll('.fb-link').forEach(el => el.setAttribute('href', 'https://www.facebook.com/share/17AAMmaY7c/'));
}

// ─── MODALS ──────────────────────────────────────────────────
function initModals() {
  // Close on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  });
  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.modal-overlay').classList.remove('open'));
  });
}

window.openProductModal = function(id) {
  const p = allProducts.find(p => p.id === id);
  if (!p) return;
  document.getElementById('modalProductImg').src = p.image_url || 'https://via.placeholder.com/500x280';
  document.getElementById('modalProductName').textContent = p.name;
  document.getElementById('modalProductPrice').textContent = `${p.price} جنيه`;
  document.getElementById('modalProductDesc').textContent = p.description || 'منتج مميز من مكتبة صوفي';
  document.getElementById('modalOrderBtn').onclick = () => { closeModal('productModal'); openOrderModal(id); };
  document.getElementById('modalShareBtn').onclick = () => shareProduct(id);
  document.getElementById('productModal').classList.add('open');
};

window.openOrderModal = function(id) {
  const p = allProducts.find(p => p.id === id);
  if (!p) return;
  document.getElementById('orderProductName').textContent = p.name;
  document.getElementById('orderProductPrice').textContent = `السعر: ${p.price} جنيه`;
  document.getElementById('orderCurrentId').value = id;
  document.getElementById('orderModal').classList.add('open');
};

window.openOrderModalBox = function(id) {
  const b = allBoxes.find(b => b.id === id);
  if (!b) return;
  document.getElementById('orderProductName').textContent = b.name;
  document.getElementById('orderProductPrice').textContent = `السعر: ${b.price} جنيه`;
  document.getElementById('orderCurrentId').value = 'box_' + id;
  document.getElementById('orderModal').classList.add('open');
};

function closeModal(id) {
  document.getElementById(id)?.classList.remove('open');
}

// Order form submit
document.getElementById('orderForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const id = form.orderCurrentId?.value;
  const isBox = id?.startsWith('box_');
  const item = isBox ? allBoxes.find(b => b.id === id.replace('box_', '')) : allProducts.find(p => p.id === id);
  if (!item) return;

  const name = form.oName.value.trim();
  const phone = form.oPhone.value.trim();
  const qty = form.oQty.value;
  const address = form.oAddress.value.trim();
  const notes = form.oNotes.value.trim();

  // Log order to sheet
  try {
    await addOrder({ name, phone, qty, address, notes, product: item.name, price: item.price, date: new Date().toISOString() });
  } catch {}

  const msg = `🛍️ *طلب جديد - مكتبة صوفي*

👤 *الاسم:* ${name}
📱 *التليفون:* ${phone}
📦 *المنتج:* ${item.name}
🔢 *الكمية:* ${qty}
💰 *السعر:* ${parseFloat(item.price) * parseInt(qty)} جنيه
🏠 *العنوان:* ${address}
${notes ? `📝 *ملاحظات:* ${notes}` : ''}`;

  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
  closeModal('orderModal');
  e.target.reset();
});

// ─── CUSTOM BOX MODAL ────────────────────────────────────────
window.openCustomBoxModal = function() {
  const grid = document.getElementById('customBoxGrid');
  if (!grid) return;
  const availableProducts = allProducts.filter(p => p.available !== 'false').slice(0, 12);
  grid.innerHTML = availableProducts.map(p => `
    <div class="custom-box-item" data-id="${p.id}" data-price="${p.price}" data-name="${p.name}" onclick="toggleCustomItem(this)">
      <img src="${p.image_url || 'https://via.placeholder.com/70'}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/70'">
      <div class="p-name">${p.name}</div>
      <div class="p-price">${p.price} جنيه</div>
    </div>
  `).join('');
  updateCustomBoxSummary();
  document.getElementById('customBoxModal').classList.add('open');
};

window.toggleCustomItem = function(el) {
  el.classList.toggle('selected');
  updateCustomBoxSummary();
};

function updateCustomBoxSummary() {
  const selected = document.querySelectorAll('.custom-box-item.selected');
  const total = Array.from(selected).reduce((sum, el) => sum + parseFloat(el.dataset.price || 0), 0);
  const countEl = document.getElementById('customBoxCount');
  const totalEl = document.getElementById('customBoxTotal');
  if (countEl) countEl.textContent = selected.length;
  if (totalEl) totalEl.textContent = `${total} جنيه`;
}

document.getElementById('sendCustomBox')?.addEventListener('click', () => {
  const selected = document.querySelectorAll('.custom-box-item.selected');
  if (!selected.length) { showToast('⚠️ اختاري منتجاً على الأقل', 'warning'); return; }
  const items = Array.from(selected).map(el => el.dataset.name).join(' + ');
  const total = Array.from(selected).reduce((sum, el) => sum + parseFloat(el.dataset.price || 0), 0);
  const msg = `🎁 *طلب بوكس هدية مخصص - مكتبة صوفي*

المنتجات المختارة:
${items}

💰 الإجمالي المتوقع: ${total} جنيه`;
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
  closeModal('customBoxModal');
});

// ─── FAQ ─────────────────────────────────────────────────────
function initFAQ() {
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const isOpen = btn.classList.contains('open');
      document.querySelectorAll('.faq-q').forEach(b => { b.classList.remove('open'); b.nextElementSibling?.classList.remove('open'); });
      if (!isOpen) { btn.classList.add('open'); btn.nextElementSibling?.classList.add('open'); }
    });
  });
}

// ─── STAR PICKER ─────────────────────────────────────────────
function initStarPicker() {
  document.querySelectorAll('.star-picker label').forEach(label => {
    label.addEventListener('mouseover', () => {
      const val = parseInt(label.getAttribute('for').replace('star', ''));
      document.querySelectorAll('.star-picker label').forEach((l, i) => {
        l.style.color = (5 - i) <= val ? 'var(--secondary)' : 'var(--text-muted)';
      });
    });
  });
}

// ─── SHARE ───────────────────────────────────────────────────
window.shareProduct = function(id) {
  const p = allProducts.find(p => p.id === id);
  if (!p) return;
  const text = `تسوقي من مكتبة صوفي 🛍️\n${p.name} بسعر ${p.price} جنيه فقط!\nتواصلي معنا على واتساب 👇`;
  if (navigator.share) {
    navigator.share({ title: p.name, text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => showToast('✅ تم نسخ رابط المشاركة'));
  }
};

// ─── TOAST ───────────────────────────────────────────────────
window.showToast = function(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const div = document.createElement('div');
  div.className = `toast ${type}`;
  div.innerHTML = `<span>${message}</span>`;
  container.appendChild(div);
  setTimeout(() => {
    div.style.animation = 'slideOutToast 0.3s ease forwards';
    setTimeout(() => div.remove(), 300);
  }, 3000);
};

// ─── FAKE PURCHASE NOTIFICATIONS ─────────────────────────────
function initFakePurchaseNotifications() {
  const names = ['فاطمة', 'منى', 'نور', 'سارة', 'رنا', 'هدى', 'لمياء', 'دينا'];
  const cities = ['القاهرة', 'الإسكندرية', 'الجيزة', 'المنصورة', 'طنطا', 'أسيوط'];
  const el = document.getElementById('fakePurchase');
  if (!el) return;

  function show() {
    if (!allProducts.length) return;
    const p = allProducts[Math.floor(Math.random() * allProducts.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    el.innerHTML = `🛍️ <strong>${name} من ${city}</strong> اشترت "${p.name}" للتو!`;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 4000);
  }

  setTimeout(show, 8000);
  setInterval(show, 20000);
}

// ─── ABANDONED CART REMINDER ─────────────────────────────────
function initAbandonedCartReminder() {
  if (localStorage.getItem('sofia_reminder_shown')) return;
  setTimeout(() => {
    const reminder = document.getElementById('cartReminder');
    if (!reminder) return;
    reminder.classList.add('show');
    localStorage.setItem('sofia_reminder_shown', '1');
  }, 30000);

  document.getElementById('reminderCheckout')?.addEventListener('click', () => {
    document.getElementById('cartReminder')?.classList.remove('show');
    window.cart?.open();
  });
  document.getElementById('reminderClose')?.addEventListener('click', () => {
    document.getElementById('cartReminder')?.classList.remove('show');
  });
}
