# Thiệp Cưới Điện Tử - Hệ thống Realtime WebSocket & MongoDB Docker

Dự án thiệp cưới điện tử tương tác cao với **Next.js Frontend**, **Node.js Express Backend & Socket.io Realtime**, cùng **MongoDB** được đóng gói hoàn chỉnh bằng **Docker Compose**.

---

## 🏗 Kiến trúc hệ thống

- **Frontend:** Next.js 14 (React 18), Tailwind CSS / Lucide icons, `socket.io-client`.
- **Backend (Port 8080):** Node.js Express + Socket.io Server (WebSocket) xử lý REST API & Realtime Broadcast.
- **Database (Port 27017):** MongoDB 7.0 chạy container Docker với volume `mongo_data` (lưu trữ vĩnh viễn trên ổ đĩa).

---

## 🚀 Hướng dẫn khởi động & Sử dụng

### 1. Khởi động Backend & MongoDB bằng Docker (Khuyên dùng)

Chỉ cần một lệnh duy nhất:
```bash
docker compose up -d
```
> Hệ thống sẽ khởi động 2 container:
> - `wedding_mongodb` trên cổng `27017`
> - `wedding_backend` trên cổng `8080` (API & WebSocket)

Kiểm tra trạng thái container:
```bash
docker ps
docker logs -f wedding_backend
```

Dừng hệ thống Docker:
```bash
docker compose down
```

---

### 2. Khởi động Frontend (Next.js)

Mở một terminal mới tại thư mục gốc của dự án:
```bash
npm run dev
```
Truy cập trình duyệt tại: **`http://localhost:3000`**

---

## ⚡ Tính năng Realtime WebSocket
- **Sổ lưu bút trực tiếp:** Khi bất kỳ khách nào gửi lời chúc mừng trên thiệp cưới, lời chúc sẽ lập tức xuất hiện trên màn hình của tất cả các khách mời khác đang xem mà **không cần tải lại trang (F5)**.
- **Bộ đếm khách online:** Hiển thị số lượng khách đang cùng xem thiệp cưới theo thời gian thực (`Realtime: X khách đang online`).
- **Tự động đồng bộ từ RSVP:** Khách xác nhận tham dự và để lại lời nhắn, lời nhắn sẽ tự động được đưa vào sổ lưu bút và phát trực tiếp tới mọi người.

---

## 📡 Danh sách API Endpoints (Cổng 8080)

| Phương thức | Endpoint | Mô tả |
|-------------|----------|-------|
| `GET` | `/api/health` | Kiểm tra tình trạng hoạt động của Server |
| `GET` | `/api/wishes` | Lấy danh sách lời chúc từ MongoDB (mới nhất lên đầu) |
| `POST` | `/api/wishes` | Gửi lời chúc mới & bắn WebSocket `new_wish` |
| `GET` | `/api/rsvp` | Lấy danh sách khách mời đã xác nhận tham dự |
| `POST` | `/api/rsvp` | Gửi phản hồi xác nhận tham dự (RSVP) |
| `GET` | `/api/info` | Lấy thông tin cấu hình đám cưới (ngày giờ, địa điểm, STK) |
| `PUT` | `/api/info` | Cập nhật thông tin đám cưới |
