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
const Coupon  = require("../model/couponmodel")
const Wallet = require("../model/walletmodel")
const { sendOTP } = require("../controller/otpController");
const generateOTP = require("../utils/otpgenerator");
const mongoose = require('mongoose');
const Razorpay  = require('razorpay')
const easyinvoice = require('easyinvoice');
const global = require('../global/globalfunction');



const razorpay = new Razorpay({
  key_id: 'rzp_test_h2KMHrmhqDKgVl',
  key_secret: 'FprhnazqVcjTQToP8lGJykbW',
});





const userController = {
  getIndex: async (req, res) => {
    try {
      const useProduct = await Products.find().limit(10);
      const use2Product = await Products.find().skip(10)
      const useBrand = await Categorie.find({status:true}).limit(3);

      const useflagship = await Products.find({ phone_type:"Flagship phones",status:true})
      const useCameraphones = await Products.find({phone_type:"Camera phones"})
      const useBatterylife = await Products.find({phone_type:"Battery life champions"})
      const useflagshipkiller = await Products.find({phone_type:"Flagship killers"})
      const useGaming = await Products.find({phone_type:"Gaming phones"})
      res.render("get-index", {useBrand,use2Product,useflagship,useCameraphones,useBatterylife,useflagshipkiller,useGaming,useProduct,});
      
    } catch (error) {
      console.error(error);
      res.render('500')
      
    }
   
  },

  getSignUpPage: (req, res) => {
    try {
      const msg = req.query.err;
    res.render("sign-up", { msg });
      
    } catch (error) {
      console.error(error);
      res.render('500')
      
    }
    
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
      res.render('500')
    }
  },

  showOtpPage: (req, res) => {
    if (req.session.signOtp || req.session.forgot) {
      res.render("otp", { title: "OTP",err:'' });
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
      res.render('500')
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
        return res.render("otp", { err: "OTP has expired" });
      }

      const hashed = Otp.otp;
      const code = req.body.otp;

      req.session.user = data.email;
      req.session.userLoggedin = true;


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
      res.render('500')
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
      res.render('500')
    }
  },

  GetforgottPchange: (req, res) => {
    try {
      res.render("forgottPchange");
    } catch (error) {
      console.error(error);
      res.render('500')
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
      const loggedUser=await global.findLoggedUser(req.session.user)
      const cartNo = await global.cartNo(loggedUser[0]._id)



      res.render("product-deteals", { item ,cartNo});
    } catch (error) {
      console.log(error);
      res.status(500).render('500')
    }
  },
// GetCart route
GetCart: async (req, res) => {
  try {
    const email = req.session.user;
    const user = await User.findOne({ email });
    const discountPrice = req.session.coupendiscount ? req.session.coupendiscount : 0;

    const CouponCode  = req.session.couponCode ? req.session.couponCode : "";

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
          // 'productDetails.couponDiscount': discountPrice,
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
          CouponDiscount: { $first: discountPrice },
          subTotal: {
            $sum: '$productDetails.totalPrice',
          }, 
        },
      },
      {
        $project: {
          _id: 0,
          total: {
            $subtract: ['$total', '$CouponDiscount'],
          },

          CouponDiscount: 1,
          subTotal:1

        },
      },
    ];
    
    
    
    const totalPrice = await Cart.aggregate(totalPricePipeline);

    req.session.totalPrice = totalPrice;
    const loggedUser=await global.findLoggedUser(req.session.user)
    const cartNo = await global.cartNo(loggedUser[0]._id)

    let success = false
    console.log(totalPrice,'------------------------------------');
    res.render('cart', { cartItems, totalPrice, discountPrice ,cartNo,CouponCode,success});
  } catch (error) {
    console.error('Error in GetCart:', error);
    res.status(500).render('500')
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
    const productQuantity = await Products.findOne({ _id: productId }, { _id: 0, stock: 1 });

    if (!productQuantity) {
      return res.status(404).send('Product not found');
    }

    const stock = productQuantity.stock;

    const productExist = await Cart.findOne({ user: userId, 'products.cartItem': productId });

    if (productExist) {
      if (stock > 0) {
        const product = productExist.products.find(item => item.cartItem.equals(productId));

        if (product) {
          if (stock - 1 >= product.quantity) {
            await Cart.updateOne(
              { user: userId, 'products.cartItem': productId },
              { $inc: { 'products.$.quantity': 1 } }
            );
            return res.redirect('/user/cart');
          } else {
            const item = await Products.findOne({ _id: productId });
      
      

            if (!item) {
              return res.status(404).send("page not found");
            }
            const loggedUser=await global.findLoggedUser(req.session.user)
            const cartNo = await global.cartNo(loggedUser[0]._id)
      
            res.render("product-deteals", { item, message: "Only This Much Stock Available",cartNo });

          }
        } else {
          console.log('Product not found in the cart.');
        }
      } else {
        console.log('No stock available for this product.');
      }
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
    return res.status(500).render('500')

  }
},

