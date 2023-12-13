const usercollection = require("../model/usermodel");
const bcrypt = require("bcrypt");
const Products = require('../model/productmodel')
const Categorie = require('../model/brandmodel')
const admin = {
    email: "admin@gmail.com",
    password: "admin123",
};
const loginController = {
    loginHome: (req, res) => {
        if (req.session.userLoggedin) {
            res.redirect("/user-home");
        } else {
            res.render("login");
        }
    },

    UserHome: async(req, res) => {
        if (req.session.userLoggedin) {
            const useProduct = await Products.find().limit(10);
            const use2Product = await Products.find().skip(10)
            const useBrand = await Categorie.find({status:true}).limit(4);

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

    GetLogin: (req, res) => {
        res.render('login')
    },

    PostLogin: async function (req, res) {
        const { email, password } = req.body;
    
        if (req.body.email == admin.email && req.body.password == admin.password) {
            req.session.adminLoggedin = true;
            req.session.admin = email;
            res.render('admin-dash');
        } else {
            const user = await usercollection.findOne({ email: email });
    
            if (user && user.status === true) { 
                const isMatch = await bcrypt.compare(password, user.password);
                if (isMatch) {
                    req.session.user = user.email;
                    req.session.userLoggedin = true;
                    console.log(req.session);
                    res.redirect('/user-home');
                } else {
                    res.render('login', { err: "Invalid password" });
                }
            } else if (user && user.status === false) {
                res.render('login', { err: "You are Blocked" });
            } else {
                res.render('login', { err: "Invalid Email" });
            }
        }
    }
    
};

module.exports = loginController;
