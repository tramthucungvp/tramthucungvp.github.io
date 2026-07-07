# Deployment Guide — Trạm Thú Cưng

## Prerequisites

- Node.js 18+
- A Cloudflare account (free tier works)
- A Google Apps Script webhook URL (already configured in `worker/wrangler.toml`)
- Optional: Telegram bot for order alerts

---

## Step 1: Deploy the Cloudflare Worker

```bash
cd worker

# Install dependencies (if not already done)
npm install   # or pnpm install

# Log in to Cloudflare (one-time)
npx wrangler login

# Deploy
npx wrangler deploy
```

After deploy, Wrangler prints your Worker URL:
```
https://tramthucung-worker.<your-account>.workers.dev
```

Copy this URL — you will paste it into the frontend config.

---

## Step 2: Configure Telegram Alerts (Optional)

1. Create a Telegram bot via [@BotFather](https://t.me/BotFather) and copy the bot token.
2. Get your chat ID (message `@userinfobot` or use `@getidsbot`).
3. Store them as Worker secrets:

```bash
cd worker
npx wrangler secret put TELEGRAM_BOT_TOKEN
# paste your bot token

npx wrangler secret put TELEGRAM_CHAT_ID
# paste your chat ID
```

Redeploy after setting secrets:
```bash
npx wrangler deploy
```

---

## Step 3: Wire Frontend to Worker

Edit `js/config.js` and replace the placeholder:

```javascript
// Before:
const ORDER_API_URL = 'https://your-worker.your-subdomain.workers.dev';

// After (example):
const ORDER_API_URL = 'https://tramthucung-worker.your-account.workers.dev';
```

Commit and push — GitHub Pages will pick up the change automatically.

---

## Step 4: Verify End-to-End

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

## Step 5: (Optional) Cloudflare Turnstile Anti-Spam

If you want bot protection:

1. Go to [Cloudflare Turnstile dashboard](https://dash.cloudflare.com/?to=/:account/turnstile) and create a site.
2. Copy the **site key**.
3. In `index.html`, add Turnstile widget inside the order form.
4. In `worker/src/index.ts`, verify the Turnstile token before processing.
5. Store the Turnstile **secret key** as a Worker secret:
   ```bash
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```

> This step is optional. The current setup works without Turnstile.

---

## Troubleshooting

### Worker deploy fails
- Ensure you ran `npx wrangler login` first.
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

## Updating the Worker

After editing `worker/src/index.ts`:

```bash
cd worker
npx wrangler deploy
```

No need to touch the frontend unless you change the API shape.

---

## Environment Summary

| Variable | Location | How to set |
|----------|----------|------------|
| `SHEET_URL` | `worker/wrangler.toml` | Edit file, deploy |
| `ORDER_API_URL` | `js/config.js` | Edit file, commit |
| `TELEGRAM_BOT_TOKEN` | Cloudflare Worker secrets | `wrangler secret put` |
| `TELEGRAM_CHAT_ID` | Cloudflare Worker secrets | `wrangler secret put` |

---

## Rollback

If something breaks:

1. Revert `js/config.js` to use the old `SHEET_URL` directly (restore pre-Prompt-4 `submitOrder`).
2. Or: in the Cloudflare dashboard, set the Worker to a previous version.
3. Or: disable the Worker route temporarily.
