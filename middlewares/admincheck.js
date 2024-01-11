const adminverify = (req, res, next) => {
    if (req.session.adminLoggedin) {
      next();
    } else {
      res.redirect('/login-home');
    }
  };

  const existingadmin=(req,res,next)=>{
    if(req.session.adminLoggedin){
        res.redirect("/admin/Dashboard")
    }else if (req.session.userLoggedin) {
        res.redirect("/user-home")

    } else  {
      
        next()
    }
}

  
  module.exports = { adminverify , existingadmin};
  