cartquandity : async (req,res) =>{
  try {
    const productId = req.body.productId;
    const count = req.body.count;
    const email = req.session.user;
    const userData = await User.findOne({ email: email });
    const userId = userData._id;

  
    await Cart.updateOne(
      { user: userId, 'products.cartItem': productId, },
      { $inc: { 'products.$.quantity': count } }
    );
    let cart = await Cart.findOne(
      { user: userId, 'products.cartItem': productId },
      { 'products.$': 1 }
    );
    let allCartData = await Cart.find({ user: userId });
    let totalPrice = 0;

    for (const cartData of allCartData) {
        for (const item of cartData.products) {
            const productDetails = await Products.findById(item.cartItem);

            if (productDetails) {
                totalPrice += productDetails.price * item.quantity;
            }
        }
    }

  
   let productPrice = await Products.find({_id:productId},{price:1,_id:0})
   let eachProductPrice = productPrice[0].price
   let quantity;
  if (cart && cart.products && cart.products.length > 0) {
      quantity = cart.products[0].quantity;
  }

  let overAllPrice 
  if (req.session.coupendiscount) {
    overAllPrice = req.session.coupendiscount;
  } else{
    overAllPrice = 0;
  }

  let productStock = await Products.findOne({_id:productId})
  let availableStock = productStock.stock
    res.json({success:true,quantity,totalPrice,eachProductPrice,overAllPrice,availableStock})
    
  } catch (error) {
    console.error('Error in :', error);
    res.status(500).render('500')
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
        const cartupdate = await Cart.updateOne({user: user._id},{$set:{couponcount:0}})


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
    const loggedUser=await global.findLoggedUser(req.session.user)
    const cartNo = await global.cartNo(loggedUser[0]._id)
    res.render('profile', { userData ,cartNo});
  } catch (error) {
    console.error("Error :", error);
    res.status(500).render('500')
  }
},


EditeUserName: async (req, res) => {
  try {
    const userId = req.params.id;
    const newName = req.body.username; 
    const Phone = req.body.Phone;
    await User.updateOne({ _id: userId }, { $set: { username: newName , Phone:Phone } });
    res.redirect('/user/profile?msg="User Name changed"');
  } catch (error) {
    console.error("Error :", error);
    res.status(500).render('500')
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
      res.status(500).render('500')
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
    res.status(500).render('500')
  }
},


ManageAddress: async (req,res) =>{
  try {
    const email = req.session.user
    const userData = await User.findOne({ email: email });
    const loggedUser=await global.findLoggedUser(req.session.user)
    const cartNo = await global.cartNo(loggedUser[0]._id)
    res.render('manageAddress',{userData,cartNo})
    
  } catch (error) {
    console.error("Error:", error); 
    res.status(500).render('500')
    
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
    res.status(500).render('500')
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
    res.status(500).render('500')
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
    res.status(500).render('500')
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

    const discountPrice = req.session.coupendiscount ? req.session.coupendiscount : 0;

    const totalPricePipeline = [
      ...userCartDataPipeline,
      {
        $group: {
          _id: null,
          total: {
            $sum: '$productDetails.totalPrice',
          },
          CouponDiscount: { $sum: discountPrice },
          subTotal: {
            $sum: '$productDetails.totalPrice',
          }, 
        },
      },
      {
        $project: {
          _id: 0,
          total: {
            $subtract: ['$total', '$CouponDiscount'],
          },

          CouponDiscount: 1,
          subTotal:1

        },
      },
    ];
    
    const totalPrice = await Cart.aggregate(totalPricePipeline);
    

    let i = 0;
    const loggedUser=await global.findLoggedUser(req.session.user)
    const cartNo = await global.cartNo(loggedUser[0]._id)



    res.render('checkOutPage', { userAddress, i , userCartData, totalPrice, discountPrice,cartNo });
  } catch (error) {
    console.error('Error in CheckOut:', error);
    res.status(500).send('Internal Server Error');
  }
},

