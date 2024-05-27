const multer = require('multer')

// Define storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Set the destination folder for uploaded files
    cb(null, './public/productImages/');
  },
  filename: function (req, file, cb) {
    // Set the filename for uploaded files
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Create multer instance with the defined storage and fileFilter

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Check file types here if needed
    cb(null, true);
  }
});

module.exports = {
  storage,
  upload
};
