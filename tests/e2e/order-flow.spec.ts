import { test, expect, type Page } from '@playwright/test';

const WORKER_URL = 'https://tramthucung-worker.tramthucung.workers.dev';
const SHEET_URL_PATTERN = /script\.google\.com\/macros\/s\//;

async function fillAddress(page: Page) {
  // Chờ dropdown Tỉnh/TP load xong (address-ui.js fetch từ API)
  await page.waitForFunction(() => {
    const sel = document.getElementById('fProvince') as HTMLSelectElement;
    return sel && sel.options.length > 1;
  });

  const province = page.locator('#fProvince');
  await province.selectOption({ index: 1 }); // chọn tỉnh đầu tiên

  // Chờ Quận/Huyện enable
  await expect(page.locator('#fDistrict')).toBeEnabled();
  const district = page.locator('#fDistrict');
  await district.selectOption({ index: 1 });

  // Chờ Phường/Xã enable
  await expect(page.locator('#fWard')).toBeEnabled();
  const ward = page.locator('#fWard');
  await ward.selectOption({ index: 1 });
}

test.describe('Landing page — root (index.html)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('mở form đặt hàng từ nút topnav', async ({ page }) => {
    await page.click('button.topnav-order-btn');
    await expect(page.locator('#orderDrawer')).toHaveClass(/open/);
    await expect(page.locator('#fname')).toBeVisible();
  });

  test('happy path: điền form hợp lệ và submit', async ({ page }) => {
    // Intercept request để verify
    let capturedPayload: Record<string, unknown> | null = null;
    await page.route(WORKER_URL, async (route, request) => {
      if (request.method() === 'POST') {
        capturedPayload = await request.postDataJSON();
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ success: true, message: 'Đơn hàng đã được ghi nhận', maDon: '#TEST001' }),
      });
    });

    await page.click('button.topnav-order-btn');

    await page.fill('#fname', 'Nguyễn Văn A');
    await page.fill('#fphone', '0901234567');
    await fillAddress(page);
    await page.fill('#faddress', '123 Lê Lợi');

    // Chọn variant 2 lọ
    await page.click('#ovBtn2lo');

    await page.fill('#fnote', 'Giao buổi sáng');

    await page.click('button.btn-order');

    // Chờ redirect cam-on
    await page.waitForURL(/cam-on\.html/);

    // Verify payload gửi đến Worker
    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload!.hoTen).toBe('Nguyễn Văn A');
    expect(capturedPayload!.sdt).toBe("'0901234567"); // frontend thêm dấu nháy đầu
    expect(capturedPayload!.diaChi).toMatch(/123 Lê Lợi/);
    expect(capturedPayload!.sanPham).toMatch(/Xịt ve rận/);
    expect(capturedPayload!.maDon).toMatch(/^#/);
  });

  test('validation: thiếu họ tên', async ({ page }) => {
    await page.click('button.topnav-order-btn');
    await page.fill('#fphone', '0901234567');
    await fillAddress(page);

    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toMatch(/họ tên|tên/i);
      await dialog.accept();
    });

    await page.click('button.btn-order');
  });

  test('validation: SĐT không hợp lệ', async ({ page }) => {
    await page.click('button.topnav-order-btn');
    await page.fill('#fname', 'Nguyễn Văn A');
    await page.fill('#fphone', '123');
    await fillAddress(page);

    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toMatch(/số điện thoại|điện thoại/i);
      await dialog.accept();
    });

    await page.click('button.btn-order');
  });

  test('frontend không gọi trực tiếp Google Apps Script', async ({ page }) => {
    let sheetCalled = false;
    await page.route(SHEET_URL_PATTERN, () => {
      sheetCalled = true;
    });

    await page.click('button.topnav-order-btn');
    await page.fill('#fname', 'Nguyễn Văn A');
    await page.fill('#fphone', '0901234567');
    await fillAddress(page);

    // Mock Worker để tránh lỗi
    await page.route(WORKER_URL, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.click('button.btn-order');
    await page.waitForTimeout(500);

    expect(sheetCalled).toBe(false);
  });

  test('Worker trả lỗi thì hiện alert lỗi', async ({ page }) => {
    await page.route(WORKER_URL, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Thiếu mã đơn hàng' }),
      });
    });

    // Đăng ký dialog handler TRƯỚC khi click
    const dialogPromise = page.waitForEvent('dialog');

    await page.click('button.topnav-order-btn');
    await page.fill('#fname', 'Nguyễn Văn A');
    await page.fill('#fphone', '0901234567');
    await fillAddress(page);

    await page.click('button.btn-order');

    const dialog = await dialogPromise;
    expect(dialog.message()).toMatch(/thiếu mã|lỗi/i);
    await dialog.accept();
  });
});

test.describe('SpayFly subpage', () => {
  test('happy path đặt hàng', async ({ page }) => {
    let capturedPayload: Record<string, unknown> | null = null;
    await page.route(WORKER_URL, async (route, request) => {
      if (request.method() === 'POST') {
        capturedPayload = await request.postDataJSON();
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: JSON.stringify({ success: true, message: 'Đơn hàng đã được ghi nhận', maDon: '#TEST002' }),
      });
    });

    await page.goto('/SpayFly/', { waitUntil: 'domcontentloaded' });
    await page.click('button.btn-buy', { force: true });

    await page.fill('#fname', 'Trần Thị B');
    await page.fill('#fphone', '0912345678');
    await fillAddress(page);
    await page.fill('#faddress', '456 Nguyễn Trãi');

    await page.click('button.btn-order');

    await page.waitForURL(/cam-on-spayfly\.html/);

    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload!.nguon).toBe('SpayFly');
  });
});

test.describe('Worker API trực tiếp', () => {
  test('OPTIONS trả về CORS headers', async ({ request }) => {
    const res = await request.fetch(WORKER_URL, { method: 'OPTIONS' });
    expect(res.status()).toBe(204);
    expect(res.headers()['access-control-allow-origin']).toBeTruthy();
    expect(res.headers()['access-control-allow-methods']).toMatch(/POST/);
  });

  test('POST thiếu trường trả về 400', async ({ request }) => {
    const res = await request.post(WORKER_URL, {
      data: { hoTen: 'A', sdt: '0901234567', diaChi: 'HN', sanPham: 'Xịt', maDon: '#001' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  test('POST hợp lệ với mock Sheet trả về 200', async ({ request }) => {
    // Note: test này gọi production Worker thật.
    // Nên dùng test data rõ ràng và xóa sau khi test.
    const res = await request.post(WORKER_URL, {
      data: {
        thoiGian: '2026-07-07 21:30',
        hoTen: 'E2E Test Bot',
        sdt: "'0900000000",
        diaChi: 'Test Address',
        sanPham: 'Xịt ve rận E2E',
        gia: 199000,
        canNang: 1,
        cod: 199000,
        phiShip: 0,
        ghiChu: 'E2E automated test — safe to delete',
        maDon: '#E2E001',
        nguon: 'e2e-playwright',
      },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.maDon).toBe('#E2E001');
  });
});
