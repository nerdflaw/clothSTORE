const mongoose = require("mongoose");
require('dotenv').config();

// const { ObjectId } = require('mongodb');

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    wishlist: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
            },
        }
    ],
    wishlistStatus: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist;
