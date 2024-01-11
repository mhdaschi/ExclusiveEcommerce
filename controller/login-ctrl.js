const usercollection = require("../model/usermodel");
const bcrypt = require("bcrypt");
const Products = require('../model/productmodel')
const Categorie = require('../model/brandmodel')
const Cart = require("../model/cartmodel")
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
            const useProduct = await Products.find().limit(10);
            const use2Product = await Products.find().skip(10)
            const useBrand = await Categorie.find({status:true}).limit(3);

            const useflagship = await Products.find({ phone_type:"Flagship phones",status:true})
            const useCameraphones = await Products.find({phone_type:"Camera phones"})
            const useBatterylife = await Products.find({phone_type:"Battery life champions"})
            const useflagshipkiller = await Products.find({phone_type:"Flagship killers"})
            const useGaming = await Products.find({phone_type:"Gaming phones"})

             res.render('user-dashboard',{useBrand,use2Product,useflagship,useCameraphones,useBatterylife,useflagshipkiller,useGaming,useProduct});
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
