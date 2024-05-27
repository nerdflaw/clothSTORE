const mongoose = require("mongoose");
require('dotenv').config();

// const { ObjectId } = require('mongodb');

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    cart: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
            },
            color: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
            },
            size: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
            },
            coupon: {
                type: mongoose.Schema.Types.ObjectId,
            },
            productStatus: {
                type: String,
                default: 'pending'
            }
        }
    ],
    cartStatus: {
        type: String,
        default: 'pending'
    }
}, {
    timestamps: true
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
