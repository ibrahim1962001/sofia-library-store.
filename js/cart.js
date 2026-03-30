// ============================================================
// cart.js — Shopping cart logic
// ============================================================

class Cart {
  constructor() {
    this.items = JSON.parse(localStorage.getItem('sofia_cart') || '[]');
    this.whatsappNumber = '201026400415';
    this.bindEvents();
    this.updateUI();
  }

  save() {
    localStorage.setItem('sofia_cart', JSON.stringify(this.items));
    this.updateUI();
  }

  add(product) {
    const existing = this.items.find(i => i.id === product.id);
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      this.items.push({ ...product, qty: 1 });
    }
    this.save();
    this.showAddedToast(product.name);
  }

  remove(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.save();
    this.renderItems();
  }

  changeQty(id, delta) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;
    item.qty = (item.qty || 1) + delta;
    if (item.qty <= 0) {
      this.remove(id);
    } else {
      this.save();
      this.renderItems();
    }
  }

  clear() {
    this.items = [];
    this.save();
    this.renderItems();
  }

  getTotal() {
    return this.items.reduce((sum, i) => sum + parseFloat(i.price) * (i.qty || 1), 0);
  }

  getTotalCount() {
    return this.items.reduce((sum, i) => sum + (i.qty || 1), 0);
  }

  updateUI() {
    const count = this.getTotalCount();
    const badge = document.getElementById('cartCount');
    if (badge) {
      badge.textContent = count;
      badge.classList.toggle('show', count > 0);
    }
    this.renderItems();
    if (typeof window.updateProductCartButtons === 'function') {
      window.updateProductCartButtons();
    }
  }

  renderItems() {
    const container = document.getElementById('cartItems');
    const emptyMsg = document.getElementById('cartEmpty');
    const totalEl = document.getElementById('cartTotal');
    if (!container) return;

    if (this.items.length === 0) {
      container.innerHTML = '';
      if (emptyMsg) emptyMsg.style.display = 'block';
      if (totalEl) totalEl.textContent = '0 جنيه';
      return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';
    container.innerHTML = this.items.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <img src="${item.image_url || 'https://via.placeholder.com/64x64'}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/64x64'">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${parseFloat(item.price) * (item.qty || 1)} جنيه</div>
          <div class="cart-qty">
            <button class="qty-btn" onclick="window.cart.changeQty('${item.id}', -1)">−</button>
            <span class="qty-val">${item.qty || 1}</span>
            <button class="qty-btn" onclick="window.cart.changeQty('${item.id}', 1)">+</button>
            <button class="btn-remove-item" onclick="window.cart.remove('${item.id}')">🗑</button>
          </div>
        </div>
      </div>
    `).join('');

    if (totalEl) totalEl.textContent = `${this.getTotal()} جنيه`;
  }

  buildWhatsAppMessage() {
    const lines = ['🛒 *طلب جديد من مكتبة صوفي*\n'];
    this.items.forEach((item, i) => {
      lines.push(`${i + 1}. ${item.name} × ${item.qty || 1} = ${parseFloat(item.price) * (item.qty || 1)} جنيه`);
    });
    lines.push(`\n💰 *الإجمالي: ${this.getTotal()} جنيه*`);
    lines.push(`\nيرجى إرسال بيانات التوصيل 📦`);
    return encodeURIComponent(lines.join('\n'));
  }

  sendViaWhatsApp() {
    if (this.items.length === 0) return;
    const msg = this.buildWhatsAppMessage();
    window.open(`https://wa.me/${this.whatsappNumber}?text=${msg}`, '_blank');
  }

  showAddedToast(name) {
    if (typeof window.showToast === 'function') {
      window.showToast(`✅ تمت إضافة "${name}" للسلة`);
    }
  }

  bindEvents() {
    // Cart open/close
    const openBtn = document.getElementById('cartBtn');
    const closeBtn = document.getElementById('closeCart');
    const overlay = document.getElementById('cartOverlay');
    const drawer = document.getElementById('cartDrawer');
    const sendBtn = document.getElementById('sendCartBtn');

    if (openBtn) openBtn.addEventListener('click', () => this.open());
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());
    if (overlay) overlay.addEventListener('click', () => this.close());
    if (sendBtn) sendBtn.addEventListener('click', () => this.sendViaWhatsApp());
  }

  open() {
    document.getElementById('cartOverlay')?.classList.add('open');
    document.getElementById('cartDrawer')?.classList.add('open');
  }

  close() {
    document.getElementById('cartOverlay')?.classList.remove('open');
    document.getElementById('cartDrawer')?.classList.remove('open');
  }
}

window.cart = new Cart();
export default window.cart;
