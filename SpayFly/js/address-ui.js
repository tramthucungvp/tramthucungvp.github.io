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

    function fillSelect(sel, items, placeholder) {
        const sorted = [...items].sort((a, b) =>
            sortKey(a.name).localeCompare(sortKey(b.name), 'vi'));
        sel.innerHTML = `<option value="">${placeholder}</option>` +
            sorted.map(it => `<option value="${it.code}" data-name="${it.name.replace(/"/g, '&quot;')}">${shorten(it.name)}</option>`).join('');
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
        } catch (e) {
            provSel.innerHTML = '<option value="">⚠️ Lỗi tải (' + (e.message || e) + ')</option>';
        }
    }

    provSel.addEventListener('change', () => {
        distSel.innerHTML = '<option value="">— Đang tải —</option>';
        distSel.disabled = true;
        wardSel.innerHTML = '<option value="">— Chọn Phường/Xã —</option>';
        wardSel.disabled = true;
        if (!provSel.value) { distSel.innerHTML = '<option value="">Quận/Huyện</option>'; return; }
        const province = addressData.find(p => p.code === provSel.value);
        fillSelect(distSel, province ? province.districts : [], 'Quận/Huyện');
        distSel.disabled = false;
    });

    distSel.addEventListener('change', () => {
        wardSel.innerHTML = '<option value="">— Đang tải —</option>';
        wardSel.disabled = true;
        if (!distSel.value) { wardSel.innerHTML = '<option value="">Phường/Xã</option>'; return; }
        const province = addressData.find(p => p.code === provSel.value);
        const district = province ? province.districts.find(d => d.code === distSel.value) : null;
        fillSelect(wardSel, district ? district.wards : [], 'Phường/Xã');
        wardSel.disabled = false;
    });

    loadData();
})();
