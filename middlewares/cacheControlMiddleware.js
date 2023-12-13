const cacheControlMiddleware = (req, res, next) => {
  if (req.session.userLoggedin) {
    // If user is logged in, disable caching
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
  } else {
   
    res.header('Cache-Control', 'public, max-age=3600'); 
  }
  next();
};
  
  module.exports = cacheControlMiddleware;
 
