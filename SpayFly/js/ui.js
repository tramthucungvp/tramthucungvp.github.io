function addRelated(name, price, img) {
    const ex = cart.find(x => x.name === name);
    if (ex) ex.qty++;
    else cart.push({ name, price, ship: 0, cod: Math.round(price * .4), giftLabel: '', key: '', qty: 1, img: img || '' });
    updateCartUI(); openCart();
}

function updateCartUI() {
    const count = cart.reduce((s, i) => s + i.qty, 0);
    document.getElementById('cartCount').textContent = count;
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const itemsEl = document.getElementById('cartItems');
    const footer = document.getElementById('cartFooter');
    if (!cart.length) { itemsEl.innerHTML = '<div class="empty-cart">🛍️ Giỏ hàng trống</div>'; footer.style.display = 'none'; return; }
    footer.style.display = 'block';
    document.getElementById('cartTotal').textContent = total.toLocaleString('vi-VN') + '₫';
    itemsEl.innerHTML = cart.map((item, idx) => `
        <div class="cart-item">
            <img src="${item.img}" onerror="this.src='https://placehold.co/64x64/f9f9f9/ccc?text=SP'" alt="">
            <div class="ci-info">
                <div class="ci-name">${item.name}</div>
                <div class="ci-price">${item.price.toLocaleString('vi-VN')}₫</div>
                <div class="ci-qty">
                    <button class="qty-btn" onclick="cartQty(${idx},-1)">−</button>
                    <span class="qty-num">${item.qty}</span>
                    <button class="qty-btn" onclick="cartQty(${idx},1)">+</button>
                </div>
            </div>
        </div>`).join('');
}

function cartQty(idx, d) { cart[idx].qty += d; if (cart[idx].qty <= 0) cart.splice(idx, 1); updateCartUI(); }

function openCart() { document.getElementById('cartOverlay').classList.add('open'); document.getElementById('cartDrawer').style.display = 'block'; }
function closeCart() { document.getElementById('cartOverlay').classList.remove('open'); document.getElementById('cartDrawer').style.display = 'none'; }

// Flash Sale countdown
(function () {
    let remaining = 25 * 60;
    const minEl = document.getElementById('cdMin'),
        secEl = document.getElementById('cdSec'),
        ofbMinEl = document.getElementById('ofbMin'),
        ofbSecEl = document.getElementById('ofbSec'),
        bbcMinEl = document.getElementById('bbcMin'),
        bbcSecEl = document.getElementById('bbcSec'),
        bbcBox = document.getElementById('btnBuyCd'),
        buyBtn = document.querySelector('.btn-buy'),
        ofbBar = document.getElementById('orderFlashBar'),
        banner = document.getElementById('flashSaleBanner');
    function tick() {
        if (remaining <= 0) {
            banner.innerHTML = '<div class="flash-expired">⏰ Flash Sale đã kết thúc</div>';
            banner.style.cssText = 'background:none;box-shadow:none;animation:none;padding:0';
            if (ofbBar) {
                ofbBar.classList.add('expired');
                ofbBar.querySelector('.ofb-title').textContent = '⏰ Flash Sale đã kết thúc';
                ofbBar.querySelector('.ofb-sub').textContent = 'Bạn vẫn có thể đặt hàng nhưng giá sẽ trở về niêm yết.';
                ofbMinEl.textContent = '00'; ofbSecEl.textContent = '00';
            }
            if (buyBtn) buyBtn.classList.add('expired');
            return;
        }
        const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
        const ss = String(remaining % 60).padStart(2, '0');
        minEl.textContent = mm; secEl.textContent = ss;
        if (ofbMinEl) ofbMinEl.textContent = mm;
        if (ofbSecEl) ofbSecEl.textContent = ss;
        if (bbcMinEl) bbcMinEl.textContent = mm;
        if (bbcSecEl) bbcSecEl.textContent = ss;
        if (remaining <= 60) document.querySelectorAll('.cd-block').forEach(b => b.style.background = 'rgba(255,255,255,.35)');
        remaining--;
    }
    tick(); setInterval(tick, 1000);
})();

// Review dates
const fd = (d => String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear())(new Date());
['rc-date', 'rc-date1', 'rc-date2', 'rc-date3', 'rc-date4'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = fd; });

// Fake buyer notification
(function () {
    const names = ['Nguyễn Thị Lan', 'Trần Minh Hải', 'Lê Thu Hương', 'Phạm Văn Đức', 'Hoàng Thị Mai', 'Vũ Quang Huy', 'Đặng Thị Nga', 'Bùi Minh Tuấn', 'Đỗ Thị Linh', 'Ngô Văn Khoa', 'Trịnh Thị Hồng', 'Lý Minh Khôi', 'Phan Thị Bích', 'Cao Văn Thắng', 'Mai Thị Yến', 'Đinh Quốc Bảo'];
    const products = ['Xịt ve rận 1 Lọ', 'Xịt ve rận 2 Lọ 🎁', 'Xịt ve rận 3 Lọ 🎁'];
    const cities = ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Huế', 'Nha Trang', 'Biên Hoà', 'Vũng Tàu', 'Long Xuyên', 'Buôn Ma Thuột', 'Quy Nhơn', 'Thái Nguyên', 'Bắc Ninh', 'Bình Dương'];
    const emojis = ['🐾', '🐱', '😸', '🐶', '🐕', '😺', '🐈', '🐩'];
    const times = ['15 giây trước', '20 giây trước', '30 giây trước', '45 giây trước', '1 phút trước'];
    const notif = document.getElementById('buyer-notif');
    let t;
    function show() {
        if (document.getElementById('cartDrawer').style.display === 'block') return;
        document.getElementById('bn-name').textContent = names[Math.floor(Math.random() * names.length)];
        document.getElementById('bn-product').textContent = products[Math.floor(Math.random() * products.length)];
        document.getElementById('bn-time').textContent = times[Math.floor(Math.random() * times.length)] + ' · ' + cities[Math.floor(Math.random() * cities.length)];
        document.getElementById('bn-avatar').textContent = emojis[Math.floor(Math.random() * emojis.length)];
        notif.classList.add('show');
        clearTimeout(t); t = setTimeout(() => notif.classList.remove('show'), 4500);
    }
    setTimeout(() => { show(); setInterval(show, 15000); }, 4000);
})();
