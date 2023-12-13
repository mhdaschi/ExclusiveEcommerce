const express=require('express')
const router=express.Router();
const {sendOTP}=require('../controller/otpController')


router.get("/",async (req,res)=>{
    try{
        const email=req.session.data.Email
        const createdOtp=await sendOTP({email})
        res.status(200).render("otp")
    }catch(err){
        throw(err);
    }
    
})

module.exports=router