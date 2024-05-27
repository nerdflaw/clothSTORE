const express = require('express')
const Razorpay = require('razorpay');
const puppeteer = require('puppeteer-core');
const path = require('path');
const allCountries = require('../../helpers/functions/countriesListGenerator')
const verifyPayment = require('../../helpers/functions/verifyPaymentSignature')
const AllCountryCodes = require('country-codes-list');
const Address = require('../../models/address')
const Product = require('../../models/product')
const Category = require('../../models/category')
const Cart = require('../../models/cart')
const Size = require('../../models/size')
const Brand = require('../../models/brand')
const Color = require('../../models/color')
const Wishlist = require('../../models/wishlist')
const Order = require('../../models/order')
const User = require('../../models/models')
const Coupon = require('../../models/coupon')
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const bcrypt = require('bcrypt')
const flash = require('connect-flash')
const getPincodes = require('get-indian-places-on-pincodes')
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET} = process.env;
const razorpayInstance = new Razorpay({
	key_id: RAZORPAY_KEY_ID,
	key_secret: RAZORPAY_KEY_SECRET,
});

const countryData = allCountries()

const userDashboard = async (req, res) => {
	const countryCodes = AllCountryCodes.customList('countryCallingCode');
	res.render('user-pages/userDashboardPage',
		{
			success: req.flash('success'),
			error: req.flash('error'),
			countryCodes
		})
};
const userDashboardAddressBook_get = async (req, res) => {
	const addressId = req.query.id;
	req.session.addressId = addressId
	if (addressId) {
		try {
			const result = await Address.aggregate([
				{
					$unwind: "$addresses"
				},
				{
					$match: {
						"addresses._id": new ObjectId(addressId)
					}
				},
				{
					$project: {
						_id: 1,
						userId: 1,
						addresses: 1,
						status: 1,
						createdAt: 1,
						updatedAt: 1,
						__v: 1
					}
				}
			]);
			console.log(result)
			if (result.length === 0) {
				console.log("No matching address found");
				return res.status(404).json({ message: "Address not found" });
			}
			return res.json({ result });
		} catch (error) {
			console.error(error);
			return res.status(500).json({ message: "Internal server error" });
		}
	} else {
		const user = await User.findOne({ email: req.session.email });
		if (user) {
			const userId = user._id;
			const addresses = await Address.find({ userId: userId })
			console.log(addresses)

			res.render('user-pages/userDashboardEditAddressBookPage',
				{
					countryData,
					message: req.flash('message'),
					addresses
				})
		}
	}
};
const userAddAddress_get = (req, res) => {
	res.render('user-pages/userDashboardAddAddressBookPage',
		{
			message: req.query.message,
			countryData
		})
};
const userAddAddress_post = async (req, res) => {
	console.log(req.body, 'req.body')
	const findUser = await Address.findOne({ userId: req.session.userId });
	if (findUser) {
		const updatedAddress = await Address.updateOne(
			{ userId: req.session.userId },
			{
				$push: {
					addresses: req.body
				}
			}
		);
		console.log(updatedAddress, 'updatedAddress');
		return res.redirect('/user-dashboard-address-book?message=Address added successfully');
	} else {
		const createdAddress = await Address.create({
			userId: new ObjectId(req.session.userId),
			addresses: req.body
		})
		console.log(createdAddress, 'createdAddress')
		res.redirect('/user-dashboard-address-book?message=Address added successfully');
	}
};
const userEditAddress_post = async (req, res) => {
	const addressId = req.session.addressId
	const userId = new ObjectId(req.session.userId);
	const findUser = await Address.findOne({ userId: userId });
	console.log(findUser, 'findUser');
	console.log(req.session.userId, 'userId');
	if (findUser) {
		const existingAddress = findUser.addresses.find(address =>
			address.fullName === req.body.fullName &&
			address.phoneNumber === req.body.phoneNumber &&
			address.email === req.body.email &&
			address.building === req.body.building &&
			address.houseNumber === req.body.houseNumber &&
			address.country === req.body.country &&
			address.pincode === parseInt(req.body.pincode) &&
			address.street === req.body.street &&
			address.city === req.body.city &&
			address.state === req.body.state &&
			address.area === req.body.area &&
			address.circle === req.body.circle &&
			address.region === req.body.region &&
			address.division === req.body.division &&
			address.location === req.body.location &&
			address.district === req.body.district)

		if (existingAddress) {
			req.flash('message', 'Address already exists')
			return res.redirect('/user-dashboard-address-book');
		} else {
			const updatedAddress = await Address.findOneAndUpdate(
				{
					'addresses._id': new ObjectId(addressId)
				},
				{
					$set: {
						'addresses.$.country': req.body.country,
						'addresses.$.fullName': req.body.fullName,
						'addresses.$.email': req.body.email,
						'addresses.$.phoneNumber': req.body.phoneNumber,
						'addresses.$.building': req.body.building,
						'addresses.$.houseNumber': req.body.houseNumber,
						'addresses.$.street': req.body.street,
						'addresses.$.city': req.body.city,
						'addresses.$.area': req.body.area,
						'addresses.$.pincode': req.body.pincode,
						'addresses.$.circle': req.body.circle,
						'addresses.$.region': req.body.region,
						'addresses.$.division': req.body.division,
						'addresses.$.location': req.body.location,
						'addresses.$.district': req.body.district,
						'addresses.$.state': req.body.state
					}
				},
				{
					new: true
				}
			);
			console.log(updatedAddress);
			req.flash('message', 'Address updated successfully')
			res.redirect('/user-dashboard-address-book');
		}
	}
};
const userDeleteAddress_post = async (req, res) => {
	const id = req.params.id
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).render('user-pages/404');
	}
	const address = await Address.updateOne(
		{ userId: new ObjectId(req.session.userId) },
		{ $pull: { addresses: { _id: id } } },
	)
	console.log(address, 'deleted address')
	return res.redirect('/user-dashboard-address-book?message=Address deleted successfully')
};
const userCheckOldPassword_post = async (req, res) => {
	const userId = req.session.userId;
	const userdata = await User.findOne({ _id: new ObjectId(userId) })
	if (!userdata) {
		return res.status(404).json({ error: 'User not found' });
	}
	const pass = await bcrypt.compare(req.body.oldPassword, userdata.password)
	if (!pass) {
		return res.json({ error: 'Old password is incorrect' });
	}
	res.json({ success: true });
};
const userGetPincodeDatails_post = (req, res) => {
	console.log(req.body, 'pincode');
	const pincode = req.body.pincode;
	const data = getPincodes(parseInt(pincode));
	if (data) {
		console.log(data)
		return res.json({ data });
	} else {
		return res.json({ status: "Invalid pincode" });
	}
};
const userSearch_get = async (req, res) => {
	// console.log(req.query, 'query')
	const searchKey = req.query.searchKey || '';

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
	filterQuery['productDetails.title']= { $regex: searchKey, $options: "i" }

	if (brandsArr.length > 0) {
		filterQuery['productDetails.brandName'] = {$in : brandsArr};
	}
	if (categoriesArr.length > 0) {
		filterQuery['productDetails.categoryName'] = {$in : categoriesArr};
	}
	if (colorsArr.length > 0) {
		filterQuery['productDetails.variants.color'] = { $in: colorsArr };
	}
	if (sizesArr.length > 0) {
		filterQuery['productDetails.variants.size'] = { $in: sizesArr };
	}

	const searchResult = await Product.aggregate([
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
	// console.log('searchResult', searchResult)

	const totalPages = Math.ceil(searchResult.length / limit)
	const paginatedSearchResult = searchResult.slice(skip, skip + limit)
	// console.log(paginatedSearchResult)

	return res.render('user-pages/userListSearchResultPage', {
		categories, sizes, brands, colors,
		totalPages, currentPage, searchKey, paginatedSearchResult, limit,
		brandsArr, categoriesArr, colorsArr, sizesArr, sorted,
	})
};
const userSearch_post = async (req, res) => {
	const { brand, category, color, size, sort, searchKey } = req.body
	// console.log(req.body)
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
	filterQuery['productDetails.title']= { $regex: searchKey, $options: "i" }

	if (brandsArr.length > 0) {
		filterQuery['productDetails.brandName'] = {$in : brandsArr};
	}
	if (categoriesArr.length > 0) {
		filterQuery['productDetails.categoryName'] = {$in : categoriesArr};
	}
	if (colorsArr.length > 0) {
		filterQuery['productDetails.variants.color'] = { $in: colorsArr };
	}
	if (sizesArr.length > 0) {
		filterQuery['productDetails.variants.size'] = { $in: sizesArr };
	}

	const searchResult = await Product.aggregate([
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
	// console.log('searchResult', searchResult)

	const totalPages = Math.ceil(searchResult.length / limit)
	const paginatedSearchResult = searchResult.slice(skip, skip + limit)
	// console.log(paginatedSearchResult)

	return res.render('user-pages/userListSearchResultPage', {
		categories, sizes, brands, colors,
		totalPages, currentPage, searchKey, paginatedSearchResult, limit,
		brandsArr, categoriesArr, colorsArr, sizesArr, sorted,
	})
};
const userDashboardCart_get = async (req, res) => {
	let currentPage = Number(req.query.page) || 1;
	let limit = Number(req.query.limit) || 2;
	let skip = (currentPage - 1) * limit;

	const sizes = await Size.find({ status: true })
	const colors = await Color.find({ status: true })
	const userCartData = await Cart.aggregate([
		{ $match: { userId: new ObjectId(req.session.userId) } },
		{ $unwind: '$cart' },
		{
			$project: {
				cartId: '$cart._id',
				productId: '$cart.product',
				colorId: '$cart.color',
				sizeId: '$cart.size',
				quantity: '$cart.quantity',
				couponId: { $ifNull: ['$cart.coupon', null] },
				updatedAt: "$updatedAt",
				createdAt: "$createdAt"
			},
		},
		{
			$lookup: {
				from: "products",
				localField: "productId",
				foreignField: "_id",
				as: "productData",
			},
		},
		{
			$lookup: {
				from: "colors",
				localField: "colorId",
				foreignField: "_id",
				as: "colorData",
			},
		},
		{
			$lookup: {
				from: "sizes",
				localField: "sizeId",
				foreignField: "_id",
				as: "sizeData",
			},
		},
		{
			$lookup: {
				from: "coupons",
				localField: "couponId",
				foreignField: "_id",
				as: "couponData",
			},
		},
		{
			$unwind: "$productData"
		},
		{
			$unwind: "$colorData"
		},
		{
			$unwind: "$sizeData"
		},
		{
			$unwind: {
				path: "$couponData",
				preserveNullAndEmptyArrays: true
			}
		},
		{
			$addFields: {
				mrp: "$productData.mrp",
				discount: "$productData.discount",
				couponValue: { $ifNull: ["$couponData.couponValue", 0] }
			}
		},
		{
			$project: {
				individualTotal: {
					$multiply: ["$mrp", "$quantity"]
				},
				taxRate: 0.18,
				mrpWithoutTax: {
					$multiply: [
						{ $multiply: ["$mrp", "$quantity"] },
						{ $divide: [100, 118] }
					]
				},
				firstDiscountAmount: {
					$multiply: [
						{
							$multiply: [
								{ $multiply: ["$mrp", "$quantity"] },
								{ $divide: [100, 118] }
							]
						},
						{ $divide: ["$discount", 100] }
					]
				},
				AmountAfterfirstDiscount: {
					$subtract: [
						{
							$multiply: [
								{ $multiply: ["$mrp", "$quantity"] },
								{ $divide: [100, 118] }
							]
						},
						{
							$multiply: [
								{
									$multiply: [
										{ $multiply: ["$mrp", "$quantity"] },
										{ $divide: [100, 118] }
									]
								},
								{ $divide: ["$discount", 100] }
							]
						}
					]
				},
				seccondDiscountAmount: {
					$multiply: [
						{
							$subtract: [
								{
									$multiply: [
										{ $multiply: ["$mrp", "$quantity"] },
										{ $divide: [100, 118] }
									]
								},
								{
									$multiply: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{ $divide: ["$discount", 100] }
									]
								}
							]
						},
						{ $divide: ["$couponValue", 100] }
					]
				},
				AmountAfterSecondDiscount: {
					$subtract: [
						{
							$subtract: [
								{
									$multiply: [
										{ $multiply: ["$mrp", "$quantity"] },
										{ $divide: [100, 118] }
									]
								},
								{
									$multiply: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{ $divide: ["$discount", 100] }
									]
								}
							]
						},
						{
							$multiply: [
								{
									$subtract: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{
											$multiply: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{ $divide: ["$discount", 100] }
											]
										}
									]
								},
								{ $divide: ["$couponValue", 100] }
							]
						}
					]
				},
				gst: {
					$multiply: [
						{ $divide: [18, 100] },
						{
							$subtract: [
								{
									$subtract: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{
											$multiply: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{ $divide: ["$discount", 100] }
											]
										}
									]
								},
								{
									$multiply: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{ $divide: ["$couponValue", 100] }
									]
								}
							]
						}
					]
				},
				sgst: {
					$divide: [
						{
							$multiply: [
								{ $divide: [18, 100] },
								{
									$subtract: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{
											$multiply: [
												{
													$subtract: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{
															$multiply: [
																{
																	$multiply: [
																		{ $multiply: ["$mrp", "$quantity"] },
																		{ $divide: [100, 118] }
																	]
																},
																{ $divide: ["$discount", 100] }
															]
														}
													]
												},
												{ $divide: ["$couponValue", 100] }
											]
										}
									]
								}
							]
						}, 2
					]
				},
				cgst: {
					$divide: [
						{
							$multiply: [
								{ $divide: [18, 100] },
								{
									$subtract: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{
											$multiply: [
												{
													$subtract: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{
															$multiply: [
																{
																	$multiply: [
																		{ $multiply: ["$mrp", "$quantity"] },
																		{ $divide: [100, 118] }
																	]
																},
																{ $divide: ["$discount", 100] }
															]
														}
													]
												},
												{ $divide: ["$couponValue", 100] }
											]
										}
									]
								}
							]
						}, 2
					]
				},
				totalPrice: {
					$add: [
						{
							$subtract: [
								{
									$subtract: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{
											$multiply: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{ $divide: ["$discount", 100] }
											]
										}
									]
								},
								{
									$multiply: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{ $divide: ["$couponValue", 100] }
									]
								}
							]
						},
						{
							$multiply: [
								{ $divide: [18, 100] },
								{
									$subtract: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{
											$multiply: [
												{
													$subtract: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{
															$multiply: [
																{
																	$multiply: [
																		{ $multiply: ["$mrp", "$quantity"] },
																		{ $divide: [100, 118] }
																	]
																},
																{ $divide: ["$discount", 100] }
															]
														}
													]
												},
												{ $divide: ["$couponValue", 100] }
											]
										}
									]
								}
							]
						}
					]
				},
				mrp: "$productData.mrp",
				images: "$productData.images",
				discount: "$productData.discount",
				product: "$productData.title",
				color: "$colorData.color",
				size: "$sizeData.size",
				quantity: 1,
				cartId: 1,
				productId: 1,
				couponId: 1,
				colorId: 1,
				sizeId: 1,
				updatedAt: 1,
				createdAt: 1
			}
		},
		{ $sort: { createdAt: -1 } }
	])

	// console.log(userCartData, 'userCartData');

	let totalIndividualTotal = 0
    let totalMrpWithoutTax = 0
    let totalFirstDiscountAmount = 0
    let totalAmountAfterfirstDiscount = 0  
    let totalSeccondDiscountAmount = 0
    let totalAmountAfterSecondDiscount = 0  
    let totalGst = 0
    let totalSgst = 0
    let totalCgst = 0

	userCartData.forEach(cartItem => {
		totalIndividualTotal += cartItem.individualTotal
		totalMrpWithoutTax += cartItem.mrpWithoutTax 
		totalFirstDiscountAmount += cartItem.firstDiscountAmount 
		totalAmountAfterfirstDiscount += cartItem.AmountAfterfirstDiscount   
		totalSeccondDiscountAmount += cartItem.seccondDiscountAmount 
		totalAmountAfterSecondDiscount += cartItem.AmountAfterSecondDiscount   
		totalGst += cartItem.gst 
		totalSgst += cartItem.sgst 
		totalCgst += cartItem.cgst
	});

	let totalDiscount = totalIndividualTotal - ( totalAmountAfterSecondDiscount + totalGst )
	let totalDiscountPercentage = ( totalDiscount / totalIndividualTotal ) * 100
	let roundOff = totalIndividualTotal - (totalAmountAfterSecondDiscount + totalGst + totalDiscount )
	let grandTotal = totalAmountAfterSecondDiscount + totalGst

	// console.log (totalIndividualTotal);
    // console.log (totalMrpWithoutTax);
    // console.log (totalFirstDiscountAmount);
    // console.log (totalAmountAfterfirstDiscount);  
    // console.log (totalSeccondDiscountAmount);
    // console.log (totalAmountAfterSecondDiscount);  
    // console.log (totalGst);
    // console.log (totalSgst);
    // console.log (totalCgst);
    // console.log (totalDiscount , 'total discount amount');
    // console.log (totalDiscountPercentage , 'total discount percentage');
    // console.log (roundOff , 'total roundOff');
    // console.log (grandTotal , 'total with gst final ');

	const totalPages = Math.ceil(userCartData.length / limit);
	const paginatedCartProducts = userCartData.slice(skip, skip + limit);
	res.render('user-pages/userDashboardCartPage',
		{
			userCartData, totalAmountAfterSecondDiscount, totalGst,
			totalSgst, totalCgst, totalDiscount, totalDiscountPercentage, roundOff , grandTotal,
			paginatedCartProducts, sizes, colors,
			message: req.flash('message'),
			currentPage, limit, totalPages
		})

};
const userDashboardReturns_get = async (req, res) => {

	let currentPage = Number(req.query.page) || 1;
	let limit = Number(req.query.limit) || 1;
	let skip = (currentPage - 1) * limit;

	const order = await Order.aggregate([
		{ $match: { userId: new ObjectId(req.session.userId) } },
		{ $unwind: "$order" },
		{
			$project: {
				addressId: '$addressId',
				productId: '$order.productId',
				couponId: { $ifNull: ['$order.couponId', null] },
				colorId: '$order.colorId',
				sizeId: '$order.sizeId',
				quantity: '$order.quantity',
				status: '$order.status',
				paymentMode: "$paymentMode",
				orderStatus: "$orderStatus",
				paymentStatus: "$paymentStatus",
				createdAt: "$createdAt",
				updatedAt: "$updatedAt",
				wholeOrderId :'$_id',
				singleOrderId :'$order._id',
			}
		},
		{


			$lookup: {
				from: "products",
				localField: "productId",
				foreignField: "_id",
				as: "productData"
			}
		},
		{
			$lookup: {
				from: "coupons",
				localField: "couponId",
				foreignField: "_id",
				as: "couponData"
			}
		},
		{
			$lookup: {
				from: "colors",
				localField: "colorId",
				foreignField: "_id",
				as: "colorData"
			}
		},
		{
			$lookup: {
				from: "sizes",
				localField: "sizeId",
				foreignField: "_id",
				as: "sizeData"
			}
		},
		{ $unwind: "$productData" },
		{ $unwind: { path: "$couponData", preserveNullAndEmptyArrays: true } },
		{ $unwind: "$colorData" },
		{ $unwind: "$sizeData" },
		{
			$addFields: {
				mrp: '$productData.mrp',
				discount: '$productData.discount',
				couponValue: { $ifNull: ['$couponData.couponValue', 0] },
				couponCode: { $ifNull: ['$couponData.couponCode', null] },
				couponName: { $ifNull: ['$couponData.coupon', null] }
				
			}
		},
		{
			$project: {
				individualTotal: {
					$multiply: ["$mrp", "$quantity"]
				},
				taxRate: 0.18,
				mrpWithoutTax: {
					$multiply: [
						{ $multiply: ["$mrp", "$quantity"] },
						{ $divide: [100, 118] }
					]
				},
				firstDiscountAmount: {
					$multiply: [
						{
							$multiply: [
								{ $multiply: ["$mrp", "$quantity"] },
								{ $divide: [100, 118] }
							]
						},
						{ $divide: ["$discount", 100] }
					]
				},
				AmountAfterfirstDiscount: {
					$subtract: [
						{
							$multiply: [
								{ $multiply: ["$mrp", "$quantity"] },
								{ $divide: [100, 118] }
							]
						},
						{
							$multiply: [
								{
									$multiply: [
										{ $multiply: ["$mrp", "$quantity"] },
										{ $divide: [100, 118] }
									]
								},
								{ $divide: ["$discount", 100] }
							]
						}
					]
				},
				seccondDiscountAmount: {
					$multiply: [
						{
							$subtract: [
								{
									$multiply: [
										{ $multiply: ["$mrp", "$quantity"] },
										{ $divide: [100, 118] }
									]
								},
								{
									$multiply: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{ $divide: ["$discount", 100] }
									]
								}
							]
						},
						{ $divide: ["$couponValue", 100] }
					]
				},
				AmountAfterSecondDiscount: {
					$subtract: [
						{
							$subtract: [
								{
									$multiply: [
										{ $multiply: ["$mrp", "$quantity"] },
										{ $divide: [100, 118] }
									]
								},
								{
									$multiply: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{ $divide: ["$discount", 100] }
									]
								}
							]
						},
						{
							$multiply: [
								{
									$subtract: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{
											$multiply: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{ $divide: ["$discount", 100] }
											]
										}
									]
								},
								{ $divide: ["$couponValue", 100] }
							]
						}
					]
				},
				gst: {
					$multiply: [
						{ $divide: [18, 100] },
						{
							$subtract: [
								{
									$subtract: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{
											$multiply: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{ $divide: ["$discount", 100] }
											]
										}
									]
								},
								{
									$multiply: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{ $divide: ["$couponValue", 100] }
									]
								}
							]
						}
					]
				},
				sgst: {
					$divide: [
						{
							$multiply: [
								{ $divide: [18, 100] },
								{
									$subtract: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{
											$multiply: [
												{
													$subtract: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{
															$multiply: [
																{
																	$multiply: [
																		{ $multiply: ["$mrp", "$quantity"] },
																		{ $divide: [100, 118] }
																	]
																},
																{ $divide: ["$discount", 100] }
															]
														}
													]
												},
												{ $divide: ["$couponValue", 100] }
											]
										}
									]
								}
							]
						}, 2
					]
				},
				cgst: {
					$divide: [
						{
							$multiply: [
								{ $divide: [18, 100] },
								{
									$subtract: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{
											$multiply: [
												{
													$subtract: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{
															$multiply: [
																{
																	$multiply: [
																		{ $multiply: ["$mrp", "$quantity"] },
																		{ $divide: [100, 118] }
																	]
																},
																{ $divide: ["$discount", 100] }
															]
														}
													]
												},
												{ $divide: ["$couponValue", 100] }
											]
										}
									]
								}
							]
						}, 2
					]
				},
				totalPrice: {
					$add: [
						{
							$subtract: [
								{
									$subtract: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{
											$multiply: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{ $divide: ["$discount", 100] }
											]
										}
									]
								},
								{
									$multiply: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{ $divide: ["$couponValue", 100] }
									]
								}
							]
						},
						{
							$multiply: [
								{ $divide: [18, 100] },
								{
									$subtract: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{
											$multiply: [
												{
													$subtract: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{
															$multiply: [
																{
																	$multiply: [
																		{ $multiply: ["$mrp", "$quantity"] },
																		{ $divide: [100, 118] }
																	]
																},
																{ $divide: ["$discount", 100] }
															]
														}
													]
												},
												{ $divide: ["$couponValue", 100] }
											]
										}
									]
								}
							]
						}
					]
				},
				paymentMode: 1,
				addressId: 1,
				orderStatus: 1,
				paymentStatus: 1,
				createdAt: 1,
				updatedAt: 1,
				mrp:1,
				couponValue : 1,
				couponCode : 1,
				couponName : 1,
				discount: 1,
				status: 1,
				title: "$productData.title",
				images: "$productData.images",
				productDetailsReview : "$productData.review",
				color: "$colorData.color",
				size: "$sizeData.size",
				productId: 1,
				wholeOrderId : 1,
				singleOrderId : 1,
				quantity: 1
			}
		},
		{
			$group: {
				_id: "$wholeOrderId",
				orders: { $push: "$$ROOT" }
			}
		},
		{ $match : { 'orders.orderStatus' : 'returned'}},
		{ $sort: { 'orders.createdAt': -1 } },
	]);

	console.log(order,'order');
	let totalIndividualTotal = 0
    let totalMrpWithoutTax = 0
    let totalFirstDiscountAmount = 0
    let totalAmountAfterfirstDiscount = 0  
    let totalSeccondDiscountAmount = 0
    let totalAmountAfterSecondDiscount = 0  
    let totalGst = 0
    let totalSgst = 0
    let totalCgst = 0

	order.forEach(orderItem => {
		orderItem.orders.forEach(orderItmes =>{
			totalIndividualTotal += orderItmes.individualTotal
			totalMrpWithoutTax += orderItmes.mrpWithoutTax 
			totalFirstDiscountAmount += orderItmes.firstDiscountAmount 
			totalAmountAfterfirstDiscount += orderItmes.AmountAfterfirstDiscount   
			totalSeccondDiscountAmount += orderItmes.seccondDiscountAmount 
			totalAmountAfterSecondDiscount += orderItmes.AmountAfterSecondDiscount   
			totalGst += orderItmes.gst 
			totalSgst += orderItmes.sgst 
			totalCgst += orderItmes.cgst
		})
	});

	let totalDiscount = totalIndividualTotal - ( totalAmountAfterSecondDiscount + totalGst )
	let totalDiscountPercentage = ( totalDiscount / totalIndividualTotal ) * 100
	let roundOff = totalIndividualTotal - (totalAmountAfterSecondDiscount + totalGst + totalDiscount )
	let grandTotal = totalAmountAfterSecondDiscount + totalGst

	const totalPages = Math.ceil(order.length / limit);
	const paginatedOrder = order.slice(skip, skip + limit);

	res.render('user-pages/userDashboardReturnPage', {
		message: req.flash('message'),
		paginatedOrder,
		currentPage,
		limit,
		totalPages,
		totalAmountAfterSecondDiscount, totalGst,
		totalSgst, totalCgst, totalDiscount, totalDiscountPercentage, roundOff , grandTotal,
	});
};
const userDashboardCancellations_get = async (req, res) => {
	let currentPage = Number(req.query.page) || 1;
	let limit = Number(req.query.limit) || 1;
	let skip = (currentPage - 1) * limit;

	const order = await Order.aggregate([
		{ $match: { userId: new ObjectId(req.session.userId) } },
		{ $unwind: "$order" },
		{
			$project: {
				addressId: '$addressId',
				productId: '$order.productId',
				couponId: { $ifNull: ['$order.couponId', null] },
				colorId: '$order.colorId',
				sizeId: '$order.sizeId',
				quantity: '$order.quantity',
				status: '$order.status',
				paymentMode: "$paymentMode",
				orderStatus: "$orderStatus",
				paymentStatus: "$paymentStatus",
				createdAt: "$createdAt",
				updatedAt: "$updatedAt",
				wholeOrderId :'$_id',
				singleOrderId :'$order._id',
			}
		},
		{


			$lookup: {
				from: "products",
				localField: "productId",
				foreignField: "_id",
				as: "productData"
			}
		},
		{
			$lookup: {
				from: "coupons",
				localField: "couponId",
				foreignField: "_id",
				as: "couponData"
			}
		},
		{
			$lookup: {
				from: "colors",
				localField: "colorId",
				foreignField: "_id",
				as: "colorData"
			}
		},
		{
			$lookup: {
				from: "sizes",
				localField: "sizeId",
				foreignField: "_id",
				as: "sizeData"
			}
		},
		{ $unwind: "$productData" },
		{ $unwind: { path: "$couponData", preserveNullAndEmptyArrays: true } },
		{ $unwind: "$colorData" },
		{ $unwind: "$sizeData" },
		{
			$addFields: {
				mrp: '$productData.mrp',
				discount: '$productData.discount',
				couponValue: { $ifNull: ['$couponData.couponValue', 0] },
				couponCode: { $ifNull: ['$couponData.couponCode', null] },
				couponName: { $ifNull: ['$couponData.coupon', null] }
				
			}
		},
		{
			$project: {
				individualTotal: {
					$multiply: ["$mrp", "$quantity"]
				},
				taxRate: 0.18,
				mrpWithoutTax: {
					$multiply: [
						{ $multiply: ["$mrp", "$quantity"] },
						{ $divide: [100, 118] }
					]
				},
				firstDiscountAmount: {
					$multiply: [
						{
							$multiply: [
								{ $multiply: ["$mrp", "$quantity"] },
								{ $divide: [100, 118] }
							]
						},
						{ $divide: ["$discount", 100] }
					]
				},
				AmountAfterfirstDiscount: {
					$subtract: [
						{
							$multiply: [
								{ $multiply: ["$mrp", "$quantity"] },
								{ $divide: [100, 118] }
							]
						},
						{
							$multiply: [
								{
									$multiply: [
										{ $multiply: ["$mrp", "$quantity"] },
										{ $divide: [100, 118] }
									]
								},
								{ $divide: ["$discount", 100] }
							]
						}
					]
				},
				seccondDiscountAmount: {
					$multiply: [
						{
							$subtract: [
								{
									$multiply: [
										{ $multiply: ["$mrp", "$quantity"] },
										{ $divide: [100, 118] }
									]
								},
								{
									$multiply: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{ $divide: ["$discount", 100] }
									]
								}
							]
						},
						{ $divide: ["$couponValue", 100] }
					]
				},
				AmountAfterSecondDiscount: {
					$subtract: [
						{
							$subtract: [
								{
									$multiply: [
										{ $multiply: ["$mrp", "$quantity"] },
										{ $divide: [100, 118] }
									]
								},
								{
									$multiply: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{ $divide: ["$discount", 100] }
									]
								}
							]
						},
						{
							$multiply: [
								{
									$subtract: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{
											$multiply: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{ $divide: ["$discount", 100] }
											]
										}
									]
								},
								{ $divide: ["$couponValue", 100] }
							]
						}
					]
				},
				gst: {
					$multiply: [
						{ $divide: [18, 100] },
						{
							$subtract: [
								{
									$subtract: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{
											$multiply: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{ $divide: ["$discount", 100] }
											]
										}
									]
								},
								{
									$multiply: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{ $divide: ["$couponValue", 100] }
									]
								}
							]
						}
					]
				},
				sgst: {
					$divide: [
						{
							$multiply: [
								{ $divide: [18, 100] },
								{
									$subtract: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{
											$multiply: [
												{
													$subtract: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{
															$multiply: [
																{
																	$multiply: [
																		{ $multiply: ["$mrp", "$quantity"] },
																		{ $divide: [100, 118] }
																	]
																},
																{ $divide: ["$discount", 100] }
															]
														}
													]
												},
												{ $divide: ["$couponValue", 100] }
											]
										}
									]
								}
							]
						}, 2
					]
				},
				cgst: {
					$divide: [
						{
							$multiply: [
								{ $divide: [18, 100] },
								{
									$subtract: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{
											$multiply: [
												{
													$subtract: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{
															$multiply: [
																{
																	$multiply: [
																		{ $multiply: ["$mrp", "$quantity"] },
																		{ $divide: [100, 118] }
																	]
																},
																{ $divide: ["$discount", 100] }
															]
														}
													]
												},
												{ $divide: ["$couponValue", 100] }
											]
										}
									]
								}
							]
						}, 2
					]
				},
				totalPrice: {
					$add: [
						{
							$subtract: [
								{
									$subtract: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{
											$multiply: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{ $divide: ["$discount", 100] }
											]
										}
									]
								},
								{
									$multiply: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{ $divide: ["$couponValue", 100] }
									]
								}
							]
						},
						{
							$multiply: [
								{ $divide: [18, 100] },
								{
									$subtract: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{
											$multiply: [
												{
													$subtract: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{
															$multiply: [
																{
																	$multiply: [
																		{ $multiply: ["$mrp", "$quantity"] },
																		{ $divide: [100, 118] }
																	]
																},
																{ $divide: ["$discount", 100] }
															]
														}
													]
												},
												{ $divide: ["$couponValue", 100] }
											]
										}
									]
								}
							]
						}
					]
				},
				paymentMode: 1,
				addressId: 1,
				orderStatus: 1,
				paymentStatus: 1,
				createdAt: 1,
				updatedAt: 1,
				mrp:1,
				couponValue : 1,
				couponCode : 1,
				couponName : 1,
				discount: 1,
				status: 1,
				title: "$productData.title",
				images: "$productData.images",
				productDetailsReview : "$productData.review",
				color: "$colorData.color",
				size: "$sizeData.size",
				productId: 1,
				wholeOrderId : 1,
				singleOrderId : 1,
				quantity: 1
			}
		},
		{
			$group: {
				_id: "$wholeOrderId",
				orders: { $push: "$$ROOT" }
			}
		},
		{ $match : { 'orders.orderStatus' : 'cancelled'}},
		{ $sort: { 'orders.createdAt': -1 } },
	]);

	console.log(order,'order');
	let totalIndividualTotal = 0
    let totalMrpWithoutTax = 0
    let totalFirstDiscountAmount = 0
    let totalAmountAfterfirstDiscount = 0  
    let totalSeccondDiscountAmount = 0
    let totalAmountAfterSecondDiscount = 0  
    let totalGst = 0
    let totalSgst = 0
    let totalCgst = 0

	order.forEach(orderItem => {
		orderItem.orders.forEach(orderItmes =>{
			totalIndividualTotal += orderItmes.individualTotal
			totalMrpWithoutTax += orderItmes.mrpWithoutTax 
			totalFirstDiscountAmount += orderItmes.firstDiscountAmount 
			totalAmountAfterfirstDiscount += orderItmes.AmountAfterfirstDiscount   
			totalSeccondDiscountAmount += orderItmes.seccondDiscountAmount 
			totalAmountAfterSecondDiscount += orderItmes.AmountAfterSecondDiscount   
			totalGst += orderItmes.gst 
			totalSgst += orderItmes.sgst 
			totalCgst += orderItmes.cgst
		})
	});

	let totalDiscount = totalIndividualTotal - ( totalAmountAfterSecondDiscount + totalGst )
	let totalDiscountPercentage = ( totalDiscount / totalIndividualTotal ) * 100
	let roundOff = totalIndividualTotal - (totalAmountAfterSecondDiscount + totalGst + totalDiscount )
	let grandTotal = totalAmountAfterSecondDiscount + totalGst

	const totalPages = Math.ceil(order.length / limit);
	const paginatedOrder = order.slice(skip, skip + limit);

	res.render('user-pages/userDashboardCancellationPage', {
		message: req.flash('message'),
		paginatedOrder,
		currentPage,
		limit,
		totalPages,
		totalAmountAfterSecondDiscount, totalGst,
		totalSgst, totalCgst, totalDiscount, totalDiscountPercentage, roundOff , grandTotal,
	});
};
const userDashboardWishists_get = async (req, res) => {

	let currentPage = Number(req.query.page) || 1;
	let limit = Number(req.query.limit) || 4;
	let skip = (currentPage - 1) * limit;

	const userWishList = await Wishlist.aggregate([
		{ $match: { userId: new ObjectId(req.session.userId) } },
		{ $unwind: '$wishlist' },
		{
			$lookup: {
				from: 'products',
				localField: 'wishlist.product',
				foreignField: '_id',
				as: 'productDetails'
			}
		},
		{ $unwind: "$productDetails" },
		{
			$project: {
				productDetails: 1,
				review: "$productDetails.review",
				variants: "$productDetails.variants",
			}
		},
		{
			$addFields: {
				sumOfRatings: { $sum: { $ifNull: ["$review.rating", 0] } },
				countOfRatings: { $size: "$review" },
				sumOfQuantities: { $sum: "$variants.quantity" },
				averageRating: { $avg: { $ifNull: ["$review.rating", 0] } }
			}
		},
		{
			$group: {
				_id: "$productDetails._id",
				productDetails: { $first: "$productDetails" },
				sumOfRatings: { $first: "$sumOfRatings" },
				countOfRatings: { $first: "$countOfRatings" },
				sumOfQuantities: { $first: "$sumOfQuantities" },
				averageRating: { $first: "$averageRating" }
			}
		},
		{
			$project: {
				_id: 0,
				productDetails: 1,
				sumOfRatings: 1,
				countOfRatings: 1,
				sumOfQuantities: 1,
				averageRating: 1
				// { $round: ["$averageRating", 1] }
				// Rounding average rating to one decimal place
			}
		},
		{ $sort: { 'productDetails.createdAt': -1 } }
	]);

	const totalPages = Math.ceil(userWishList.length / limit);
	const paginatedWishlistProduct = userWishList.slice(skip, skip + limit);

	res.render('user-pages/userDashboardWishListPage',
		{
			success: req.flash('success'),
			error: req.flash('error'),
			paginatedWishlistProduct,
			totalPages,
			currentPage,
			limit
		})
};
const userWishList_get = async (req, res) => {
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).render('user-pages/404');
	}
	let update;
	const existingUserWishlist = await Wishlist.findOne({ userId: new ObjectId(req.session.userId) });
	if (existingUserWishlist) {

		const matchingItem = existingUserWishlist.wishlist.find(wishlistItem =>
			wishlistItem.product.toString() === id
		);

		if (matchingItem) {
			update = await Wishlist.updateOne(
				{ userId: new ObjectId(req.session.userId) },
				{
					$pull: {
						wishlist: { product: new ObjectId(id) }
					}
				}
			);
			return res.json({ removed: true, wishlist: existingUserWishlist, message: 'Removed item from wish-list' });
		} else {
			const newWishlist = await Wishlist.updateOne(
				{ userId: new ObjectId(req.session.userId) },
				{
					$push: {
						wishlist: { product: new ObjectId(id) }
					}
				},
				{ upsert: true }
			);
			return res.json({ added: true, wishlist: existingUserWishlist, message: 'item added to wish-list' });
		}

	} else {
		const newWishlist = await Wishlist.create({
			userId: new ObjectId(req.session.userId),
			wishlist: [{
				product: new ObjectId(id),
			}],
		})
		return res.json({ added: true, message: 'item added to wish-list' });
	}
};
const userCancelCartProduct_post = async (req, res) => {
	const cartId = req.query.cartId
	const product = req.query.product
	const updatedCart = await Cart.updateOne(
		{ userId: new ObjectId(req.session.userId) },
		{ $pull: { cart: { _id: cartId } } }
	);
	req.flash('message', `${product} cancelled successfully`);
	return res.redirect('/user-dashboard-cart');
};
const userCancelCartProductOnPlaceorder_post = async (req, res) => {
	const { cartId, product } = req.body
	const updatedCart = await Cart.updateOne(
		{ userId: new ObjectId(req.session.userId) },
		{ $pull: { cart: { _id: cartId } } }
	);
	console.log(updatedCart, 'updatedCart')
	return res.json({ success: true, message: `${product} deleted successfully` })
};
const userChangeQuantity_post = async (req, res) => {
	console.log(req.body, 'userChangeQuantity_post');
	const updatedCart = await Cart.updateOne(
		{
			'_id': new ObjectId(req.body.cart),
			'cart._id': new ObjectId(req.body.cartId),
		},
		{
			$inc: {
				'cart.$.quantity': parseInt(req.body.change),
			},
		},
		{ new: true }
	);

	if (updatedCart) {
		return res.json({ success: true, message: 'Quantity updated successfully' });
	} else {
		return res.status(404).json({ success: false, message: 'Cart not found or not updated' });
	}
};
const userCheckout_get = async (req, res) => {
	const allCoupons = await Coupon.find({ status: true });
	const cartDetails = await Cart.aggregate([
		{ $match: { userId: new ObjectId(req.session.userId) } },
		{ $unwind: '$cart' },
		{
			$project: {
				cartId: '$cart._id',
				productId: '$cart.product',
				colorId: '$cart.color',
				sizeId: '$cart.size',
				quantity: '$cart.quantity',
				couponId: { $ifNull: ['$cart.coupon', null] },
				updatedAt: "$updatedAt",
				createdAt: "$createdAt"
			},
		},
		{
			$lookup: {
				from: "products",
				localField: "productId",
				foreignField: "_id",
				as: "productData",
			},
		},
		{
			$lookup: {
				from: "colors",
				localField: "colorId",
				foreignField: "_id",
				as: "colorData",
			},
		},
		{
			$lookup: {
				from: "sizes",
				localField: "sizeId",
				foreignField: "_id",
				as: "sizeData",
			},
		},
		{
			$lookup: {
				from: "coupons",
				localField: "couponId",
				foreignField: "_id",
				as: "couponData",
			},
		},
		{
			$unwind: "$productData"
		},
		{
			$unwind: "$colorData"
		},
		{
			$unwind: "$sizeData"
		},
		{
			$unwind: {
				path: "$couponData",
				preserveNullAndEmptyArrays: true
			}
		},
		{
			$addFields: {
				mrp: "$productData.mrp",
				discount: "$productData.discount",
				couponName: { $ifNull: ["$couponData.coupon", null] },
				couponCode: { $ifNull: ["$couponData.couponCode", null] },
				couponValue: { $ifNull: ["$couponData.couponValue", 0] }
			}
		},
		{
			$project: {
				individualTotal: {
					$multiply: ["$mrp", "$quantity"]
				},
				taxRate: 0.18,
				mrpWithoutTax: {
					$multiply: [
						{ $multiply: ["$mrp", "$quantity"] },
						{ $divide: [100, 118] }
					]
				},
				firstDiscountAmount: {
					$multiply: [
						{
							$multiply: [
								{ $multiply: ["$mrp", "$quantity"] },
								{ $divide: [100, 118] }
							]
						},
						{ $divide: ["$discount", 100] }
					]
				},
				AmountAfterfirstDiscount: {
					$subtract: [
						{
							$multiply: [
								{ $multiply: ["$mrp", "$quantity"] },
								{ $divide: [100, 118] }
							]
						},
						{
							$multiply: [
								{
									$multiply: [
										{ $multiply: ["$mrp", "$quantity"] },
										{ $divide: [100, 118] }
									]
								},
								{ $divide: ["$discount", 100] }
							]
						}
					]
				},
				seccondDiscountAmount: {
					$multiply: [
						{
							$subtract: [
								{
									$multiply: [
										{ $multiply: ["$mrp", "$quantity"] },
										{ $divide: [100, 118] }
									]
								},
								{
									$multiply: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{ $divide: ["$discount", 100] }
									]
								}
							]
						},
						{ $divide: ["$couponValue", 100] }
					]
				},
				AmountAfterSecondDiscount: {
					$subtract: [
						{
							$subtract: [
								{
									$multiply: [
										{ $multiply: ["$mrp", "$quantity"] },
										{ $divide: [100, 118] }
									]
								},
								{
									$multiply: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{ $divide: ["$discount", 100] }
									]
								}
							]
						},
						{
							$multiply: [
								{
									$subtract: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{
											$multiply: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{ $divide: ["$discount", 100] }
											]
										}
									]
								},
								{ $divide: ["$couponValue", 100] }
							]
						}
					]
				},
				gst: {
					$multiply: [
						{ $divide: [18, 100] },
						{
							$subtract: [
								{
									$subtract: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{
											$multiply: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{ $divide: ["$discount", 100] }
											]
										}
									]
								},
								{
									$multiply: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{ $divide: ["$couponValue", 100] }
									]
								}
							]
						}
					]
				},
				sgst: {
					$divide: [
						{
							$multiply: [
								{ $divide: [18, 100] },
								{
									$subtract: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{
											$multiply: [
												{
													$subtract: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{
															$multiply: [
																{
																	$multiply: [
																		{ $multiply: ["$mrp", "$quantity"] },
																		{ $divide: [100, 118] }
																	]
																},
																{ $divide: ["$discount", 100] }
															]
														}
													]
												},
												{ $divide: ["$couponValue", 100] }
											]
										}
									]
								}
							]
						}, 2
					]
				},
				cgst: {
					$divide: [
						{
							$multiply: [
								{ $divide: [18, 100] },
								{
									$subtract: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{
											$multiply: [
												{
													$subtract: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{
															$multiply: [
																{
																	$multiply: [
																		{ $multiply: ["$mrp", "$quantity"] },
																		{ $divide: [100, 118] }
																	]
																},
																{ $divide: ["$discount", 100] }
															]
														}
													]
												},
												{ $divide: ["$couponValue", 100] }
											]
										}
									]
								}
							]
						}, 2
					]
				},
				totalPrice: {
					$add: [
						{
							$subtract: [
								{
									$subtract: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{
											$multiply: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{ $divide: ["$discount", 100] }
											]
										}
									]
								},
								{
									$multiply: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{ $divide: ["$couponValue", 100] }
									]
								}
							]
						},
						{
							$multiply: [
								{ $divide: [18, 100] },
								{
									$subtract: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{
											$multiply: [
												{
													$subtract: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{
															$multiply: [
																{
																	$multiply: [
																		{ $multiply: ["$mrp", "$quantity"] },
																		{ $divide: [100, 118] }
																	]
																},
																{ $divide: ["$discount", 100] }
															]
														}
													]
												},
												{ $divide: ["$couponValue", 100] }
											]
										}
									]
								}
							]
						}
					]
				},
				mrp: "$productData.mrp",
				images: "$productData.images",
				discount: "$productData.discount",
				product: "$productData.title",
				color: "$colorData.color",
				size: "$sizeData.size",
				quantity: 1,
				cartId: 1,
				productId: 1,
				couponId: 1,
				colorId: 1,
				sizeId: 1,
				updatedAt: 1,
				createdAt: 1,
			}
		},
		{ $sort: { createdAt: -1 } }
	])
	//  console.log(cartDetails, 'cartDetails');
	let totalIndividualTotal = 0
    let totalMrpWithoutTax = 0
    let totalFirstDiscountAmount = 0
    let totalAmountAfterfirstDiscount = 0  
    let totalSeccondDiscountAmount = 0
    let totalAmountAfterSecondDiscount = 0  
    let totalGst = 0
    let totalSgst = 0
    let totalCgst = 0

	cartDetails.forEach(cartItem => {
		totalIndividualTotal += cartItem.individualTotal
		totalMrpWithoutTax += cartItem.mrpWithoutTax 
		totalFirstDiscountAmount += cartItem.firstDiscountAmount 
		totalAmountAfterfirstDiscount += cartItem.AmountAfterfirstDiscount   
		totalSeccondDiscountAmount += cartItem.seccondDiscountAmount 
		totalAmountAfterSecondDiscount += cartItem.AmountAfterSecondDiscount   
		totalGst += cartItem.gst 
		totalSgst += cartItem.sgst 
		totalCgst += cartItem.cgst
	});

	let totalDiscount = totalIndividualTotal - ( totalAmountAfterSecondDiscount + totalGst )
	let totalDiscountPercentage = ( totalDiscount / totalIndividualTotal ) * 100
	let roundOff = totalIndividualTotal - (totalAmountAfterSecondDiscount + totalGst + totalDiscount )
	let grandTotal = totalAmountAfterSecondDiscount + totalGst

	// console.log (totalIndividualTotal);
    // console.log (totalMrpWithoutTax);
    // console.log (totalFirstDiscountAmount);
    // console.log (totalAmountAfterfirstDiscount);  
    // console.log (totalSeccondDiscountAmount);
    // console.log (totalAmountAfterSecondDiscount);  
    // console.log (totalGst);
    // console.log (totalSgst);
    // console.log (totalCgst);
    // console.log (totalDiscount , 'total discount amount');
    // console.log (totalDiscountPercentage , 'total discount percentage');
    // console.log (roundOff , 'total roundOff');
    // console.log (grandTotal , 'total with gst final ');

	res.render('user-pages/userDashboardCheckoutPage',
		{
			totalAmountAfterSecondDiscount, totalGst,
			totalSgst, totalCgst, totalDiscount, totalDiscountPercentage, roundOff , grandTotal,
			message: req.flash('message'),
			cartDetails, allCoupons , RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
		})
};
const userDashboardOrders_get = async (req, res) => {
	let currentPage = Number(req.query.page) || 1;
	let limit = Number(req.query.limit) || 1;
	let skip = (currentPage - 1) * limit;

	const order = await Order.aggregate([
		{ $match: { userId: new ObjectId(req.session.userId) } },
		{ $unwind: "$order" },
		{
			$project: {
				addressId: '$addressId',
				productId: '$order.productId',
				couponId: { $ifNull: ['$order.couponId', null] },
				colorId: '$order.colorId',
				sizeId: '$order.sizeId',
				quantity: '$order.quantity',
				status: '$order.status',
				paymentMode: "$paymentMode",
				orderStatus: "$orderStatus",
				paymentStatus: "$paymentStatus",
				createdAt: "$createdAt",
				updatedAt: "$updatedAt",
				wholeOrderId :'$_id',
				singleOrderId :'$order._id',
				userId: "$userId"
			}
		},
		{
			$lookup: {
				from: "products",
				localField: "productId",
				foreignField: "_id",
				as: "productData"
			}
		},
		{
			$lookup: {
				from: "coupons",
				localField: "couponId",
				foreignField: "_id",
				as: "couponData"
			}
		},
		{
			$lookup: {
				from: "colors",
				localField: "colorId",
				foreignField: "_id",
				as: "colorData"
			}
		},
		{
			$lookup: {
				from: "sizes",
				localField: "sizeId",
				foreignField: "_id",
				as: "sizeData"
			}
		},
		{ $unwind: "$productData" },
		{ $unwind: { path: "$couponData", preserveNullAndEmptyArrays: true } },
		{ $unwind: "$colorData" },
		{ $unwind: "$sizeData" },
		{
			$addFields: {
				mrp: '$productData.mrp',
				discount: '$productData.discount',
				couponValue: { $ifNull: ['$couponData.couponValue', 0] },
				couponCode: { $ifNull: ['$couponData.couponCode', null] },
				couponName: { $ifNull: ['$couponData.coupon', null] }
				
			}
		},
		{
			$project: {
				individualTotal: {
					$multiply: ["$mrp", "$quantity"]
				},
				taxRate: 0.18,
				mrpWithoutTax: {
					$multiply: [
						{ $multiply: ["$mrp", "$quantity"] },
						{ $divide: [100, 118] }
					]
				},
				firstDiscountAmount: {
					$multiply: [
						{
							$multiply: [
								{ $multiply: ["$mrp", "$quantity"] },
								{ $divide: [100, 118] }
							]
						},
						{ $divide: ["$discount", 100] }
					]
				},
				AmountAfterfirstDiscount: {
					$subtract: [
						{
							$multiply: [
								{ $multiply: ["$mrp", "$quantity"] },
								{ $divide: [100, 118] }
							]
						},
						{
							$multiply: [
								{
									$multiply: [
										{ $multiply: ["$mrp", "$quantity"] },
										{ $divide: [100, 118] }
									]
								},
								{ $divide: ["$discount", 100] }
							]
						}
					]
				},
				seccondDiscountAmount: {
					$multiply: [
						{
							$subtract: [
								{
									$multiply: [
										{ $multiply: ["$mrp", "$quantity"] },
										{ $divide: [100, 118] }
									]
								},
								{
									$multiply: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{ $divide: ["$discount", 100] }
									]
								}
							]
						},
						{ $divide: ["$couponValue", 100] }
					]
				},
				AmountAfterSecondDiscount: {
					$subtract: [
						{
							$subtract: [
								{
									$multiply: [
										{ $multiply: ["$mrp", "$quantity"] },
										{ $divide: [100, 118] }
									]
								},
								{
									$multiply: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{ $divide: ["$discount", 100] }
									]
								}
							]
						},
						{
							$multiply: [
								{
									$subtract: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{
											$multiply: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{ $divide: ["$discount", 100] }
											]
										}
									]
								},
								{ $divide: ["$couponValue", 100] }
							]
						}
					]
				},
				gst: {
					$multiply: [
						{ $divide: [18, 100] },
						{
							$subtract: [
								{
									$subtract: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{
											$multiply: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{ $divide: ["$discount", 100] }
											]
										}
									]
								},
								{
									$multiply: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{ $divide: ["$couponValue", 100] }
									]
								}
							]
						}
					]
				},
				sgst: {
					$divide: [
						{
							$multiply: [
								{ $divide: [18, 100] },
								{
									$subtract: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{
											$multiply: [
												{
													$subtract: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{
															$multiply: [
																{
																	$multiply: [
																		{ $multiply: ["$mrp", "$quantity"] },
																		{ $divide: [100, 118] }
																	]
																},
																{ $divide: ["$discount", 100] }
															]
														}
													]
												},
												{ $divide: ["$couponValue", 100] }
											]
										}
									]
								}
							]
						}, 2
					]
				},
				cgst: {
					$divide: [
						{
							$multiply: [
								{ $divide: [18, 100] },
								{
									$subtract: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{
											$multiply: [
												{
													$subtract: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{
															$multiply: [
																{
																	$multiply: [
																		{ $multiply: ["$mrp", "$quantity"] },
																		{ $divide: [100, 118] }
																	]
																},
																{ $divide: ["$discount", 100] }
															]
														}
													]
												},
												{ $divide: ["$couponValue", 100] }
											]
										}
									]
								}
							]
						}, 2
					]
				},
				totalPrice: {
					$add: [
						{
							$subtract: [
								{
									$subtract: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{
											$multiply: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{ $divide: ["$discount", 100] }
											]
										}
									]
								},
								{
									$multiply: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{ $divide: ["$couponValue", 100] }
									]
								}
							]
						},
						{
							$multiply: [
								{ $divide: [18, 100] },
								{
									$subtract: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{
											$multiply: [
												{
													$subtract: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{
															$multiply: [
																{
																	$multiply: [
																		{ $multiply: ["$mrp", "$quantity"] },
																		{ $divide: [100, 118] }
																	]
																},
																{ $divide: ["$discount", 100] }
															]
														}
													]
												},
												{ $divide: ["$couponValue", 100] }
											]
										}
									]
								}
							]
						}
					]
				},
				paymentMode: 1,
				addressId: 1,
				orderStatus: 1,
				paymentStatus: 1,
				createdAt: 1,
				updatedAt: 1,
				mrp:1,
				couponValue : 1,
				couponCode : 1,
				couponName : 1,
				discount: 1,
				status: 1,
				title: "$productData.title",
				images: "$productData.images",
				productDetailsReview : "$productData.review",
				color: "$colorData.color",
				size: "$sizeData.size",
				productId: 1,
				wholeOrderId : 1,
				singleOrderId : 1,
				quantity: 1,
				userId :1
			}
		},
		{
			$group: {
				_id: "$wholeOrderId",
				orders: { $push: "$$ROOT" }
			}
		},
		{ $sort: { 'orders.createdAt': -1 } },
	]);

	function findUniqueOrderStatusTypes(order) {
		const uniqueStatusTypes = new Set();
		order.forEach(orderItems => {
			orderItems.orders.forEach(orderItem => {
				uniqueStatusTypes.add(orderItem.orderStatus);
			});
		});
		return Array.from(uniqueStatusTypes);
	}
	const uniqueStatusTypes = findUniqueOrderStatusTypes(order);
	const totalPages = Math.ceil(order.length / limit);
	const paginatedOrder = order.slice(skip, skip + limit);
	let totalIndividualTotal = 0
    let totalMrpWithoutTax = 0
    let totalFirstDiscountAmount = 0
    let totalAmountAfterfirstDiscount = 0
    let totalSeccondDiscountAmount = 0
    let totalAmountAfterSecondDiscount = 0  
    let totalGst = 0
    let totalSgst = 0
    let totalCgst = 0
	let statusArr = [];
	let pendingArr = [];
	let placedArr = [];
	let cancelledArr = [];
	let returnedArr = [];
	let deliveredArr = [];

	paginatedOrder.forEach(orderItem => {
		orderItem.orders.forEach(orderItmes =>{
			totalIndividualTotal += orderItmes.individualTotal
			totalMrpWithoutTax += orderItmes.mrpWithoutTax 
			totalFirstDiscountAmount += orderItmes.firstDiscountAmount 
			totalAmountAfterfirstDiscount += orderItmes.AmountAfterfirstDiscount   
			totalSeccondDiscountAmount += orderItmes.seccondDiscountAmount 
			totalAmountAfterSecondDiscount += orderItmes.AmountAfterSecondDiscount   
			totalGst += orderItmes.gst 
			totalSgst += orderItmes.sgst 
			totalCgst += orderItmes.cgst
			statusArr.push(orderItmes.status)
		})
	});
	pendingArr = statusArr.filter(status => status === 'pending');
	cancelledArr = statusArr.filter(status => status === 'cancelled');
	returnedArr = statusArr.filter(status => status === 'returned');
	placedArr = statusArr.filter(status => status === 'placed');
	deliveredArr = statusArr.filter(status => status === 'delivered');

	let totalDiscount = totalIndividualTotal - ( totalAmountAfterSecondDiscount + totalGst )
	let totalDiscountPercentage = ( totalDiscount / totalIndividualTotal ) * 100
	let roundOff = totalIndividualTotal - (totalAmountAfterSecondDiscount + totalGst + totalDiscount )
	let grandTotal = totalAmountAfterSecondDiscount + totalGst

	res.render('user-pages/userDashboardOrderPage', {
		message: req.flash('message'),
		uniqueStatusTypes,
		paginatedOrder,
		pendingArr,
		cancelledArr,
		returnedArr,
		placedArr,
		deliveredArr,
		currentPage,
		limit,
		totalPages,
		RAZORPAY_KEY_ID,
		totalAmountAfterSecondDiscount,
		totalGst,
		totalSgst, 
		totalCgst, 
		totalDiscount, 
		totalDiscountPercentage, 
		roundOff , 
		grandTotal,
	});
};
const userDownloadInvoice_get = async (req, res) => {
	console.log(req.params.id , 'req.params.id')
	if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
		return res.status(400).render('user-pages/404', { title: '404 Error' })
	};

	const orderDetails = await Order.aggregate([
		{ $match: { _id: new ObjectId(req.params.id) } },
		{ $unwind: "$order" },
		{
			$project: {
				productId: '$order.productId',
				addressId: '$order.addressId',
				couponId: { $ifNull: ['$order.couponId', null] },
				colorId: '$order.colorId',
				sizeId: '$order.sizeId',
				quantity: '$order.quantity',
				status: '$order.status',
				paymentMode: "$paymentMode",
				orderStatus: "$orderStatus",
				paymentStatus: "$paymentStatus",
				createdAt: "$createdAt",
				updatedAt: "$updatedAt",
				addressId: '$addressId',
			}
		},
		{
			$lookup: {
				from: "products",
				localField: "productId",
				foreignField: "_id",
				as: "productData"
			}
		},
		{
			$lookup: {
				from: "coupons",
				localField: "couponId",
				foreignField: "_id",
				as: "couponData"
			}
		},
		{
			$lookup: {
				from: "colors",
				localField: "colorId",
				foreignField: "_id",
				as: "colorData"
			}
		},
		{
			$lookup: {
				from: "sizes",
				localField: "sizeId",
				foreignField: "_id",
				as: "sizeData"
			}
		},
		{
			$lookup: {
				from: "addresses",
				localField: "addressId",
				foreignField: "addresses._id",
				as: "addressData"
			}
		},
		{ $unwind: "$productData" },
		{ $unwind: { path: "$couponData", preserveNullAndEmptyArrays: true } },
		{ $unwind: "$colorData" },
		{ $unwind: "$sizeData" },
		// { $unwind: "$addressData" },
		{
			$addFields: {
				mrp: '$productData.mrp',
				discount: '$productData.discount',
				couponValue: { $ifNull: ['$couponData.couponValue', 0] },
				couponCode: { $ifNull: ['$couponData.couponCode', null] },
				couponName: { $ifNull: ['$couponData.coupon', null] },
				taxRate: 0.18,
			}
		},
		{
			$project: {
				individualTotal: {
					$multiply: ["$mrp", "$quantity"]
				},
				
				mrpWithoutTax: {
					$multiply: [
						{ $multiply: ["$mrp", "$quantity"] },
						{ $divide: [100, 118] }
					]
				},
				firstDiscountAmount: {
					$multiply: [
						{
							$multiply: [
								{ $multiply: ["$mrp", "$quantity"] },
								{ $divide: [100, 118] }
							]
						},
						{ $divide: ["$discount", 100] }
					]
				},
				AmountAfterfirstDiscount: {
					$subtract: [
						{
							$multiply: [
								{ $multiply: ["$mrp", "$quantity"] },
								{ $divide: [100, 118] }
							]
						},
						{
							$multiply: [
								{
									$multiply: [
										{ $multiply: ["$mrp", "$quantity"] },
										{ $divide: [100, 118] }
									]
								},
								{ $divide: ["$discount", 100] }
							]
						}
					]
				},
				seccondDiscountAmount: {
					$multiply: [
						{
							$subtract: [
								{
									$multiply: [
										{ $multiply: ["$mrp", "$quantity"] },
										{ $divide: [100, 118] }
									]
								},
								{
									$multiply: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{ $divide: ["$discount", 100] }
									]
								}
							]
						},
						{ $divide: ["$couponValue", 100] }
					]
				},
				AmountAfterSecondDiscount: {
					$subtract: [
						{
							$subtract: [
								{
									$multiply: [
										{ $multiply: ["$mrp", "$quantity"] },
										{ $divide: [100, 118] }
									]
								},
								{
									$multiply: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{ $divide: ["$discount", 100] }
									]
								}
							]
						},
						{
							$multiply: [
								{
									$subtract: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{
											$multiply: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{ $divide: ["$discount", 100] }
											]
										}
									]
								},
								{ $divide: ["$couponValue", 100] }
							]
						}
					]
				},
				gst: {
					$multiply: [
						{ $divide: [18, 100] },
						{
							$subtract: [
								{
									$subtract: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{
											$multiply: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{ $divide: ["$discount", 100] }
											]
										}
									]
								},
								{
									$multiply: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{ $divide: ["$couponValue", 100] }
									]
								}
							]
						}
					]
				},
				sgst: {
					$divide: [
						{
							$multiply: [
								{ $divide: [18, 100] },
								{
									$subtract: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{
											$multiply: [
												{
													$subtract: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{
															$multiply: [
																{
																	$multiply: [
																		{ $multiply: ["$mrp", "$quantity"] },
																		{ $divide: [100, 118] }
																	]
																},
																{ $divide: ["$discount", 100] }
															]
														}
													]
												},
												{ $divide: ["$couponValue", 100] }
											]
										}
									]
								}
							]
						}, 2
					]
				},
				cgst: {
					$divide: [
						{
							$multiply: [
								{ $divide: [18, 100] },
								{
									$subtract: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{
											$multiply: [
												{
													$subtract: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{
															$multiply: [
																{
																	$multiply: [
																		{ $multiply: ["$mrp", "$quantity"] },
																		{ $divide: [100, 118] }
																	]
																},
																{ $divide: ["$discount", 100] }
															]
														}
													]
												},
												{ $divide: ["$couponValue", 100] }
											]
										}
									]
								}
							]
						}, 2
					]
				},
				totalPrice: {
					$add: [
						{
							$subtract: [
								{
									$subtract: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{
											$multiply: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{ $divide: ["$discount", 100] }
											]
										}
									]
								},
								{
									$multiply: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{ $divide: ["$couponValue", 100] }
									]
								}
							]
						},
						{
							$multiply: [
								{ $divide: [18, 100] },
								{
									$subtract: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{
											$multiply: [
												{
													$subtract: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{
															$multiply: [
																{
																	$multiply: [
																		{ $multiply: ["$mrp", "$quantity"] },
																		{ $divide: [100, 118] }
																	]
																},
																{ $divide: ["$discount", 100] }
															]
														}
													]
												},
												{ $divide: ["$couponValue", 100] }
											]
										}
									]
								}
							]
						}
					]
				},
				totalDiscount: {
				  $subtract: [
					{ $multiply: ["$mrp", "$quantity"] },
					{
					  $add: [
						{
						  $subtract: [
							{
							  $subtract: [
								{
								  $multiply: [
									{ $multiply: ["$mrp", "$quantity"] },
									{ $divide: [100, 118] }
								  ]
								},
								{
								  $multiply: [
									{
									  $multiply: [
										{ $multiply: ["$mrp", "$quantity"] },
										{ $divide: [100, 118] }
									  ]
									},
									{ $divide: ["$discount", 100] }
								  ]
								}
							  ]
							},
							{
							  $multiply: [
								{
								  $subtract: [
									{
									  $multiply: [
										{ $multiply: ["$mrp", "$quantity"] },
										{ $divide: [100, 118] }
									  ]
									},
									{
									  $multiply: [
										{
										  $multiply: [
											{ $multiply: ["$mrp", "$quantity"] },
											{ $divide: [100, 118] }
										  ]
										},
										{ $divide: ["$discount", 100] }
									  ]
									}
								  ]
								},
								{ $divide: ["$couponValue", 100] }
							  ]
							}
						  ]
						},
						{
						  $multiply: [
							{ $divide: [18, 100] },
							{
							  $subtract: [
								{
								  $subtract: [
									{
									  $multiply: [
										{ $multiply: ["$mrp", "$quantity"] },
										{ $divide: [100, 118] }
									  ]
									},
									{
									  $multiply: [
										{
										  $multiply: [
											{ $multiply: ["$mrp", "$quantity"] },
											{ $divide: [100, 118] }
										  ]
										},
										{ $divide: ["$discount", 100] }
									  ]
									}
								  ]
								},
								{
								  $multiply: [
									{
									  $subtract: [
										{
										  $multiply: [
											{ $multiply: ["$mrp", "$quantity"] },
											{ $divide: [100, 118] }
										  ]
										},
										{
										  $multiply: [
											{
											  $multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											  ]
											},
											{ $divide: ["$discount", 100] }
										  ]
										}
									  ]
									},
									{ $divide: ["$couponValue", 100] }
								  ]
								}
							  ]
							}
						  ]
						}
					  ]
					}
				  ]
				},
				totalDiscountPercentage: {
				  $multiply: [
					{
					  $divide: [
						{
						  $subtract: [
							{ $multiply: ["$mrp", "$quantity"] },
							{
							  $add: [
								{
								  $subtract: [
									{
									  $subtract: [
										{
										  $multiply: [
											{ $multiply: ["$mrp", "$quantity"] },
											{ $divide: [100, 118] }
										  ]
										},
										{
										  $multiply: [
											{
											  $multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											  ]
											},
											{ $divide: ["$discount", 100] }
										  ]
										}
									  ]
									},
									{
									  $multiply: [
										{
										  $subtract: [
											{
											  $multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											  ]
											},
											{
											  $multiply: [
												{
												  $multiply: [
													{ $multiply: ["$mrp", "$quantity"] },
													{ $divide: [100, 118] }
												  ]
												},
												{ $divide: ["$discount", 100] }
											  ]
											}
										  ]
										},
										{ $divide: ["$couponValue", 100] }
									  ]
									}
								  ]
								},
								{
								  $multiply: [
									{ $divide: [18, 100] },
									{
									  $subtract: [
										{
										  $subtract: [
											{
											  $multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											  ]
											},
											{
											  $multiply: [
												{
												  $multiply: [
													{ $multiply: ["$mrp", "$quantity"] },
													{ $divide: [100, 118] }
												  ]
												},
												{ $divide: ["$discount", 100] }
											  ]
											}
										  ]
										},
										{
										  $multiply: [
											{
											  $subtract: [
												{
												  $multiply: [
													{ $multiply: ["$mrp", "$quantity"] },
													{ $divide: [100, 118] }
												  ]
												},
												{
												  $multiply: [
													{
													  $multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													  ]
													},
													{ $divide: ["$discount", 100] }
												  ]
												}
											  ]
											},
											{ $divide: ["$couponValue", 100] }
										  ]
										}
									  ]
									}
								  ]
								}
							  ]
							}
						  ]
						},
						{ $multiply: ["$mrp", "$quantity"] }
					  ]
					}, 100
				  ]
				},
				addressData: { $arrayElemAt: ["$addressData", 0] },
				paymentMode: 1,
				addressId: 1,
				orderStatus: 1,
				paymentStatus: 1,
				createdAt: 1,
				updatedAt: 1,
				mrp: 1,
				couponValue: 1,
				couponCode: 1,
				couponName: 1,
				discount: 1,
				status: 1,
				title: "$productData.title",
				images: "$productData.images",
				color: "$colorData.color",
				size: "$sizeData.size",
				productId: 1,
				quantity: 1,
				addressId: 1,
				taxRate: 1,
			}
		},
	])
	let totalIndividualTotal = 0
    let totalMrpWithoutTax = 0
    let totalFirstDiscountAmount = 0
    let totalAmountAfterfirstDiscount = 0  
    let totalSeccondDiscountAmount = 0
    let totalAmountAfterSecondDiscount = 0  
    let totalGst = 0
    let totalSgst = 0
    let totalCgst = 0
    let totalQuantity = 0

	orderDetails.forEach(orderItem => {
		totalIndividualTotal += orderItem.individualTotal
		totalMrpWithoutTax += orderItem.mrpWithoutTax
		totalFirstDiscountAmount += orderItem.firstDiscountAmount
		totalAmountAfterfirstDiscount += orderItem.AmountAfterfirstDiscount
		totalSeccondDiscountAmount += orderItem.seccondDiscountAmount
		totalAmountAfterSecondDiscount += orderItem.AmountAfterSecondDiscount
		totalGst += orderItem.gst
		totalSgst += orderItem.sgst
		totalCgst += orderItem.cgst
		totalQuantity += orderItem.quantity
	});

	let totalDiscount = totalIndividualTotal - ( totalAmountAfterSecondDiscount + totalGst )
	let totalDiscountPercentage = ( totalDiscount / totalIndividualTotal ) * 100
	let roundOff = totalIndividualTotal - (totalAmountAfterSecondDiscount + totalGst + totalDiscount )
	let grandTotal = totalAmountAfterSecondDiscount + totalGst

	return res.render('user-pages/userDownloadInvoicePage',
		{   orderDetails, message : req.query.messages,
			totalIndividualTotal,
			totalMrpWithoutTax,
			totalFirstDiscountAmount,
			totalAmountAfterfirstDiscount,  
			totalSeccondDiscountAmount,
			totalAmountAfterSecondDiscount,  
			totalGst,
			totalSgst,
			totalCgst,
			totalDiscount, 
			totalDiscountPercentage, 
			roundOff, 
			grandTotal,
			totalQuantity
		}
	)
}
const userGenerateInvoice_get = async (req, res )=> {
	const id = req.params.id;
	console.log(req.params.id , 'req.params.id')
	const executablePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
	console.log(executablePath , 'executablePath')
	const browser = await puppeteer.launch({
		headless : 'new',
		executablePath : '/usr/bin/chromium-browser'
	});
	const page = await browser.newPage();
	await page.goto(`${req.protocol}://${req.get('host')}/user-download-Invoice/${id}`, {
		waitUntil : 'networkidle2'
	})
	await page.setViewport({
		width : 1680,
		height : 1050
	})
	const dateValue = new Date();
	const clothStore = `clothStore_${id.toString().slice(-8)}_${dateValue.getTime()}`;
	const pdfPath = path.join(__dirname, '../../public/files', `${clothStore}.pdf`);
	const pdfn = await page.pdf({
		path: pdfPath,
		printBackground : true,
		format: "A4",
        landscape: true
	})
	await browser.close();
	res.download( pdfPath , (error)=>{
		if(error){
			console.log(error);
		}
	})
}
const userFilterOrderStatus_get = async (req, res) => {
	const uniqueStatusTypes = req.query.orderStatuses? req.query.orderStatuses.split(',') : [];
	const selectedFilter = req.query.selectedFilter || '';
	let currentPage = Number(req.query.page) || 1;
	let limit = Number(req.query.limit) || 1;
	let skip = (currentPage - 1) * limit;
	const order = await Order.aggregate([
		{ $match: { userId: new ObjectId(req.session.userId) } },
		{ $unwind: "$order" },
		{
			$project: {
				addressId: '$addressId',
				productId: '$order.productId',
				couponId: { $ifNull: ['$order.couponId', null] },
				colorId: '$order.colorId',
				sizeId: '$order.sizeId',
				quantity: '$order.quantity',
				status: '$order.status',
				paymentMode: "$paymentMode",
				orderStatus: "$orderStatus",
				paymentStatus: "$paymentStatus",
				createdAt: "$createdAt",
				updatedAt: "$updatedAt",
				wholeOrderId :'$_id',
				singleOrderId :'$order._id',
				userId: "$userId"
			}
		},
		{
			$lookup: {
				from: "products",
				localField: "productId",
				foreignField: "_id",
				as: "productData"
			}
		},
		{
			$lookup: {
				from: "coupons",
				localField: "couponId",
				foreignField: "_id",
				as: "couponData"
			}
		},
		{
			$lookup: {
				from: "colors",
				localField: "colorId",
				foreignField: "_id",
				as: "colorData"
			}
		},
		{
			$lookup: {
				from: "sizes",
				localField: "sizeId",
				foreignField: "_id",
				as: "sizeData"
			}
		},
		{ $unwind: "$productData" },
		{ $unwind: { path: "$couponData", preserveNullAndEmptyArrays: true } },
		{ $unwind: "$colorData" },
		{ $unwind: "$sizeData" },
		{
			$addFields: {
				mrp: '$productData.mrp',
				discount: '$productData.discount',
				couponValue: { $ifNull: ['$couponData.couponValue', 0] },
				couponCode: { $ifNull: ['$couponData.couponCode', null] },
				couponName: { $ifNull: ['$couponData.coupon', null] }
				
			}
		},
		{
			$project: {
				individualTotal: {
					$multiply: ["$mrp", "$quantity"]
				},
				taxRate: 0.18,
				mrpWithoutTax: {
					$multiply: [
						{ $multiply: ["$mrp", "$quantity"] },
						{ $divide: [100, 118] }
					]
				},
				firstDiscountAmount: {
					$multiply: [
						{
							$multiply: [
								{ $multiply: ["$mrp", "$quantity"] },
								{ $divide: [100, 118] }
							]
						},
						{ $divide: ["$discount", 100] }
					]
				},
				AmountAfterfirstDiscount: {
					$subtract: [
						{
							$multiply: [
								{ $multiply: ["$mrp", "$quantity"] },
								{ $divide: [100, 118] }
							]
						},
						{
							$multiply: [
								{
									$multiply: [
										{ $multiply: ["$mrp", "$quantity"] },
										{ $divide: [100, 118] }
									]
								},
								{ $divide: ["$discount", 100] }
							]
						}
					]
				},
				seccondDiscountAmount: {
					$multiply: [
						{
							$subtract: [
								{
									$multiply: [
										{ $multiply: ["$mrp", "$quantity"] },
										{ $divide: [100, 118] }
									]
								},
								{
									$multiply: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{ $divide: ["$discount", 100] }
									]
								}
							]
						},
						{ $divide: ["$couponValue", 100] }
					]
				},
				AmountAfterSecondDiscount: {
					$subtract: [
						{
							$subtract: [
								{
									$multiply: [
										{ $multiply: ["$mrp", "$quantity"] },
										{ $divide: [100, 118] }
									]
								},
								{
									$multiply: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{ $divide: ["$discount", 100] }
									]
								}
							]
						},
						{
							$multiply: [
								{
									$subtract: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{
											$multiply: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{ $divide: ["$discount", 100] }
											]
										}
									]
								},
								{ $divide: ["$couponValue", 100] }
							]
						}
					]
				},
				gst: {
					$multiply: [
						{ $divide: [18, 100] },
						{
							$subtract: [
								{
									$subtract: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{
											$multiply: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{ $divide: ["$discount", 100] }
											]
										}
									]
								},
								{
									$multiply: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{ $divide: ["$couponValue", 100] }
									]
								}
							]
						}
					]
				},
				sgst: {
					$divide: [
						{
							$multiply: [
								{ $divide: [18, 100] },
								{
									$subtract: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{
											$multiply: [
												{
													$subtract: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{
															$multiply: [
																{
																	$multiply: [
																		{ $multiply: ["$mrp", "$quantity"] },
																		{ $divide: [100, 118] }
																	]
																},
																{ $divide: ["$discount", 100] }
															]
														}
													]
												},
												{ $divide: ["$couponValue", 100] }
											]
										}
									]
								}
							]
						}, 2
					]
				},
				cgst: {
					$divide: [
						{
							$multiply: [
								{ $divide: [18, 100] },
								{
									$subtract: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{
											$multiply: [
												{
													$subtract: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{
															$multiply: [
																{
																	$multiply: [
																		{ $multiply: ["$mrp", "$quantity"] },
																		{ $divide: [100, 118] }
																	]
																},
																{ $divide: ["$discount", 100] }
															]
														}
													]
												},
												{ $divide: ["$couponValue", 100] }
											]
										}
									]
								}
							]
						}, 2
					]
				},
				totalPrice: {
					$add: [
						{
							$subtract: [
								{
									$subtract: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{
											$multiply: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{ $divide: ["$discount", 100] }
											]
										}
									]
								},
								{
									$multiply: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{ $divide: ["$couponValue", 100] }
									]
								}
							]
						},
						{
							$multiply: [
								{ $divide: [18, 100] },
								{
									$subtract: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{
											$multiply: [
												{
													$subtract: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{
															$multiply: [
																{
																	$multiply: [
																		{ $multiply: ["$mrp", "$quantity"] },
																		{ $divide: [100, 118] }
																	]
																},
																{ $divide: ["$discount", 100] }
															]
														}
													]
												},
												{ $divide: ["$couponValue", 100] }
											]
										}
									]
								}
							]
						}
					]
				},
				paymentMode: 1,
				addressId: 1,
				orderStatus: 1,
				paymentStatus: 1,
				createdAt: 1,
				updatedAt: 1,
				mrp:1,
				couponValue : 1,
				couponCode : 1,
				couponName : 1,
				discount: 1,
				status: 1,
				title: "$productData.title",
				images: "$productData.images",
				productDetailsReview : "$productData.review",
				color: "$colorData.color",
				size: "$sizeData.size",
				productId: 1,
				wholeOrderId : 1,
				singleOrderId : 1,
				quantity: 1,
				userId :1
			}
		},
		{
			$group: {
				_id: "$wholeOrderId",
				orders: { $push: "$$ROOT" }
			}
		},
		{ $match : { 'orders.orderStatus': selectedFilter}},

		{ $sort: { 'orders.createdAt': -1 } },
	]);
	const totalPages = Math.ceil(order.length / limit);
	const paginatedOrder = order.slice(skip, skip + limit);
	let totalIndividualTotal = 0
    let totalMrpWithoutTax = 0
    let totalFirstDiscountAmount = 0
    let totalAmountAfterfirstDiscount = 0  
    let totalSeccondDiscountAmount = 0

	let totalAmountAfterSecondDiscount = 0  
    let totalGst = 0
    let totalSgst = 0
    let totalCgst = 0
	let statusArr = [];
	let pendingArr = [];
	let placedArr = [];
	let cancelledArr = [];
	let returnedArr = [];
	let deliveredArr = [];

	paginatedOrder.forEach(orderItem => {
		orderItem.orders.forEach(orderItmes =>{
			totalIndividualTotal += orderItmes.individualTotal
			totalMrpWithoutTax += orderItmes.mrpWithoutTax 
			totalFirstDiscountAmount += orderItmes.firstDiscountAmount 
			totalAmountAfterfirstDiscount += orderItmes.AmountAfterfirstDiscount   
			totalSeccondDiscountAmount += orderItmes.seccondDiscountAmount 
			totalAmountAfterSecondDiscount += orderItmes.AmountAfterSecondDiscount   
			totalGst += orderItmes.gst 
			totalSgst += orderItmes.sgst 
			totalCgst += orderItmes.cgst
			statusArr.push(orderItmes.status)
		})
	});
	pendingArr = statusArr.filter(status => status === 'pending');
	cancelledArr = statusArr.filter(status => status === 'cancelled');
	returnedArr = statusArr.filter(status => status === 'returned');
	placedArr = statusArr.filter(status => status === 'placed');
	deliveredArr = statusArr.filter(status => status === 'delivered');

	let totalDiscount = totalIndividualTotal - ( totalAmountAfterSecondDiscount + totalGst )
	let totalDiscountPercentage = ( totalDiscount / totalIndividualTotal ) * 100
	let roundOff = totalIndividualTotal - (totalAmountAfterSecondDiscount + totalGst + totalDiscount )
	let grandTotal = totalAmountAfterSecondDiscount + totalGst

	res.render('user-pages/userDashboardOrderFilteredPage', {
		message: req.flash('message'),
		uniqueStatusTypes,
		paginatedOrder,
		pendingArr,
		cancelledArr,
		returnedArr,
		placedArr,
		deliveredArr,
		currentPage,
		limit,
		totalPages,
		RAZORPAY_KEY_ID,selectedFilter,
		totalAmountAfterSecondDiscount, totalGst,
		totalSgst, totalCgst, totalDiscount, totalDiscountPercentage, roundOff , grandTotal,
	});
};
const userFilterOrderStatus_post = async (req, res) => {
	const uniqueStatusTypes = req.query.orderStatuses? req.query.orderStatuses.split(',') : [];
	console.log(uniqueStatusTypes, 'userFilterOrderStatus_post');
	const selectedFilter = req.body.orderStatusFilter
	console.log(selectedFilter, 'userFilterOrderStatus_post');

	let currentPage = Number(req.query.page) || 1;
	let limit = Number(req.query.limit) || 1;
	let skip = (currentPage - 1) * limit;
	const order = await Order.aggregate([
		{ $match: { userId: new ObjectId(req.session.userId) } },
		{ $unwind: "$order" },
		{
			$project: {
				addressId: '$addressId',
				productId: '$order.productId',
				couponId: { $ifNull: ['$order.couponId', null] },
				colorId: '$order.colorId',
				sizeId: '$order.sizeId',
				quantity: '$order.quantity',
				status: '$order.status',
				paymentMode: "$paymentMode",
				orderStatus: "$orderStatus",
				paymentStatus: "$paymentStatus",
				createdAt: "$createdAt",
				updatedAt: "$updatedAt",
				wholeOrderId :'$_id',
				singleOrderId :'$order._id',
				userId: "$userId"
			}
		},
		{
			$lookup: {
				from: "products",
				localField: "productId",
				foreignField: "_id",
				as: "productData"
			}
		},
		{
			$lookup: {
				from: "coupons",
				localField: "couponId",
				foreignField: "_id",
				as: "couponData"
			}
		},
		{
			$lookup: {
				from: "colors",
				localField: "colorId",
				foreignField: "_id",
				as: "colorData"
			}
		},
		{
			$lookup: {
				from: "sizes",
				localField: "sizeId",
				foreignField: "_id",
				as: "sizeData"
			}
		},
		{ $unwind: "$productData" },
		{ $unwind: { path: "$couponData", preserveNullAndEmptyArrays: true } },
		{ $unwind: "$colorData" },
		{ $unwind: "$sizeData" },
		{
			$addFields: {
				mrp: '$productData.mrp',
				discount: '$productData.discount',
				couponValue: { $ifNull: ['$couponData.couponValue', 0] },
				couponCode: { $ifNull: ['$couponData.couponCode', null] },
				couponName: { $ifNull: ['$couponData.coupon', null] }
				
			}
		},
		{
			$project: {
				individualTotal: {
					$multiply: ["$mrp", "$quantity"]
				},
				taxRate: 0.18,
				mrpWithoutTax: {
					$multiply: [
						{ $multiply: ["$mrp", "$quantity"] },
						{ $divide: [100, 118] }
					]
				},
				firstDiscountAmount: {
					$multiply: [
						{
							$multiply: [
								{ $multiply: ["$mrp", "$quantity"] },
								{ $divide: [100, 118] }
							]
						},
						{ $divide: ["$discount", 100] }
					]
				},
				AmountAfterfirstDiscount: {
					$subtract: [
						{
							$multiply: [
								{ $multiply: ["$mrp", "$quantity"] },
								{ $divide: [100, 118] }
							]
						},
						{
							$multiply: [
								{
									$multiply: [
										{ $multiply: ["$mrp", "$quantity"] },
										{ $divide: [100, 118] }
									]
								},
								{ $divide: ["$discount", 100] }
							]
						}
					]
				},
				seccondDiscountAmount: {
					$multiply: [
						{
							$subtract: [
								{
									$multiply: [
										{ $multiply: ["$mrp", "$quantity"] },
										{ $divide: [100, 118] }
									]
								},
								{
									$multiply: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{ $divide: ["$discount", 100] }
									]
								}
							]
						},
						{ $divide: ["$couponValue", 100] }
					]
				},
				AmountAfterSecondDiscount: {
					$subtract: [
						{
							$subtract: [
								{
									$multiply: [
										{ $multiply: ["$mrp", "$quantity"] },
										{ $divide: [100, 118] }
									]
								},
								{
									$multiply: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{ $divide: ["$discount", 100] }
									]
								}
							]
						},
						{
							$multiply: [
								{
									$subtract: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{
											$multiply: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{ $divide: ["$discount", 100] }
											]
										}
									]
								},
								{ $divide: ["$couponValue", 100] }
							]
						}
					]
				},
				gst: {
					$multiply: [
						{ $divide: [18, 100] },
						{
							$subtract: [
								{
									$subtract: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{
											$multiply: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{ $divide: ["$discount", 100] }
											]
										}
									]
								},
								{
									$multiply: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{ $divide: ["$couponValue", 100] }
									]
								}
							]
						}
					]
				},
				sgst: {
					$divide: [
						{
							$multiply: [
								{ $divide: [18, 100] },
								{
									$subtract: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{
											$multiply: [
												{
													$subtract: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{
															$multiply: [
																{
																	$multiply: [
																		{ $multiply: ["$mrp", "$quantity"] },
																		{ $divide: [100, 118] }
																	]
																},
																{ $divide: ["$discount", 100] }
															]
														}
													]
												},
												{ $divide: ["$couponValue", 100] }
											]
										}
									]
								}
							]
						}, 2
					]
				},
				cgst: {
					$divide: [
						{
							$multiply: [
								{ $divide: [18, 100] },
								{
									$subtract: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{
											$multiply: [
												{
													$subtract: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{
															$multiply: [
																{
																	$multiply: [
																		{ $multiply: ["$mrp", "$quantity"] },
																		{ $divide: [100, 118] }
																	]
																},
																{ $divide: ["$discount", 100] }
															]
														}
													]
												},
												{ $divide: ["$couponValue", 100] }
											]
										}
									]
								}
							]
						}, 2
					]
				},
				totalPrice: {
					$add: [
						{
							$subtract: [
								{
									$subtract: [
										{
											$multiply: [
												{ $multiply: ["$mrp", "$quantity"] },
												{ $divide: [100, 118] }
											]
										},
										{
											$multiply: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{ $divide: ["$discount", 100] }
											]
										}
									]
								},
								{
									$multiply: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{ $divide: ["$couponValue", 100] }
									]
								}
							]
						},
						{
							$multiply: [
								{ $divide: [18, 100] },
								{
									$subtract: [
										{
											$subtract: [
												{
													$multiply: [
														{ $multiply: ["$mrp", "$quantity"] },
														{ $divide: [100, 118] }
													]
												},
												{
													$multiply: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{ $divide: ["$discount", 100] }
													]
												}
											]
										},
										{
											$multiply: [
												{
													$subtract: [
														{
															$multiply: [
																{ $multiply: ["$mrp", "$quantity"] },
																{ $divide: [100, 118] }
															]
														},
														{
															$multiply: [
																{
																	$multiply: [
																		{ $multiply: ["$mrp", "$quantity"] },
																		{ $divide: [100, 118] }
																	]
																},
																{ $divide: ["$discount", 100] }
															]
														}
													]
												},
												{ $divide: ["$couponValue", 100] }
											]
										}
									]
								}
							]
						}
					]
				},
				paymentMode: 1,
				addressId: 1,
				orderStatus: 1,
				paymentStatus: 1,
				createdAt: 1,
				updatedAt: 1,
				mrp:1,
				couponValue : 1,
				couponCode : 1,
				couponName : 1,
				discount: 1,
				status: 1,
				title: "$productData.title",
				images: "$productData.images",
				productDetailsReview : "$productData.review",
				color: "$colorData.color",
				size: "$sizeData.size",
				productId: 1,
				wholeOrderId : 1,
				singleOrderId : 1,
				quantity: 1,
				userId :1
			}
		},
		{
			$group: {
				_id: "$wholeOrderId",
				orders: { $push: "$$ROOT" }
			}
		},
		{ $match : { 'orders.orderStatus': selectedFilter}},
		{ $sort: { 'orders.createdAt': -1 } }
	]);

	const totalPages = Math.ceil(order.length / limit);
	const paginatedOrder = order.slice(skip, skip + limit);
	let totalIndividualTotal = 0
    let totalMrpWithoutTax = 0
    let totalFirstDiscountAmount = 0
    let totalAmountAfterfirstDiscount = 0  
    let totalSeccondDiscountAmount = 0
    let totalAmountAfterSecondDiscount = 0  
    let totalGst = 0
    let totalSgst = 0
    let totalCgst = 0
	let statusArr = [];
	let pendingArr = [];
	let placedArr = [];
	let cancelledArr = [];
	let returnedArr = [];
	let deliveredArr = [];

	paginatedOrder.forEach(orderItem => {
		orderItem.orders.forEach(orderItmes =>{
			totalIndividualTotal += orderItmes.individualTotal
			totalMrpWithoutTax += orderItmes.mrpWithoutTax 
			totalFirstDiscountAmount += orderItmes.firstDiscountAmount 
			totalAmountAfterfirstDiscount += orderItmes.AmountAfterfirstDiscount   
			totalSeccondDiscountAmount += orderItmes.seccondDiscountAmount 
			totalAmountAfterSecondDiscount += orderItmes.AmountAfterSecondDiscount   
			totalGst += orderItmes.gst 
			totalSgst += orderItmes.sgst 
			totalCgst += orderItmes.cgst
			statusArr.push(orderItmes.status)
		})
	});
	pendingArr = statusArr.filter(status => status === 'pending');
	cancelledArr = statusArr.filter(status => status === 'cancelled');
	returnedArr = statusArr.filter(status => status === 'returned');
	placedArr = statusArr.filter(status => status === 'placed');
	deliveredArr = statusArr.filter(status => status === 'delivered');

	let totalDiscount = totalIndividualTotal - ( totalAmountAfterSecondDiscount + totalGst )
	let totalDiscountPercentage = ( totalDiscount / totalIndividualTotal ) * 100
	let roundOff = totalIndividualTotal - (totalAmountAfterSecondDiscount + totalGst + totalDiscount )
	let grandTotal = totalAmountAfterSecondDiscount + totalGst

	res.render('user-pages/userDashboardOrderFilteredPage', {
		message: req.flash('message'),
		uniqueStatusTypes,
		paginatedOrder,
		pendingArr,
		cancelledArr,
		returnedArr,
		placedArr,
		deliveredArr,
		currentPage,
		limit,
		totalPages,
		RAZORPAY_KEY_ID,selectedFilter,
		totalAmountAfterSecondDiscount, totalGst,
		totalSgst, totalCgst, totalDiscount, totalDiscountPercentage, roundOff , grandTotal,
	});
};
const userRemoveCouponPlaceOrder_post = async (req, res) => {
	const { cartId, couponId} = req.body
	const removeCoupon = await Cart.updateOne(
		{ _id: new ObjectId(cartId), cart: { $exists: true } },
		{
			$set: {
				"cart.$[].coupon": null
			}
		}
	);
	return res.json({ success: true, message: 'Coupon removed successfully' });
};
const userApplyCouponPlaceOrder_post = async (req, res) => {
	const { cartId, couponId } = req.body
	const applyCoupon = await Cart.updateOne(
		{ "_id": new ObjectId(cartId), "cart": { $exists: true } },
		{
			"$set": {
				"cart.$[].coupon": new ObjectId(couponId)
			}
		}
	);
	return res.json({ success: true, message: 'Coupon applied successfully' });
};
const updateQuantityPlaceOrder_post = async (req, res) => {
	console.log(req.body)
	const updatedCart = await Cart.updateOne(
		{
			_id: new ObjectId(req.body.cart),
			'cart._id': new ObjectId(req.body.cartId),
		},
		{
			$inc: {
				'cart.$.quantity': parseInt(req.body.change),
			},
		},
		{ new: true }
	);
	console.log(updatedCart, 'updatedCart')

	if (updatedCart) {
		console.log('Quantity updated successfully');
		return res.json({ success: true, message: 'Quantity updated successfully' });
	} else {
		console.log('Cart not found or not updated');
		return res.status(404).json({ success: false, message: 'Cart not found or not updated' });
	}

};
const userPlaceOrder_post = async (req, res) => {
	const cartId = req.params.id;
	console.log(req.params,'req.params')
	console.log(req.body,'req.body')
	if (!mongoose.Types.ObjectId.isValid(cartId)) {
		return res.status(404).render('user-pages/404');
	}

	const orderDetails = await Cart.aggregate([
		{ $match: { _id: new ObjectId(cartId) } },
		{ $unwind: '$cart' },
		{
			$project: {
				productId: '$cart.product',
				colorId: '$cart.color',
				sizeId: '$cart.size',
				quantity: '$cart.quantity',
				couponId: { $ifNull: ['$cart.coupon', null] },
			},
		},
		{
			$lookup: {
				from : "products",
				localField : "productId",
				foreignField : "_id",
				as : "productDetails"
			}
		},
		{
			$project: {
				_id: "$cart._id",
				productId: 1,
				couponId: 1,
				brandId: { $arrayElemAt: ["$productDetails.brandName", 0] },
				categoryId: { $arrayElemAt: ["$productDetails.categoryName", 0] },
				colorId: 1,
				sizeId: 1,
				quantity : 1
			},
		},
	]);
	console.log(orderDetails, 'orderDetails')
	const orderItems = orderDetails.map((item) => ({
		productId: item.productId,
		couponId: item.couponId,
		brandId: item.brandId,
		categoryId: item.categoryId,
		colorId: item.colorId,
		sizeId: item.sizeId,
		quantity: item.quantity,
	}));

	// subtract the quantity and update the stock 
	// after successfull order creation.
	const subtractQuantityAndUpdateStock = async (orderItems) => {
		for (let item of orderItems) {
			const product = await Product.findOneAndUpdate(
				{
					_id: item.productId,
					'variants.color': item.colorId,
					'variants.size': item.sizeId
				},
				{ $inc: { 'variants.$.quantity': -item.quantity } },
				{ new: true }
			);
		}
	};
	// created the new order
	const newOrder = await Order.create({
		userId: new ObjectId(req.session.userId),
		paymentMode: req.body.paymentMode,
		addressId: req.body.address,
		order: orderItems,
	})

	// Call the function only after the order is successfully created
	await subtractQuantityAndUpdateStock(orderItems);

	const orderID = "clothStore_" + newOrder._id.toString().slice(-8);
	const deleteUserCart = await Cart.deleteOne({
		_id: new ObjectId(cartId)
	})
	const options = {
		amount: parseInt(req.body.amount),
		currency: "INR",
		receipt: newOrder._id
	};

	razorpayInstance.orders.create(options, (err, order) => {
		if (err) {
			console.error(err);
			res.status(500).json({ error: 'Unable to create order' });
		} else {
			console.log(order, 'order created in razorpay')
			res.json({
				order: order,
				userDetails: req.session,
				paymentMode: req.body.paymentMode,
				message: `Order placed successfully Order ID : ${orderID}`
			});
		}
	});
};
const userRetryPayment_post = async (req, res) => {
	console.log(req.body, 'retry payment')
	const { orderId, keyId, amount} = req.body;
	if (!mongoose.Types.ObjectId.isValid(orderId)) {
		return res.status(404).render('user-pages/404');
	}
	const options = {
		amount: parseInt( amount),
		currency: "INR",
		receipt: orderId
	};

	razorpayInstance.orders.create(options, (err, order) => {
		if (err) {
			console.error(err);
			res.status(500).json({ error: 'Unable to create order' });
		} else {
			console.log(order, 'order created in razorpay')
			res.json({
				status: true,
				order: order,
				userDetails: req.session,
				message: `Order placed successfully Order ID : ${orderId}`
			});
		}
	});
};
const userVerifyPayment_post = (req, res) => {
	const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req?.body?.paymentDetails
	const { id } = req?.body?.orderDetails?.order
	const placedOrderDetails = req?.body?.orderDetails?.order
	const orderId = id;
	const paymentId = razorpay_payment_id;
	const razorpaySignature = razorpay_signature;
	const secret = RAZORPAY_KEY_SECRET;

	const isValid = verifyPayment.verifyPaymentSignature(orderId, paymentId, razorpaySignature, secret);
	if (isValid) {
		return res.json({ placedOrderDetails : placedOrderDetails, status: true, message: 'Payment successfull' })
	} else {
		return res.json({ placedOrderDetails : placedOrderDetails, status: false, message: 'Payment failed, try again!' })
	}
};
const userChangePaymentStatus_post = async (req, res) => {
	console.log(req.body, 'change payment')
	if (!mongoose.Types.ObjectId.isValid(req?.body?.orderId)) {
		return res.status(404).render('user-pages/404');
	}
	const orderId = req?.body?.orderId
	const updatePaymentStatus = await Order.findOneAndUpdate(
        { _id: new ObjectId(orderId) },
        { $set: { paymentStatus: req?.body?.status } },
        { new: true }
    );
	if (updatePaymentStatus) {
        res.json({ status : true, message: 'Payment status updated successfully', paymentStatus: updatePaymentStatus?.paymentStatus, });
    } else {
		return res.status(404).render('user-pages/404');
    }
};
const userCancelSingleOrder_post = async (req, res) => {
	if (!mongoose.Types.ObjectId.isValid(req.query.single)) {
		return res.status(404).render('user-pages/404');
	}
    const updatedOrder = await Order.updateOne(
        {
            userId: new ObjectId(req.session.userId),
            'order._id': new ObjectId(req.query.single)
        },
        {
            $set: {
                'order.$.status': "cancelled"
            }
        }
    );
    const allOrders = await Order.findOne({
        userId: new ObjectId(req.session.userId),
    });
    const allOrdersCancelled = allOrders.order.every(order => order.status === 'cancelled');
    if (allOrdersCancelled) {
        await Order.updateOne(
            {
                userId: new ObjectId(req.session.userId)
            },
            {
                $set: {
                    orderStatus: "cancelled"
                }
            }
        );
    }
    req.flash('message', `${req.query.product} cancelled successfully`);
    return res.redirect(`/user-dashboard-orders?page=${req.query.page}`);
};
const userCancelWholeOrder_post = async (req, res) => {
	if (!mongoose.Types.ObjectId.isValid(req.query.orderId)) {
		return res.status(404).render('user-pages/404');
	}
	const cancelledOrder = await Order.updateOne(
		{
			_id: new ObjectId(req.query.orderId),
			//   "order.status": "pending"
		},
		{
			$set: {
				"order.$[].status": "cancelled",
				 orderStatus: "cancelled"
			}
		}
	);
	console.log(cancelledOrder,'cancelledOrder')
	if(cancelledOrder){
		req.flash('message', `${req.query.orderName} cancelled successfully`);
		return res.redirect(`/user-dashboard-orders?page=${req.query.page}`)
	}
};
const userReturnWholeOrder_post = async (req, res) => {
	const { orderId, orderName, currentStatus, page } = req.query;
	const newStatus = 'returned'

	const returnedOrder = await Order.updateOne(
		{
			_id: new ObjectId(req.query.orderId),
			//   "order.status": "pending"
		},
		{
			$set: {
				"order.$[].status": newStatus,
				 orderStatus: newStatus
			}
		}
	);
	if(returnedOrder) {
		req.flash('message', `${orderName} returned successfully`);
		return res.redirect(`/user-dashboard-orders?page=${page}`)
	}
};
const userAddAddressOnPayment_get = (req, res) => {
	res.render('user-pages/userDashboardAddAddressOnPlaceOrderPage',
		{
			message: req.query.message,
			countryData
		})
};
const userAddAddressOnPayment_post = async (req, res) => {
	const findUser = await Address.findOne({ userId: req.session.userId });
	if (findUser) {
		const updatedAddress = await Address.updateOne(
			{ userId: req.session.userId },
			{
				$push: {
					addresses: req.body
				}
			}
		);
		req.flash('message', 'new address added successfully')
		return res.redirect('/user-checkout');
	} else {
		const createdAddress = await Address.create({
			userId: new ObjectId(req.session.userId),
			addresses: req.body
		})
		res.redirect('/user-checkout?message=new address added successfully');
	}
};
const userDashboardOrdersAddReview_get = async (req, res) => {
	const productId = req.query.productId;
	const page = req.query.page;
	const { rating, reviewMessage } = req.body;
	const { userId, firstName, lastName } = req.session;

	const existingReview = await Product.findOne({
		'review.userId': new ObjectId(userId),
		_id: new ObjectId(productId)
	});

	if (existingReview) {
		const updatedReview = await Product.updateOne(
			{
				_id: new ObjectId(productId),
				'review.userId': new ObjectId(userId)
			},
			{
				$set: {
					'review.$.rating': rating,
					'review.$.message': reviewMessage
				}
			}
		);
	} else {
		const newReview = {
			rating: rating,
			message: reviewMessage,
			userId: userId,
			username: `${firstName} ${lastName}`
		};
		const addedReview = await Product.updateOne(
			{ _id: new ObjectId(productId) },
			{ $push: { review: newReview } }
		);
	}

	req.flash('message', `Your review has been added. Thank you for your feedback!`);
	return res.redirect(`/user-dashboard-orders?page=${page}`);
};

