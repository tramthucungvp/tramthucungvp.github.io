# Deployment Guide — Trạm Thú Cưng

> **Current production environment**
> - Worker: `https://tramthucung-worker.tramthucung.workers.dev`
> - Frontend: `https://tramthucungvp.github.io`
> - SpayFly subpage: `https://tramthucungvp.github.io/SpayFly/`
> - Telegram secrets: configured via `wrangler secret put`

## Prerequisites

- Node.js 18+
- pnpm (or npm)
- A Cloudflare account (free tier works)
- A Google Apps Script webhook URL (already configured in `worker/wrangler.toml`)
- Optional: Telegram bot for order alerts

---

## Step 1: Local Development

```powershell
cd "C:\Landing page\xit-ve-ran\worker"
pnpm install
pnpm run dev
```

The Worker will start on `http://localhost:8787`.

### Local secrets (`worker/.dev.vars`)

Create `worker/.dev.vars` (never commit this file):

```
SHEET_URL="https://script.google.com/macros/s/AKfycbwSFkBsMRkIOAao4bQON8o7p09vtntKE-zvXusebqMPS6NYfeaTYq0-Qa83c8sjB-YXtQ/exec"
TELEGRAM_BOT_TOKEN="8983931047:AAFdU2EyKl7i6Js1VKhp0b8jcQ3iZNazbFw"
TELEGRAM_CHAT_ID="-1004461167067"
ALLOWED_ORIGIN="http://localhost:5500"
```

> ⚠️ `.dev.vars` is for local development only and must not be committed. It is already ignored in `.gitignore`.

---

## Step 2: Type-check before deploying

```powershell
cd "C:\Landing page\xit-ve-ran\worker"
pnpm tsc --noEmit
```

Fix any TypeScript errors before deploying.

---

## Step 3: Deploy the Cloudflare Worker

```powershell
cd "C:\Landing page\xit-ve-ran\worker"
pnpm wrangler login
pnpm wrangler deploy
```

After deploy, Wrangler prints your Worker URL:

```
https://tramthucung-worker.<your-account>.workers.dev
```

Copy this URL — you will paste it into the frontend config.

---

## Step 4: Configure Production Secrets

Set secrets via Wrangler (not via code or wrangler.toml):

```powershell
cd "C:\Landing page\xit-ve-ran\worker"
pnpm wrangler secret put SHEET_URL
pnpm wrangler secret put TELEGRAM_BOT_TOKEN
pnpm wrangler secret put TELEGRAM_CHAT_ID
```

If you want to restrict CORS to your GitHub Pages domain, add `ALLOWED_ORIGIN` as a plain variable in `wrangler.toml`:

```toml
[vars]
ALLOWED_ORIGIN = "https://tramthucungvp.github.io"
```

This covers both frontends served from the same repo:
- Root landing page: `https://tramthucungvp.github.io/`
- SpayFly subpage: `https://tramthucungvp.github.io/SpayFly/`

Then redeploy:

```powershell
pnpm wrangler deploy
```

---

## Step 5: Wire Frontend to Worker

There are two frontends in this repo. Update both `ORDER_API_URL` placeholders after deploying:

### Root landing page (`js/config.js`)

```javascript
// Before:
const ORDER_API_URL = 'https://your-worker.your-subdomain.workers.dev';

// After (example):
const ORDER_API_URL = 'https://tramthucung-worker.your-account.workers.dev';
```

### SpayFly subpage (`SpayFly/js/config.js`)

```javascript
// Before:
const ORDER_API_URL = 'https://your-worker.your-subdomain.workers.dev';

// After (example):
const ORDER_API_URL = 'https://tramthucung-worker.your-account.workers.dev';
```

Commit and push — GitHub Pages will pick up the change automatically.

---

## Step 6: Verify End-to-End

### Local test (PowerShell)

```powershell
$body = @{
    thoiGian = "2026-07-07 21:30"
    hoTen    = "Nguyễn Văn A"
    sdt      = "0900000000"
    diaChi   = "Hà Nội"
    sanPham  = "Xịt ve rận Spay Fly"
    gia      = 199000
    canNang  = 1
    cod      = 199000
    phiShip  = 0
    ghiChu   = "Test đơn hàng"
    maDon    = "TEST001"
    nguon    = "local"
} | ConvertTo-Json -Compress

Invoke-RestMethod -Uri "http://localhost:8787" `
    -Method POST `
    -ContentType "application/json; charset=utf-8" `
    -Body $body
```

### Production test

Replace the URL with your deployed Worker URL:

```powershell
Invoke-RestMethod -Uri "https://tramthucung-worker.your-account.workers.dev" `
    -Method POST `
    -ContentType "application/json; charset=utf-8" `
    -Body $body
```

### Manual browser test

1. Open the live GitHub Pages URL.
2. Fill the order form with test data:
   - Name: `Nguyễn Văn A`
   - Phone: `0901234567`
   - Address: pick any province/district/ward
3. Submit.
4. You should be redirected to `cam-on.html`.
5. Check your Google Sheet — a new row should appear.
6. If Telegram is configured, check your bot chat for an alert.

---

## Step 6b: Automated E2E Tests (Playwright)

Install (one-time):

