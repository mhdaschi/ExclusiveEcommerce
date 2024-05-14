const mongoose = require('mongoose');
require('dotenv').config();

const OrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Types.ObjectId
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
    type: mongoose.Types.ObjectId
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
  paymentStatus: {
    type: String,
  }

});

const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;
