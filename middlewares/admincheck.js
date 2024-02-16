const User = require("../model/usermodel");

const adminverify = (req, res, next) => {
    if (req.session.adminLoggedin) {
      next();
    } else {
      res.redirect('/login-home');
    }
  };

  const existingadmin= async(req,res,next)=>{
    const email = req.session.user;
    const uservalid = await User.find({email: email,status:true})
    if(req.session.adminLoggedin){
        res.redirect("/admin/Dashboard")
    }else if (req.session.userLoggedin && uservalid.length > 0) {
        res.redirect("/user-home")

    } else  {
      
        next()
    }
}

  
  module.exports = { adminverify , existingadmin};
  