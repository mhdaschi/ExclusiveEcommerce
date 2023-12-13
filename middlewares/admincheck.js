const adminverify = (req, res, next) => {
    if (req.session.adminLoggedin) {
      console.log("Admin checked");
      next();
    } else {
      res.redirect('/login-home');
      console.log('else worked');
    }
  };

  const existingadmin=(req,res,next)=>{
    if(req.session.adminLoggedin){
        console.log("Admin auth checking");
        res.redirect("/admin/Dashboard")
    }else{
        next()
    }
}

  
  module.exports = { adminverify , existingadmin};
  