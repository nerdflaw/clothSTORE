const express = require('express')
const mongoose = require('mongoose');
require('dotenv').config()
const Category = require('../../models/category')
const Product = require('../../models/product')
const Brand = require('../../models/brand')
const Color = require('../../models/color')
const Size = require('../../models/size')
const Wishlist = require('../../models/wishlist')
const { ObjectId } = require('mongodb')

const userAccessBrandWise_get = async (req, res) => {
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).render('user-pages/404');
	}
	let currentPage = Number(req.query.page) || 1;
	let limit = Number(req.query.limit) || 4;
	let skip = (currentPage - 1) * limit;

	const categoriesArr = req.query.category ? req.query.category.split(',') : [];
	const colorsArr = req.query.color ? req.query.color.split(',') : [];
	const sizesArr = req.query.size ? req.query.size.split(',') : [];
	const sorted = req.query.sort || "";
	let sortQuery = {};

	if (sorted === 'highToLow') {
		sortQuery['productDetails.mrp'] = -1;
	} else if (sorted === 'lowToHigh') {
		sortQuery['productDetails.mrp'] = 1;
	} else if (sorted === 'newestToOldest') {
		sortQuery['productDetails.createdAt'] = -1;
	} else if (sorted === 'oldestToNewest') {
		sortQuery['productDetails.createdAt'] = 1;
	} else if (sorted === 'aATozZ') {
		sortQuery['productDetails.title'] = 1;
	} else if (sorted === 'zZToaA') {
		sortQuery['productDetails.title'] = -1;
	} else if (sorted === 'ratingHighToLow') {
		sortQuery.averageRating = -1;
	} else if (sorted === 'ratingLowToHigh') {
		sortQuery.averageRating = 1;
	} else (sorted === 'zZToaA')
	sortQuery['productDetails.createdAt'] = -1;

	let filterQuery = {}

	filterQuery['productDetails.status'] = true;
	// filterQuery['productDetails.brandName'] = [id];

	if (categoriesArr.length > 0) {
		filterQuery['productDetails.categoryName'] = { $in: categoriesArr };
	}
	if (colorsArr.length > 0) {
		filterQuery['productDetails.variants.color'] = { $in: colorsArr };
	}
	if (sizesArr.length > 0) {
		filterQuery['productDetails.variants.size'] = { $in: sizesArr };
	}

	const brandWiseProduct = await Product.aggregate([
		{ $match : { brandName : new ObjectId(id)}},
		{
			$lookup: {
				from: "products",
				localField: "_id",
				foreignField: "_id",
				as: "productDetails"
			}
		},
		{ $unwind: "$productDetails" },
		{
			$unwind: {
				path: "$productDetails.review",
				preserveNullAndEmptyArrays: true
			}
		},
		{
			$group: {
				_id: "$_id",
				sumOfRatings: { $sum: { $ifNull: ["$productDetails.review.rating", 0] } },
				countOfRatings: { $sum: { $cond: [{ $gt: ["$productDetails.review", null] }, 1, 0] } },
				averageRating: { $avg: { $ifNull: ["$productDetails.review.rating", 0] } },
				productDetails: { $first: "$productDetails" }
			}
		},
		{ $unwind: { path: "$productDetails.variants", preserveNullAndEmptyArrays: true } },
		{
			$group: {
				_id: "$_id",
				sumOfRatings: { $first: "$sumOfRatings" },
				countOfRatings: { $first: "$countOfRatings" },
				averageRating: { $first: "$averageRating" },
				sumOfQuantities: { $sum: { $ifNull: ["$productDetails.variants.quantity", 0] } },
				productDetails: { $first: "$productDetails" }
			}
		},
		{
			$project: {
				sumOfRatings: 1,
				countOfRatings: 1,
				averageRating: 1,
				sumOfQuantities: 1,
				productDetails: 1
			}
		},
		{ $match: filterQuery },
		{ $sort: sortQuery }
	]);

	const [brand, colors, categories, sizes] = await Promise.all([
		Brand.find({ _id: id }, {}),
		Color.find({ status: true }),
		Category.find({ status: true }),
		Size.find({ status: true }),
	]);

	const totalPages = Math.ceil(brandWiseProduct.length / limit);
	const paginatedbrandWiseProduct = brandWiseProduct.slice(skip, skip + limit);

	res.render('user-pages/userListBrandWisePage', {
		categories,
		colors,
		sizes,
		brand,
		totalPages,
		currentPage,
		paginatedbrandWiseProduct,
		limit,
		id,
		categoriesArr,
		colorsArr,
		sizesArr,
		sorted,
	});
};

