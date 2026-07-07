        // ===== API ENDPOINTS =====
        // ORDER_API_URL: Cloudflare Worker backend (Prompt 3). Replace with your deployed Worker URL.
        const ORDER_API_URL = 'https://your-worker.your-subdomain.workers.dev';
        // SHEET_URL: kept for reference; Worker forwards to this internally.
        const SHEET_URL = 'https://script.google.com/macros/s/AKfycbwSFkBsMRkIOAao4bQON8o7p09vtntKE-zvXusebqMPS6NYfeaTYq0-Qa83c8sjB-YXtQ/exec';

        // ===== TRACK NGUỒN ĐƠN (UTM / fbclid) =====
        // Khi khách click ads, FB tự add ?fbclid=... và UTM. Lưu vào localStorage để follow đến lúc submit.
        (function () {
            const p = new URLSearchParams(location.search);
            const captured = {
                utm_source: p.get('utm_source'),
                utm_medium: p.get('utm_medium'),
                utm_campaign: p.get('utm_campaign'),
                utm_content: p.get('utm_content'),
                utm_term: p.get('utm_term'),
                fbclid: p.get('fbclid'),
                ttclid: p.get('ttclid'),     // TikTok
                gclid: p.get('gclid'),       // Google Ads
                referrer: document.referrer || ''
            };
            if (Object.values(captured).some(v => v)) {
                captured.ts = Date.now();
                try { localStorage.setItem('_ad_source', JSON.stringify(captured)); } catch (e) {}
            }
        })();

        function getOrderSource() {
            let src = {};
            try { src = JSON.parse(localStorage.getItem('_ad_source') || '{}'); } catch (e) {}
            // CHỈ ghi nếu có utm_campaign (đến từ ads thật). Còn lại để trống.
            if (src.utm_campaign) {
                const parts = [src.utm_campaign];
                if (src.utm_content) parts.push(src.utm_content);
                if (src.utm_term) parts.push(src.utm_term);
                return parts.join(' | ');
            }
            return ''; // Không phải từ camp → để trống, không ghi chú gì
        }

        let currentImg = 0, qty = 1, cart = [];
        let selectedVariantKey = '1lo';

        const SHOP_SHIP_FEE = 14000;

        const VARIANTS = {
            '1lo': { label: '1 Lọ', displayPrice: 168000, oldPrice: 349000, ship: 0, cod: 75000, giftLabel: '' },
            '2lo': { label: '2 Lọ', displayPrice: 299000, oldPrice: 698000, ship: 0, cod: 180000, giftLabel: '🎁 Tặng: 1 chai sữa tắm 80k' },
            '3lo': { label: '3 Lọ', displayPrice: 429000, oldPrice: 1047000, ship: 0, cod: 285000, giftLabel: '🎁 Tặng: 2 chai sữa tắm 80k/chai' },
        };

        function getVariant(k) { return VARIANTS[k]; }

        function money(n) {
            return (+n || 0).toLocaleString('vi-VN') + '₫';
        }

        function variantLabel(v) {
            return v.label + ' — ' + money(v.displayPrice);
        }

        function renderVariantPrices() {
            Object.keys(VARIANTS).forEach(key => {
                const v = VARIANTS[key];
                document.querySelectorAll(`.variant-btn[onclick*="'${key}'"] .v-price`).forEach(el => {
                    el.textContent = money(v.displayPrice);
                });
            });
            const selected = getVariant(selectedVariantKey);
            syncInstantOffer(selected);
            const selectedLabel = document.getElementById('selectedVariantLabel');
            const orderSelectedLabel = document.getElementById('orderSelectedVariantLabel');
            if (selectedLabel) selectedLabel.textContent = variantLabel(selected);
            if (orderSelectedLabel) orderSelectedLabel.textContent = variantLabel(selected);
            const priceMain = document.getElementById('priceMain');
            const priceOld = document.getElementById('priceOld');
            const priceDiscount = document.getElementById('priceDiscount');
            if (priceMain) priceMain.textContent = money(selected.displayPrice);
            if (priceOld) priceOld.textContent = money(selected.oldPrice);
            if (priceDiscount) priceDiscount.textContent = '-' + Math.round((1 - selected.displayPrice / selected.oldPrice) * 100) + '%';
        }

        function syncInstantOffer(v) {
            const priceText = money(v.displayPrice);
            const topPrice = document.getElementById('instantOfferPrice');
            const bottomText = document.getElementById('bottomBuyText');
            if (topPrice) topPrice.textContent = priceText;
            if (bottomText) bottomText.textContent = '⚡ MUA ' + priceText + ' - FREESHIP';
        }

        function selectVariant(btn, key) {
            document.querySelectorAll('.variant-section .variant-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedVariantKey = key;
            const v = getVariant(key);
            syncInstantOffer(v);
            document.getElementById('selectedVariantLabel').textContent = variantLabel(v);
            document.getElementById('priceMain').textContent = money(v.displayPrice);
            document.getElementById('priceOld').textContent = money(v.oldPrice);
            document.getElementById('priceDiscount').textContent = '-' + Math.round((1 - v.displayPrice / v.oldPrice) * 100) + '%';
        }

        renderVariantPrices();
