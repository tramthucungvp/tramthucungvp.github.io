        // Cascading address dropdown — Tỉnh → Huyện → Xã (provinces.open-api.vn, miễn phí)
        (function () {
            const provSel = document.getElementById('fProvince');
            const distSel = document.getElementById('fDistrict');
            const wardSel = document.getElementById('fWard');
            if (!provSel) return;
            const API = 'https://provinces.open-api.vn/api';
            let addressData = [];

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
            function normSearch(name) {
                return sortKey(name).toLowerCase()
                    .replace(/[àáảãạâầấẩẫậăằắẳẵặ]/g, 'a')
                    .replace(/[èéẻẽẹêềếểễệ]/g, 'e')
                    .replace(/[ìíỉĩị]/g, 'i')
                    .replace(/[òóỏõọôồốổỗộơờớởỡợ]/g, 'o')
                    .replace(/[ùúủũụưừứửữự]/g, 'u')
                    .replace(/[ỳýỷỹỵ]/g, 'y')
                    .replace(/đ/g, 'd');
            }

            function fillSelect(sel, items, placeholder) {
                // Sort theo bảng chữ cái Tiếng Việt
                const sorted = [...items].sort((a, b) =>
                    sortKey(a.name).localeCompare(sortKey(b.name), 'vi'));
                sel.innerHTML = `<option value="">${placeholder}</option>` +
                    sorted.map(it => `<option value="${it.code}" data-name="${it.name.replace(/"/g, '&quot;')}">${shorten(it.name)}</option>`).join('');
            }

            /* Custom searchable dropdown factory */
            function makeSearchSelect({ wrapId, listId, hiddenSelectId, placeholder, onSelect }) {
                const wrap = document.getElementById(wrapId);
                if (!wrap) return null;
                const display = wrap.querySelector('.cs-display');
                const dropdown = wrap.querySelector('.cs-dropdown');
                const search = wrap.querySelector('.cs-search');
                const closeBtn = wrap.querySelector('.cs-close');
                const list = document.getElementById(listId);
                const hidden = document.getElementById(hiddenSelectId);
                let items = [];
                let activeIdx = -1;
                let isOpen = false;

                // Overlay backdrop
                let overlay = null;
                function ensureOverlay() {
                    if (overlay) return overlay;
                    overlay = document.createElement('div');
                    overlay.className = 'cs-overlay';
                    document.body.appendChild(overlay);
                    overlay.addEventListener('click', () => close());
                    return overlay;
                }

                function render(filter) {
                    const q = normSearch(filter || '');
                    const matches = q ? items.filter(it => it.norm.includes(q)) : items;
                    if (!matches.length) { list.innerHTML = '<div class="cs-empty">Không tìm thấy</div>'; return; }
                    list.innerHTML = matches.map((it, i) => {
                        let html = it.label;
                        if (q) {
                            const idx = it.norm.indexOf(q);
                            if (idx >= 0) {
                                const start = idx;
                                const end = idx + q.length;
                                html = it.label.slice(0, start) + '<span class="hl">' + it.label.slice(start, end) + '</span>' + it.label.slice(end);
                            }
                        }
                        return `<div class="cs-item" data-i="${i}" data-v="${it.value}">${html}</div>`;
                    }).join('');
                    activeIdx = -1;
                }
                function open() {
                    isOpen = true;
                    dropdown.classList.add('open');
                    ensureOverlay().classList.add('open');
                    if (search) { search.value = ''; render(); }
                }
                function close() {
                    if (!isOpen) return;
                    isOpen = false;
                    dropdown.classList.remove('open');
                    if (overlay) overlay.classList.remove('open');
                }
                function selectValue(value, label) {
                    if (display) { display.value = label || ''; }
                    if (hidden) { hidden.value = value || ''; hidden.dispatchEvent(new Event('change', { bubbles: true })); }
                    close();
                    if (onSelect) onSelect(value, label);
                }
                function reset() { selectValue('', ''); }
                function enable() { if (display) { display.disabled = false; } if (hidden) { hidden.disabled = false; } }
                function disable() { if (display) { display.disabled = true; } if (hidden) { hidden.disabled = true; } }

                if (display) {
                    display.addEventListener('click', () => { if (display.disabled) return; isOpen ? close() : open(); });
                }
                if (closeBtn) {
                    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); close(); });
                }
                if (search) {
                    search.addEventListener('input', () => render(search.value));
                    search.addEventListener('keydown', e => {
                        const els = list.querySelectorAll('.cs-item');
                        if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(activeIdx + 1, els.length - 1); els.forEach((el, i) => el.classList.toggle('active', i === activeIdx)); if (activeIdx >= 0) els[activeIdx].scrollIntoView({ block: 'nearest' }); }
                        else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = Math.max(activeIdx - 1, 0); els.forEach((el, i) => el.classList.toggle('active', i === activeIdx)); if (activeIdx >= 0) els[activeIdx].scrollIntoView({ block: 'nearest' }); }
                        else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); els[activeIdx].click(); }
                        else if (e.key === 'Escape') { close(); if (display) display.focus(); }
                    });
                }
                if (list) {
                    list.addEventListener('click', e => {
                        const item = e.target.closest('.cs-item');
                        if (!item) return;
                        const value = item.dataset.v;
                        const label = item.textContent;
                        selectValue(value, label);
                    });
                }

                return { setItems(newItems) { items = newItems; render(); }, selectValue, reset, enable, disable };
            }

            const provinceDD = makeSearchSelect({ wrapId: 'fProvinceWrap', listId: 'fProvinceList', hiddenSelectId: 'fProvince', placeholder: 'Tỉnh/TP', onSelect: () => {} });
            const districtDD = makeSearchSelect({ wrapId: 'fDistrictWrap', listId: 'fDistrictList', hiddenSelectId: 'fDistrict', placeholder: 'Quận/Huyện', onSelect: () => {} });
            const wardDD = makeSearchSelect({ wrapId: 'fWardWrap', listId: 'fWardList', hiddenSelectId: 'fWard', placeholder: 'Phường/Xã', onSelect: () => {} });

            async function loadAll() {
                try {
                    const res = await fetch(`${API}/p/?depth=3`);
                    const raw = await res.json();
                    addressData = raw.map(p => ({
                        code: String(p.code),
                        name: p.name,
                        districts: (p.districts || []).map(d => ({
                            code: String(d.code),
                            name: d.name,
                            wards: (d.wards || []).map(w => ({
                                code: String(w.code),
                                name: w.name
                            }))
                        }))
                    }));
                    fillSelect(provSel, addressData, 'Tỉnh/TP');
                    provinceDD.setItems(addressData.map(p => ({ value: p.code, label: shorten(p.name), norm: normSearch(p.name) })));
                } catch (e) {
                    console.error('Load address data failed', e);
                    provSel.innerHTML = '<option value="">⚠️ Lỗi tải</option>';
                }
            }

            provSel.addEventListener('change', async () => {
                distSel.innerHTML = '<option value="">— Đang tải —</option>';
                distSel.disabled = true;
                wardSel.innerHTML = '<option value="">— Chọn Phường/Xã —</option>';
                wardSel.disabled = true;
                districtDD.reset(); districtDD.disable();
                wardDD.reset(); wardDD.disable();
                if (!provSel.value) { distSel.innerHTML = '<option value="">Quận/Huyện</option>'; return; }
                try {
                    const res = await fetch(`${API}/p/${provSel.value}?depth=2`);
                    const data = await res.json();
                    fillSelect(distSel, data.districts || [], 'Quận/Huyện');
                    distSel.disabled = false;
                    districtDD.setItems((data.districts || []).map(d => ({ value: String(d.code), label: shorten(d.name), norm: normSearch(d.name) })));
                    districtDD.enable();
                } catch (e) {
                    distSel.innerHTML = '<option value="">⚠️ Lỗi tải</option>';
                }
            });

            distSel.addEventListener('change', async () => {
                wardSel.innerHTML = '<option value="">— Đang tải —</option>';
                wardSel.disabled = true;
                wardDD.reset(); wardDD.disable();
                if (!distSel.value) { wardSel.innerHTML = '<option value="">Phường/Xã</option>'; return; }
                try {
                    const res = await fetch(`${API}/d/${distSel.value}?depth=2`);
                    const data = await res.json();
                    fillSelect(wardSel, data.wards || [], 'Phường/Xã');
                    wardSel.disabled = false;
                    wardDD.setItems((data.wards || []).map(w => ({ value: String(w.code), label: shorten(w.name), norm: normSearch(w.name) })));
                    wardDD.enable();
                } catch (e) {
                    wardSel.innerHTML = '<option value="">⚠️ Lỗi tải</option>';
                }
            });

            loadAll();
        })();
