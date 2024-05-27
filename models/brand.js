const mongoose = require("mongoose");
require('dotenv').config();

const brandSchema = new mongoose.Schema({
    brand: {
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

const Barnds = mongoose.model('Brand', brandSchema);

module.exports = Barnds;