OrderPlace: async (req, res) => {
  try {
    const email = req.session.user;
    const AddressId = req.body.address;
    req.session.AddressId = req.body.address
    const paymentMethod = req.body.paymentMethod;
    const userId = req.session.userId;

    const user = await User.findOne({ 
      email: email,
      'address._id': AddressId,
    });

    if (!user) {
      const redirectMsg = `Please Add a Address`;
      return res.json({ codSuccess: false, message: redirectMsg });
    }

    const addressData = user.address.find(address => address._id.toString() === AddressId);
    if (!addressData) {
      const redirectMsg = `Please Add a Address`;
      return res.json({ codSuccess: false, message: redirectMsg });
      
    }

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
    const totalPrice = req.session.totalPrice ;
    const overallamount = totalPrice[0].total

    if (paymentMethod === 'Online') {
const orderCreateData = {
  nameuser: addressData.name,
  email: email,
  phonenumber: addressData.phone,
  orderTotalPrice: overallamount,
  orderaddress: addressData.address,
  city: addressData.city,
  state: addressData.state,
  pincode: addressData.pincode,
  orderAdded: new Date(),
  orderedproducts: orderedProducts,
  paymentStatus: 'Pending', 
  PaymenMethod: "Razorpay",
};


const cartId = await Cart.find({user:user._id})

const orderAmount = overallamount;
const currency = 'INR';

const options = {
  amount: orderAmount * 100, 
  currency,
  receipt: '' + cartId._id,
  payment_capture: 1,
};

const razorpayOrder = await razorpay.orders.create(options);

res.json({
  razorpayKey: 'rzp_test_h2KMHrmhqDKgVl',
  orderAmount,
  currency,
  orderId: razorpayOrder.id,
  orderID: cartId._id, 
});
    } else if (paymentMethod === 'COD') {
      const orderCreateData = {
        userId: req.session.userId,
        orderTotalPrice: overallamount,
        orderaddress:  AddressId,
        orderAdded: new Date(),
        orderedproducts: orderedProducts,
        paymentStatus: 'Pending', 
        PaymenMethod: "COD",
      };
  
      const orderCreate = await Order.create(orderCreateData);
      res.json({ codSuccess: true, message: "Success" });
    } else if (paymentMethod === 'Wallet') {
      try {
        const orderCreateData = {
          userId: req.session.userId,
          orderTotalPrice: overallamount,
          orderaddress:  AddressId,
          orderAdded: new Date(),
          orderedproducts: orderedProducts,
          paymentStatus: 'Paid', 
          PaymenMethod: "Wallet Payment",
        };
    
        const user = await Wallet.findOne({ userId }, { wallettotalAmount: 1 });
    
        if (user) {
          const walletTotalAmount = user.wallettotalAmount;
          const orderedprice = orderCreateData.orderTotalPrice;
          const currentDate = new Date();
          const formattedDate = currentDate.toISOString();
    
          if (orderedprice < walletTotalAmount) {
            const decresewallet = await Wallet.updateOne(
              { userId: userId },
              {
                $push: {
                  "wallet": {
                    balanceamount: orderedprice,
                    transactionType: 'Debit',
                    Timestamp: formattedDate,
                    description: `${orderedprice}Rs Amount Debited To Wallet`
                  }
                },
                $inc: { wallettotalAmount: -orderedprice }
              }
            );
          
            const orderCreate = await Order.create(orderCreateData);
            res.json({ codSuccess: true, message: "Success" });

          } else {
            // Insufficient funds in the wallet
            const redirectMsg = `Only wallet has ${walletTotalAmount}/Rs money left`;
            res.json({ codSuccess: false, message: redirectMsg });
          }
          
        } else {
          console.log('User not found for email:', email);
          return res.redirect('/place/order?msg=User not found');
        }
      } catch (error) {
        console.error('Error during wallet payment:', error);
        return res.redirect('/place/order?msg=Error during wallet payment');
      }
    } else {
      console.log("Invalid payment method:", paymentMethod);
      return res.status(400).json({ error: 'Invalid payment method' });
    }


  } catch (error) {
    console.error("Error placing order:", error);
    return res.status(500).render('500')

  }
},

