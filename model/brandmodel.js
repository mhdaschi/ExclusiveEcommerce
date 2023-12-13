const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const brandmodel = new mongoose.Schema({
    brand: {
        type: String,
        required:true,
        unique :true
        
    },
    image :{
        type:String,
        required:true
    },

    status: {
        type: Boolean,
        default: true
    },
    created_at:{
        type:Date,
        default:Date.now
        
    },
  
})

mongoose.connect(process.env.MONGOURL,{
    useNewUrlParser: true,
    useUnifiedTopology: false

}).then(() => {
    console.log("brand Database Connected")
}).catch((err) =>{
    console.log(err);
});

const brandcollection = mongoose.model('brand', brandmodel);
module.exports = brandcollection