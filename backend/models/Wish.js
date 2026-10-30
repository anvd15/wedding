const mongoose = require('mongoose');

const wishSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập tên người gửi'],
      trim: true,
      maxlength: [100, 'Tên không quá 100 ký tự'],
    },
    side: {
      type: String,
      default: 'Bạn bè',
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Vui lòng nhập nội dung lời chúc'],
      trim: true,
      maxlength: [1000, 'Lời chúc không quá 1000 ký tự'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Wish', wishSchema);
