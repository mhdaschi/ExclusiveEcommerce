const mongoose = require('mongoose');
require('dotenv').config();

const OrderSchema = new mongoose.Schema({
  nameuser: {
    type: String,
  },
  phonenumber: {
    type: Number,
  },
  email: {
    type: String,
  },
  orderTotalPrice: {
    type: String,
  },
  orderedproducts: [{
    orderedItem: String,
    image: String, 
    colour: String,
    price: Number,
    quantity: Number,
  }],
  orderStatus: {
    type: String,
    default: "pending",
  },
  orderaddress: {
    type: String,
  },
  city: {
    type: String,
  },
  state: {
    type: String,
  },
  pincode: {
    type: Number,
  },
  orderAdded: {
    type: Date,
  },
  deliverdAt: {
    type: Date,
  },
  PaymenMethod: {
    type: String,
  },
});

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;
