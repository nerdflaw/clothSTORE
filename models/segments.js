const mongoose = require("mongoose");
require('dotenv').config();

const segmentSchema = new mongoose.Schema({
	segment: {
		type: String,
		required: true,
		unique: true
	},
	segmentedProducts: {
		type: [String],
		required: true
	},
	status: {
		type: Boolean,
		default: true
	}
}, {
	timestamps: true
});

const Segments = mongoose.model('Segments', segmentSchema);

module.exports = Segments;
