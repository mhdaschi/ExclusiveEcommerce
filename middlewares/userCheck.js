const userMiddleware=(req,res,next)=>{
    console.log(req.session)
    if (req.session && req.session.userLoggedin) {
      next();
    } else {
      res.redirect('/login-home');
      }
}


module.exports = {userMiddleware}