const userAccessBrandWiseFilter_post = async (req, res) => {
	const { category, color, size, sort } = req.body;
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).render('user-pages/404');
	}

	let currentPage = Number(req.query.page) || 1;
	let limit = Number(req.query.limit) || 4;
	let skip = (currentPage - 1) * limit;

	const categoriesArr = category && category.length > 0 ? category.map(cat => new ObjectId(cat)) : [];
	const colorsArr = color && color.length > 0 ? color : [];
	const sizesArr = size && size.length > 0 ? size : [];
	const sorted = sort || "";

	let sortQuery = {};

	if (sorted === 'highToLow') {
		sortQuery['productDetails.mrp'] = -1;
	} else if (sorted === 'lowToHigh') {
		sortQuery['productDetails.mrp'] = 1;
	} else if (sorted === 'newestToOldest') {
		sortQuery['productDetails.createdAt'] = -1;
	} else if (sorted === 'oldestToNewest') {
		sortQuery['productDetails.createdAt'] = 1;
	} else if (sorted === 'aATozZ') {
		sortQuery['productDetails.title'] = 1;
	} else if (sorted === 'zZToaA') {
		sortQuery['productDetails.title'] = -1;
	} else if (sorted === 'ratingHighToLow') {
		sortQuery.averageRating = -1;
	} else if (sorted === 'ratingLowToHigh') {
		sortQuery.averageRating = 1;
	} else (sorted === 'zZToaA')
	sortQuery['productDetails.createdAt'] = -1;

	let filterQuery = {}

	filterQuery['productDetails.status'] = true;

	if (categoriesArr.length > 0) {
		filterQuery['productDetails.categoryName'] = { $in: categoriesArr };;
	}
	if (colorsArr.length > 0) {
		filterQuery['productDetails.variants.color'] = { $in: colorsArr };
	}
	if (sizesArr.length > 0) {
		filterQuery['productDetails.variants.size'] = { $in: sizesArr };
	}

	const brandWiseProduct = await Product.aggregate([
		{ $match : { brandName : new ObjectId(id)}},
		{
			$lookup: {
				from: "products",
				localField: "_id",
				foreignField: "_id",
				as: "productDetails"
			}
		},
		{ $unwind: "$productDetails" },
		{
			$unwind: {
				path: "$productDetails.review",
				preserveNullAndEmptyArrays: true
			}
		},
		{
			$group: {
				_id: "$_id",
				sumOfRatings: { $sum: { $ifNull: ["$productDetails.review.rating", 0] } },
				countOfRatings: { $sum: { $cond: [{ $gt: ["$productDetails.review", null] }, 1, 0] } },
				averageRating: { $avg: { $ifNull: ["$productDetails.review.rating", 0] } },
				productDetails: { $first: "$productDetails" }
			}
		},
		{ $unwind: { path: "$productDetails.variants", preserveNullAndEmptyArrays: true } },
		{
			$group: {
				_id: "$_id",
				sumOfRatings: { $first: "$sumOfRatings" },
				countOfRatings: { $first: "$countOfRatings" },
				averageRating: { $first: "$averageRating" },
				sumOfQuantities: { $sum: { $ifNull: ["$productDetails.variants.quantity", 0] } },
				productDetails: { $first: "$productDetails" }
			}
		},
		{
			$project: {
				sumOfRatings: 1,
				countOfRatings: 1,
				averageRating: 1,
				sumOfQuantities: 1,
				productDetails: 1
			}
		},
		{ $match: filterQuery },
		{ $sort: sortQuery }
	]);

	const [brand, colors, categories, sizes] = await Promise.all([
		Brand.find({ _id: id }, {}),
		Color.find({ status: true }),
		Category.find({ status: true }),
		Size.find({ status: true }),
	]);
	
	const totalPages = Math.ceil(brandWiseProduct.length / limit);
	const paginatedbrandWiseProduct = brandWiseProduct.slice(skip, skip + limit);

	res.render('user-pages/userListBrandWisePage', {
		categories,
		colors,
		sizes,
		brand,
		totalPages,
		currentPage,
		paginatedbrandWiseProduct,
		limit,
		id,
		categoriesArr,
		colorsArr,
		sizesArr,
		sorted,
	});
};

module.exports = {
	userAccessBrandWise_get,
	userAccessBrandWiseFilter_post
}