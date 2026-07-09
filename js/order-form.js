        function syncOrderSummary() {
            let rows = '', total = 0;
            const price1lo = VARIANTS['1lo'].displayPrice + VARIANTS['1lo'].ship;

            if (cart.length) {
                cart.forEach(i => {
                    const lt = i.price * i.qty;
                    rows += `<div class="os-row"><span>${i.name} x${i.qty}</span><span>${lt.toLocaleString('vi-VN')}₫</span></div>`;
                    if (i.giftLabel) rows += `<div class="os-row" style="color:#00796b;font-weight:800"><span>${i.giftLabel}</span><span>Miễn phí</span></div>`;
                    if (i.ship > 0) rows += `<div class="os-row" style="color:#ff6d00;font-weight:800"><span>🚚 Phí vận chuyển</span><span>${i.ship.toLocaleString('vi-VN')}₫</span></div>`;
                    else rows += `<div class="os-row" style="color:#00c853;font-weight:800"><span>🚚 Vận chuyển</span><span>Miễn phí</span></div>`;
                    total += lt + (i.ship || 0);
                });
            } else {
                const v = getVariant(selectedVariantKey), lt = v.displayPrice * qty;
                rows += `<div class="os-row"><span>Xịt ve rận (${v.label}) x${qty}</span><span>${lt.toLocaleString('vi-VN')}₫</span></div>`;
                rows += `<div class="os-row" style="margin-top:2px"><span style="font-size:.82rem;color:#aaa;text-decoration:line-through">${v.oldPrice.toLocaleString('vi-VN')}₫</span><span style="background:linear-gradient(135deg,#ff2d55,#ff6b35);color:#fff;font-size:.72rem;font-weight:900;padding:3px 8px;border-radius:8px">-${Math.round((1-v.displayPrice/v.oldPrice)*100)}%</span></div>`;
                if (v.giftLabel) rows += `<div class="os-row" style="color:#00796b;font-weight:800"><span>${v.giftLabel}</span><span>Miễn phí</span></div>`;
                if (v.ship > 0) rows += `<div class="os-row" style="color:#ff6d00;font-weight:800"><span>🚚 Phí vận chuyển</span><span>${v.ship.toLocaleString('vi-VN')}₫</span></div>`;
                else rows += `<div class="os-row" style="color:#00c853;font-weight:800"><span>🚚 Vận chuyển</span><span>Miễn phí</span></div>`;
                total = lt + v.ship;

                // ✅ THÊM DÒNG TIẾT KIỆM (chỉ hiện khi mua 2 lọ hoặc 3 lọ)
                if (selectedVariantKey !== '1lo') {
                    const soLo = selectedVariantKey === '2lo' ? 2 : 3;
                    const neuMua1lo = price1lo * soLo; // nếu mua từng lọ riêng
                    const tietKiem = neuMua1lo - total;
                    if (tietKiem > 0) {
                        rows += `<div class="os-row" style="color:#e91e63;font-weight:800;background:#fff0f3;border-radius:6px;padding:4px 6px;margin-top:4px">
                    <span>🎉 Tiết kiệm so với mua lẻ</span>
                    <span>-${tietKiem.toLocaleString('vi-VN')}₫</span>
                </div>`;
                    }
                }
            }

            rows += `<div class="os-row total"><span>Tổng đơn hàng</span><span>${total.toLocaleString('vi-VN')}₫</span></div>`;
            document.getElementById('orderSummary').innerHTML = rows;
        }

        function selectOrderVariant(btn, key) {
            document.querySelectorAll('#orderVariantGroup .variant-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedVariantKey = key;
            const v = getVariant(key);
            syncInstantOffer(v);
            document.querySelectorAll('.variant-section .variant-btn').forEach(b => {
                b.classList.toggle('active', b.getAttribute('onclick') && b.getAttribute('onclick').includes("'" + key + "'"));
            });
            document.getElementById('selectedVariantLabel').textContent = variantLabel(v);
            document.getElementById('priceMain').textContent = money(v.displayPrice);
            document.getElementById('priceOld').textContent = money(v.oldPrice);
            document.getElementById('priceDiscount').textContent = '-' + Math.round((1 - v.displayPrice / v.oldPrice) * 100) + '%';
            document.getElementById('orderSelectedVariantLabel').textContent = variantLabel(v);
            syncOrderSummary();
        }

        function openOrder() {
            // Đẩy notif lên TRÊN để không che form đang nhập
            const bn = document.getElementById('buyer-notif');
            if (bn) bn.classList.add('in-popup');
            document.getElementById('orderForm').style.display = 'block';
            document.getElementById('successMsg').style.display = 'none';
            const vg = document.getElementById('orderVariantGroup');
            if (cart.length) { vg.style.display = 'none'; }
            else {
                vg.style.display = 'block';
                document.querySelectorAll('#orderVariantGroup .variant-btn').forEach(b => b.classList.remove('active'));
                const ab = document.getElementById('ovBtn' + selectedVariantKey);
                if (ab) ab.classList.add('active');
                const v = getVariant(selectedVariantKey);
                document.getElementById('orderSelectedVariantLabel').textContent = variantLabel(v);
            }
            syncOrderSummary();
            document.getElementById('orderOverlay').classList.add('open');
            document.getElementById('orderDrawer').classList.add('open');
        }
        function closeOrder() {
            document.getElementById('orderOverlay').classList.remove('open');
            document.getElementById('orderDrawer').classList.remove('open');
            const bn = document.getElementById('buyer-notif');
            if (bn) bn.classList.remove('in-popup'); // trả về vị trí dưới-trái
        }

        let isSubmitting = false;
        function submitOrder() {
            if (isSubmitting) return;
            isSubmitting = true;

            const btn = document.querySelector('button.btn-order');
            const overlay = document.getElementById('submitOverlay');
            const originalText = btn ? btn.textContent : '';
            if (btn) { btn.disabled = true; btn.textContent = '⏳ Đang gửi...'; btn.style.opacity = '0.7'; }

            function resetBtn() {
                isSubmitting = false;
                if (btn) { btn.disabled = false; btn.textContent = originalText; btn.style.opacity = ''; }
                if (overlay) overlay.style.display = 'none';
            }
            function showOverlay() {
                if (overlay) overlay.style.display = 'flex';
            }

            const name = document.getElementById('fname').value.trim();
            const phone = document.getElementById('fphone').value.trim();
            const detail = document.getElementById('faddress').value.trim();
            const provSel = document.getElementById('fProvince');
            const distSel = document.getElementById('fDistrict');
            const wardSel = document.getElementById('fWard');
            const provName = provSel.selectedOptions[0]?.dataset.name || '';
            const distName = distSel.selectedOptions[0]?.dataset.name || '';
            const wardName = wardSel.selectedOptions[0]?.dataset.name || '';
            const noteRaw = document.getElementById('fnote').value.trim();
            const note = noteRaw ? 'FB ' + noteRaw : 'FB';

            // ===== VALIDATION =====
            if (!name || name.length < 2) {
                alert('⚠️ Vui lòng nhập Họ và tên đầy đủ (ít nhất 2 ký tự)');
                document.getElementById('fname').focus(); resetBtn(); return;
            }
            if (/^\d+$/.test(name)) {
                alert('⚠️ Họ tên không hợp lệ — không được chỉ là số');
                document.getElementById('fname').focus(); resetBtn(); return;
            }

            if (!phone) {
                alert('⚠️ Vui lòng nhập Số điện thoại');
                document.getElementById('fphone').focus(); resetBtn(); return;
            }
            if (!/^0[235789]\d{8}$/.test(phone)) {
                alert('⚠️ Số điện thoại không hợp lệ!\n\nĐịnh dạng đúng: 10 chữ số, bắt đầu bằng 0\nVí dụ: 0901234567');
                document.getElementById('fphone').focus(); resetBtn(); return;
            }
            if (/^0(\d)\1{8}$/.test(phone) || phone === '0123456789' || phone === '0987654321') {
                alert('⚠️ Số điện thoại có vẻ không hợp lệ. Vui lòng nhập đúng số bạn dùng để shop liên hệ giao hàng.');
                document.getElementById('fphone').focus(); resetBtn(); return;
            }

            // Địa chỉ: bắt buộc chọn Tỉnh + Huyện + Xã. Số nhà/đường/thôn TUỲ CHỌN (cho khách ở quê)
            if (!provName) { alert('⚠️ Vui lòng chọn Tỉnh / Thành phố'); provSel.focus(); resetBtn(); return; }
            if (!distName) { alert('⚠️ Vui lòng chọn Quận / Huyện'); distSel.focus(); resetBtn(); return; }
            if (!wardName) { alert('⚠️ Vui lòng chọn Phường / Xã'); wardSel.focus(); resetBtn(); return; }

            // Gộp thành 1 chuỗi địa chỉ đầy đủ (detail có thì thêm, không có thì bỏ qua)
            const address = [detail, wardName, distName, provName].filter(Boolean).join(', ');

            let totalCustomer = 0, totalCod = 0, totalWeight = 0, sanPhamStr = '';
            if (cart.length) {
                cart.forEach(item => {
                    const lt = item.price * item.qty, ls = item.ship || 0;
                    totalCustomer += lt + ls; totalCod += (item.cod || 0) * item.qty;
                    if (item.key === '1lo') totalWeight += 0.3 * item.qty;
                    else if (item.key === '2lo') totalWeight += 0.6 * item.qty;
                    else if (item.key === '3lo') totalWeight += 0.9 * item.qty;
                    else totalWeight += 0.1 * item.qty;
                    sanPhamStr += item.name + ' x' + item.qty + (item.giftLabel ? ' ' + item.giftLabel : '') + ', ';
                });
            } else {
                const v = getVariant(selectedVariantKey), lt = v.displayPrice * qty;
                totalCustomer = lt + v.ship; totalCod = v.cod * qty;
                totalWeight = selectedVariantKey === '1lo' ? 0.3 : selectedVariantKey === '2lo' ? 0.6 : 0.9;
                sanPhamStr = 'Xịt ve rận bọ chét (' + v.label + ') x' + qty + (v.giftLabel ? ' ' + v.giftLabel : '');
            }
            sanPhamStr = sanPhamStr.replace(/,\s*$/, '');

            const now = new Date();
            const thoiGian = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':' + String(now.getSeconds()).padStart(2, '0') + ' ' + now.getDate() + '/' + (now.getMonth() + 1) + '/' + now.getFullYear();
            const orderCode = Math.floor(100000 + Math.random() * 900000);

            const nguon = getOrderSource();
            const payload = { thoiGian, hoTen: name, sdt: "'" + phone, diaChi: address, sanPham: sanPhamStr, gia: totalCustomer, canNang: totalWeight, cod: totalCod, phiShip: SHOP_SHIP_FEE, ghiChu: note, maDon: '#' + orderCode, nguon };
            showOverlay();
            // ===== SUBMIT TO WORKER =====
            fetch(ORDER_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(r => r.json().catch(() => ({})))
                .then(data => {
                    if (data && data.success) {
                        // Worker confirmed — proceed to thank-you page
                        cart = []; updateCartUI();
                        window.location.href = './cam-on.html?ma=' + encodeURIComponent(orderCode);
                    } else {
                        // Worker returned an error — show it
                        const msg = (data && data.error) ? data.error : 'Không thể gửi đơn hàng. Vui lòng thử lại sau.';
                        alert('⚠️ ' + msg);
                        resetBtn();
                    }
                })
                .catch(() => {
                    // Network error — fallback alert
                    alert('⚠️ Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.');
                    resetBtn();
                });
        }
