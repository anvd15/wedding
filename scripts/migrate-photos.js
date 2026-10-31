/**
 * Script chạy 1 lần: resize ảnh gốc xuống FullHD, upload lên S3, lưu URL vào MongoDB.
 *
 * Cách dùng:
 *   cd scripts
 *   npm install
 *   cp .env.example .env   # rồi điền AWS_*, S3_BUCKET_NAME, MONGO_URI
 *   npm run migrate              # chạy thật
 *   node migrate-photos.js --dry-run   # chỉ resize + in log, không upload/không ghi DB
 *
 * Lưu ý: schema Photo ở đây phải khớp với backend/models/Photo.js.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const mongoose = require('mongoose');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const DRY_RUN = process.argv.includes('--dry-run');

const AWS_REGION = process.env.AWS_REGION || 'ap-southeast-1';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const S3_PREFIX = process.env.S3_PREFIX || 'photos/';
const S3_PUBLIC_BASE_URL = process.env.S3_PUBLIC_BASE_URL || '';
const S3_USE_ACL = String(process.env.S3_USE_ACL).toLowerCase() === 'true';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wedding_db';
const SOURCE_DIR = process.env.SOURCE_DIR
  ? path.resolve(process.env.SOURCE_DIR)
  : path.join(__dirname, '..', '19 chụp thuy -an');
const MAX_WIDTH = Number(process.env.MAX_WIDTH) || 1920;
const MAX_HEIGHT = Number(process.env.MAX_HEIGHT) || 1080;
const JPEG_QUALITY = Number(process.env.JPEG_QUALITY) || 82;

// Ảnh dùng cho các vị trí cố định trên trang (hero, chú rể, cô dâu) + 6 ảnh slider ở trang chủ.
// Giữ đúng thứ tự/ý nghĩa như mảng ALL_PHOTOS cũ trong app/page.jsx.
const SPECIAL_PHOTOS = {
  'DSC_1220.jpg': { tags: ['hero', 'slider'], order: 0 },
  'DSC_1332.jpg': { tags: ['bride', 'slider'], order: 1 },
  'DSC_1415.jpg': { tags: ['groom', 'slider'], order: 2 },
  'DSC_1677.jpg': { tags: ['slider'], order: 3 },
  'DSC_1924.jpg': { tags: ['slider'], order: 4 },
  'DSC_2268.jpg': { tags: ['slider'], order: 5 },
};

const photoSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    width: { type: Number },
    height: { type: Number },
    tags: { type: [String], default: [] },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);
const Photo = mongoose.models.Photo || mongoose.model('Photo', photoSchema);

function buildPlan() {
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(`Không tìm thấy thư mục ảnh gốc: ${SOURCE_DIR}`);
  }
  const files = fs
    .readdirSync(SOURCE_DIR)
    .filter((f) => /\.(jpe?g)$/i.test(f))
    .sort();

  if (files.length === 0) {
    throw new Error(`Không có ảnh .jpg/.jpeg nào trong ${SOURCE_DIR}`);
  }

  let nextOrder = Object.keys(SPECIAL_PHOTOS).length;
  return files.map((filename) => {
    const special = SPECIAL_PHOTOS[filename];
    if (special) {
      return { filename, tags: special.tags, order: special.order };
    }
    return { filename, tags: ['gallery'], order: nextOrder++ };
  });
}

async function resizeToFullHD(inputPath) {
  const { data, info } = await sharp(inputPath)
    .rotate() // áp dụng EXIF orientation trước khi resize
    .resize({
      width: MAX_WIDTH,
      height: MAX_HEIGHT,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height };
}

function buildPublicUrl(key) {
  if (S3_PUBLIC_BASE_URL) {
    return `${S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;
  }
  return `https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
}

async function main() {
  if (!DRY_RUN && !S3_BUCKET_NAME) {
    throw new Error('Thiếu S3_BUCKET_NAME trong .env');
  }

  const plan = buildPlan();
  console.log(`Tìm thấy ${plan.length} ảnh trong ${SOURCE_DIR}`);
  console.log(DRY_RUN ? '>>> DRY RUN: chỉ resize, không upload S3 / không ghi DB\n' : '');

  const s3 = DRY_RUN
    ? null
    : new S3Client({
        region: AWS_REGION,
        credentials: process.env.AWS_ACCESS_KEY_ID
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined, // để SDK tự lấy từ profile/role nếu không set trong .env
      });

  if (!DRY_RUN) {
    await mongoose.connect(MONGO_URI);
    console.log('Đã kết nối MongoDB:', MONGO_URI);
  }

  let totalOriginal = 0;
  let totalResized = 0;

  for (const item of plan) {
    const inputPath = path.join(SOURCE_DIR, item.filename);
    const originalSize = fs.statSync(inputPath).size;
    const { buffer, width, height } = await resizeToFullHD(inputPath);
    totalOriginal += originalSize;
    totalResized += buffer.length;

    const key = `${S3_PREFIX}${item.filename}`;
    console.log(
      `${item.filename}: ${(originalSize / 1024 / 1024).toFixed(1)}MB -> ${(buffer.length / 1024).toFixed(0)}KB ` +
        `(${width}x${height}) tags=[${item.tags.join(',')}] order=${item.order}`
    );

    if (DRY_RUN) continue;

    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: 'image/jpeg',
        ...(S3_USE_ACL ? { ACL: 'public-read' } : {}),
      })
    );

    const url = buildPublicUrl(key);
    await Photo.findOneAndUpdate(
      { key },
      { key, url, width, height, tags: item.tags, order: item.order },
      { upsert: true, new: true }
    );
  }

  console.log(
    `\nTổng dung lượng: ${(totalOriginal / 1024 / 1024).toFixed(0)}MB -> ${(totalResized / 1024 / 1024).toFixed(1)}MB`
  );

  if (!DRY_RUN) {
    await mongoose.disconnect();
    console.log(`Hoàn tất. Đã upload + lưu DB ${plan.length} ảnh.`);
  } else {
    console.log('Dry run hoàn tất, không có gì được upload hoặc ghi DB.');
  }
}

main().catch((err) => {
  console.error('Lỗi migrate ảnh:', err);
  process.exit(1);
});
