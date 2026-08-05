(function () {
    const provSel = document.getElementById('fProvince');
    const distSel = document.getElementById('fDistrict');
    const wardSel = document.getElementById('fWard');
    if (!provSel) return;

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
        const list = document.getElementById(listId);
        const hidden = document.getElementById(hiddenSelectId);
        let items = [];
        let activeIdx = -1;
        let isOpen = false;

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
                        // map back from norm positions to label positions (approximate, works for simple cases)
                        html = it.label.slice(0, start) + '<span class="hl">' + it.label.slice(start, end) + '</span>' + it.label.slice(end);
                    }
                }
                return `<div class="cs-item" data-i="${i}" data-v="${it.value}">${html}</div>`;
            }).join('');
            activeIdx = -1;
        }
        function open() { isOpen = true; dropdown.classList.add('open'); if (search) { search.value = ''; render(); search.focus(); } }
        function close() { isOpen = false; dropdown.classList.remove('open'); }
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
        document.addEventListener('click', e => { if (wrap && !wrap.contains(e.target)) close(); });

        return { setItems(newItems) { items = newItems; render(); }, selectValue, reset, enable, disable };
    }

    let addressData = [];

    async function loadData() {
        try {
            let raw = (typeof addressDataRaw !== 'undefined' && addressDataRaw) || window.addressDataRaw || [];
            if (!raw.length) {
                const res = await fetch('./data.json');
                if (!res.ok) throw new Error('HTTP ' + res.status);
                raw = await res.json();
            }
            addressData = raw.map(p => ({
                code: p.Id,
                name: p.Name,
                districts: (p.Districts || []).map(d => ({
                    code: d.Id,
                    name: d.Name,
                    wards: (d.Wards || []).map(w => ({
                        code: w.Id,
                        name: w.Name
                    }))
                }))
            }));
            fillSelect(provSel, addressData, 'Tỉnh/TP');
            provinceDD.setItems(addressData.map(p => ({ value: p.code, label: shorten(p.name), norm: normSearch(p.name) })));
        } catch (e) {
            provSel.innerHTML = '<option value="">⚠️ Lỗi tải (' + (e.message || e) + ')</option>';
        }
    }

    const provinceDD = makeSearchSelect({ wrapId: 'fProvinceWrap', listId: 'fProvinceList', hiddenSelectId: 'fProvince', placeholder: 'Tỉnh/TP', onSelect: () => {} });
    const districtDD = makeSearchSelect({ wrapId: 'fDistrictWrap', listId: 'fDistrictList', hiddenSelectId: 'fDistrict', placeholder: 'Quận/Huyện', onSelect: () => {} });
    const wardDD = makeSearchSelect({ wrapId: 'fWardWrap', listId: 'fWardList', hiddenSelectId: 'fWard', placeholder: 'Phường/Xã', onSelect: () => {} });

    provSel.addEventListener('change', () => {
        distSel.innerHTML = '<option value="">— Đang tải —</option>';
        distSel.disabled = true;
        wardSel.innerHTML = '<option value="">— Chọn Phường/Xã —</option>';
        wardSel.disabled = true;
        districtDD.reset(); districtDD.disable();
        wardDD.reset(); wardDD.disable();
        if (!provSel.value) { distSel.innerHTML = '<option value="">Quận/Huyện</option>'; return; }
        const province = addressData.find(p => p.code === provSel.value);
        fillSelect(distSel, province ? province.districts : [], 'Quận/Huyện');
        distSel.disabled = false;
        districtDD.setItems((province ? province.districts : []).map(d => ({ value: d.code, label: shorten(d.name), norm: normSearch(d.name) })));
        districtDD.enable();
    });

    distSel.addEventListener('change', () => {
        wardSel.innerHTML = '<option value="">— Đang tải —</option>';
        wardSel.disabled = true;
        wardDD.reset(); wardDD.disable();
        if (!distSel.value) { wardSel.innerHTML = '<option value="">Phường/Xã</option>'; return; }
        const province = addressData.find(p => p.code === provSel.value);
        const district = province ? province.districts.find(d => d.code === distSel.value) : null;
        fillSelect(wardSel, district ? district.wards : [], 'Phường/Xã');
        wardSel.disabled = false;
        wardDD.setItems((district ? district.wards : []).map(w => ({ value: w.code, label: shorten(w.name), norm: normSearch(w.name) })));
        wardDD.enable();
    });

    loadData();
})();
