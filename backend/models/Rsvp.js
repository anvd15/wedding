const mongoose = require('mongoose');

const rsvpSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập họ tên của bạn'],
      trim: true,
      maxlength: [100, 'Họ tên không quá 100 ký tự'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    guestType: {
      type: String,
      enum: ['groom', 'bride'],
      default: 'groom',
    },
    attending: {
      type: String,
      enum: ['yes', 'no'],
      default: 'yes',
    },
    count: {
      type: Number,
      min: 1,
      max: 10,
      default: 1,
    },
    wishes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Rsvp', rsvpSchema);
