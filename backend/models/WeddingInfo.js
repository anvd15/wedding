const mongoose = require('mongoose');

const weddingInfoSchema = new mongoose.Schema(
  {
    groom: {
      name: { type: String, default: 'Đức An' },
      fullName: { type: String, default: 'Nguyễn Đức An' },
      parents: { type: String, default: 'Ông Nguyễn Văn A & Bà Trần Thị B' },
      bank: {
        bankName: { type: String, default: 'Vietcombank' },
        accountNumber: { type: String, default: '1012345678' },
        accountName: { type: String, default: 'NGUYEN DUC AN' },
        qrCodeUrl: { type: String, default: '/photos/DSC_1220.jpg' },
      },
    },
    bride: {
      name: { type: String, default: 'Bích Thủy' },
      fullName: { type: String, default: 'Trần Bích Thủy' },
      parents: { type: String, default: 'Ông Trần Văn C & Bà Lê Thị D' },
      bank: {
        bankName: { type: String, default: 'Techcombank' },
        accountNumber: { type: String, default: '1909876543' },
        accountName: { type: String, default: 'TRAN BICH THUY' },
        qrCodeUrl: { type: String, default: '/photos/DSC_1246.jpg' },
      },
    },
    weddingDate: {
      type: String,
      default: '2026-11-20T11:00:00',
    },
    events: [
      {
        title: { type: String },
        time: { type: String },
        date: { type: String },
        location: { type: String },
        address: { type: String },
        mapUrl: { type: String },
      },
    ],
    audioUrl: {
      type: String,
      default: '/music/idodigital.mp3',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('WeddingInfo', weddingInfoSchema);
