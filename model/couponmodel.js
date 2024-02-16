const mongoose = require('mongoose');
require('dotenv').config();

const couponSchema = new mongoose.Schema({
    couponCode: {
      type: String,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
    },
    expireAt: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    email:{
      type: String
    },
    Discount_price:{
      type:Number
    },
    productName:{
      type:String
    }
  });

const Coupon = mongoose.model('coupon', couponSchema);
module.exports = Coupon;
