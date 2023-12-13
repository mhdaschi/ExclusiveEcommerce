const mongoose=require ('mongoose')
require('dotenv').config()


const otpSchema=new mongoose.Schema({
    otp:{
        type:Number
      
    },
    email:{
        type:String
        
    },
    otpAdded:{
      type:Date
    },
    expireAt:{
      type:Date
    }
})

const OTP=mongoose.model('OTP',otpSchema)
module.exports=OTP