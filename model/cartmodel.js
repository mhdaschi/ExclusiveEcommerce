const mongoose = require('mongoose');
require('dotenv').config();

const cartSchema = new mongoose.Schema({
    user: mongoose.Types.ObjectId,
    products: [{
        cartItem: mongoose.Types.ObjectId,
        quantity: Number,
    
    }],
    couponcount :Number,
    couponcode: String,
    resetcoupon:{
    type:Boolean,
    default: false,
    }
});

const cartModel = mongoose.model('Cart', cartSchema);
module.exports = cartModel;
