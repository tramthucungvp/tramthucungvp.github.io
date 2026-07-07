        // Cascading address dropdown — Tỉnh → Huyện → Xã (provinces.open-api.vn, miễn phí)
        (function () {
            const provSel = document.getElementById('fProvince');
            const distSel = document.getElementById('fDistrict');
            const wardSel = document.getElementById('fWard');
            if (!provSel) return;
            const API = 'https://provinces.open-api.vn/api';

            // Rút gọn tên tỉnh/huyện/xã để fit khung hẹp
            function shorten(name) {
                return String(name)
                    .replace(/^Thành phố /i, 'TP. ')
                    .replace(/^Tỉnh /i, '')
                    .replace(/^Quận /i, 'Q. ')
                    .replace(/^Huyện /i, 'H. ')
                    .replace(/^Thị xã /i, 'TX. ')
                    .replace(/^Thành phố /i, 'TP. ')
                    .replace(/^Phường /i, 'P. ')
                    .replace(/^Xã /i, '')
                    .replace(/^Thị trấn /i, 'TT. ');
            }
            // Bỏ tiền tố để sort theo tên gốc (Hà Nội xếp dưới H, không phải T)
            function sortKey(name) {
                return String(name)
                    .replace(/^(Thành phố|Tỉnh|Quận|Huyện|Thị xã|Phường|Xã|Thị trấn)\s+/i, '');
            }

            function fillSelect(sel, items, placeholder) {
                // Sort theo bảng chữ cái Tiếng Việt
                const sorted = [...items].sort((a, b) =>
                    sortKey(a.name).localeCompare(sortKey(b.name), 'vi'));
                sel.innerHTML = `<option value="">${placeholder}</option>` +
                    sorted.map(it => `<option value="${it.code}" data-name="${it.name.replace(/"/g, '&quot;')}">${shorten(it.name)}</option>`).join('');
            }

            async function loadProvinces() {
                try {
                    const res = await fetch(`${API}/p/`);
                    const data = await res.json();
                    fillSelect(provSel, data, 'Tỉnh/TP');
                } catch (e) {
                    console.error('Load provinces failed', e);
                    provSel.innerHTML = '<option value="">⚠️ Lỗi tải</option>';
                }
            }

            provSel.addEventListener('change', async () => {
                distSel.innerHTML = '<option value="">— Đang tải —</option>';
                distSel.disabled = true;
                wardSel.innerHTML = '<option value="">— Chọn Phường/Xã —</option>';
                wardSel.disabled = true;
                if (!provSel.value) { distSel.innerHTML = '<option value="">Quận/Huyện</option>'; return; }
                try {
                    const res = await fetch(`${API}/p/${provSel.value}?depth=2`);
                    const data = await res.json();
                    fillSelect(distSel, data.districts || [], 'Quận/Huyện');
                    distSel.disabled = false;
                } catch (e) {
                    distSel.innerHTML = '<option value="">⚠️ Lỗi tải</option>';
                }
            });

            distSel.addEventListener('change', async () => {
                wardSel.innerHTML = '<option value="">— Đang tải —</option>';
                wardSel.disabled = true;
                if (!distSel.value) { wardSel.innerHTML = '<option value="">Phường/Xã</option>'; return; }
                try {
                    const res = await fetch(`${API}/d/${distSel.value}?depth=2`);
                    const data = await res.json();
                    fillSelect(wardSel, data.wards || [], 'Phường/Xã');
                    wardSel.disabled = false;
                } catch (e) {
                    wardSel.innerHTML = '<option value="">⚠️ Lỗi tải</option>';
                }
            });

            loadProvinces();
        })();
