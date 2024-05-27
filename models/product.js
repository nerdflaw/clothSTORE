const mongoose = require("mongoose");
require('dotenv').config();
const { ObjectId } = require('mongodb');

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    brandName: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    categoryName: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    mrp: {
        type: Number,
        required: true,
        min: 0,
    },
    images: {
        type: [String],
        required: true
    },
    variants: [
        {
            color: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Color',
                required: true
            },
            size: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Size',
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 0
            }
        }
    ],
    status: {
        type: Boolean,
        default: true
    },
    flashsale: {
        type: Boolean,
        default: false
    },
    featured: {
        type: Boolean,
        default: false
    },
    review: [
        {
            rating: {
                type: Number,
                default: 0,
                min: 0,
                max: 5
            },
            message: {
                type: String,
                required: true,
                minlength: 1,
                maxlength: 50
            },
            username: {
                type: String,
                required: true
            },
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            },
            updatedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    discount: {
        type: Number,
        default: 10,
        min: 0,
        max: 50
    }

}, {
    timestamps: true
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
