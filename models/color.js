const mongoose = require("mongoose")
require('dotenv').config();

const colorSchema = new mongoose.Schema({
  color: {
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

const Color = mongoose.model('Color', colorSchema);

module.exports = Color;
