# Trạm Thú Cưng — Landing Page

Static landing page for pet care products. Deployed via **GitHub Pages**.

## Architecture

```
xit-ve-ran/
├── index.html          # Landing page (GH Pages root)
├── cam-on.html         # Thank-you page
├── favicon.svg
├── robots.txt
├── .nojekyll           # Disables Jekyll processing
├── css/
│   └── style.css       # Extracted from inline <style>
├── js/
│   ├── config.js       # Constants, variants, endpoints
│   ├── gallery.js      # Product image gallery
│   ├── ui.js           # Cart, countdown, notifications, reviews
│   ├── order-form.js   # Form validation & Worker submission
│   └── address-ui.js   # Province/district/ward dropdowns (provinces.open-api.vn)
├── img/                # Product & review images
├── SpayFly/
│   └── imges/feedback/ # Customer feedback images
├── _archive/           # Old duplicate pages (cam-on-spayfly.html, index-spayfly.html)
└── worker/             # Cloudflare Worker backend
    ├── src/index.ts    # CORS, validation, Sheet forward, Telegram alert
    ├── wrangler.toml   # Worker config
    ├── tsconfig.json   # TypeScript config
    └── package.json    # Scripts: dev, deploy, typecheck
```

## Local development

Serve the repo root as a static site:

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

Then open http://localhost:8000

## Deployment

### 1. GitHub Pages (frontend)

**GitHub Pages** serves from the repo root:
- `index.html` — main landing page
- `cam-on.html` — thank-you page
- `css/`, `js/`, `img/` — assets

No build step needed. Push to `main` and enable Pages in repo settings.

### 2. Cloudflare Worker (backend)

The order form submits to a Cloudflare Worker instead of directly to Google Apps Script.

**Configure `js/config.js`:**
```javascript
const ORDER_API_URL = 'https://tramthucung-worker.your-account.workers.dev';
```

**Deploy the Worker:**
```bash
cd worker
npx wrangler login        # one-time auth
npx wrangler deploy       # deploys to Cloudflare
```

**Set Telegram secrets (optional):**
```bash
cd worker
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
```

See [`docs/deployment.md`](docs/deployment.md) for the full step-by-step guide.

## Order flow

1. Customer fills form on `index.html`
2. Frontend validates, then `POST`s JSON to `ORDER_API_URL`
3. Worker validates again, forwards to Google Sheet (`SHEET_URL`)
4. Worker sends Telegram alert (if configured)
5. Customer redirected to `cam-on.html?ma=######`

## Form endpoint configuration

The order form submits to the Cloudflare Worker endpoint configured in:
`js/config.js` → `ORDER_API_URL`

The Worker internally forwards to the Google Apps Script URL configured in:
`worker/wrangler.toml` → `SHEET_URL`
