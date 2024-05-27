const mongoose = require("mongoose")
require('dotenv').config();

const sizeSchema = new mongoose.Schema({
  size: {
    type: String,
    required: true,
    unique: true
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: Boolean,
    default: true
  }
  
});

const Size = mongoose.model('Size', sizeSchema);

module.exports = Size;
