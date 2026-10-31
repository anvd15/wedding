/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Build ra 1 server Node gọn (kèm sẵn node_modules cần thiết) để chạy trên
  // VPS RAM thấp mà không cần `npm install` production trên server.
  output: 'standalone',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
