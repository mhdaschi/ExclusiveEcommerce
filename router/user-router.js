// routes/user-routes.js
const express = require('express');
const router = express.Router();

const userController = require('../controller/user-ctrl');
const loginController = require('../controller/login-ctrl');
const otpController = require('../controller/otpController');

const cacheControlMiddleware = require('../middlewares/cacheControlMiddleware');
const { userMiddleware } = require('../middlewares/userCheck');
const {adminverify,existingadmin} = require('../middlewares/admincheck');



// Home route
router.get('/',existingadmin, userController.getIndex);

// Login home route
router.get('/login-home',existingadmin, loginController.loginHome);

// User home route with cache control middleware
router.get('/user-home',userMiddleware,cacheControlMiddleware, loginController.UserHome);

// Sign-up page route
router.get('/sign-up', userController.getSignUpPage);

// User sign-up processing route
router.post('/user/signup', userController.signUp);

// Login page route
router.get('/login',adminverify, loginController.GetLogin);

// User login processing route
router.post('/login', loginController.PostLogin);

// Product deteals page

router.get('/user/product/Details/:id',userController.Productdeteals)

// OTP home route
router.get('/user/otp-home', userController.sendOtpHome);

// OTP page route
router.get('/user/otp', userController.showOtpPage);

// Resend otp route

router.get('/user/resendotp',userController.resendOtp)

// OTP confirmation processing route
router.post('/user/otp', userController.confirmOtp);

module.exports = router;