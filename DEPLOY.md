# CD lên EC2 (tự động)

Workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml) tự chạy sau khi
workflow `CI` pass trên nhánh `main`. Nó build frontend (Next.js standalone) trên GitHub
Actions runner, sau đó SSH vào EC2 để:

- **Backend:** `git reset --hard origin/main` rồi `docker compose up -d --build`.
- **Frontend:** giải nén bundle vừa build vào `~/wedding-frontend`, restart qua systemd service có sẵn `wedding-frontend.service` (port 3000).

## 1. GitHub Secrets cần tạo (Settings → Secrets and variables → Actions → Secrets)

| Secret | Giá trị |
|---|---|
| `EC2_HOST` | IP hoặc domain public của EC2 |
| `EC2_USER` | User SSH, ví dụ `ec2-user` (Amazon Linux) |
| `EC2_SSH_KEY` | Toàn bộ nội dung file `.pem` (private key) dùng để SSH vào EC2 |
| `EC2_APP_DIR` | Đường dẫn repo backend trên EC2, ví dụ `/home/ec2-user/wedding` |

## 2. GitHub Variable (Settings → Secrets and variables → Actions → Variables)

| Variable | Giá trị |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL backend mà frontend gọi tới (REST + Socket.io), ví dụ `https://wedding-api.anvd.dev`. **Phải là https + domain** — không dùng IP:8080 trực tiếp, vì frontend chạy https nên gọi http sẽ bị trình duyệt chặn (Mixed Content). |

## 3. Setup một lần trên EC2 (chạy tay qua SSH)

```bash
# Clone repo backend (nếu chưa có) đúng path đã khai ở EC2_APP_DIR
git clone https://github.com/anvd15/wedding.git ~/wedding
cd ~/wedding
docker compose up -d --build   # kiểm tra chạy được lần đầu
```

Frontend chạy qua systemd service `wedding-frontend.service`
(`WorkingDirectory=/home/ec2-user/wedding-frontend`, `ExecStart=/usr/bin/node server.js`,
`Restart=always`, port 3000). Workflow deploy sẽ giải nén bundle mới vào đúng thư mục này
rồi `sudo systemctl restart wedding-frontend` — không dùng pm2.

Nếu service này chưa tồn tại trên EC2, tạo file `/etc/systemd/system/wedding-frontend.service`:

```ini
[Unit]
Description=Wedding Frontend (Next.js standalone)
After=network.target

[Service]
WorkingDirectory=/home/ec2-user/wedding-frontend
ExecStart=/usr/bin/node server.js
Restart=always
Environment=PORT=3000
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

rồi:
```bash
sudo systemctl daemon-reload
sudo systemctl enable wedding-frontend
```

User SSH deploy (`EC2_USER`) cần quyền `sudo systemctl stop/start wedding-frontend` không cần
nhập mật khẩu (mặc định `ec2-user` trên Amazon Linux đã có NOPASSWD sudo toàn quyền).

## 4. Kiến trúc public traffic (đã setup sẵn trên EC2)

Không cần mở port 3000/8080 ra Internet. Traffic đi qua Cloudflare Tunnel (`cloudflared`,
chạy as systemd service) → nginx (port 80, local) → app:

```
wedding.anvd.dev      --tunnel-->  nginx :80  --> 127.0.0.1:3000  (frontend)
wedding-api.anvd.dev  --tunnel-->  nginx :80  --> 127.0.0.1:8080  (backend)
```

Nginx config: `/etc/nginx/conf.d/*.conf`. Cloudflared config: `/etc/cloudflared/` (ingress
rules map từng hostname về `http://localhost:80`, nginx tự route theo `server_name`).

**Quan trọng:** `NEXT_PUBLIC_API_URL` phải dùng domain `https://wedding-api.anvd.dev`, không
dùng IP EC2 trực tiếp — vì frontend chạy https, gọi thẳng `http://<IP>:8080` sẽ bị trình
duyệt chặn (Mixed Content), kể cả kết nối Socket.io.

## 5. Lưu ý khác

- Security Group của EC2 cần mở port 22 (SSH) cho GitHub Actions runner (IP động, nên để `0.0.0.0/0` và chỉ xác thực bằng SSH key). Không cần mở port 80/3000/8080 ra ngoài vì đã qua Cloudflare Tunnel.
- `git reset --hard` trên EC2 sẽ xoá mọi thay đổi chưa commit trực tiếp trên máy EC2 — chỉ sửa code ở repo GitHub, không sửa tay trên EC2.
- Muốn xem log frontend: `sudo journalctl -u wedding-frontend -f`. Xem log backend: `docker logs -f wedding_backend`. Xem log tunnel: `sudo journalctl -u cloudflared -f`.
- **Không chạy frontend bằng tay/pm2 song song** — nếu có process nào khác đang giữ port 3000 ngoài `wedding-frontend.service`, deploy sẽ fail do `EADDRINUSE`. Kiểm tra bằng `sudo ss -tlnp | grep :3000`, chỉ nên thấy đúng 1 process do systemd quản lý.