paimentFail : async (req,res) =>{
  const orderId = req.query.orderId;

    const deleteOrder = await Order.findByIdAndDelete(orderId);
    console.log('deleteOrder',deleteOrder);
    const loggedUser=await global.findLoggedUser(req.session.user)
    const cartNo = await global.cartNo(loggedUser[0]._id)
    res.render('paymentFail',{cartNo})

  },







  conformOrder : async (req, res) => {

    try {
      const orderId = req.query.orderId;
      const email = req.session.user;
     const AddressId = req.session.AddressId;
  
      const user = await User.findOne({
        email: email,

      });
  
      if (!user) {
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
  


      if(req.session.buyNow == 'buynow' ){ 
        const productId = req.session.productID    
        const productData = await Products.findOne({_id: productId});
        const orderTotalPrice = productData.price ;
        
        const orderedProducts = {
          orderedItem: productData.product_name,
          image: productData.product_image[0],
          colour: productData.productColor,
          price: productData.price,
          quantity: productData.quantity,
        };

      if (orderId == 'razorpay') {
        const orderCreateData = {
          userId: req.session.userId,
          orderTotalPrice: orderTotalPrice,
          orderaddress:  AddressId,
          orderAdded: new Date(),
          orderedproducts: orderedProducts,
          paymentStatus: 'Paid',
          PaymenMethod: "Razorpay",
        };
  
        const orderCreate = await Order.create(orderCreateData);
        console.log("orderCreate",orderCreate);
      }
      await Products.updateOne({ _id: productId}, { $inc: { stock: -1 } });

      }else{

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
      const totalPrice = req.session.totalPrice ;
      const overallamount = totalPrice[0].total
  
      if (orderId == 'razorpay') {
        const orderCreateData = {
          userId: req.session.userId,
          orderTotalPrice: overallamount,
          orderaddress:  AddressId,
          orderAdded: new Date(),
          orderedproducts: orderedProducts,
          paymentStatus: 'Paid',
          PaymenMethod: "Razorpay",
        };
  
        const orderCreate = await Order.create(orderCreateData);
        console.log("orderCreate",orderCreate);

      }

      const cart = await Cart.findOne({ user: user._id }, { products: 1, _id: 0 });
  
      for (let i = 0; i < cart.products.length; i++) {
        const cartItem = cart.products[i];
        await Products.updateOne({ _id: cartItem.cartItem }, { $inc: { stock: -cartItem.quantity } });
      }

      const cartupdate = await Cart.updateOne({ user: user._id }, { $set: { couponcount: 0 } });
      const userID = user._id;
      await Cart.deleteOne({ user: userID });
    }
  

    const loggedUser=await global.findLoggedUser(req.session.user)
    const cartNo = await global.cartNo(loggedUser[0]._id)
  
      res.render('conformOrder',{cartNo}); 
  
    } catch (error) {
      console.error("Error rendering order page:", error);
      res.status(500).render('500')
    }
  },

GetOrder : async (req,res) =>{
  try {
    const email = req.session.user;
    const userId = req.session.userId;
    const orderData = await Order.find({userId:userId})
    const loggedUser=await global.findLoggedUser(req.session.user)
    const cartNo = await global.cartNo(loggedUser[0]._id)
    res.render('userorder',{orderData,cartNo})

    
  } catch (error) {
    console.error("Error rendering order page:", error);
    res.status(500).render('500')
    
  }
},

CancelOrder: async (req, res) => {
  try {
    const ID = req.params.id;
    const data = "Cancelled";
    const email = req.session.user;
    const userId = req.session.userId;
    const order = await Order.findOne({ _id: ID });
    const balance = order.orderTotalPrice;

    if (order.PaymenMethod === 'Razorpay') {
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString();

      const walletData = await Wallet.updateMany(
        { userId: userId },
        {
          $push: {
            "wallet": {
              balanceamount: balance,
              transactionType: 'credit',
              Timestamp: formattedDate,
              description: `${balance}Rs Amount credited To Wallet`
            }
          },
          $inc: {
            "wallettotalAmount": parseInt(balance)
          }
        }
      );

      const cancel = await Order.updateOne({ _id: ID }, { $set: { orderStatus: data } });

      const product = await Order.findOne({ _id: ID }, { orderedproducts: 1 });


      for (const item of product.orderedproducts) {

        await Products.updateOne({ product_name: item.orderedItem }, { $inc: { stock: item.quantity } });
      }

      res.json({ success: true, order });
    } else if (order.PaymenMethod === 'Wallet Payment') {
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString();

      const walletData = await Wallet.updateMany(
        { userId: userId },
        {
          $push: {
            "wallet": {
              balanceamount: balance,
              transactionType: 'credit',
              Timestamp: formattedDate,
              description: `${balance}Rs Amount credited To Wallet`
            }
          },
          $inc: {
            "wallettotalAmount": parseInt(balance)
          }
        }
      );

      const cancel = await Order.updateOne({ _id: ID }, { $set: { orderStatus: data } });

      const product = await Order.findOne({ _id: ID }, { orderedproducts: 1 });

      for (const item of product.orderedproducts) {
        await Products.updateOne({ product_name: item.orderedItem }, { $inc: { stock: item.quantity } });
      }

      res.json({ success: true, order });
    } else {
      const cancel = await Order.updateOne({ _id: ID }, { $set: { orderStatus: data } });

      const product = await Order.findOne({ _id: ID }, { orderedproducts: 1 });

      for (const item of product.orderedproducts) {
        await Products.updateOne({ product_name: item.orderedItem }, { $inc: { stock: item.quantity } });
      }

      res.json({ success: true, order });
    }
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).render('500')
  }
},


