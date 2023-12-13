const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
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
    }
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
