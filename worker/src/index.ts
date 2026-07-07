// Cloudflare Worker — Order API for Trạm Thú Cưng
// Accepts CORS, validates, forwards to Google Sheet, sends Telegram alert

export interface Env {
  SHEET_URL: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

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

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function validateOrder(body: Record<string, unknown>): { ok: false; error: string } | { ok: true; payload: OrderPayload } {
  const hoTen = String(body.hoTen || '').trim();
  const sdt = String(body.sdt || '').trim().replace(/^'+/, ''); // strip leading quote
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
  if (!sdt) return { ok: false, error: 'Vui lòng nhập số điện thoại' };
  if (!/^0[235789]\d{8}$/.test(sdt)) return { ok: false, error: 'Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0)' };
  if (!diaChi) return { ok: false, error: 'Vui lòng nhập địa chỉ' };
  if (!sanPham) return { ok: false, error: 'Thiếu thông tin sản phẩm' };
  if (!maDon) return { ok: false, error: 'Thiếu mã đơn hàng' };

  return {
    ok: true,
    payload: { thoiGian, hoTen, sdt, diaChi, sanPham, gia, canNang, cod, phiShip, ghiChu, maDon, nguon },
  };
}

async function sendTelegramAlert(token: string, chatId: string, payload: OrderPayload): Promise<void> {
  const text = [
    `🛒 <b>Đơn hàng mới ${payload.maDon}</b>`,
    ``,
    `👤 <b>${payload.hoTen}</b>`,
    `📞 ${payload.sdt}`,
    `📍 ${payload.diaChi}`,
    ``,
    `📦 ${payload.sanPham}`,
    `💰 Tổng: ${payload.gia.toLocaleString('vi-VN')}₫`,
    `💵 COD: ${payload.cod.toLocaleString('vi-VN')}₫`,
    `🚚 Ship: ${payload.phiShip.toLocaleString('vi-VN')}₫`,
    ``,
    `📝 ${payload.ghiChu || 'Không có ghi chú'}`,
    payload.nguon ? `📊 Nguồn: ${payload.nguon}` : '',
    `⏰ ${payload.thoiGian}`,
  ].join('\n');

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });
}

async function forwardToSheet(sheetUrl: string, payload: OrderPayload): Promise<Response> {
  // Mirror the original frontend format: JSON POST with text/plain body
  return fetch(sheetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400);
    }

    const validation = validateOrder(body);
    if (!validation.ok) {
      return jsonResponse({ success: false, error: validation.error }, 400);
    }

    const payload = validation.payload;

    // Forward to Google Sheet
    const sheetPromise = forwardToSheet(env.SHEET_URL, payload);

    // Send Telegram alert if configured
    const telegramPromise =
      env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID
        ? sendTelegramAlert(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, payload)
        : Promise.resolve();

    // Wait for both (don't let Telegram block the response)
    const [sheetRes] = await Promise.allSettled([sheetPromise, telegramPromise]);

    if (sheetRes.status === 'rejected') {
      return jsonResponse({ success: false, error: 'Failed to forward to sheet' }, 502);
    }

    return jsonResponse({
      success: true,
      message: 'Đơn hàng đã được ghi nhận',
      maDon: payload.maDon,
    });
  },
};