returnOrder: async (req, res) => {
  try {
    const ID = req.params.id;
      const data = "Returned";
      const email = req.session.user;
      const userId = req.session.userId;

      const order = await Order.findOne({ _id: ID });
      const total = order.orderTotalPrice;    
         
      if (order.PaymenMethod == 'Razorpay' || order.PaymenMethod == 'COD' || order.PaymenMethod == 'Wallet Payment' ) {
          console.log("Found Order:", order);

          const currentDate = new Date();
          const formattedDate = currentDate.toISOString();

          const walletdata = await Wallet.updateMany(
              { userId: userId },
              {
                  $push: {
                      "wallet": {
                          balanceamount: total,
                          transactionType: 'credit',
                          Timestamp: formattedDate,
                          description: `${total}Rs Amount credited To Wallet`
                      }
                  },
                  $inc: {
                      "wallettotalAmount": parseInt(total)
                  }
              }
          );

          const cancel = await Order.updateOne({ _id: ID }, { $set: { orderStatus: data } });

         
          const product = await Order.findOne({ _id: ID }, { orderedproducts: 1 });

          for (const item of product.orderedproducts) {
            await Products.updateOne({ product_name: item.orderedItem }, { $inc: { stock: item.quantity } });
          }


         

          res.json({ success: true, order });
      }
  } catch (error) {
      console.error("Error cancel order:", error);
      res.status(500).render('500')
  }
},








GetWallet: async (req, res) => {
  try {
    const email = req.session.user;
    const userId = req.session.userId;
    const walletData = await Wallet.find({ userId: userId });
    const loggedUser=await global.findLoggedUser(req.session.user)
    const cartNo = await global.cartNo(loggedUser[0]._id)
    res.render('userWallet', { walletData,cartNo });
  } catch (error) {
    console.error("Error fetching wallet:", error);
    res.status(500).render('500')
  }
},

UserCoupen: async (req,res)=>{
  try {
    const usercoupen = await Coupon.find();
    const loggedUser=await global.findLoggedUser(req.session.user)
    const cartNo = await global.cartNo(loggedUser[0]._id)
    res.render('userCoupen',{usercoupen,cartNo})
    
  } catch (error) {
    console.error("Error fetching coupon:", error);
    res.status(500).render('500')
    
  }
},
ApplyCoupon: async (req, res) => {
  try {
      const CouponCode = req.body.couponCode;
      req.session.couponCode = CouponCode
      const email = req.session.user;
      const user = await User.findOne({ email });

      const coupendiscount = await Coupon.findOne({ couponCode: CouponCode });
      const CouponCount = await Cart.findOne({user: user._id})
      console.log(CouponCount.products.length);
      if(CouponCount.couponcount === 1 && CouponCount.resetcoupon === false ){  
        res.redirect("/user/cart?msg=Already%20Applied");
        return; 
      }

      if (!coupendiscount) {
          res.redirect("/user/cart?msg=Invalid%20Coupon");
          return; 
      } else{
        const cartupdate = await Cart.updateOne({user: user._id},{$set:{couponcount:1,couponcode:CouponCode}})
      }

 
      let discountPrice = coupendiscount.discount;

      console.log("discountPrice",discountPrice);
      

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
                // 'productDetails.couponDiscount': discountPrice,
            },
        },
    ];
    

    const cartItems = await Cart.aggregate(cartItemsPipeline);
    console.log("23456788888888888",cartItems)
      const cartAmount = req.session.totalPrice;
      if (coupendiscount.Discount_price >= cartAmount[0].total) {
          res.redirect("/user/cart?msg=Not%20Available%20for%20This%20Order%20Amount");
          return; 

      } else if (coupendiscount.email === email) {
        console.log(coupendiscount.email,"EMAILLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL");
        res.redirect("/user/cart?msg=You%20Already%20Applied%20This%20Coupon");
        return; 
      }else {
        const totalPricePipeline = [
          ...cartItemsPipeline,
          {
            $group: {
              _id: null,
              total: {
                $sum: '$productDetails.totalPrice',
              },
              CouponDiscount: { $first: discountPrice },
              subTotal: {
                $sum: '$productDetails.totalPrice',
              }, 
            },
          },
          {
            $project: {
              _id: 0,
              total: {
                $subtract: ['$total', '$CouponDiscount'],
              },
    
              CouponDiscount: 1,
              subTotal:1
    
            },
          },
        ];
        
        const totalPrice = await Cart.aggregate(totalPricePipeline);
        console.log("------------",totalPrice,"====================");
          req.session.coupendiscount = coupendiscount.discount;
          req.session.totalPrice = totalPrice;


          await Coupon.updateOne(
              { couponCode: CouponCode },
              { $set: { email: email, productName: cartItems.product_name } }
          );
          const loggedUser=await global.findLoggedUser(req.session.user)
          const cartNo = await global.cartNo(loggedUser[0]._id)
          let success = true
          res.render('cart', { cartItems, totalPrice, discountPrice, cartNo, CouponCode,success });
          res.json({ success: success });


      }
  } catch (error) {
      console.error("Error Applying coupon:", error);
      res.status(500).render('500')
  }
},

