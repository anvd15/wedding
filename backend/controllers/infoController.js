const WeddingInfo = require('../models/WeddingInfo');

// Lấy thông tin đám cưới
exports.getWeddingInfo = async (req, res) => {
  try {
    let info = await WeddingInfo.findOne();
    if (!info) {
      // Seed dữ liệu mặc định ban đầu
      info = await WeddingInfo.create({
        groom: {
          name: 'Đức An',
          fullName: 'Nguyễn Đức An',
          parents: 'Ông Nguyễn Văn A & Bà Trần Thị B',
          bank: {
            bankName: 'Vietcombank',
            accountNumber: '1012345678',
            accountName: 'NGUYEN DUC AN',
            qrCodeUrl: '/photos/DSC_1220.jpg',
          },
        },
        bride: {
          name: 'Bích Thủy',
          fullName: 'Trần Bích Thủy',
          parents: 'Ông Trần Văn C & Bà Lê Thị D',
          bank: {
            bankName: 'Techcombank',
            accountNumber: '1909876543',
            accountName: 'TRAN BICH THUY',
            qrCodeUrl: '/photos/DSC_1246.jpg',
          },
        },
        weddingDate: '2026-11-20T11:00:00',
        events: [
          {
            title: 'LỄ VU QUY',
            time: '09:00',
            date: '2026-11-20',
            location: 'Tư gia Nhà Gái',
            address: 'Số 123 Đường Hoa Hồng, Quận 1, TP. HCM',
            mapUrl: 'https://maps.google.com',
          },
          {
            title: 'LỄ THÀNH HÔN',
            time: '11:00',
            date: '2026-11-20',
            location: 'Tư gia Nhà Trai',
            address: 'Số 456 Đường Hướng Dương, Quận Bình Thạnh, TP. HCM',
            mapUrl: 'https://maps.google.com',
          },
          {
            title: 'TIỆC CƯỚI',
            time: '18:00',
            date: '2026-11-20',
            location: 'Trung tâm Hội nghị Tiệc cưới The Grand Palace',
            address: 'Sảnh Diamond - 142/18 Cộng Hòa, Phường 4, Quận Tân Bình, TP. HCM',
            mapUrl: 'https://maps.google.com',
          },
        ],
        audioUrl: '/music/idodigital.mp3',
      });
    }

    return res.status(200).json({
      success: true,
      data: info,
    });
  } catch (error) {
    console.error('Lỗi lấy thông tin đám cưới:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin',
      error: error.message,
    });
  }
};

// Cập nhật thông tin đám cưới
exports.updateWeddingInfo = async (req, res) => {
  try {
    let info = await WeddingInfo.findOne();
    if (!info) {
      info = await WeddingInfo.create(req.body);
    } else {
      info = await WeddingInfo.findByIdAndUpdate(info._id, req.body, { new: true });
    }
    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: info,
    });
  } catch (error) {
    console.error('Lỗi cập nhật thông tin:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật thông tin',
      error: error.message,
    });
  }
};
