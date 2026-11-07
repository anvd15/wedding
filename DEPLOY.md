# CD lên EC2 (tự động)

Workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml) tự chạy sau khi
workflow `CI` pass trên nhánh `main`. Nó build frontend (Next.js standalone) trên GitHub
Actions runner, sau đó SSH vào EC2 để:

- **Backend:** `git reset --hard origin/main` rồi `docker compose up -d --build`.
- **Frontend:** giải nén bundle vừa build, chạy bằng `pm2` (process `wedding-frontend`, port 3000).

## 1. GitHub Secrets cần tạo (Settings → Secrets and variables → Actions → Secrets)

| Secret | Giá trị |
|---|---|
| `EC2_HOST` | IP hoặc domain public của EC2 |
| `EC2_USER` | User SSH, ví dụ `ubuntu` |
| `EC2_SSH_KEY` | Toàn bộ nội dung file `.pem` (private key) dùng để SSH vào EC2 |
| `EC2_APP_DIR` | Đường dẫn repo backend trên EC2, ví dụ `/home/ubuntu/wedding` |

## 2. GitHub Variable (Settings → Secrets and variables → Actions → Variables)

| Variable | Giá trị |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL backend mà frontend gọi tới, ví dụ `http://<EC2_HOST>:8080` |

## 3. Setup một lần trên EC2 (chạy tay qua SSH)

```bash
# Clone repo backend (nếu chưa có) đúng path đã khai ở EC2_APP_DIR
git clone https://github.com/anvd15/wedding.git ~/wedding
cd ~/wedding
docker compose up -d --build   # kiểm tra chạy được lần đầu

# Cài Node + pm2 để chạy frontend standalone
sudo apt-get install -y nodejs npm   # nếu EC2 chưa có Node
sudo npm install -g pm2
pm2 startup   # làm theo hướng dẫn in ra để pm2 tự chạy lại khi reboot
```

Lần đầu không cần tự chạy frontend bằng tay — job `Deploy frontend (pm2)` trong workflow
sẽ tạo process `wedding-frontend` ở lần deploy đầu tiên.

## 4. Lưu ý

- Security Group của EC2 cần mở port 22 (SSH) cho GitHub Actions runner (IP động, nên để `0.0.0.0/0` và chỉ xác thực bằng SSH key).
- `git reset --hard` trên EC2 sẽ xoá mọi thay đổi chưa commit trực tiếp trên máy EC2 — chỉ sửa code ở repo GitHub, không sửa tay trên EC2.
- Muốn xem log frontend: `pm2 logs wedding-frontend`. Xem log backend: `docker logs -f wedding_backend`.