RemoveCoupon: async (req, res) => {
  try {
      const CouponCode = req.body.couponCode;
      const email = req.session.user;
      const user = await User.findOne({email: email });
      const coupendiscount = await Coupon.findOne({ couponCode: CouponCode });
      req.session.couponCode = ""

      const test = await Cart.updateOne({user:user._id},{$set:{resetcoupon:true}})

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
                  'productDetails.couponDiscount': 0,
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
                CouponDiscount: {
                    $sum: '$productDetails.couponDiscount' 
                },
                subTotal: {
                    $sum: '$productDetails.totalPrice',
                },
            },
        },
        {
            $project: {
                _id: 0,
                total: '$subTotal',
                CouponDiscount: 1,
                subTotal: 1
            },
        },
    ];
    
      const totalPrice = await Cart.aggregate(totalPricePipeline);
      req.session.coupendiscount = 0 ;
      req.session.totalPrice = totalPrice;

      // Unset email and productName fields from coupon
      await Coupon.updateOne(
          { couponCode: CouponCode },
          { $unset: { email: "", productName: "" } }
      );




      const loggedUser = await global.findLoggedUser(req.session.user)
      const cartNo = await global.cartNo(loggedUser[0]._id)
      let success = true
      res.redirect("/user/cart?msg=coupon%20removed%20");
      // res.render('cart', { cartItems, totalPrice, cartNo, CouponCode });
      res.json({ success: success });



  } catch (error) {
      console.error("Error Removing coupon:", error);
      res.status(500).render('500')
  }
},


buyNow: async (req,res)=>{
  try {
    const Id = req.params.id;
    req.session.productID = Id;
    const email = req.session.user;
    const productData = await Products.findOne({_id:Id})

    const user = await User.findOne({ email: email });
    const userAddress = user 
    const loggedUser=await global.findLoggedUser(req.session.user)
    const cartNo = await global.cartNo(loggedUser[0]._id)
    res.render('buynowcheck',{userAddress,productData,cartNo})
    
  } catch (error) {
    console.error("Error rendering Buy now Checkout page:", error);
    res.status(500).json({ success: false, error: "Error rendering Buy now Checkout page" });
    
  }
},

