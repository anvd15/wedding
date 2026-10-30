const Wish = require('../models/Wish');

// Lấy danh sách lời chúc (mới nhất lên đầu)
exports.getWishes = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const wishes = await Wish.find().sort({ createdAt: -1 }).limit(limit);
    return res.status(200).json({
      success: true,
      count: wishes.length,
      data: wishes,
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách lời chúc:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách lời chúc',
      error: error.message,
    });
  }
};

// Gửi lời chúc mới (qua HTTP POST)
exports.createWish = async (req, res) => {
  try {
    const { name, side, message } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập họ tên' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung lời chúc' });
    }

    const newWish = await Wish.create({
      name: name.trim(),
      side: side || 'Bạn bè',
      message: message.trim(),
    });

    // Phát sự kiện WebSocket tới tất cả các client đang online
    const io = req.app.get('io');
    if (io) {
      io.emit('new_wish', newWish);
    }

    return res.status(201).json({
      success: true,
      message: 'Gửi lời chúc thành công!',
      data: newWish,
    });
  } catch (error) {
    console.error('Lỗi lưu lời chúc:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể gửi lời chúc',
      error: error.message,
    });
  }
};
