const mongoose = require("mongoose");
require('dotenv').config();

const orderSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, required: true },
	paymentMode: { type: String, required: true },
	addressId: { type: mongoose.Schema.Types.ObjectId, required: true },
	order: [{
		productId: { type: mongoose.Schema.Types.ObjectId, required: true },
		couponId: { type: mongoose.Schema.Types.ObjectId, default: null },
		brandId: { type: mongoose.Schema.Types.ObjectId, required: true },
		categoryId: { type: mongoose.Schema.Types.ObjectId, required: true },
		colorId: { type: mongoose.Schema.Types.ObjectId, required: true },
		sizeId: { type: mongoose.Schema.Types.ObjectId, required: true },
		quantity: { type: Number, required: true },
		status: { type: String, default: 'pending' },
	}],
	orderStatus: { type: String, default: 'pending' },
	paymentStatus: { type: String, default: 'pending' }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