buyNowOrderplace: async (req,res)=>{
  try {
    const email = req.session.user;
    const AddressId = req.body.address;
    req.session.AddressId = req.body.address
    const paymentMethod = req.body.paymentMethod;
    const productId = req.session.productID 
    req.session.buyNow = 'buynow'

    const user = await User.findOne({
      email: email,
      'address._id': AddressId,
    });
    if (!user) {
      const redirectMsg = `Please Add a Address`;
      return res.json({ codSuccess: false, message: redirectMsg });
    }

    const addressData = user.address.find(address => address._id.toString() === AddressId);
    const productData = await Products.findOne({_id: productId});

    const orderTotalPrice = productData.price ;
    
    const orderedProducts = {
      orderedItem: productData.product_name,
      image: productData.product_image[0],
      colour: productData.productColor,
      price: productData.price,
      quantity: 1,
    };
    

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
        paymentStatus: 'Pending', 
        PaymenMethod: "Razorpay",
      };
      
      
      const cartId = await Cart.find({user:user._id})
      
      const orderAmount = orderTotalPrice;
      const currency = 'INR';
      
      const options = {
        amount: orderAmount * 100, 
        currency,
        receipt: '' + cartId._id,
        payment_capture: 1,
      };
      
      const razorpayOrder = await razorpay.orders.create(options);
      
      res.json({
        razorpayKey: 'rzp_test_h2KMHrmhqDKgVl',
        orderAmount,
        currency,
        orderId: razorpayOrder.id,
        orderID: cartId._id, 
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
              paymentStatus: 'Pending', 
              PaymenMethod: "COD",
            };
        
            const orderCreate = await Order.create(orderCreateData);
            res.json({ codSuccess: true, message: "Success" });
          } else if (paymentMethod === 'Wallet') {
            try {
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
                paymentStatus: 'Paid', 
                PaymenMethod: "Wallet Payment",
              };
          
              const user = await User.findOne({ email }, { wallettotalAmount: 1 });
          
              if (user) {
                const walletTotalAmount = user.wallettotalAmount;
                const orderedprice = orderCreateData.orderTotalPrice;
                const currentDate = new Date();
                const formattedDate = currentDate.toISOString();
          
                if (orderedprice < walletTotalAmount) {
                  const decresewallet = await User.updateOne(
                    { email: email },
                    {
                      $push: {
                        "wallet": {
                          balanceamount: orderedprice,
                          transactionType: 'Debit',
                          Timestamp: formattedDate,
                          description: `${orderedprice}Rs Amount Debited To Wallet`
                        }
                      },
                      $inc: { wallettotalAmount: -orderedprice }
                    }
                  );
                
                  const orderCreate = await Order.create(orderCreateData);
                  res.json({ codSuccess: true, message: "Success" });
      
                } else {
                  // Insufficient funds in the wallet
                  const redirectMsg = `Only wallet has ${walletTotalAmount}/Rs money left`;
                  res.json({ codSuccess: false, message: redirectMsg });
                }
                
              } else {
                console.log('User not found for email:', email);
                return res.redirect('/place/order?msg=User not found');
              }
            } catch (error) {
              console.error('Error during wallet payment:', error);
              return res.redirect('/place/order?msg=Error during wallet payment');
            }
          } else {
            console.log("Invalid payment method:", paymentMethod);
            return res.status(500).render('500')

          }



    
  } catch (error) {
    console.error("Error Order placing:", error);
    res.status(500).render('500')
    
  }
},

viewAllflagship: async (req,res)=>{
  try {
    const productData = await Products.find({
      phone_type: "Flagship phones",
      status: true,
    });
    const categoryData = await Categorie.find({});
    const phoneType = 'Flagship'
    const loggedUser=await global.findLoggedUser(req.session.user)
    const cartNo = await global.cartNo(loggedUser[0]._id)
    let checkedBrands= [];
    let  priceSort = "highToLow"
  
    res.render('viewAll',{productData,categoryData,phoneType,cartNo,checkedBrands,priceSort})
  } catch (error) {
    console.error("Error in View All Products:", error);
    res.status(500).render('500')
    
  }


},

viewAllFlagkiller: async (req,res)=>{
  try {
    const productData = await Products.find({
      phone_type: "Flagship killers",
      status: true,
    });
    const categoryData = await Categorie.find({});
    const phoneType = 'Flagship killer'
    const loggedUser=await global.findLoggedUser(req.session.user)
    const cartNo = await global.cartNo(loggedUser[0]._id)
    let checkedBrands= [];
    let  priceSort = "highToLow"

  
    res.render('viewAll',{productData,categoryData,phoneType,cartNo,checkedBrands,priceSort})
  } catch (error) {
    console.error("Error in View All Products:", error);
    res.status(500).render('500')
    
  }

},

browsebybrand: async (req,res)=>{
  try {
    const Id = req.params.id
    const category = await Categorie.findOne({_id:Id},{brand:1,_id:0});
    const productData = await Products.find({
      brand: category.brand,
      status: true,
    });
    const phoneType = category.brand;
    const loggedUser=await global.findLoggedUser(req.session.user)
    const cartNo = await global.cartNo(loggedUser[0]._id)
    
    const categoryData = await Categorie.find({});
    let  priceSort = "highToLow"
    let checkedBrands =[];

    res.render('viewAll',{productData,categoryData,phoneType,cartNo,checkedBrands,priceSort})



  } catch (error) {
    console.error("Error in View All Products:", error);
    res.status(500).render('500')
    
  }
},

