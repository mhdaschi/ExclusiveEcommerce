const multer = require ('multer')
const path=require('')


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname); // Use file.originalname instead of file.photos
    },
  });
  
  const upload = multer({ storage: storage });