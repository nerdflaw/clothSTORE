const mongoose = require("mongoose")
require('dotenv').config();

const couponSchema = new mongoose.Schema({
  coupon: {
    type: String,
    required: true,
    unique: true
  },
  couponCode: { type: String, default: null },
  couponValue: { type: Number, default: 0 },
  createdDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: Boolean,
    default: true
  }
  
});

const Coupon = mongoose.model('Coupons', couponSchema);

module.exports = Coupon;
