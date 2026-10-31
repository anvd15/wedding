#!/usr/bin/env bash
# Build FE (Next.js standalone) với đúng URL backend, đóng gói thành
# frontend-dist.tar.gz để scp lên EC2. Chạy ở máy dev (Windows Git Bash/Mac/Linux),
# KHÔNG chạy trên EC2 (tránh build tốn RAM trên máy 1GB).
#
# Dùng: scripts/package-frontend.sh http://<EC2_PUBLIC_IP>:8080
set -euo pipefail
cd "$(dirname "$0")/.."

API_URL="${1:-}"
if [ -z "$API_URL" ]; then
  echo "Thiếu URL backend." >&2
  echo "Dùng: scripts/package-frontend.sh http://<EC2_PUBLIC_IP>:8080" >&2
  exit 1
fi

echo "==> npm run build (NEXT_PUBLIC_API_URL=$API_URL)"
NEXT_PUBLIC_API_URL="$API_URL" npm run build

echo "==> Gộp static assets + public vào bản standalone"
rm -rf .next/standalone/.next/static .next/standalone/public
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

tar -czf frontend-dist.tar.gz -C .next/standalone .
echo "==> Xong: frontend-dist.tar.gz ($(du -h frontend-dist.tar.gz | cut -f1))"
echo "Copy lên EC2: scp -i <key.pem> frontend-dist.tar.gz ubuntu@<EC2_IP>:~/"
