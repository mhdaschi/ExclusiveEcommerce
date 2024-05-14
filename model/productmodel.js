const mongoose = require('mongoose');
require('dotenv').config();

const productmodel = new mongoose.Schema({
    product_name:{
     type: String,
    require:true
    },
    created_at:{
        type:Date,
        default:Date.now
        
    },
    last_updated: {
        type: Date,
        default: Date.now
    },
    stock:{
        type:Number ,
        required: true

    },
    brand: {
    type:  mongoose.Types.ObjectId,
    required : true,
    
    
    },
    price:{
        type:Number,
        required:true

    },
    variant:{
        type:String,
        required:true
    },
    description:{
       type:String,
       required:true 
    },
    phone_type:{
        type:String,
        required:true
    },
    productColor:{
        type:String,
        required:true

    },
    status: {
        type: Boolean,
        default: true
    },
    product_image:{
        type:[String],
        required: true
    }
   



})
const ProductModel = mongoose.model('Product', productmodel);
module.exports = ProductModel;
