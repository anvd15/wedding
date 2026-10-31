const Photo = require('../models/Photo');

// Lấy danh sách ảnh cưới (đã upload lên S3), sắp xếp theo order
exports.getPhotos = async (req, res) => {
  try {
    const photos = await Photo.find().sort({ order: 1 });
    return res.status(200).json({
      success: true,
      data: photos,
    });
  } catch (error) {
    console.error('Lỗi lấy danh sách ảnh:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách ảnh',
      error: error.message,
    });
  }
};
