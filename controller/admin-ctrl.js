const user = require("../model/usermodel");
const Categorie = require("../model/brandmodel");
const Products = require("../model/productmodel");
const Order = require("../model/ordermodel")
const Coupon = require("../model/couponmodel")
const moment = require('moment');
const uploadDirectory = 'uploads';
const fs = require('fs');
const {jsPDF} = require('jspdf');
require('jspdf-autotable'); 
const path = require('path');
const os = require('os');



const adminController = {
  AdminDashboard: async (req, res) => {
    try {
      const TotalOrder = await Order.countDocuments()
      const TotalUser = await user.countDocuments()
      const TotalProduct = await Products.countDocuments()
      const productData = await Products.find({}, { product_name: 1, stock: 1, _id: 0 });

      const labels = productData.map(entry => entry.product_name);
      const data = productData.map(entry => entry.stock);

      const inventoryData = {
          labels: labels,
          datasets: [{
              label: 'Available Stock',
              data: data,
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgba(255, 99, 132, 1)',
              borderWidth: 1
          }]

      };
      const Orderdata = await Order.find({},{_id:0})

      const monthlySales = {};
      const weeklySales = {};
      const yearlySales = {};
      let totalRevenue = 0;
      
      Orderdata.forEach(order => {
          const orderDate = new Date(order.orderAdded);
          const month = moment(orderDate).format('MMMM'); // Extract month name
          const week = moment(orderDate).isoWeek(); // Extract ISO week number
          const year = moment(orderDate).year(); // Extract year
          const totalOrderPrice = parseInt(order.orderTotalPrice) || 0;
      
          // Monthly sales
          if (!monthlySales[month]) {
              monthlySales[month] = totalOrderPrice;
          } else {
              monthlySales[month] += totalOrderPrice;
          }
      
          // Weekly sales
          if (!weeklySales[week]) {
              weeklySales[week] = totalOrderPrice;
          } else {
              weeklySales[week] += totalOrderPrice;
          }
      
          // Yearly sales
          if (!yearlySales[year]) {
              yearlySales[year] = totalOrderPrice;
          } else {
              yearlySales[year] += totalOrderPrice;
          }
      
          totalRevenue += totalOrderPrice;
      });
      

      

const salesData = {
  monthly: {
      label: 'Monthly Sales',
      data: Object.values(monthlySales),
      backgroundColor: 'rgba(75, 192, 192, 0.7)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 2
  },
  weekly: {
      label: 'Weekly Sales',
      data: Object.values(weeklySales),
      backgroundColor: 'rgba(255, 99, 132, 0.7)',
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 2
  },
  yearly: {
      label: 'Yearly Sales',
      data: Object.values(yearlySales),
      backgroundColor: 'rgba(153, 102, 255, 0.7)',
      borderColor: 'rgba(153, 102, 255, 1)',
      borderWidth: 2
  }
};

const topSellingProducts = await Order.aggregate([
  {
    $unwind: "$orderedproducts"
  },
  {
    $group: {
      _id: "$orderedproducts.orderedItem",
      totalQuantity: { $sum: "$orderedproducts.quantity" },
      image: { $first: "$orderedproducts.image" }, 
      price: { $first: "$orderedproducts.price" }, 
      qunt: { $first: "$orderedproducts.quantity" } 
    }
  },
  {
    $sort: { totalQuantity: -1 } 
  },
  {
    $limit: 10 
  }
]);

const topSellingBrand = await Order.aggregate([
  { $unwind: "$orderedproducts" },
  {
    $lookup: {
      from: "products",
      localField: "orderedproducts.orderedItem",
      foreignField: "product_name",
      as: "product"
    }
  },
  { $unwind: "$product" },
  {
    $group: {
      _id: "$product.brand",
      totalQuantity: { $sum: "$orderedproducts.quantity" },
      Revenue: { $sum: "$orderedproducts.price" },
    }
  },
  {
    $lookup: {
      from: "brands",
      localField: "_id",
      foreignField: "brand",
      as: "brand"
    }
  },
  { $unwind: "$brand" },
  {
    $project: {
      _id: 1,
      totalQuantity: 1,
      Revenue: 1,
      brandImage: "$brand.image" // Rename brandImage to the actual image field from the brand model
    }
  },
  { $sort: { totalQuantity: -1 } },
  { $limit: 10 }
]);






      res.render("admin-dash",{TotalOrder,TotalUser,TotalProduct,inventoryData,salesData,totalRevenue,topSellingProducts,topSellingBrand});
      
    } catch (error) {
      console.error(error);
      res.status(500).render('500')
      
    }
    

   
  },

  // sales Report download 
  SalesReportDownload: async (req, res) => {
    const { startDate, endDate } = req.body;
    console.log('Received request for sales report with startDate:', startDate, 'and endDate:', endDate);

    try {
        // Query orders between the specified dates
        const orders = await Order.find({
            orderAdded: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        });

        // Initialize PDF document
        const document = new jsPDF();

        // Set document properties
        document.setProperties({
            title: 'Sales Report',
            subject: `Sales data between ${startDate} and ${endDate}`,
            author: 'Your Company Name',
            keywords: 'sales, report, data',
            creator: 'Your Company Name'
        });

        // Set document header
        document.setFontSize(18);
        document.text('Sales Report', 14, 22);

        // Generate sales report table
        const salesData = orders.map(order => {
          const orderedItems = [];
      
          order.orderedproducts.forEach(product => {
              orderedItems.push(product.orderedItem);
          });
      
          return [
              order._id.toString(),
              order.nameuser.toString(),
              orderedItems.join(', '), // Join orderedItems array into a string
              order.orderTotalPrice.toString(),
              moment(order.orderAdded).format('YYYY-MM-DD')
          ];
      });
      

        // Set table headers
        const headers = [['Order ID', 'name user', 'Products', 'Total Price', 'Date']];
        const tableData = headers.concat(salesData);

        // Add table to PDF using autotable plugin
        document.autoTable({
            head: tableData.slice(0, 1),
            body: tableData.slice(1)
        });

        const pdfFilename = 'sales-report.pdf'; // Assuming the PDF is generated in the current directory

        // Save the PDF file

        const downloadsPath = path.join(os.homedir(), 'Downloads');
        const absolutePath = path.join(downloadsPath, pdfFilename);

        document.save(absolutePath);

        // Send the PDF file as response
        res.sendFile(absolutePath);
    } catch (error) {
        console.error('Error downloading sales report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
},
// Dashusers route
Dashusers: async (req, res) => {
  try {
    const useData = await user.find().sort({ username: 1, email: 1, status: 1 });
    const msg = req.query.err; 
    var i = 0;
    req.session.adminLoggedin = true

  
    res.render("user-list", { useData, i, msg });
    
  } catch (error) {
    console.error(error);
    res.status(500).render('500')
    
  }
 

},

// Blockuser route
Blockuser: async (req, res) => {
  try {
    const id = req.params.id;
    const status = await user.updateOne({ _id: id }, { $set: { status: false } });
    res.redirect("/admin/users?err=User Blocked"); 
  } catch (error) {
    console.error(error);
    res.status(500).render('500')
  }

},

// Activeuser route
Activeuser: async (req, res) => {
  try {
    const id = req.params.id;
    const status = await user.updateOne({ _id: id }, { $set: { status: true } });
    res.redirect("/admin/users?err=User Activated"); 
  } catch (error) {
    console.error(error);
    res.status(500).render('500')
    
  }
 
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
    res.status(500).render('500')
  }
},


  


  AdminCategories: async (req, res) => {
    try {
      const useBrand = await Categorie.find().sort({
        brand: 1,
        status: 1,
        image: 1,
      });
      const msg = req.query.err;
      var i = 0;
      req.session.adminLoggedin=true
      res.render("Categories", { useBrand, i ,msg});
      
    } catch (error) {
      console.error(error);
      res.status(500).render('500')
      
    }
  
      
   
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
      res.status(500).render('500')
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
      res.status(500).render('500')
      
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
      res.status(500).render('500')
    }
  },

  Posteditebrand: async (req, res) => {
    try {
      const id = req.params.id;
      const productImage = req.file ? req.file.filename : undefined;
      const name = req.body.name;
      const existname = await Categorie.findOne({ brand: name });

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
      res.status(500).render('500')
    }
  },

  Deletebrand: async (req, res) => {
    const id = req.params.id;
    try {
      const status = await Categorie.deleteOne({ _id: id });
      res.redirect("/admin/Categories?err= Brand Deleted");
    } catch (error) {
      console.error(error);
      res.status(500).render('500')
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
      res.status(500).render('500')
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
      res.status(500).render('500')
    }
  },

  AdminProducts: async (req, res) => {
    try {
      let i = 0;
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
    } catch (error) {
      console.error(error);
      res.status(500).render('500')

      
    }

  
   
  },

  Serchproduct: async (req,res) =>{

    try {
      const serchdata = req.body;
      let i = 0;
      const useProduct = await Products.find({ product_name: { $regex: serchdata.search, $options: "i" } });
      res.render('Products',{useProduct,i})
      
    } catch (error) {
      console.error(error);
      res.status(500).render('500')
      
    }
   
  },

  Getproduct: async (req, res) => {

    try {
      let i = 0;
      const useProduct = await Products.find().sort({
        prduct_name: 1,
        brand: 1,
        status: 1,
        price: 1,
        stock: 1,
        variant: 1,
      });
      
        const msg =req.query.err
        req.session.adminLoggedin=  true;
        res.render("Products", { useProduct, i, msg });
      
    } catch (error) {
      console.error(error);
      res.status(500).render('500')
    }
  },

  Blockproduct: async (req, res) => {
    try {
      const id = req.params.id;
      const status = await Products.updateOne(
        { _id: id },
        { $set: { status: false } }
      );
      res.redirect("/product-home?err= Product Blocked");
    } catch (error) {
      console.error(error);
      res.status(500).render('500')
    }
  },
  Activeproduct: async (req, res) => {
    try {
      const id = req.params.id;
      const status = await Products.updateOne(
        { _id: id },
        { $set: { status: true } }
      );
      res.redirect("/product-home?err= Product Active ");
    } catch (error) {
      console.error(error);
      res.status(500).render('500')
    }
  },

  Deleteproduct: async (req, res) => {
    try {
      const id = req.params.id;
      const status = await Products.deleteOne({ _id: id });
      res.redirect("/product-home?err= Product deleted");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  },

  Editeproduct: async (req, res) => {
    try {
      const id = req.params.id;
      const categoryData = await Categorie.find();
      const useProduct = await Products.find({ _id: id });
      res.render("edit-product", { useProduct,categoryData });
    } catch (error) {
      console.error(error);
      res.status(500).render('500')
    }
  },

 PostEditeproduct: async (req, res) => {
   try {
    const id = req.params.id;
    const updateFields = {
      product_name: req.body.productName,
      stock: req.body.stock,
      brand: req.body.brand,
      price: req.body.price,
      variant: req.body.variant,
      productColor: req.body.colour,
      description: req.body.description,
    };

    if (req.body.updateImage && Array.isArray(req.body.updateImage) && req.files && Array.isArray(req.files)) {
      let updateImageValues = req.body.updateImage.map(value => {
        return parseInt(value.trim());
    });
    
    let temp = updateImageValues[updateImageValues.length - 1];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      let num = (i + temp); 
      if (file) {
        updateFields[`product_image.${num}`] = file.filename; 
      }
    }
  }

    console.log("Uploaded Files:", req.files);
    console.log("Update Fields:", updateFields);

    const status = await Products.updateOne(
      { _id: id },
      { $set: updateFields }
    );
    console.log("Update Status:", status);

    res.redirect("/product-home?err= Product edited ");
  } catch (error) {
    console.error("Error:", error.message);
    console.error("Stack Trace:", error.stack);
    res.status(500).render('500')
  }
},



  AddProduct: async (req, res) => {
    try {
      req.session.adminLoggedin =true;
      const categoryData = await Categorie.find();
      res.render("add-product",{categoryData});
    } catch (error) {
      console.error(error);
      res.status(500).render('500')
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

        // Extract cropped image data from FormData
        const croppedImages = [];
        for (let i = 1; i <= 4; i++) {
            const croppedImageData = req.body[`croppedImage${i}`];
            if (croppedImageData) {
                // Decode base64 data and create a buffer
                const base64Data = croppedImageData.replace(/^data:image\/\w+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');

                // Generate a unique filename for the cropped image
                const filename = `cropped_image_${Date.now()}_${i}.jpg`;
                const filePath = `${uploadDirectory}/${filename}`;

                // Save the decoded image to disk
                fs.writeFileSync(filePath, buffer);

                // Remove the uploadDirectory part from the file path
                const relativePath = filePath.replace(`${uploadDirectory}/`, '');

                // Store the relative file path in the croppedImages array
                croppedImages.push(relativePath);
            }
        }

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
                product_image: croppedImages, // Store the paths of cropped images
            });

            res.status(200).json({ success: true, message: 'Product added successfully' });
        } else {
          res.status(200).json({ success: false, message: 'Product alredy exist'  });

        }
    } catch (error) {
        console.error(error);
        res.status(500).render('500')
      }
},


  GetOrder : async (req,res)=>{
    try {
      let i = 0
      const orderData = await Order.find()
      res.render('adminOrder',{orderData,i})
      
    } catch (error) {
      console.error(error);
      res.status(500).render('500')
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
      res.status(500).render('500')
      
    }
  },
  Coupon: async (req,res)=>{
    try {
      const couponData =  await Coupon.find()
      res.render('admincoupen',{couponData})
      
    } catch (error) {
      console.error(error);
      res.status(500).render('500')
      
    }
  },
  GetAddcoupon: async(req,res)=>{
    try {
    
      res.render('adminAddCoupon')

      
    } catch (error) {
      console.error(error);
      res.status(500).render('500')
    }
  },
  SaveCouon: async(req,res)=>{
    try {
      
      const coupon = await Coupon.create({
        couponCode: req.body.couponCode,
        discount: Number(req.body.discount),
        expireAt: req.body.expirationDate,
        description:req.body.description,
        Discount_price:Number(req.body.discount_price)
      });
      res.redirect('/admin/add-coupon?msg="coupon created succesfully"')    
    } catch (error) {
      console.error("Error saving coupon data:", error);
      res.status(500).render('500')
    }

    


  },
  DeleteCoupen: async (req,res)=>{
    try {
      const Id = req.params.id
      const deletecoupon = await Coupon.deleteOne({_id:Id}) 
      console.log(deletecoupon);
      res.redirect('/admin/Coupons?msg="Coupon deleted "')
    } catch (error) {
      console.error("Error deleting coupon data:", error);
      res.status(500).render('500')
    }

  },
  EditCoupon: async (req, res) => {
    try {
      const Id = req.params.id;
      const couponData = await Coupon.findOne({ _id: Id }); 
      res.render('adminEditCoupon', { couponData });
    } catch (error) {
      console.error("Error fetching coupon data:", error);
      res.status(500).render('500')
    }
  },

  SaveEditCoupon: async(req,res)=>{
    try {
      const Id = req.params.id;
      const couponData = await Coupon.updateOne({ _id: Id },{$set:{
        couponCode:req.body.couponCode,
        discount: Number(req.body.discount),
        expireAt: req.body.expirationDate,
        description:req.body.description,
        Discount_price:Number(req.body.discount_price)

      }}); 
      res.redirect(`/admin/edit-coupon/${Id}?msg=coupon+edited+successfully`); 
    } catch (error) {
      console.error("Error editing coupon data:", error);
      res.status(500).render('500')
      
    }

  }
  
  
};


module.exports = adminController;
