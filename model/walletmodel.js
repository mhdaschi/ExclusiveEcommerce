
// Importing dependencies
const mongoose = require('mongoose');
require('dotenv').config();

// Defining Schema
const walletmodel = new mongoose.Schema({
    userId: mongoose.Types.ObjectId,
    wallettotalAmount: { type: Number, default: 0 },
    wallet: [{
        balanceamount: { type: String, default: '0' },
        transactionType: { type: String },
        Timestamp: { type: Date, default: Date.now },
        description: { type: String }
    }]
});

// Defining Model
const Walletcollection = mongoose.model('wallet', walletmodel);

// Exporting Model
module.exports = Walletcollection;
