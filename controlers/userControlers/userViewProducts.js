const express = require('express')
const mongoose = require('mongoose')
const Category = require('../../models/category')
const Product = require('../../models/product')
const Color = require('../../models/color')
const Size = require('../../models/size')
const Brand = require('../../models/brand')
const Cart = require('../../models/cart')
const Wishlist = require('../../models/wishlist')
const { ObjectId } = require('mongodb')
const fetchProductsMiddleware = require('../../middlewares/productsMiddleware')

// userListAllproducts ,userViewProductDetails
const userViewProductDetails = async (req, res) => {
	const id = req.params.id
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).render('user-pages/404');
	}
	const productDetails = await Product.aggregate([
		{ $match: { '_id': new ObjectId(id) } },
		{ $addFields: { averageRating: { $avg: "$review.rating" } } },
	])

	const relatedProducts = await Product.aggregate([
		{ $match: { _id: new ObjectId(id) } },
		{
			$lookup: {
				from: "products",
				let: { productBrand: "$brandName", productCategory: "$categoryName" },
				pipeline: [
					{
						$match: {
							$expr: {
								$and: [
									{ $ne: ["$_id", new ObjectId(id)] },
									{ $eq: ["$brandName", "$$productBrand"] },
									{ $eq: ["$categoryName", "$$productCategory"] }
								]
							}
						}
					}
				],
				as: "relatedProducts"
			}
		},
		{ $unwind: "$relatedProducts" },
		{
			$project: {
				relatedProducts: 1,
				_id: 0
			}
		},
		{ $match : { 'relatedProducts.status' : true}},
		{ $limit: 6 }
	]);

	const colorDetails = await Color.find({ status: true })
	const sizeDetails = await Size.find({ status: true })

	const productVariants = await Product.aggregate([
		{
			$match: {
				"_id": new ObjectId(id)
			}
		},
		{
			$unwind: "$variants"
		},
		{
			$group: {
				_id: "$variants.color",
				sizes: { $addToSet: "$variants.size" }
			}
		},
		{
			$project: {
				_id: 0,
				color: "$_id",
				sizes: 1
			}
		}
	]);

	res.render('user-pages/userProductsDetailsPage',
		{ productDetails, colorDetails, sizeDetails, productVariants, relatedProducts })
}
const userSelectProductDetails = async (req, res) => {
	const id = req.params.id
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).render('user-pages/404');
	}
	const selectedColor = req.query.color
	const sizeDetails = await Size.find({ status: true })
	const productVariants = await Product.aggregate([
		{
			$match: {
				"_id": new ObjectId(id)
			}
		},
		{
			$unwind: "$variants"
		},
		{
			$match: {
				"variants.color": new ObjectId(selectedColor)
			}
		},
		{
			$group: {
				_id: "$_id",
				title: { $first: "$title" },
				color: { $first: "$variants.color" },
				sizes: { $addToSet: "$variants.size" },
				quantity: { $push: "$variants.quantity" }
			}
		},
		{
			$project: {
				_id: 0,
				title: 1,
				color: 1,
				sizes: 1,
				quantity: 1
			}
		}
	]);

	res.json({ productVariants, sizeDetails })
}
const userListAllproducts_get = async (req, res) => {
	let currentPage = Number(req.query.page) || 1
	let limit = Number(req.query.limit) || 4
	let skip = (currentPage - 1) * limit;
	let brandsArr = req.query.brand ? req.query.brand.split(',') : [];
	let categoriesArr = req.query.category ? req.query.category.split(',') : [];
	let colorsArr = req.query.color ? req.query.color.split(',') : [];
	let sizesArr = req.query.size ? req.query.size.split(',') : [];
	let sorted = req.query.sort ? req.query.sort : '';
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

	if (brandsArr.length > 0) {
		filterQuery['productDetails.brandName'] = brandsArr;
	}
	if (categoriesArr.length > 0) {
		filterQuery['productDetails.categoryName'] = categoriesArr;
	}
	if (colorsArr.length > 0) {
		filterQuery['productDetails.variants.color'] = { $in: colorsArr };
	}
	if (sizesArr.length > 0) {
		filterQuery['productDetails.variants.size'] = { $in: sizesArr };
	}

	const products = await Product.aggregate([
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

	const [categories, sizes, brands, colors] = await Promise.all([
		Category.find({ status: true }),
		Size.find({ status: true }),
		Brand.find({ status: true }),
		Color.find({ status: true })
	])
	const paginatedProducts = products.slice(skip, skip + limit)
	const totalPages = Math.ceil(products.length / limit)
	return res.render('user-pages/userListAllProductsPage',
		{
			categories, sizes, brands, colors,
			totalPages, currentPage, paginatedProducts, limit,
			brandsArr, categoriesArr, colorsArr, sizesArr, sorted
		})
}
const userListAllproducts_post = async (req, res) => {
	const { brand, category, color, size, sort } = req.body
	let currentPage = Number(req.query.page) || 1
	let limit = Number(req.query.limit) || 4
	let skip = (currentPage - 1) * limit;

	let brandsArr = brand && brand.length > 0 ? brand.map(bran => new ObjectId(bran)) : [];
	let categoriesArr = category && category.length > 0 ? category.map(cat => new ObjectId(cat)) : [];
	let colorsArr = color && color.length > 0 ? color : [];
	let sizesArr = size && size.length > 0 ? size : [];
	let sorted = sort ? sort : '';

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

	if (brandsArr.length > 0) {
		filterQuery['productDetails.brandName'] = brandsArr;
	}
	if (categoriesArr.length > 0) {
		filterQuery['productDetails.categoryName'] = categoriesArr;
	}
	if (colorsArr.length > 0) {
		filterQuery['productDetails.variants.color'] = { $in: colorsArr };
	}
	if (sizesArr.length > 0) {
		filterQuery['productDetails.variants.size'] = { $in: sizesArr };
	}

	const products = await Product.aggregate([
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

	const [categories, sizes, brands, colors] = await Promise.all([
		Category.find({ status: true }),
		Size.find({ status: true }),
		Brand.find({ status: true }),
		Color.find({ status: true })
	])
	const totalPages = Math.ceil(products.length / limit);
	const paginatedProducts = products.slice(skip, skip + limit);
	return res.render('user-pages/userListAllProductsPage',
		{
			categories, sizes, brands, colors,
			totalPages, currentPage, paginatedProducts, limit,
			brandsArr, categoriesArr, colorsArr, sizesArr, sorted
		})
}
const userAddToCart_post = async (req, res) => {
	const existingCart = await Cart.findOne({ userId: req.session.userId });
	if (existingCart) {
		const matchingItem = existingCart.cart.find(cartItem =>
			cartItem.product.toString() === req.body.productId &&
			cartItem.color.toString() === req.body.selectedColor &&
			cartItem.size.toString() === req.body.selectedSize
		);
		if (matchingItem) {
			// If a matching item is found, update the quantity
			matchingItem.quantity += parseInt(req.body.selectedQuantity, 10);
			await Cart.updateOne(
				{
					userId: new ObjectId(req.session.userId),
					'cart.product': new ObjectId(req.body.productId),
					'cart.color': new ObjectId(req.body.selectedColor),
					'cart.size': new ObjectId(req.body.selectedSize)
				},
				{
					$set: {
						'cart.$.quantity': matchingItem.quantity
					}
				}
			);
		} else {
			// If no matching item is found, add a new item to the cart
			existingCart.cart.push({
				product: req.body.productId,
				color: req.body.selectedColor,
				size: req.body.selectedSize,
				quantity: parseInt(req.body.selectedQuantity, 10),
			});
		}
		// Save the updated cart
		await existingCart.save();
		return res.json({ success: true, message: 'Item added to the cart successfully.' });
	} else {
		// If the user doesn't have a cart, create a new cart with the provided item
		const newCart = await Cart.create({
			userId: new ObjectId(req.session.userId),
			cart: [{
				product: req.body.productId,
				color: req.body.selectedColor,
				size: req.body.selectedSize,
				quantity: parseInt(req.body.selectedQuantity, 10),
			}],
		});
	}
	return res.json({ success: true, message: 'Item added to the cart successfully.' });
};
const userListProductReviews = async (req, res) => {
	const id = req.params.id
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).render('user-pages/404');
	}
	const productReviewDetails = await Product.aggregate([
		{ $match: { '_id': new ObjectId(id) } },
		{ $addFields: { averageRating: { $avg: "$review.rating" } } },
	])
	res.render('user-pages/userListProductReviewsPage',
		{ productReviewDetails })
}

module.exports = {
	userViewProductDetails,
	userListAllproducts_get,
	userListAllproducts_post,
	userSelectProductDetails,
	userAddToCart_post,
	userListProductReviews
}