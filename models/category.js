const mongoose = require("mongoose")
require('dotenv').config();

const categorySchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
