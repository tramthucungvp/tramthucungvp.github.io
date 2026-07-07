# E2E Test — Trạm Thú Cưng Order Flow

## Cài đặt (một lần)

```powershell
cd "C:\Landing page\xit-ve-ran"
npm install -D @playwright/test
npx playwright install chromium
```

## Chạy test

### Production (gọi Worker + GitHub Pages thật)

```powershell
cd "C:\Landing page\xit-ve-ran"
$env:TEST_ENV="production"
npx playwright test

# Có UI để quan sát
$env:TEST_ENV="production"
npx playwright test --headed

# Debug từng bước
$env:TEST_ENV="production"
npx playwright test --debug
```

### Local (cần Worker local chạy ở `localhost:8787`)

```powershell
cd "C:\Landing page\xit-ve-ran\worker"
pnpm run dev

# Tab khác:
cd "C:\Landing page\xit-ve-ran"
npx playwright test
```

## Yêu cầu trước khi chạy production

1. Worker đã deploy: `https://tramthucung-worker.tramthucung.workers.dev`
2. Frontend đã push lên GitHub Pages: `https://tramthucungvp.github.io`
3. Google Sheet endpoint hoạt động (test đơn sẽ ghi thật vào Sheet)
4. Nếu có Telegram secrets, alert thật sẽ gửi đến chat

## Test bao gồm

- Happy path: mở form → điền thông tin → submit → redirect cam-on
- Validation: thiếu tên, SĐT sai, chưa chọn địa chỉ
- Network: frontend gọi Worker, không gọi trực tiếp Google Apps Script
- CORS: OPTIONS request thành công
- SpayFly subpage: form hoạt động tương tự
- Worker API: validation error 400, success 200

## Lưu ý production

- Dữ liệu test ghi thật vào Google Sheet. Dùng `maDon` bắt đầu bằng `#E2E` để dễ nhận diện và xóa sau.
- Telegram alert thật sẽ gửi nếu secrets đã cấu hình.
