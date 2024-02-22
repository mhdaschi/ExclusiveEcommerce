const { ObjectId } = require('mongoose').Types;
const Cart = require('../model/cartmodel'); // Import your Cart model
const User = require('../model/usermodel'); // Import your User model

const findLoggedUser = async (email) => {
    try {
        const loggedUser = await User.find({ email: email },{_id:1});
        console.log(';;;;;;;;;;;;',loggedUser);
        return loggedUser;
    } catch (error) {
        console.error(error);
    }
};

const cartNo = async (userId) => {
    try {
        console.log(">>>>>>>>>>>>>>>>>>>>",userId);

        const cart = await Cart.findOne({ user: userId },{_id:0,products:1});
        console.log(">>>>>>>>>>>>>>>>>>>>",cart);
        if (cart && cart.products) {
            return cart.products.length;
        } else {
            return 0; 
        }
    } catch (err) {
        console.error(err);
        throw err;
    }
};


module.exports = {
    cartNo,
    findLoggedUser
};
