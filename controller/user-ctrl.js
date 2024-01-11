// controllers/user-controller.js
const bcrypt = require("bcrypt");
const express = require('express');
const flash = require('express-flash');
const session = require('express-session')
const User = require("../model/usermodel");
const OTP = require("../model/otpmodel");
const Products = require("../model/productmodel");
const Categorie = require("../model/brandmodel");
const Cart = require("../model/cartmodel");
const Order = require("../model/ordermodel")
const Wallet = require("../model/walletmodel")
const { sendOTP } = require("../controller/otpController");
const generateOTP = require("../utils/otpgenerator");
const mongoose = require('mongoose');
const Razorpay  = require('razorpay')
const { ObjectId } = require("mongodb");


const razorpay = new Razorpay({
  key_id: 'rzp_test_h2KMHrmhqDKgVl',
  key_secret: 'FprhnazqVcjTQToP8lGJykbW',
});





const userController = {
  getIndex: async (req, res) => {
    const useProduct = await Products.find().sort({ product_image: 1 });
    const useBrand = await Categorie.find({ status: true }).limit(4);
    const useflagship = await Products.find({
      phone_type: "Flagship phones",
      status: true,
    });
    const useCameraphones = await Products.find({
      phone_type: "Camera phones",
    });
    const useBatterylife = await Products.find({
      phone_type: "Battery life champions",
    });
    const useflagshipkiller = await Products.find({
      phone_type: "Flagship killers",
    });
    const useGaming = await Products.find({ phone_type: "Gaming phones" });

    res.render("get-index", {
      useProduct,
      useBrand,
      useflagship,
      useCameraphones,
      useBatterylife,
      useflagshipkiller,
      useGaming,
    });
  },

  getSignUpPage: (req, res) => {
    const msg = req.query.err;
    res.render("sign-up", { msg });
  },

  signUp: async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const userExist = await User.findOne({ email: email });

      if (userExist) {
        res.redirect("/sign-up?err=Email already exists");
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

        req.session.signOtp = true;
        console.log(req.session);
        res.redirect("/user/otp-home");
      }
    } catch (error) {
      console.error(error);
    }
  },

  showOtpPage: (req, res) => {
    if (req.session.signOtp || req.session.forgot) {
      res.render("otp", { title: "OTP" });
    } else {
      res.redirect("/sign-up");
    }
  },

  sendOtpHome: async (req, res) => {
    if (req.session.signOtp || req.session.forgot) {
      try {
        const email = req.session.email;
        console.log("Email in session:", email);
        console.log("Mail initiated");
        const otpSending = await sendOTP(email);
        console.log("OTP Sent:", otpSending);
        res.status(200).redirect("/user/otp");
      } catch (err) {
        console.log(err);
        req.session.err = "Sorry, cannot send OTP";
        res.redirect("/user/otp-home");
      }
    } else {
      res.redirect("/sign-up"); // Redirect to sign-up if session variables are not set
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

      if (!data || !data.email) {
        // Handle the case where data or data.email is undefined
        req.session.err = "Invalid session data";
        return res.render("otp", { err: "Invalid session data" });
      }

      const Otp = await OTP.findOne({ email: data.email });

      if (!Otp || Date.now() > Otp.expireAt) {
        // Handle the case where Otp is not found or has expired
        await OTP.deleteOne({ email: data.email });
        req.session.err = "OTP not found or has expired";
        return res.render("otp", { err: "OTP not found or has expired" });
      }

      const hashed = Otp.otp;
      const code = req.body.otp;

      req.session.email = data.email;

      if (hashed == code && req.session.signOtp) {
        const newUser = await User.create([data]);
        req.session.userLoggedin = true;
        req.session.signOtp = false;
        return res.redirect("/user-home");
      } else if (hashed == code && req.session.forgot) {
        req.session.forgot = false;
        return res.redirect("/user/GetforgottPchange");
      } else {
        req.session.err = "Invalid OTP";
        return res.render("otp", { err: "Invalid OTP" });
      }
    } catch (err) {
      console.log(err);

      req.session.err = "Error in processing OTP";
      res.render("otp", { err: "Error in processing OTP" });
    }
  },

  ForgotFirst: async (req, res) => {
    try {
      res.render("forgotfirst");
    } catch (error) {
      console.error(error);
    }
  },

  Postforgot: async (req, res) => {
    try {
      const { email } = req.body;
      const emailExist = await User.find({ email: email });

      if (emailExist.length > 0) {
        req.session.data = req.body;
        req.session.forgot = true;
        req.session.email = email;
        res.redirect("/user/otp-home");
      } else {
        res.redirect("/user/forgot?err=Email Not exists");
      }
    } catch (error) {
      console.error(error);
    }
  },

  GetforgottPchange: (req, res) => {
    try {
      res.render("forgottPchange");
    } catch (error) {
      console.error(error);
    }
  },

  PostforgottPchange: async (req, res) => {
    try {
      let email = req.session.email;

      let forgotPasswordData = req.body;

      const newPassword = forgotPasswordData.ForgotPassword;

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await User.updateMany(
        { email: email },
        { $set: { password: hashedPassword } }
      );

      res.redirect("/login-home?erorr=Password changed");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },

  Productdeteals: async (req, res) => {
    try {
      const id = req.params.id;
      const item = await Products.findOne({ _id: id });
      
      

      if (!item) {
        return res.status(404).send("page not found");
      }

      res.render("product-deteals", { item });
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  },
// GetCart route
GetCart: async (req, res) => {
  try {
    const email = req.session.user;
    const user = await User.findOne({ email });

    const cartItemsPipeline = [
      { $match: { user: user._id } },
      { $unwind: '$products' },
      {
        $project: {
          item: '$products.cartItem',
          quantity: '$products.quantity',
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'item',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      {
        $project: {
          item: 1,
          quantity: 1,
          productDetails: { $arrayElemAt: ['$productDetails', 0] },
        },
      },
      {
        $addFields: {
          'productDetails.totalPrice': {
            $multiply: [
              '$quantity',
              { $toDouble: '$productDetails.price' },
            ],
          },
        },
      },
    ];

    const cartItems = await Cart.aggregate(cartItemsPipeline);

    const totalPricePipeline = [
      ...cartItemsPipeline,
      {
        $group: {
          _id: null,
          total: {
            $sum: '$productDetails.totalPrice',
          },
        },
      },
    ];

    const totalPrice = await Cart.aggregate(totalPricePipeline);

    req.session.totalPrice = totalPrice;

    

    res.render('cart', { cartItems, totalPrice });
  } catch (error) {
    console.error('Error in GetCart:', error);
    res.status(500).send('Internal Server Error');
  }
},




 Getaddtocart: async (req, res) => {
  try {
    const productId = req.params.id;
    const email = req.session.user;

    const userData = await User.findOne({ email: email });

    if (!userData) {
      return res.status(404).send('User not found');
    }

    const userId = userData._id;

    const productExist = await Cart.findOne({ user: userId, 'products.cartItem': productId });
    console.log('................',productExist);

    if (productExist) {
      await Cart.updateOne(
        { user: userId, 'products.cartItem': productId },
        { $inc: { 'products.$.quantity': 1 } }
      );
      return res.redirect('/user/cart');
    } else {
      const userExist = await Cart.findOne({ user: userId });

      if (userExist) {
        
        await Cart.updateOne(
          { user: userId, _id: userExist._id },
          {
            $push: {
              products: {
                cartItem: productId,
                quantity: 1,
              },
            },
          }
        );
      } else {
        await Cart.create({
          user: userId,
          products: [
            {
              cartItem: productId,
              quantity: 1,
            },
          ],
        });
      }

      return res.redirect('/user/cart');
    }
  } catch (error) {
    console.error('Error in Getaddtocart:', error);
    return res.status(500).send('Internal Server Error');
  }
},

  RemoveCartItem: async (req, res) => {
    try {
        const productId = req.params.id;
        const email = req.session.user;
        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(404).send("Page not found");
        }

        const userId = user._id;
        const productObjectId = new mongoose.Types.ObjectId(productId);

        await Cart.updateOne({ user: userId }, { $pull: { products: { cartItem: productObjectId } } });

        res.redirect('/user/cart?msg="Your product has been removed"');
    } catch (error) {
        console.error("Error removing product from cart:", error);
        res.status(500).send("Internal Server Error");
    }
},


Userprofile: async (req, res) => {
  try {
    const email = req.session.user;
    const userData = await User.findOne({ email: email });
    res.render('profile', { userData });
  } catch (error) {
    console.error("Error :", error);
    res.status(500).send("Internal Server Error");
  }
},


EditeUserName: async (req, res) => {
  try {
    const userId = req.params.id;
    const newName = req.body.name; 
    await User.updateOne({ _id: userId }, { $set: { username: newName } });
    res.redirect('/user/profile?msg="User Name changed"');
  } catch (error) {
    console.error("Error :", error);
    res.status(500).send("Internal Server Error");
  }
},



ChangePassword: async (req, res) => {
  try {
      const email = req.session.user;
      const oldPassword = req.body.oldPassword;
      const newPassword = req.body.newPassword;

      const user = await User.findOne({ email: email });

      if (!user) {
          return res.status(404).json({ success: false, error: "User not found" });
      }

      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

      if (isPasswordValid) {
          const hashedPassword = await bcrypt.hash(newPassword, 10);

          await User.updateOne({ email: email }, { $set: { password: hashedPassword } });

          return res.json({ success: true, msg: "Password changed successfully" });
      } else {
          return res.json({ success: false, error: "The old password is not correct" });
      }
  } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
},


ProfilePhoto: async (req, res) => {
  try {
    const email = req.session.user
    const userImage = req.file ? req.file.filename : "";
    const userprofilePhoto = await User.updateOne({email: email},{$set:{profilePhoto: userImage } 
    });
    return res.json({true:"profile updated succesfully"})
    
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
},


ManageAddress: async (req,res) =>{
  try {
    const email = req.session.user
    const userData = await User.findOne({ email: email });
    res.render('manageAddress',{userData})
    
  } catch (error) {
    console.error("Error:", error); 
    res.status(500).send("Internal Server Error");
    
  }
},


AddAddress: async (req, res) => {
  try {
    const emaila = req.session.user;
    const { name, address, city, state, pincode, number } = req.body;
    const user = await User.findOne({ email: emaila });

    if (user) {
      if (user.address.length <= 3) {

        await User.updateOne(
          { email: emaila },
          {
            $push: {
              address: {
                name: name,
                address: address,
                city: city,
                state: state,
                pincode: pincode,
                phone: number,
              },
            },
          }
        );
        res.redirect('/user-manageAddress');
      } else {
        req.flash(
          'success',
          'Max Address limit reached!!! please delete existing address to add more'
        );
        res.redirect('/user-manageAddress');

      }
    } else {
  
      req.flash('error', 'User not found');
      res.status(404).redirect('/user/profile');
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
},

DeleteAddress: async (req, res) => {
  try {
    const emaila = req.session.user;
    const  {id} = req.params; 

    const result = await User.updateOne(
      { email: emaila },
      { $pull: { address: { _id: id } } } 
    );
    
    if (result.nModified > 0) {
      req.flash('true', 'Address deleted successfully');
    } else {
      req.flash('error', 'Address not found or could not be deleted');
    }
    res.redirect('/user-manageAddress');
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
},
 EditAddress : async (req, res) => {
  try {
    const id = req.params.id;
    const email = req.session.user;
    const { name, address, city, state, pincode, number } = req.body;

    const newAddress = {
      name,
      address,
      city,
      state,
      pincode,
      phone: number, 
    };

    const updatedUser = await User.findOneAndUpdate(
      { 'address._id': id },
      { $set: { 'address.$': newAddress } },
      { new: true }
    );

    res.redirect('/user-manageAddress');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
},

CheckOut: async (req, res) => {
  try {

    
    const email = req.session.user;
    


    
    const user = await User.findOne({ email: email });


    if (!user) {
      return res.status(404).send('User not found');
    }

    const userAddress = user 

 

    const userCartDataPipeline = [
      { $match: { user: user._id } },
      { $unwind: '$products' },
      {
        $project: {
          item: '$products.cartItem',
          quantity: '$products.quantity',
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'item',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      {
        $project: {
          item: 1,
          quantity: 1,
          productDetails: { $arrayElemAt: ['$productDetails', 0] },
        },
      },
      {
        $addFields: {
          'productDetails.totalPrice': {
            $multiply: [
              '$quantity',
              { $toDouble: '$productDetails.price' },
            ],
          },
        },
      },
    ];

    const userCartData = await Cart.aggregate(userCartDataPipeline);


    const TotalPrice = req.session.totalPrice 

    let i = 0;



    res.render('checkOutPage', { userAddress, i , userCartData, TotalPrice, });
  } catch (error) {
    console.error('Error in CheckOut:', error);
    res.status(500).send('Internal Server Error');
  }
},

OrderPlace: async (req, res) => {
  try {
    const email = req.session.user;
    const AddressId = req.body.address;
    const paymentMethod = req.body.paymentMethod;

    const user = await User.findOne({
      email: email,
      'address._id': AddressId,
    });

    if (!user) {
      console.log("No matching user found for the given criteria.");
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const addressData = user.address.find(address => address._id.toString() === AddressId);

    const userCartDataPipeline = [
      { $match: { user: user._id } },
      { $unwind: '$products' },
      {
        $project: {
          item: '$products.cartItem',
          quantity: '$products.quantity',
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: 'item',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      {
        $project: {
          item: 1,
          quantity: 1,
          productDetails: { $arrayElemAt: ['$productDetails', 0] },
        },
      },
      {
        $addFields: {
          'productDetails.totalPrice': {
            $multiply: [
              '$quantity',
              { $toDouble: '$productDetails.price' },
            ],
          },
        },
      },
    ];

    const userCartData = await Cart.aggregate(userCartDataPipeline);
    let orderTotalPrice = 0;

    const orderedProducts = userCartData.map(cartItem => {
      orderTotalPrice += cartItem.productDetails.totalPrice;

      return {
        orderedItem: cartItem.productDetails.product_name,
        image: cartItem.productDetails.product_image[0],
        colour: cartItem.productDetails.productColor,
        price: cartItem.productDetails.price,
        quantity: cartItem.quantity,
      };
    });



    let cart = await Cart.findOne({ user: user._id }, { products: 1, _id: 0 });

    if (cart) {
      for (let i = 0; i < cart.products.length; i++) {
        const cartItem = cart.products[i];
        await Products.updateOne({ _id: cartItem.cartItem }, { $inc: { stock: -cartItem.quantity } });
      }

      const userID = user._id;
      await Cart.deleteOne({ user: userID });
    }

    if (paymentMethod === 'Online') {
      const orderCreateData = {
        nameuser: addressData.name,
        email: email,
        phonenumber: addressData.phone,
        orderTotalPrice: orderTotalPrice,
        orderaddress: addressData.address,
        city: addressData.city,
        state: addressData.state,
        pincode: addressData.pincode,
        orderAdded: new Date(),
        orderedproducts: orderedProducts,
        PaymenMethod: "Razorpay",
      };
  
      const orderCreate = await Order.create(orderCreateData);
      const orderAmount = orderTotalPrice;
      const currency = 'INR';

      const options = {
        amount: orderAmount*100,
        currency,
        receipt: '' + orderCreate._id,
        payment_capture: 1,
      };

      const razorpayOrder = await razorpay.orders.create(options);

      return res.json({
        razorpayKey: 'rzp_test_h2KMHrmhqDKgVl',
        orderAmount,
        currency,
        orderId: razorpayOrder.id,
      });
    } else if (paymentMethod === 'COD') {
      const orderCreateData = {
        nameuser: addressData.name,
        email: email,
        phonenumber: addressData.phone,
        orderTotalPrice: orderTotalPrice,
        orderaddress: addressData.address,
        city: addressData.city,
        state: addressData.state,
        pincode: addressData.pincode,
        orderAdded: new Date(),
        orderedproducts: orderedProducts,
        PaymenMethod: "COD",
      };
  
      const orderCreate = await Order.create(orderCreateData);
      return res.json({ codSuccess: true, message: "Success" });
    } else {
      return res.status(400).json({ error: 'Invalid payment method' });
    }
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ success: false, error: "Error placing order" });
  }
},





conformOrder : (req, res) => {

  try {
    res.render('conformOrder');
    
  } catch (error) {
    console.error("Error rendering order page:", error);
    res.status(500).json({ success: false, error: "Error rendering order page" });
    
  }
},

GetOrder : async (req,res) =>{
  try {
    const email = req.session.user;
    const orderData = await Order.find({email:email})
    res.render('userorder',{orderData})

    
  } catch (error) {
    console.error("Error rendering order page:", error);
    res.status(500).json({ success: false, error: "Error rendering order page" });
    
  }
},

CancelOrder : async (req,res)=>{
  try {
    const ID = req.params.id;
    const data = "Cancelled"
    const cancel = await Order.updateOne({_id:ID},{$set:{orderStatus:data}})
    
  } catch (error) {
    console.error("Error cancel order :", error);
    res.status(500).json({ success: false, error: "Error cancel order " });
    
  }
},
returnOrder : async (req,res) =>{
  try {
    const ID = req.params.id;
     
    
  } catch (error) {
    console.error("Error cancel order :", error);
    res.status(500).json({ success: false, error: "Error cancel order " });
  }
},


  

};

module.exports = userController;
