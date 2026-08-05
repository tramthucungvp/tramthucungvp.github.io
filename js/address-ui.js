        // Cascading address dropdown — Tỉnh → Huyện → Xã (provinces.open-api.vn, miễn phí)
        (function () {
            const provSel = document.getElementById('fProvince');
            const distSel = document.getElementById('fDistrict');
            const wardSel = document.getElementById('fWard');
            if (!provSel) return;
            const API = 'https://provinces.open-api.vn/api';
            let addressData = [];
            const searchInput = document.getElementById('faddressSearch');
            const resultsBox = document.getElementById('faddressResults');

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
                    buildFlatWards();
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

            function buildFlatWards() {
                flatWards = [];
                addressData.forEach(p => {
                    p.districts.forEach(d => {
                        d.wards.forEach(w => {
                            flatWards.push({
                                wardCode: w.code, wardName: w.name,
                                districtCode: d.code, districtName: d.name,
                                provinceCode: p.code, provinceName: p.name,
                                search: sortKey(`${w.name} ${d.name} ${p.name}`)
                            });
                        });
                    });
                });
            }

            let flatWards = [];

            if (searchInput && resultsBox) {
                let activeIdx = -1;

                function renderResults(matches) {
                    if (!matches.length) { resultsBox.style.display = 'none'; return; }
                    resultsBox.innerHTML = matches.slice(0, 8).map((m, i) =>
                        `<div class="addr-result-item" data-idx="${i}" data-wc="${m.wardCode}" data-dc="${m.districtCode}" data-pc="${m.provinceCode}">
                            <strong>${shorten(m.wardName)}</strong>, ${shorten(m.districtName)}, ${shorten(m.provinceName)}
                        </div>`
                    ).join('');
                    resultsBox.style.display = 'block';
                    activeIdx = -1;
                }

                searchInput.addEventListener('input', () => {
                    const q = sortKey(searchInput.value.trim());
                    if (!q || q.length < 1) { resultsBox.style.display = 'none'; return; }
                    const matches = flatWards.filter(f => f.search.includes(q));
                    renderResults(matches);
                });

                searchInput.addEventListener('keydown', e => {
                    const items = resultsBox.querySelectorAll('.addr-result-item');
                    if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(activeIdx + 1, items.length - 1); items.forEach((it, i) => it.style.background = i === activeIdx ? '#fff5f7' : ''); }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = Math.max(activeIdx - 1, 0); items.forEach((it, i) => it.style.background = i === activeIdx ? '#fff5f7' : ''); }
                    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); items[activeIdx]?.click(); }
                });

                resultsBox.addEventListener('click', e => {
                    const item = e.target.closest('.addr-result-item');
                    if (!item) return;
                    const wc = item.dataset.wc, dc = item.dataset.dc, pc = item.dataset.pc;
                    const hit = flatWards.find(f => f.wardCode === wc && f.districtCode === dc && f.provinceCode === pc);
                    if (!hit) return;

                    provSel.value = hit.provinceCode;
                    const province = addressData.find(p => p.code === hit.provinceCode);
                    fillSelect(distSel, province ? province.districts : [], 'Quận/Huyện');
                    distSel.disabled = false;

                    distSel.value = hit.districtCode;
                    const district = province.districts.find(d => d.code === hit.districtCode);
                    fillSelect(wardSel, district ? district.wards : [], 'Phường/Xã');
                    wardSel.disabled = false;

                    wardSel.value = hit.wardCode;

                    searchInput.value = `${shorten(hit.wardName)}, ${shorten(hit.districtName)}, ${shorten(hit.provinceName)}`;
                    resultsBox.style.display = 'none';
                    document.getElementById('faddress').focus();
                });

                document.addEventListener('click', e => {
                    if (!searchInput.contains(e.target) && !resultsBox.contains(e.target)) resultsBox.style.display = 'none';
                });
            }

            loadAll();
        })();
