const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true }, // S3 object key, ví dụ: photos/DSC_1220.jpg
    url: { type: String, required: true }, // URL public để FE hiển thị
    width: { type: Number },
    height: { type: Number },
    tags: { type: [String], default: [] }, // ví dụ: ['slider'], ['hero', 'slider'], ['gallery']
    order: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Photo', photoSchema);