filter: async (req,res)=>{
  try {
    const categoryIds = req.body.category;
    const brands = await Categorie.find({ _id: { $in: categoryIds } }, { brand: 1, _id: 0 });
    const brandNames = brands.map(category => category.brand);
    const categoryData = await Categorie.find({});
    const phoneType = ' ';
    const loggedUser=await global.findLoggedUser(req.session.user)
    const cartNo = await global.cartNo(loggedUser[0]._id)
    const checkedBrands = brandNames; 
    const priceSort = req.body.priceSort;
  
    if(req.body.priceSort == 'highToLow'){
      const productData = await Products.find({
        brand: { $in: brandNames },
        status: true,
      }).sort({ price: -1 });
      res.render('viewAll',{productData,categoryData,phoneType,cartNo,
        checkedBrands: checkedBrands,
        priceSort: priceSort })
    }else if(req.body.priceSort == 'lowToHigh'){
      const productData = await Products.find({
        brand: { $in: brandNames },
        status: true,
      }).sort({ price: 1 });
      res.render('viewAll',{productData,categoryData,phoneType,cartNo,
        checkedBrands: checkedBrands,
        priceSort: priceSort })
  
    }else{
      const productData = await Products.find({
        brand: { $in: brandNames },
        status: true,
      });

      const checkedBrands = brandNames; 
      const priceSort = req.body.priceSort;
      
      res.render('viewAll', {
          productData,
          categoryData,
          phoneType,
          cartNo,
          checkedBrands: checkedBrands,
          priceSort: priceSort 
      });
        
    }
    
  } catch (error) {
    console.error("Error in Filtering time:", error);
    res.status(500).render('500')
    
  }




},
usersechProduct: async(req,res)=>{
  try {
    const data = req.body.serchuser;
    const productData = await Products.find({ product_name: { $regex: data, $options: "i" } });
    const categoryData = await Categorie.find({});
    const phoneType = data;
    const loggedUser=await global.findLoggedUser(req.session.user)
    const cartNo = await global.cartNo(loggedUser[0]._id)
    let  priceSort = "highToLow"
    let checkedBrands =[]

    res.render('viewAll',{productData,categoryData,phoneType,cartNo,checkedBrands: checkedBrands,priceSort});
    
  } catch (error) {
    console.error("Error in user serching time:", error);
    res.status(500).render('500')
    
  }
},

downloadPdf : async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    if (!order) {
        return res.status(500).render('500')

    }

    const invoiceData = {
        invoiceNumber: 'INV' + order._id,
        date: order.orderAdded.toDateString(),
        amount: order.orderTotalPrice,
        customer: order.nameuser,
    };

    const data = {
      documentTitle: 'Invoice',
      currency: 'INR',
      taxNotation: 'vat',
      marginTop: 25,
      marginRight: 25,
      marginLeft: 25,
      marginBottom: 25,
      logo: 'https://public.budgetinvoice.com/img/logo_en_original.png',
      sender: {
          company: 'Exclusive',
          address: 'vilakkileri,kakkuni',
          zip: '673507',
          city: 'Ayancheri',
          country: 'India'
      },
      client: {
          company: order.nameuser,
          address: order.orderaddress,
          zip: order.pincode,
          city: order.city,
          country: order.state
      },
      information: {
        // Invoice number
        number:  'INV'+ order._id,
        // Invoice data
        date: new Date().toDateString(),

    },

      products: order.orderedproducts.map(product => ({
          quantity: product.quantity,
          description: product.orderedItem,
          price: product.price
      })),
      bottomNotice: 'Thank you for your exclusive purchase.',
  };
  

    const result = await easyinvoice.createInvoice(data);
    const pdfBuffer = Buffer.from(result.pdf, 'base64');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length); 
    res.end(pdfBuffer); 
} catch (error) {
    console.error('Error in downloading PDF:', error);
    res.status(500).render('500')
  }
},

UserShop : async (req,res)=>{
  try {
    const category = await Categorie.find();
    const productData = await Products.find({
      status: true
    });
    const phoneType = "";
    
    const categoryData = await Categorie.find({});
    const loggedUser=await global.findLoggedUser(req.session.user)
    const cartNo = await global.cartNo(loggedUser[0]._id)
    let checkedBrands =[]
    let  priceSort = "highToLow"

    res.render('viewAll',{productData,categoryData,phoneType,cartNo,checkedBrands,priceSort})



  } catch (error) {
    console.error("Error in View All Products:", error);
    res.status(500).render('500')
    
  }
},


};

module.exports = userController;
