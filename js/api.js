// ============================================================
// api.js — Google Sheets / Apps Script communication
// ============================================================

// ⚠️ Replace with your deployed Google Apps Script Web App URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwRKAl3YawbE2jUszlW7VB1gu0sDDx0nGgwAAH6QkqqGzdgs6Zas79jPndLaE0Xqm6q/exec';

// ⚠️ Cloudinary config (unsigned upload preset)
const CLOUDINARY = {
  cloudName: 'YOUR_CLOUD_NAME',
  uploadPreset: 'sofia_products'
};

// ─── Generic helpers ────────────────────────────────────────
async function apiFetch(params = {}) {
  const url = new URL(SCRIPT_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPost(body = {}) {
  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── PRODUCTS ───────────────────────────────────────────────
export async function getProducts() {
  try {
    const data = await apiFetch({ action: 'getProducts' });
    return data.products || [];
  } catch (e) {
    console.warn('getProducts failed, using demo data', e);
    return getDemoProducts();
  }
}

export async function addProduct(product) {
  return apiPost({ action: 'addProduct', ...product });
}

export async function updateProduct(product) {
  return apiPost({ action: 'updateProduct', ...product });
}

export async function deleteProduct(id) {
  return apiPost({ action: 'deleteProduct', id });
}

// ─── BOXES ──────────────────────────────────────────────────
export async function getBoxes() {
  try {
    const data = await apiFetch({ action: 'getBoxes' });
    return data.boxes || [];
  } catch (e) {
    console.warn('getBoxes failed, using demo data', e);
    return getDemoBoxes();
  }
}

export async function addBox(box) {
  return apiPost({ action: 'addBox', ...box });
}

export async function updateBox(box) {
  return apiPost({ action: 'updateBox', ...box });
}

export async function deleteBox(id) {
  return apiPost({ action: 'deleteBox', id });
}

// ─── REVIEWS ────────────────────────────────────────────────
export async function getReviews() {
  try {
    const data = await apiFetch({ action: 'getReviews' });
    return data.reviews || [];
  } catch (e) {
    console.warn('getReviews failed, using demo data', e);
    return getDemoReviews();
  }
}

export async function addReview(review) {
  return apiPost({ action: 'addReview', ...review });
}

export async function approveReview(id) {
  return apiPost({ action: 'approveReview', id });
}

export async function deleteReview(id) {
  return apiPost({ action: 'deleteReview', id });
}

// ─── ORDERS ─────────────────────────────────────────────────
export async function getOrders() {
  try {
    const data = await apiFetch({ action: 'getOrders' });
    return data.orders || [];
  } catch (e) {
    console.warn('getOrders failed', e);
    return [];
  }
}

export async function addOrder(order) {
  return apiPost({ action: 'addOrder', ...order });
}

export async function updateOrderStatus(id, status) {
  return apiPost({ action: 'updateOrderStatus', id, status });
}

// ─── SETTINGS ───────────────────────────────────────────────
export async function getSettings() {
  try {
    const data = await apiFetch({ action: 'getSettings' });
    return data.settings || {};
  } catch (e) {
    return getDefaultSettings();
  }
}

export async function updateSetting(key, value) {
  return apiPost({ action: 'updateSetting', key, value });
}

// ─── IMGBB UPLOAD ───────────────────────────────────────────
export async function uploadImage(file, onProgress) {
  const settings = await getSettings();
  const apiKey = settings.imgbb_key;
  if (!apiKey) {
    throw new Error('يرجى إضافة مفتاح ImgBB في الإعدادات أولاً لتتمكن من رفع الصور');
  }

  const formData = new FormData();
  formData.append('image', file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.imgbb.com/1/upload?key=${apiKey}`);
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100));
      };
    }
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status === 200 && res.success) resolve(res.data.url);
        else reject(new Error(res.error?.message || 'Upload failed'));
      } catch (err) {
        reject(err);
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(formData);
  });
}

// ─── DEMO / FALLBACK DATA ───────────────────────────────────
export function getDemoProducts() {
  return [
    { id: '1', name: 'دفتر ملاحظات فاخر A5', price: '45', old_price: '60', category: 'ادوات_مكتبية', image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400', description: 'دفتر ملاحظات فاخر مجلد بغلاف ناعم وورق عالي الجودة، مثالي للكتابة اليومية.', available: 'true', featured: 'true' },
    { id: '2', name: 'أقلام ألوان 24 لون', price: '89', old_price: '', category: 'ادوات_مكتبية', image_url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400', description: 'طقم أقلام ألوان خشبية عالية الجودة، 24 لون زاهي.', available: 'true', featured: 'false' },
    { id: '3', name: 'باليت ظلال العيون', price: '120', old_price: '150', category: 'تجميل', image_url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400', description: 'باليت ظلال عيون بألوان دافئة مثالية للسهرات والمناسبات.', available: 'true', featured: 'true' },
    { id: '4', name: 'أحمر شفاه مات', price: '65', old_price: '', category: 'تجميل', image_url: 'https://images.unsplash.com/photo-1586495777744-4e6232bf2a3d?w=400', description: 'أحمر شفاه مات فاخر، ثبات طويل الأمد بألوان نابضة.', available: 'true', featured: 'false' },
    { id: '5', name: 'مفك براغي متعدد الاستخدامات', price: '75', old_price: '95', category: 'خردوات', image_url: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400', description: 'مجموعة مفكات براغي متعددة الأحجام عالية الجودة.', available: 'true', featured: 'false' },
    { id: '6', name: 'بوكس هدية عيد ميلاد', price: '180', old_price: '220', category: 'هدايا', image_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400', description: 'صندوق هدايا متكامل يحتوي على أدوات مكتبية وتجميل مميزة.', available: 'true', featured: 'true' },
    { id: '7', name: 'ورق ملصقات ملون', price: '30', old_price: '', category: 'ادوات_مكتبية', image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400', description: 'ورق ملصقات ملون لتزيين الدفاتر والمستلزمات.', available: 'true', featured: 'false' },
    { id: '8', name: 'كريم مرطب للوجه', price: '95', old_price: '130', category: 'تجميل', image_url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400', description: 'كريم مرطب خفيف للاستخدام اليومي، يمنح البشرة نضارة وترطيبًا.', available: 'true', featured: 'false' },
  ];
}

export function getDemoBoxes() {
  return [
    { id: '1', name: 'بوكس الدراسة المميز', price: '150', image_url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400', items: 'دفتر + أقلام + مسطرة + قلم رصاص', description: 'كل ما تحتاجيه للدراسة في صندوق واحد.' },
    { id: '2', name: 'بوكس الميكب الأساسي', price: '200', image_url: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400', items: 'ظلال + أحمر شفاه + مسكارا', description: 'الميكب الأساسي لكل يوم.' },
    { id: '3', name: 'بوكس هدية عيد ميلاد', price: '250', image_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400', items: 'أدوات مكتبية + تجميل + هدايا', description: 'هدية متكاملة لأي مناسبة.' },
  ];
}

export function getDemoReviews() {
  return [
    { id: '1', name: 'فاطمة أحمد', city: 'القاهرة', rating: '5', review: 'منتجات رائعة وتوصيل سريع جداً! سعيدة جداً بشرائي من مكتبة صوفي.', date: '2025-01-15', approved: 'true' },
    { id: '2', name: 'منى سعيد', city: 'الإسكندرية', rating: '5', review: 'جودة عالية وأسعار منافسة، هنطلب تاني بالتأكيد!', date: '2025-01-20', approved: 'true' },
    { id: '3', name: 'نور محمد', city: 'الجيزة', rating: '4', review: 'تجربة تسوق ممتازة، خدمة العملاء محترمة والمنتجات جميلة.', date: '2025-02-01', approved: 'true' },
  ];
}

export function getDefaultSettings() {
  return {
    whatsapp: '201026400415',
    facebook: 'https://www.facebook.com/share/1b4LhXfweC/',
    welcome_text: 'مرحباً بكم في مكتبة صوفي',
    countdown_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    store_name: 'مكتبة صوفي'
  };
}
