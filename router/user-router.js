// routes/user-routes.js
const express = require('express');
const router = express.Router();

const userController = require('../controller/user-ctrl');
const loginController = require('../controller/login-ctrl');
const otpController = require('../controller/otpController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadDirectory = 'uploads';


const { userMiddleware } = require('../middlewares/userCheck');
const {adminverify,existingadmin} = require('../middlewares/admincheck');



// Create upload directory if it doesn't exist
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory);
  }
  
  // Multer storage configuration
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDirectory);
    },
    filename: function (req, file, cb) {
      const filename = Date.now() + path.extname(file.originalname);
      cb(null, filename);
    },
  });
  
  // Multer file filter configuration
  const fileFilter = function (req, file, cb) {
    const allowedFileTypes = /jpeg|jpg|png|gif/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);
  
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      console.error('Error: Images only!');
      cb('Error: Images only!');
    }
  };
  
  // Multer configuration
  const upload = multer({ storage: storage, fileFilter: fileFilter });
  
  




// Home route
router.get('/',existingadmin, userController.getIndex);

// Login home route
router.get('/login-home',existingadmin, loginController.loginHome);

// User home route with cache control middleware
router.get('/user-home',userMiddleware, loginController.UserHome);

// Sign-up page route
router.get('/sign-up',existingadmin, userController.getSignUpPage);

// User sign-up processing route
router.post('/user/signup',existingadmin, userController.signUp);

// Login page route
router.get('/login',existingadmin, loginController.loginHome);

// User login processing route
router.post('/login',existingadmin, loginController.PostLogin);

// forgot 
router.get('/user/forgot',userController.ForgotFirst)

// post forgot
router.post('/user/forgot',userController.Postforgot)

// logout 
router.get('/logout',loginController.Getlogout);

// Product deteals page

router.get('/user/product/Details/:id', userController.Productdeteals);

// OTP home route
router.get('/user/otp-home', userController.sendOtpHome);

// OTP page route
router.get('/user/otp', userController.showOtpPage);

// Resend otp route

router.get('/user/resendotp',userController.resendOtp)

// OTP confirmation processing route
router.post('/user/otp', userController.confirmOtp);

// update Forgot Pass
router.get('/user/GetforgottPchange',userController.GetforgottPchange)

// update Forgot Pass
router.post('/user/forgot/updatepass',userController.PostforgottPchange)

// get cart
router.get('/user/cart',userMiddleware,userController.GetCart)

// get add to cart
router.get('/user/addToCart/:id', userMiddleware, userController.Getaddtocart);

// cart product remove
router.post('/user/cartItems/remove/:id',userMiddleware, userController.RemoveCartItem)

// user profile
router.get('/user/profile',userMiddleware, userController.Userprofile)

//edite username
router.post('/user/editProfile/name/:id',userMiddleware,userController.EditeUserName)

// change password
router.post('/user-changePassword',userMiddleware,userController.ChangePassword)

// profile picture
router.post('/user-profileImage', upload.single('profileimage'), userController.ProfilePhoto);

//manage address
router.get('/user-manageAddress',userMiddleware,userController.ManageAddress)

//Add Address
router.post('/user/addAddress',userMiddleware,userController.AddAddress)

//Delete Address
router.post('/user/deleteAddress/:id',userMiddleware,userController.DeleteAddress)

//Edit Address
router.post('/user/editAddress/:id',userMiddleware,userController.EditAddress) 

//CheckOut
router.get('/user/checkout', userMiddleware, userController.CheckOut);

//Place Order
router.post('/place/order',userMiddleware,userController.OrderPlace)

//conform order
router.get('/user-Orderconfirmation',userMiddleware,userController.conformOrder)

//order page
router.get('/user/orders',userMiddleware,userController.GetOrder)

//order cancel
router.post('/user/order/cancel/:id',userMiddleware,userController.CancelOrder)

//order return
router.post('/user/order/return/:id',userMiddleware,userController.returnOrder)

//user Wallet
router.get('/user/wallet',userMiddleware,userController.GetWallet)

//Update cart Qundity
router.post('/user/change/quantity',userMiddleware,userController.cartquandity)

//User coupon
router.get('/user/coupon',userMiddleware,userController.UserCoupen)

//User Apply coupon
router.post('/user/apply/coupon',userMiddleware,userController.ApplyCoupon)

//user remove coupon
router.post('/user/remove/coupon',userMiddleware,userController.RemoveCoupon)

//razorpay webhook
router.post('/user-Orderfail',userMiddleware,userController.paimentFail)

//buy now
router.get('/user/buynow/:id',userMiddleware,userController.buyNow)

//buy now orderplace
router.post('/placebuy/order',userMiddleware,userController.buyNowOrderplace)

//view all flagship
router.post('/user/ViewAll/FlagshipPhonesproduct',userMiddleware,userController.viewAllflagship)

//view all flagshipkiller
router.post('/user/allflagshipkiller/product',userMiddleware,userController.viewAllFlagkiller)

//Browse by brand
router.get('/viewall/category/:id',userMiddleware,userController.browsebybrand)

//Filter 
router.post('/user/productsfilter',userMiddleware,userController.filter)

//user serch product
router.post('/user/product/serch',userMiddleware,userController.usersechProduct) 

//download invoice
router.get('/download/invoice/:id',userMiddleware,userController.downloadPdf)

//User shop
router.get('/user/shop',userMiddleware,userController.UserShop)

//User About
router.get('/user/about',userMiddleware,userController.About)

//index About
router.get('/about',existingadmin,userController.gtAbout)

//index Contact
router.get('/contact',existingadmin,userController.contact)

//index Contact
router.get('/user/contact',userMiddleware,userController.userContact)



module.exports = router;