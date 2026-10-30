const Wish = require('../models/Wish');

let onlineUsers = 0;

const setupWishSocket = (io) => {
  io.on('connection', (socket) => {
    onlineUsers++;
    console.log(`⚡ [Socket] Client kết nối: ${socket.id} (Online: ${onlineUsers})`);

    // Phát số lượng khách đang online
    io.emit('online_count', onlineUsers);

    // Lắng nghe sự kiện gửi lời chúc qua Socket
    socket.on('send_wish', async (data, callback) => {
      try {
        const { name, side, message } = data;

        if (!name || !name.trim() || !message || !message.trim()) {
          if (callback) callback({ success: false, message: 'Dữ liệu không hợp lệ' });
          return;
        }

        const newWish = await Wish.create({
          name: name.trim(),
          side: side || 'Bạn bè',
          message: message.trim(),
        });

        // Broadcast lời chúc mới tới TẤT CẢ các client đang xem
        io.emit('new_wish', newWish);

        if (callback) callback({ success: true, data: newWish });
      } catch (err) {
        console.error('❌ [Socket] Lỗi xử lý send_wish:', err);
        if (callback) callback({ success: false, message: err.message });
      }
    });

    socket.on('disconnect', () => {
      onlineUsers = Math.max(0, onlineUsers - 1);
      console.log(`🔌 [Socket] Client ngắt kết nối: ${socket.id} (Online: ${onlineUsers})`);
      io.emit('online_count', onlineUsers);
    });
  });
};

module.exports = setupWishSocket;