module.exports = {
	userDashboard,
	userDashboardAddressBook_get,
	userAddAddress_get,
	userAddAddress_post,
	userEditAddress_post,
	userDeleteAddress_post,
	userCheckOldPassword_post,
	userGetPincodeDatails_post,
	userSearch_get,
	userSearch_post,
	userDashboardOrders_get,
	userGenerateInvoice_get,
	userDownloadInvoice_get,
	userFilterOrderStatus_get,
	userFilterOrderStatus_post,
	userDashboardOrdersAddReview_get,
	userDashboardReturns_get,
	userDashboardCancellations_get,
	userDashboardWishists_get,
	userWishList_get,
	userDashboardCart_get,
	userCancelCartProduct_post,
	userCheckout_get,
	userChangeQuantity_post,
	updateQuantityPlaceOrder_post,
	userRemoveCouponPlaceOrder_post,
	userApplyCouponPlaceOrder_post,
	userCancelCartProductOnPlaceorder_post,
	userPlaceOrder_post,
	userRetryPayment_post,
	userVerifyPayment_post,
	userChangePaymentStatus_post,
	userCancelSingleOrder_post,
	userCancelWholeOrder_post,
	userReturnWholeOrder_post,
	userAddAddressOnPayment_get,
	userAddAddressOnPayment_post,
}

