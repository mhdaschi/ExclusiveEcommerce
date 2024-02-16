
const User = require("../model/usermodel");
const userMiddleware= async(req,res,next)=>{
  const email = req.session.user;
  const uservalid = await User.find({email: email,status:true})

    if (req.session && req.session.userLoggedin && uservalid.length > 0 ){
      next();
    } else {
      res.redirect('/login-home');
      }
}


module.exports = {userMiddleware}