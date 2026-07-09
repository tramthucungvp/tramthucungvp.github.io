// Cloudflare Worker — Order API for Trạm Thú Cưng
// Accepts CORS, validates, forwards to Google Sheet, sends Telegram alert

export interface Env {
  SHEET_URL: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  ALLOWED_ORIGIN?: string;
}

function getCorsHeaders(env: Env): Record<string, string> {
  const origin = env.ALLOWED_ORIGIN?.trim() || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

interface OrderPayload {
  thoiGian: string;
  hoTen: string;
  sdt: string;
  diaChi: string;
  sanPham: string;
  gia: number;
  canNang: number;
  cod: number;
  phiShip: number;
  ghiChu: string;
  maDon: string;
  nguon: string;
}

function jsonResponse(env: Env, data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...getCorsHeaders(env) },
  });
}

function escapeTelegramHtml(value: unknown): string {
  const s = String(value ?? '');
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function validateOrder(body: Record<string, unknown>): { ok: false; error: string } | { ok: true; payload: OrderPayload } {
  const hoTen = String(body.hoTen || '').trim();
  const sdtRaw = String(body.sdt || '').trim();
  const sdtClean = sdtRaw.replace(/^'+/, ''); // strip leading quote for validation only
  const diaChi = String(body.diaChi || '').trim();
  const sanPham = String(body.sanPham || '').trim();
  const gia = Number(body.gia);
  const cod = Number(body.cod);
  const phiShip = Number(body.phiShip);
  const canNang = Number(body.canNang);
  const ghiChu = String(body.ghiChu || '').trim();
  const maDon = String(body.maDon || '').trim();
  const nguon = String(body.nguon || '').trim();
  const thoiGian = String(body.thoiGian || '').trim();

  if (!hoTen || hoTen.length < 2) return { ok: false, error: 'Họ tên phải có ít nhất 2 ký tự' };
  if (/^\d+$/.test(hoTen)) return { ok: false, error: 'Họ tên không hợp lệ' };
  if (!sdtClean) return { ok: false, error: 'Vui lòng nhập số điện thoại' };
  if (!/^0[235789]\d{8}$/.test(sdtClean)) return { ok: false, error: 'Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0)' };
  if (!diaChi) return { ok: false, error: 'Vui lòng nhập địa chỉ' };
  if (!sanPham) return { ok: false, error: 'Thiếu thông tin sản phẩm' };
  if (!maDon) return { ok: false, error: 'Thiếu mã đơn hàng' };

  return {
    ok: true,
    payload: { thoiGian, hoTen, sdt: sdtRaw, diaChi, sanPham, gia, canNang, cod, phiShip, ghiChu, maDon, nguon },
  };
}

function isWhitelistedChatId(chatId: string, env: Env): boolean {
  const configured = String(env.TELEGRAM_CHAT_ID ?? '').trim();
  const incoming = String(chatId ?? '').trim();
  return !!incoming && !!configured && incoming === configured;
}

async function sendTelegramAlert(token: string, chatId: string, payload: OrderPayload, env: Env): Promise<void> {
  if (!isWhitelistedChatId(chatId, env)) {
    console.warn('Blocked Telegram alert: chat_id not whitelisted');
    return;
  }

  const text = [
    `🛒 <b>Đơn hàng mới ${escapeTelegramHtml(payload.maDon)}</b>`,
    ``,
    `👤 <b>${escapeTelegramHtml(payload.hoTen)}</b>`,
    `📞 ${escapeTelegramHtml(payload.sdt)}`,
    `📍 ${escapeTelegramHtml(payload.diaChi)}`,
    ``,
    `📦 ${escapeTelegramHtml(payload.sanPham)}`,
    `💰 Tổng: ${payload.gia.toLocaleString('vi-VN')}₫`,
    `💵 COD: ${payload.cod.toLocaleString('vi-VN')}₫`,
    `🚚 Ship: ${payload.phiShip.toLocaleString('vi-VN')}₫`,
    ``,
    `📝 ${escapeTelegramHtml(payload.ghiChu) || 'Không có ghi chú'}`,
    payload.nguon ? `📊 Nguồn: ${escapeTelegramHtml(payload.nguon)}` : '',
    `⏰ ${escapeTelegramHtml(payload.thoiGian)}`,
  ].join('\n');

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    throw new Error(`Telegram API error: ${res.status}`);
  }
  console.log('Telegram alert sent successfully', { chatId, maDon: payload.maDon });
}

async function forwardToSheet(sheetUrl: string, payload: OrderPayload): Promise<Response> {
  // Mirror the original frontend format: JSON POST with text/plain body
  return fetch(sheetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
}

async function handlePost(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(env, { success: false, error: 'Invalid JSON body' }, 400);
  }

  const validation = validateOrder(body);
  if (!validation.ok) {
    return jsonResponse(env, { success: false, error: validation.error }, 400);
  }

  const payload = validation.payload;

  // 1. Forward to Google Sheet first
  let sheetRes: Response;
  try {
    sheetRes = await forwardToSheet(env.SHEET_URL, payload);
  } catch {
    return jsonResponse(env, { success: false, error: 'Failed to forward to sheet' }, 502);
  }

  if (!sheetRes.ok) {
    return jsonResponse(env, { success: false, error: 'Failed to forward to sheet' }, 502);
  }

  // 2. Send Telegram alert after Sheet success (non-blocking to response)
  const token = String(env.TELEGRAM_BOT_TOKEN ?? '').trim();
  const chatId = String(env.TELEGRAM_CHAT_ID ?? '').trim();
  if (token && chatId) {
    // Use ctx.waitUntil so Cloudflare keeps the worker alive until the Telegram API call completes.
    ctx.waitUntil(
      sendTelegramAlert(token, chatId, payload, env)
        .then(() => console.log('Telegram alert sent', { maDon: payload.maDon }))
        .catch((err: unknown) => {
          console.error('Telegram alert failed:', err instanceof Error ? err.message : String(err));
        }),
    );
  }

  return jsonResponse(env, {
    success: true,
    message: 'Đơn hàng đã được ghi nhận',
    maDon: payload.maDon,
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: getCorsHeaders(env) });
    }

    if (request.method !== 'POST') {
      return jsonResponse(env, { success: false, error: 'Method not allowed' }, 405);
    }

    return handlePost(request, env, ctx);
  },
};
