const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { stringify } = require('uuid');
require('dotenv').config();

// userschema
const usermodel = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },

    status: {
        type: Boolean,
        default: true
    },
    profilePhoto:{
        type:[String],
        required: true
    },

    address:[{
        name:{type:String},
        address:{type:String},
        city:{type:String},
        state:{type:String},
        pincode:{type:String},
        phone:{type:Number}
    }]
});

// Connect database
mongoose.connect(process.env.MONGOURL, {
    useNewUrlParser: true,
    useUnifiedTopology: false
}).then(() => {
    console.log("Database Connected");
}).catch((err) => {
    console.log(err);
});

const usercollection = mongoose.model('users', usermodel);
module.exports = usercollection;
