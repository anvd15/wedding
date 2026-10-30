const Rsvp = require('../models/Rsvp');
const Wish = require('../models/Wish');

// Lấy danh sách phản hồi RSVP
exports.getRsvps = async (req, res) => {
  try {
    const rsvps = await Rsvp.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: rsvps.length,
      data: rsvps,
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách RSVP:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách RSVP',
      error: error.message,
    });
  }
};

// Gửi phản hồi RSVP mới
exports.createRsvp = async (req, res) => {
  try {
    const { name, phone, guestType, attending, count, wishes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập họ tên của bạn' });
    }

    const newRsvp = await Rsvp.create({
      name: name.trim(),
      phone: phone ? phone.trim() : '',
      guestType: guestType || 'groom',
      attending: attending || 'yes',
      count: count ? parseInt(count) : 1,
      wishes: wishes ? wishes.trim() : '',
    });

    // Nếu khách có để lại lời chúc trong form RSVP, tự động lưu vào bảng Wish và bắn socket!
    if (wishes && wishes.trim()) {
      const sideName = guestType === 'groom' ? 'Nhà Trai' : 'Nhà Gái';
      const createdWish = await Wish.create({
        name: name.trim(),
        side: sideName,
        message: wishes.trim(),
      });

      const io = req.app.get('io');
      if (io) {
        io.emit('new_wish', createdWish);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Cảm ơn bạn đã xác nhận tham dự!',
      data: newRsvp,
    });
  } catch (error) {
    console.error('Lỗi lưu RSVP:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể gửi xác nhận',
      error: error.message,
    });
  }
};
