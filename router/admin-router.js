// admin-routes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controller/admin-ctrl');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const uploadDirectory = 'uploads';
const {adminverify,existingadmin} = require('../middlewares/admincheck');
const cacheControlMiddleware = require('../middlewares/cacheControlMiddleware')



// Create upload directory if it doesn't exist
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory);
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },
  filename: function (req, file, cb) {
    const filename = Date.now() + path.extname(file.originalname);
    cb(null, filename);
  },
});

// Multer file filter configuration
const fileFilter = function (req, file, cb) {
  const allowedFileTypes = /jpeg|jpg|png|gif/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    console.error('Error: Images only!');
    cb('Error: Images only!');
  }
};

// Multer configuration
const upload = multer({ storage: storage, fileFilter: fileFilter });

// Dashboard route
router.get('/admin/Dashboard', existingadmin,cacheControlMiddleware, adminController.AdminDashboard);

// User-related routes
router.get('/admin/users',adminverify, adminController.Dashusers);
router.post('/admin/search', adminController.Serchuser);
router.post('/admin/block/:id', adminController.Blockuser);
router.post('/admin/unblock/:id', adminController.Activeuser);
router.post('/admin/delete/:id', adminController.Deleteuser);

// Categories-related routes
router.get('/admin/Categories',adminverify, adminController.AdminCategories);
router.post('/admin/addbrand', upload.single('productImage'), adminController.Addbrand);
router.post('/admin/category/search', adminController.Serchbrand)
router.post('/admin/brand/delete/:id', adminController.Deletebrand);
router.get('/admin/brand/edit/:id',adminverify ,adminController.Editebrand);
router.post('/admin/edit/category/:id', upload.single('image'), adminController.Posteditebrand);
router.post('/admin/brand/disable/:id',adminController.Blockbrand)
router.post('/admin/brand/enable/:id',adminController.Activebrand)
// Product-related routes
router.get('/product-home',adminverify, adminController.Getproduct);
router.get('/admin/Products',adminverify, adminController.AdminProducts);
router.post('/admin/product/search',adminController.Serchproduct)
router.post('/admin/add/product', adminController.AddProduct);
router.post('/admin/addproduct', upload.array('productImage', 4), adminController.AddproductDb);
router.post('/admin/category/disable/:id', adminController.Blockproduct);
router.post('/admin/category/enable/:id', adminController.Activeproduct);
router.post('/admin/category/delete/:id', adminController.Deleteproduct);
router.get('/admin/category/edit/:id',adminverify, adminController.Editeproduct);
router.post('/admin/editproduct/:id',upload.array('productImage',4), adminController.PostEditeproduct);

module.exports = router;
