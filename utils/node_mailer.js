const nodemailer = require("nodemailer");
const { AUTH_MAIL, AUTH_PASS} = process.env;
let mailTransporter=nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user:AUTH_MAIL,
        pass:AUTH_PASS,
    }
})
mailTransporter.verify((error,success)=>{
    if(error){
        console.log(error);
    }else{
        console.log("email ready");
        console.log(success);
    }
})
const sendEmail=async (mailOptions)=>{
    try{
        console.log('.-.-.-.-.-.-.-.');
        await mailTransporter.sendMail(mailOptions)
        console.log("email sended");
        
        return;
    }catch(err){
        throw err;
        console.log(err)
    }
}

module.exports=sendEmail;