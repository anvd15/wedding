const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wedding_db';
  const maxRetries = 10;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      console.log(`[Database] Đang kết nối tới MongoDB (${mongoURI})... (Lần thử ${retryCount + 1}/${maxRetries})`);
      await mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('✅ [Database] Kết nối MongoDB thành công!');
      return;
    } catch (err) {
      retryCount++;
      console.error(`❌ [Database] Lỗi kết nối MongoDB: ${err.message}`);
      if (retryCount >= maxRetries) {
        console.error('💥 [Database] Đã hết số lần thử lại kết nối MongoDB.');
        break;
      }
      console.log('⏳ [Database] Đợi 3 giây trước khi thử lại...');
      await new Promise(res => setTimeout(res, 3000));
    }
  }
};

module.exports = connectDB;
