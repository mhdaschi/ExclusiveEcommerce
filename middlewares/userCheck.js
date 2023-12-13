const userMiddleware=(req,res,next)=>{
    console.log(req.session)
    if (!req.session.userLoggedin) {
        res.redirect('/login-home');
      } else {
        next();
      }
}




module.exports = {userMiddleware}