```powershell
cd "C:\Landing page\xit-ve-ran"
npm install -D @playwright/test
npx playwright install chromium
```

### Test on production

```powershell
cd "C:\Landing page\xit-ve-ran"
$env:TEST_ENV="production"
npx playwright test
```

Or with UI:

```powershell
$env:TEST_ENV="production"
npx playwright test --headed
```

### Test locally

```powershell
cd "C:\Landing page\xit-ve-ran\worker"
pnpm run dev
# Tab khác:
cd "C:\Landing page\xit-ve-ran"
npx playwright test
```

> ⚠️ Production tests gọi Worker thật và ghi dữ liệu thật vào Google Sheet. Dùng test data có `maDon` bắt đầu bằng `#E2E` để dễ nhận diện và xóa sau.

---

## Step 7: (Optional) Cloudflare Turnstile Anti-Spam

If you want bot protection:

1. Go to [Cloudflare Turnstile dashboard](https://dash.cloudflare.com/?to=/:account/turnstile) and create a site.
2. Copy the **site key**.
3. In `index.html`, add Turnstile widget inside the order form.
4. In `worker/src/index.ts`, verify the Turnstile token before processing.
5. Store the Turnstile **secret key** as a Worker secret:
   ```powershell
   pnpm wrangler secret put TURNSTILE_SECRET_KEY
   ```

> This step is optional. The current setup works without Turnstile.

---

## Troubleshooting

### Worker deploy fails
- Ensure you ran `pnpm wrangler login` first.
- Check `wrangler.toml` has a valid `compatibility_date`.

### Form submission shows "Không thể kết nối đến máy chủ"
- Verify `ORDER_API_URL` in `js/config.js` matches the deployed Worker URL exactly.
- Open browser DevTools → Network tab → check the POST request URL and response.
- Ensure the Worker is deployed and not returning 4xx/5xx errors.

### Orders not appearing in Google Sheet
- Check `worker/wrangler.toml` → `SHEET_URL` matches your active Apps Script endpoint.
- In the Cloudflare dashboard → Workers → Your Worker → Logs, check for `forwardToSheet` errors.
- The Google Apps Script may be timing out; ensure the script is deployed and the URL is current.

### Telegram alerts not arriving
- Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set via `wrangler secret put`.
- Check Worker logs for `sendTelegramAlert` errors.
- Ensure the bot has permission to message the chat (start the bot first).

---

## QA Checklist

### Worker
- [ ] `pnpm install` succeeds
- [ ] `pnpm tsc --noEmit` passes with zero errors
- [ ] `pnpm run dev` starts locally on `localhost:8787`
- [ ] `OPTIONS` request returns `204` with CORS headers
- [ ] `POST` valid order returns `{ success: true, message, maDon }`
- [ ] Missing required fields return `400` with Vietnamese error message
- [ ] Sheet failure returns `502` with safe public error
- [ ] Valid order writes a new row to Google Sheet
- [ ] Valid order sends Telegram alert (if configured)
- [ ] Telegram failure does **not** lose the Sheet order

### Frontend
- [ ] GitHub Pages still loads static landing page
- [ ] UI remains unchanged (no layout/color/spacing shifts)
- [ ] Images load correctly
- [ ] Form looks identical
- [ ] Form calls Worker endpoint (`ORDER_API_URL`)
- [ ] Frontend no longer exposes Google Apps Script URL in network requests
- [ ] Success and error UX still works (redirects, alerts)

### Security
- [ ] No real secrets committed in the repo
- [ ] `.dev.vars` is ignored by `.gitignore`
- [ ] `node_modules/` is ignored
- [ ] `.wrangler/` is ignored
- [ ] Telegram token is not logged in console or returned to browser
- [ ] `SHEET_URL` is not exposed in frontend code or browser requests

---

## Updating the Worker

After editing `worker/src/index.ts`:

```powershell
cd "C:\Landing page\xit-ve-ran\worker"
pnpm tsc --noEmit
pnpm wrangler deploy
```

No need to touch the frontend unless you change the API shape.

---

## Environment Summary

| Variable | Location | How to set | Visibility |
|----------|----------|------------|------------|
| `SHEET_URL` | `wrangler.toml` or secret | Edit file / `wrangler secret put` | Server only |
| `ORDER_API_URL` | `js/config.js` | Edit file, commit | Public (Worker URL only) |
| `ALLOWED_ORIGIN` | `wrangler.toml` `[vars]` | Edit file, deploy | Public (CORS header) |
| `TELEGRAM_BOT_TOKEN` | Cloudflare Worker secrets | `wrangler secret put` | Server only |
| `TELEGRAM_CHAT_ID` | Cloudflare Worker secrets | `wrangler secret put` | Server only |

> 🔒 **Security**: Worker chỉ gửi Telegram alert đến `TELEGRAM_CHAT_ID` đã cấu hình. Nếu chat_id bị thay đổi hoặc không khớp whitelist, Worker sẽ bỏ qua và ghi log warning.

---

## Rollback

If something breaks:

1. Revert `js/config.js` to use the old `SHEET_URL` directly (restore pre-Worker `submitOrder`).
2. Or: in the Cloudflare dashboard, set the Worker to a previous version.
3. Or: disable the Worker route temporarily.
