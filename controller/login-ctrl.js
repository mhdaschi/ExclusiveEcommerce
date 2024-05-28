const usercollection = require("../model/usermodel");
const bcrypt = require("bcrypt");
const Products = require('../model/productmodel')
const Categorie = require('../model/brandmodel')
const Cart = require("../model/cartmodel")
const Wallet = require("../model/walletmodel")

const global = require('../global/globalfunction')

const admin = {
    email: "admin@gmail.com",
    password: "admin123",
};
const loginController = {
    loginHome: (req, res) => {
       
        if (req.session.userLoggedin) {
            res.redirect("/user-home");
        }else if(req.session.adminLoggedin){
            res.redirect('/admin/Dashboard')
        } else {
            res.render("login");
        }
    },

    UserHome: async(req, res) => {
        if (req.session.userLoggedin) {
            const useProduct = await Products.aggregate([
                {
                    $lookup: {
                        from: 'brands', 
                        localField: 'brand',
                        foreignField: '_id',
                        as: 'brandDetails'
                    }
                },
                {
                    $unwind: '$brandDetails'
                },
                {
                    $match: {
                        'status': true,
                        'brandDetails.status': true
                    }
                },
                {
                    $project: {
                        product_name: 1,
                        created_at: 1,
                        last_updated: 1,
                        stock: 1,
                        brand: 1,
                        price: 1,
                        variant: 1,
                        description: 1,
                        phone_type: 1,
                        productColor: 1,
                        status: 1,
                        product_image: 1,
                        'brandDetails.brand': 1,
                        'brandDetails.image': 1,
                        'brandDetails.status': 1
                    }
                }
            ]);
            const use2Product = await Products.aggregate([
                {
                    $lookup: {
                        from: 'brands', 
                        localField: 'brand',
                        foreignField: '_id',
                        as: 'brandDetails'
                    }
                },
                {
                    $unwind: '$brandDetails'
                },
                {
                    $match: {
                        'status': true,
                        'brandDetails.status': true
                    }
                },
                {
                    $project: {
                        product_name: 1,
                        created_at: 1,
                        last_updated: 1,
                        stock: 1,
                        brand: 1,
                        price: 1,
                        variant: 1,
                        description: 1,
                        phone_type: 1,
                        productColor: 1,
                        status: 1,
                        product_image: 1,
                        'brandDetails.brand': 1,
                        'brandDetails.image': 1,
                        'brandDetails.status': 1
                    }
                }
            ]);
            const useBrand = await Categorie.find({status:true}).limit(4);
            const loggedUser=await global.findLoggedUser(req.session.user)
  
            const useflagship = await Products.aggregate([
                {
                    $lookup: {
                        from: 'brands', 
                        localField: 'brand',
                        foreignField: '_id',
                        as: 'brandDetails'
                    }
                },
                {
                    $unwind: '$brandDetails'
                },
                {
                    $match: {
                        'phone_type': 'Flagship phones',
                        'status': true,
                        'brandDetails.status': true
                    }
                },
                {
                    $project: {
                        product_name: 1,
                        created_at: 1,
                        last_updated: 1,
                        stock: 1,
                        brand: 1,
                        price: 1,
                        variant: 1,
                        description: 1,
                        phone_type: 1,
                        productColor: 1,
                        status: 1,
                        product_image: 1,
                        'brandDetails.brand': 1,
                        'brandDetails.image': 1,
                        'brandDetails.status': 1
                    }
                }
            ]);
          const useCameraphones =  await Products.aggregate([
                            {
                                $lookup: {
                                    from: 'brands', // The collection name in MongoDB (usually the model name in lowercase and pluralized)
                                    localField: 'brand',
                                    foreignField: '_id',
                                    as: 'brandDetails'
                                }
                            },
                            {
                                $unwind: '$brandDetails'
                            },
                            {
                                $match: {
                                    'phone_type': 'Camera phones',
                                    'status': true,
                                    'brandDetails.status': true
                                }
                            },
                            {
                                $project: {
                                    product_name: 1,
                                    created_at: 1,
                                    last_updated: 1,
                                    stock: 1,
                                    brand: 1,
                                    price: 1,
                                    variant: 1,
                                    description: 1,
                                    phone_type: 1,
                                    productColor: 1,
                                    status: 1,
                                    product_image: 1,
                                    'brandDetails.brand': 1,
                                    'brandDetails.image': 1,
                                    'brandDetails.status': 1
                                }
                            }
                        ]);
            
            const useBatterylife = await Products.aggregate([
                {
                    $lookup: {
                        from: 'brands', // The collection name in MongoDB (usually the model name in lowercase and pluralized)
                        localField: 'brand',
                        foreignField: '_id',
                        as: 'brandDetails'
                    }
                },
                {
                    $unwind: '$brandDetails'
                },
                {
                    $match: {
                        'phone_type': 'Battery life champions',
                        'status': true,
                        'brandDetails.status': true
                    }
                },
                {
                    $project: {
                        product_name: 1,
                        created_at: 1,
                        last_updated: 1,
                        stock: 1,
                        brand: 1,
                        price: 1,
                        variant: 1,
                        description: 1,
                        phone_type: 1,
                        productColor: 1,
                        status: 1,
                        product_image: 1,
                        'brandDetails.brand': 1,
                        'brandDetails.image': 1,
                        'brandDetails.status': 1
                    }
                }
            ]);

            const useflagshipkiller = await Products.aggregate([
                {
                    $lookup: {
                        from: 'brands', // The collection name in MongoDB (usually the model name in lowercase and pluralized)
                        localField: 'brand',
                        foreignField: '_id',
                        as: 'brandDetails'
                    }
                },
                {
                    $unwind: '$brandDetails'
                },
                {
                    $match: {
                        'phone_type': 'Flagship killers',
                        'status': true,
                        'brandDetails.status': true
                    }
                },
                {
                    $project: {
                        product_name: 1,
                        created_at: 1,
                        last_updated: 1,
                        stock: 1,
                        brand: 1,
                        price: 1,
                        variant: 1,
                        description: 1,
                        phone_type: 1,
                        productColor: 1,
                        status: 1,
                        product_image: 1,
                        'brandDetails.brand': 1,
                        'brandDetails.image': 1,
                        'brandDetails.status': 1
                    }
                }
            ]);

            const useGaming = await Products.find({phone_type:"Gaming phones",status:true})
            await Products.aggregate([
                {
                    $lookup: {
                        from: 'brands', // The collection name in MongoDB (usually the model name in lowercase and pluralized)
                        localField: 'brand',
                        foreignField: '_id',
                        as: 'brandDetails'
                    }
                },
                {
                    $unwind: '$brandDetails'
                },
                {
                    $match: {
                        'phone_type': 'Gaming phones',
                        'status': true,
                        'brandDetails.status': true
                    }
                },
                {
                    $project: {
                        product_name: 1,
                        created_at: 1,
                        last_updated: 1,
                        stock: 1,
                        brand: 1,
                        price: 1,
                        variant: 1,
                        description: 1,
                        phone_type: 1,
                        productColor: 1,
                        status: 1,
                        product_image: 1,
                        'brandDetails.brand': 1,
                        'brandDetails.image': 1,
                        'brandDetails.status': 1
                    }
                }
            ]);

            const cartNo = await global.cartNo(loggedUser[0]._id)
      
             res.render('user-dashboard',{useBrand,use2Product,useflagship,useCameraphones,useBatterylife,useflagshipkiller,useGaming,useProduct,cartNo});
        } else {
            res.redirect('/login-home');
        }
    },

    

    PostLogin: async function (req, res) {
        const { email, password } = req.body;
    
        if (req.body.email == admin.email && req.body.password == admin.password) {
            req.session.adminLoggedin = true;
            req.session.admin = email;
            res.redirect('/admin/Dashboard');
        } else {
            const user = await usercollection.findOne({ email: email });
    
            if (user && user.status === true) {
                try {
                    const isMatch = await bcrypt.compare(password, user.password);
    
                    if (isMatch) {
                        req.session.user = user.email;
                        req.session.userId = user._id;

                        await Wallet.create({userId:user._id})

                        req.session.userLoggedin = true;
                        res.redirect('/user-home');
                    } else {
                        res.render('login', { err: "Invalid password" });
                    }
                } catch (error) {
                    console.error('Error comparing passwords:', error);
                    res.render('login', { err: "Internal server error" });
                }
            } else if (user && user.status === false) {
                res.render('login', { err: "You are Blocked" });
            } else {
                res.render('login', { err: "Invalid Email" });
            }
        }
    },

   


    Getlogout: async (req, res) => {
        await req.session.destroy();
        res.redirect('/login-home');
      }
      
};

module.exports = loginController;
