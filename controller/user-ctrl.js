// controllers/user-controller.js
const bcrypt = require('bcrypt');
const User = require('../model/usermodel');
const OTP = require('../model/otpmodel');
const Products = require('../model/productmodel')
const Categorie = require('../model/brandmodel')
const { sendOTP } = require('../controller/otpController');
const generateOTP = require('../utils/otpgenerator')

const userController = {


  getIndex: async(req, res) => {
    const useProduct = await Products.find().sort({product_image:1 });
    const useBrand = await Categorie.find({status:true}).limit(4);
    const useflagship = await Products.find({ phone_type:"Flagship phones",status:true})
    const useCameraphones = await Products.find({phone_type:"Camera phones"})
    const useBatterylife = await Products.find({phone_type:"Battery life champions"})
    const useflagshipkiller = await Products.find({phone_type:"Flagship killers"})
    const useGaming = await Products.find({phone_type:"Gaming phones"})

    res.render('get-index');
  },



  getSignUpPage: (req, res) => {
    res.render('sign-up');
  },



  signUp: async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const userExist = await User.findOne({ email: email });

      if (userExist) {
        res.render('sign-up', { message: 'Email already exists' });
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
          username: name,
          email: email,
          password: hashedPassword,
        };

        req.session.data = newUser;
        req.session.username = req.body.name;
        req.session.email = req.body.email;
        req.session.userLoggedin = true;
        req.session.signOtp = true;
        console.log(req.session);
        res.redirect('/user/otp-home');
      }
    } catch (error) {
      console.error(error);
    }
  },



  showOtpPage: (req, res) => {
    if (req.session.signOtp || req.session.forgot) {
      res.render('otp', { title: 'OTP' });
    } else {
      res.redirect('/sign-up');
    }
  },



  sendOtpHome: async (req, res) => {
    if (req.session.signOtp || req.session.forgot) {
      try {
        const email = req.session.email;
        console.log('Mail initiated');
        const otpSending = await sendOTP(email);
        res.status(200).redirect('/user/otp');
      } catch (err) {
        console.log(err);
        req.session.err = 'Sorry, cannot send OTP';
      }
    }
  },

  resendOtp: async (req, res) => {
    try {
        if (req.session && req.session.data && req.session.data.email) {
            const { email } = req.session.data;
            console.log(email);

            const newOtp = await generateOTP();

            await OTP.updateOne({ email }, { $set: { otp: newOtp } });
            await sendOTP(email);

            console.log("resend");
        } else {
            console.log("Email not found in session data.");
           
        }
    } catch (err) {
        console.log(err);
        
    }
},




  confirmOtp: async (req, res) => {
    try {
      const data = req.session.data;
      const Otp = await OTP.findOne({ email: data.email });

      if (Date.now() > Otp.expireAt) {
        await OTP.deleteOne({ email: data.email });
      } else {
        const hashed = Otp.otp;
        const code = req.body.otp;

        req.session.email = data.email;

        if (hashed == code) {
          const newUser = await User.create([data]);
          req.session.userLoggedin = true;
          req.session.signOtp = false;
          res.redirect('/user-home');
        } else {
          req.session.err = 'Invalid OTP';
          res.render('otp', { err: 'Invalid OTP' });
        }
      }
    } catch (err) {
      console.log(err);
    }
  },

  Productdeteals: async (req,res)=>{
    try {
      const id = req.params.id
      const item = await Products.find({_id:id})
      res.render('product-deteals',{item})
      
    } catch (error) {
      console.log(err);
      
    }
  },
  
};

module.exports = userController;