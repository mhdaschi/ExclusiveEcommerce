const user = require("../model/usermodel");
const Categorie = require("../model/brandmodel");
const Products = require("../model/productmodel");
const Order = require("../model/ordermodel")

const adminController = {
  AdminDashboard: async (req, res) => {
    
      res.render("admin-dash");
   
  },

// Dashusers route
Dashusers: async (req, res) => {
 
    const useData = await user.find().sort({ username: 1, email: 1, status: 1 });
    const msg = req.query.err; 
    var i = 0;
    req.session.adminLoggedin = true

  
    res.render("user-list", { useData, i, msg });
 

},

// Blockuser route
Blockuser: async (req, res) => {
  const id = req.params.id;
  const status = await user.updateOne({ _id: id }, { $set: { status: false } });
  res.redirect("/admin/users?err=User Blocked"); 
},

// Activeuser route
Activeuser: async (req, res) => {
  const id = req.params.id;
  const status = await user.updateOne({ _id: id }, { $set: { status: true } });
  res.redirect("/admin/users?err=User Activated"); 
},

// Deleteuser route
Deleteuser: async (req, res) => {
  const id = req.params.id;
  const status = await user.deleteOne({ _id: id });
  res.redirect("/admin/users?err=User Deleted"); 
},

// Serchuser route

Serchuser: async (req, res) => {
  var i = 0;
  const data = req.body;
  try {
    const useData = await user
      .find({ username: { $regex: data.search, $options: "i" } })
      .exec();
    const msg = ""; 
    res.render("user-list", { useData, i, msg });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
},


  


  AdminCategories: async (req, res) => {
  
      const useBrand = await Categorie.find().sort({
        brand: 1,
        status: 1,
        image: 1,
      });
      const msg = req.query.err;
      var i = 0;
      req.session.adminLoggedin=true
      res.render("Categories", { useBrand, i ,msg});
   
  },

  Addbrand: async (req, res) => {
    try {
      const { Brand } = req.body;
  
      const productImage = req.file ? req.file.filename : "";
      const existCategories = await Categorie.find({ brand: Brand });
  
      if (existCategories.length > 0) {
        res.redirect("/admin/Categories?message=already exists entered category");
      } else {
        const newBrand = await Categorie.create({
          brand: Brand,
          image: productImage,
        });
  
        console.log(newBrand);
        res.redirect("/admin/Categories?err= Brand Added");
      }
  
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },

  Serchbrand : async (req,res)=>{
    try {
      const serchdata = req.body
      var i = 0;
      const useBrand = await Categorie.find({brand:{$regex: serchdata.search, $options:"i"  }})
      req.session.adminLoggedin = true;
      res.render("Categories",{useBrand,i})
      
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
      
    }
  },



  
  Editebrand: async (req, res) => {
    try {
      const id = req.params.id;
      const editeBrand = await Categorie.find({ _id: id });
      console.log(editeBrand);
      req.session.adminLoggedin = true;
      res.render("edit-categories", { editeBrand });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },

  Posteditebrand: async (req, res) => {
    try {
      const id = req.params.id;
      const productImage = req.file ? req.file.filename : undefined;
      const name = req.body.name;
      const existname = await Categorie.findOne({ brand: name });
      console.log(
        ".....................",
        productImage,
        ".................",
        name
      );
      if (existname) {
        res.redirect("/admin/Categories?message=brand is already exists");
      } else {
        const newBrand = await Categorie.findByIdAndUpdate(
          id,

          { $set: { brand: name, image: productImage } }
        );
        console.log("editing done");

        res.redirect("/admin/Categories?err=Brand Edited");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },

  Deletebrand: async (req, res) => {
    const id = req.params.id;
    try {
      const status = await Categorie.deleteOne({ _id: id });
      res.redirect("/admin/Categories?err= Brand Deleted");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },

  Blockbrand: async (req, res) => {
    const id = req.params.id;
    try {
      const status = await Categorie.updateOne(
        { _id: id },
        { $set: { status: false } }
      );
      res.redirect("/admin/Categories?err= Brand Blocked");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },

  Activebrand: async (req, res) => {
    const id = req.params.id;
    try {
      const status = await Categorie.updateOne(
        { _id: id },
        { $set: { status: true } }
      );
      res.redirect("/admin/Categories?err = Brand Actived");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },

  AdminProducts: async (req, res) => {
    var i = 0;
    const useProduct = await Products.find().sort({
      prduct_name: 1,
      brand: 1,
      status: 1,
      price: 1,
      stock: 1,
      variant: 1,
      product_image: 1,
    });
    req.session.adminLoggedin= true
      res.render("Products", { useProduct, i });
   
  },

  Serchproduct: async (req,res) =>{

    try {
      const serchdata = req.body;
      var i = 0;
      const useProduct = await Products.find({ product_name: { $regex: serchdata.search, $options: "i" } });
      res.render('Products',{useProduct,i})
      
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
      
    }
   
  },

  Getproduct: async (req, res) => {
    var i = 0;
    const useProduct = await Products.find().sort({
      prduct_name: 1,
      brand: 1,
      status: 1,
      price: 1,
      stock: 1,
      variant: 1,
    });
    try {
      
        const msg =req.query.err
        req.session.adminLoggedin=  true;
        res.render("Products", { useProduct, i, msg });
      
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },

  Blockproduct: async (req, res) => {
    const id = req.params.id;
    try {
      const status = await Products.updateOne(
        { _id: id },
        { $set: { status: false } }
      );
      res.redirect("/product-home?err= Product Blocked");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },
  Activeproduct: async (req, res) => {
    const id = req.params.id;
    try {
      const status = await Products.updateOne(
        { _id: id },
        { $set: { status: true } }
      );
      res.redirect("/product-home?err= Product Active ");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },

  Deleteproduct: async (req, res) => {
    const id = req.params.id;
    try {
      const status = await Products.deleteOne({ _id: id });
      res.redirect("/product-home?err= Product deleted");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },

  Editeproduct: async (req, res) => {
    const id = req.params.id;
    try {
      const useProduct = await Products.find({ _id: id });
      res.render("edit-product", { useProduct });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },

  PostEditeproduct: async (req, res) => {
    const id = req.params.id;
    try {
      const updateFields = {
        product_name: req.body.productName,
        stock: req.body.stock,
        brand: req.body.brand,
        price: req.body.price,
        variant: req.body.variant,
        productColor: req.body.colour,
        description: req.body.description,
      };

      console.log("ID:", id);
console.log("Update Fields:", updateFields);

      if (req.body.updateImage && Array.isArray(req.body.updateImage)) {
        req.body.updateImage.forEach((update, index) => {
          if (update === "true" && req.files && req.files[index]) {
            updateFields[`product_image.${index}`] = req.files[
              index
            ].path.replace(`${uploadDirectory}\\`, "");
          }
        });
      }

      const status = await Products.updateOne(
        { _id: id },
        { $set: updateFields }
      );
      console.log("Update Status:", status);

      res.redirect("/product-home?err= Product edited ");
    } catch (error) {
      console.error("Error:", error.message);
      console.error("Stack Trace:", error.stack);
      res.status(500).send("Internal Server Error");
    }
    
  },

  // ...

  // ...

  AddProduct: async (req, res) => {
    try {
      req.session.adminLoggedin =true;
      res.render("add-product");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },

  AddproductDb: async (req, res) => {
    try {
      const {
        productName,
        stock,
        brand,
        price,
        Varient,
        colour,
        description,
        phone_type,
      } = req.body;
      const productImages = req.files ? req.files.map((file) => file.path) : [];
  
      const existingProduct = await Products.find(
        { product_name: productName },
        { product_name: 1, _id: 0 }
      );
  
      if (existingProduct.length === 0) {

        const newProduct = await Products.create({
          product_name: productName,
          stock: stock,
          brand: brand,
          price: price,
          variant: Varient,
          productColor: colour,
          description: description,
          phone_type: phone_type,
          product_image: productImages.map((filename) =>
            filename.replace(`${uploadDirectory}\\`, '')
          ),
        });
        res.redirect('/product-home?err=Product Added');
      } else {
        res.render('add-product', { err: 'Product with the same name already exists' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  },

  GetOrder : async (req,res)=>{
    try {
      var i = 0
      const orderData = await Order.find()
      res.render('adminOrder',{orderData,i})
      
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  },
  OrderStatus : async (req,res)=>{
    try {
      const Id  = req.params.id;
      const status =req.body.orderStatus;
      await Order.updateOne({_id:Id},{$set:{orderStatus:status}})
      res.redirect('/admin/Orders')
      
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
      
    }
  },
  
};


module.exports = adminController;
