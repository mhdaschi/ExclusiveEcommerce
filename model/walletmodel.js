const mongoose = require('mongoose');
require('dotenv').config();
const walletschema = new mongoose.Schema({
    username : {
        type : String
    },
    email :{
        type : String
    },
    Timestamp:{
        type : Date

    },
    


});

const wallet = mongoose.model('wallet',walletschema)
module.exports = wallet