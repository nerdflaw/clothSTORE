const express = require('express')
require('dotenv').config()
const users = require('../../models/models');
const bcrypt = require('bcrypt')
const Category = require('../../models/category')
const Product = require('../../models/product')
const Brand = require('../../models/brand')
const Color = require('../../models/color')
const Size = require('../../models/size')
const Wishlist = require('../../models/wishlist')
const Order = require('../../models/order')
const OTPgenerator = require('../../helpers/functions/otpGenerator')
const sendOTP = require('../../helpers/functions/emailSender');
const { ObjectId } = require('mongodb');

// setting admin credential
const credential = {
	email: 'admin@gmail.com',
	password: 'admin'
};

// homepage,
// userSignUp_get,
// userSignUpOTP_post,
// userSignUpOTPValidate_get,
// userSignUpOTPValidate_post,
// userLogin_get,
// userLogin_post,
// userLoginGoogleFailed_get,
// userLoginGoogleSuccess_get,
// userSignout,
// userListFlashSales_get,
// userListFlashSales_post,
// userListFeaturedProducts_get,
// userListFeaturedProducts_post,
// userListNewArrivals_get,
// userListNewArrivals_post,
// userListPopularProducts_get,
// userListPopularProducts_post,
// userListAverageRated_get,
// userListAverageRated_post,

const homepage = async (req, res) => {
	const brands = await Brand.find({ status: true })
	const topSelling = await Product.find({ topselling: true }).limit(4)
	const colors = await Color.find({ status: true })
	const categories = await Category.find({ status: true })
	const sizes = await Size.find({ status: true })
	const flashSale = await Product.aggregate([
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
				mostOrderedCount: { $first: "$mostOrderedCount" },
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
				mostOrderedCount: { $first: "$mostOrderedCount" },
				sumOfRatings: { $first: "$sumOfRatings" },
				countOfRatings: { $first: "$countOfRatings" },
				averageRating: { $first: "$averageRating" },
				sumOfQuantities: { $sum: { $ifNull: ["$productDetails.variants.quantity", 0] } },
				productDetails: { $first: "$productDetails" }
			}
		},
		{
			$project: {
				mostOrderedCount: 1,
				sumOfRatings: 1,
				countOfRatings: 1,
				averageRating: 1,
				sumOfQuantities: 1,
				productDetails: 1
			}
		},
		{ $match: { 'productDetails.status': true, 'productDetails.flashsale': true } },
		{ $sort: { 'productDetails.createdAt': -1 } },
		{ $limit: 4 }
	]);

	const newArrival = await Product.aggregate([
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
				mostOrderedCount: { $first: "$mostOrderedCount" },
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
				mostOrderedCount: { $first: "$mostOrderedCount" },
				sumOfRatings: { $first: "$sumOfRatings" },
				countOfRatings: { $first: "$countOfRatings" },
				averageRating: { $first: "$averageRating" },
				sumOfQuantities: { $sum: { $ifNull: ["$productDetails.variants.quantity", 0] } },
				productDetails: { $first: "$productDetails" }
			}
		},
		{
			$project: {
				mostOrderedCount: 1,
				sumOfRatings: 1,
				countOfRatings: 1,
				averageRating: 1,
				sumOfQuantities: 1,
				productDetails: 1
			}
		},
		{ $match: { 'productDetails.status': true } },
		{ $sort: { 'productDetails.createdAt': -1 } },
		{ $limit: 4 }
	]);

	const popuplarProducts = await Order.aggregate([
		{ $unwind: "$order" },
		{ $group: { _id: "$order.productId", mostOrderedCount: { $sum: 1 } } },
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
				mostOrderedCount: { $first: "$mostOrderedCount" },
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
				mostOrderedCount: { $first: "$mostOrderedCount" },
				sumOfRatings: { $first: "$sumOfRatings" },
				countOfRatings: { $first: "$countOfRatings" },
				averageRating: { $first: "$averageRating" },
				sumOfQuantities: { $sum: { $ifNull: ["$productDetails.variants.quantity", 0] } },
				productDetails: { $first: "$productDetails" }
			}
		},
		{
			$project: {
				mostOrderedCount: 1,
				sumOfRatings: 1,
				countOfRatings: 1,
				averageRating: 1,
				sumOfQuantities: 1,
				productDetails: 1
			}
		},
		{ $match: { 'productDetails.status': true } },
		{ $limit: 4 }
	]);

	res.render('user-pages/userListProductsPage',
		{
			brands, colors, categories, sizes,
			popuplarProducts, newArrival, flashSale
		})
};
const userSignUp_get = (req, res) => {
	if (req.session.adminLogged) {
		res.redirect('/admin-dashboard')
	}
	try {
		if (req.session.userLogged) {
			res.redirect('/user-dashboard')
		} else {
			res.render('user-pages/userSignUpPage',
				{
					message: req.flash('message'),
					error: req.flash('error'),
					googleClientId: 'process.env.CLIENT_SECRET'
				})
		}
	} catch (error) {
		console.error(error);
		res.status(500).send('Internal server error', error)
	}
};
const otpStore1 = {};
const userSignUpOTP_post = async (req, res) => {
	if (req.session.adminLogged) {
		res.redirect('/admin-dashboard')
	}
	try {
		if (req.session.userLogged) {
			return res.redirect('/user-dashboard');
		} else {
			const { firstName, lastName, email, password, confirmPassword } = req.body;
			const existingUser = await users.findOne({ email }, {});
			if (existingUser) {
				req.flash('error', 'This email is already in use!. Please Login!')
				return res.redirect('/user-signup');
			}
			if (confirmPassword === password) {
				const saltRound = 10;
				const hashedPassword = await bcrypt.hash(password, saltRound);

				req.session.firstName = firstName;
				req.session.lastName = lastName;
				req.session.email = email;
				req.session.hashedPassword = hashedPassword
			} else {
				req.flash('error', 'Password and confirm password should be same')
				return res.redirect('/user-signup');
			}
			const generatedOTP = OTPgenerator
			console.log('generatedOTP', generatedOTP)
			const recipientEmail = email;
			const expirationTime = 5 * 60 * 1000;
			const expirationTimestamp = Date.now() + expirationTime;
			otpStore1[generatedOTP] = expirationTimestamp;
			try {
				await sendOTP(recipientEmail, generatedOTP);
				res.redirect('/user-signup-otp-validate?message=OTP sent to your email&email=' + encodeURIComponent(email));
			} catch (error) {
				console.error('Error sending OTP:', error);
				return res.status(500).redirect('/user-signup-otp-validate?error= error in sending OTP&email=' + encodeURIComponent(email));
			}
		}
	} catch (error) {
		console.error(error);
		res.status(500).send('Internal server error', error);
	}
};
const userSignUpOTPValidate_get = (req, res) => {
	res.render('user-pages/userValidateOTPSignupPage',
		{
			message: req.query.message,
			error: req.query.error,
			email: req.query.email
		}
	)
};
const userSignUpOTPValidate_post = async (req, res) => {
	const { otp1, otp2, otp3, otp4, otp5, otp6 } = req.body;
	const userEnteredOTP = otp1 + otp2 + otp3 + otp4 + otp5 + otp6;
	console.log('userEnteredOTP', userEnteredOTP);
	if (otpStore1[userEnteredOTP] && otpStore1[userEnteredOTP] > Date.now()) {
		const email = req.session.email
		const createNewuser = await users.create({
			firstName: req.session.firstName,
			lastName: req.session.lastName,
			email: req.session.email,
			password: req.session.hashedPassword
		})
		req.session.userId = createNewuser._id
		// req.session.destroy()
		// res.session.userLogged=true
		console.log(createNewuser, 'createNewuser')
		console.log(req.session.userId, 'req.session.userId')
		res.redirect('/user-login?success=OTP validated successfully');
	} else {
		res.status(500).redirect('/user-signup-otp-validate?error= Invalid or expired OTP');
	}
};
const userLogin_get = (req, res) => {
	res.render('user-pages/userLoginPage',
		{
			message: req.flash('message'),
			success: req.query.success
		})
};
const userLogin_post = async (req, res) => {
	const { email, password } = req.body;
	if (credential.email === email) {
		if (credential.password === password) {
			req.session.adminLogged = true
			return res.redirect('/admin-dashboard')
		} else {
			req.flash('message', 'Incorrect password')
			return res.redirect('/user-login')
		}
	} else {
		const user = await users.findOne({ email });
		if (!user) {
			req.flash('message', 'User not found, Please Signup')
			return res.redirect('/user-login')
		}
		const findUserStatus = await users.findOne({ email: email }, {});
		if (!findUserStatus.status) {
			req.flash('message', 'Sorry, access denied at the moment')
			return res.redirect('/user-login')
		}
		const checkForPasswordMatch = await bcrypt.compare(password, user.password);
		if (checkForPasswordMatch) {
			req.session.userLogged = true;
			req.session.firstName = user.firstName;
			req.session.lastName = user.lastName;
			req.session.userId = user._id;
			req.session.email = user.email;
			req.session.password = password;
			req.session.phoneNumber = user.phoneNumber;
			return res.redirect('/');
		} else {
			req.flash('message', 'Incorrect password')
			res.redirect('/user-login')
		}
	}
};
const userLoginGoogleFailed_get = (req, res) => {
	req.flash('message', 'Google, authentication failed')
	return res.redirect('/user-login')
};
const userLoginGoogleSuccess_get = async (req, res) => {
	const firstName = req.user.name.givenName;
	const lastName = req.user.name.familyName;
	const email = req.user.email;
	const existingUser = await users.findOne({ email }, {});
	if (existingUser) {
		req.session.userLogged = true;
		req.session.firstName = firstName;
		req.session.lastName = lastName;
		req.session.email = email;
		req.session.phoneNumber = existingUser.phoneNumber;
		req.session.userId = existingUser._id;
		return res.redirect('/');
	} else {
		const hashedPassword = ' ';
		const createNewUser = await users.create({
			firstName: firstName,
			lastName: lastName,
			email: email,
			password: hashedPassword
		});

		req.session.userLogged = true;
		req.session.firstName = firstName;
		req.session.lastName = lastName;
		req.session.email = email;
		req.session.hashedPassword = hashedPassword;
		req.session.userId = createNewUser._id;
		return res.redirect('/');
	}
};
const userSignout = (req, res) => {
	req.session.destroy()
	res.redirect('/')
};
const userListFlashSales_get = async (req, res) => {
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

	filterQuery['productDetails.flashsale'] = true;
	filterQuery['productDetails.status'] = true;

	if (brandsArr.length > 0) {
		filterQuery['productDetails.brandName'] = { $in: brandsArr };
	}
	if (categoriesArr.length > 0) {
		filterQuery['productDetails.categoryName'] = { $in: categoriesArr };
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
	return res.render('user-pages/userListFlashSalesPage',
		{
			categories, sizes, brands, colors,
			totalPages, currentPage, paginatedProducts, limit,
			brandsArr, categoriesArr, colorsArr, sizesArr, sorted
		})
};
const userListFlashSales_post = async (req, res) => {
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

	filterQuery['productDetails.flashsale'] = true;
	filterQuery['productDetails.status'] = true;

	if (brandsArr.length > 0) {
		filterQuery['productDetails.brandName'] = { $in: brandsArr };
	}
	if (categoriesArr.length > 0) {
		filterQuery['productDetails.categoryName'] = { $in: categoriesArr };
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
	return res.render('user-pages/userListFlashSalesPage',
		{
			categories, sizes, brands, colors,
			totalPages, currentPage, paginatedProducts, limit,
			brandsArr, categoriesArr, colorsArr, sizesArr, sorted
		})
};
const userListFeaturedProducts_get = async (req, res) => {
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

	filterQuery['productDetails.featured'] = true;
	filterQuery['productDetails.status'] = true;

	if (brandsArr.length > 0) {
		filterQuery['productDetails.brandName'] = { $in: brandsArr };
	}
	if (categoriesArr.length > 0) {
		filterQuery['productDetails.categoryName'] = { $in: categoriesArr };
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
	return res.render('user-pages/userListFeaturedProductsPage',
		{
			categories, sizes, brands, colors,
			totalPages, currentPage, paginatedProducts, limit,
			brandsArr, categoriesArr, colorsArr, sizesArr, sorted
		})
};
const userListFeaturedProducts_post = async (req, res) => {
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

	filterQuery['productDetails.featured'] = true;
	filterQuery['productDetails.status'] = true;

	if (brandsArr.length > 0) {
		filterQuery['productDetails.brandName'] = { $in: brandsArr };
	}
	if (categoriesArr.length > 0) {
		filterQuery['productDetails.categoryName'] = { $in: categoriesArr };
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
				mostOrderedCount: { $first: "$mostOrderedCount" },
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
				mostOrderedCount: { $first: "$mostOrderedCount" },
				sumOfRatings: { $first: "$sumOfRatings" },
				countOfRatings: { $first: "$countOfRatings" },
				averageRating: { $first: "$averageRating" },
				sumOfQuantities: { $sum: { $ifNull: ["$productDetails.variants.quantity", 0] } },
				productDetails: { $first: "$productDetails" }
			}
		},
		{
			$project: {
				mostOrderedCount: 1,
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
	return res.render('user-pages/userListFeaturedProductsPage',
		{
			categories, sizes, brands, colors,
			totalPages, currentPage, paginatedProducts, limit,
			brandsArr, categoriesArr, colorsArr, sizesArr, sorted
		})
};
const userListNewArrivals_get = async (req, res) => {

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
		filterQuery['productDetails.brandName'] = { $in: brandsArr };
	}
	if (categoriesArr.length > 0) {
		filterQuery['productDetails.categoryName'] = { $in: categoriesArr };
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
	return res.render('user-pages/userListNewArrivalsPage',
		{
			categories, sizes, brands, colors,
			totalPages, currentPage, paginatedProducts, limit,
			brandsArr, categoriesArr, colorsArr, sizesArr, sorted
		})
};
const userListNewArrivals_post = async (req, res) => {
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
		filterQuery['productDetails.brandName'] = { $in: brandsArr };
	}
	if (categoriesArr.length > 0) {
		filterQuery['productDetails.categoryName'] = { $in: categoriesArr };
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
	return res.render('user-pages/userListNewArrivalsPage',
		{
			categories, sizes, brands, colors,
			totalPages, currentPage, paginatedProducts, limit,
			brandsArr, categoriesArr, colorsArr, sizesArr, sorted
		})
};
const userListPopularProducts_get = async (req, res) => {
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
	} else if (sorted === 'popularityLowToHigh') {
		sortQuery.mostOrderedCount = 1;
	} else if (sorted === 'popularityHighToLow') {
		sortQuery.mostOrderedCount = -1;
	} else {
		sortQuery.mostOrderedCount = -1;
	}

	let filterQuery = {}

	filterQuery['productDetails.status'] = true;

	if (brandsArr.length > 0) {
		filterQuery['productDetails.brandName'] = { $in: brandsArr };
	}
	if (categoriesArr.length > 0) {
		filterQuery['productDetails.categoryName'] = { $in: categoriesArr };
	}
	if (colorsArr.length > 0) {
		filterQuery['productDetails.variants.color'] = { $in: colorsArr };
	}
	if (sizesArr.length > 0) {
		filterQuery['productDetails.variants.size'] = { $in: sizesArr };
	}

	const products = await Order.aggregate([
		{ $unwind: "$order" },
		{ $group: { _id: "$order.productId", mostOrderedCount: { $sum: 1 } } },
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
				mostOrderedCount: { $first: "$mostOrderedCount" },
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
				mostOrderedCount: { $first: "$mostOrderedCount" },
				sumOfRatings: { $first: "$sumOfRatings" },
				countOfRatings: { $first: "$countOfRatings" },
				averageRating: { $first: "$averageRating" },
				sumOfQuantities: { $sum: { $ifNull: ["$productDetails.variants.quantity", 0] } },
				productDetails: { $first: "$productDetails" }
			}
		},
		{
			$project: {
				mostOrderedCount: 1,
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

	const paginatedProducts = products.slice(skip, skip + limit)
	const totalPages = Math.ceil(products.length / limit)
	const [categories, sizes, brands, colors] = await Promise.all([
		Category.find({ status: true }),
		Size.find({ status: true }),
		Brand.find({ status: true }),
		Color.find({ status: true })
	])

	return res.render('user-pages/userListPopularProductsPage',
		{
			categories, sizes, brands, colors,
			totalPages, currentPage, paginatedProducts, limit,
			brandsArr, categoriesArr, colorsArr, sizesArr, sorted
		})
};
const userListPopularProducts_post = async (req, res) => {
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
	} else if (sorted === 'popularityLowToHigh') {
		sortQuery.mostOrderedCount = 1;
	} else if (sorted === 'popularityHighToLow') {
		sortQuery.mostOrderedCount = -1;
	} else {
		sortQuery.mostOrderedCount = -1;
	}

	let filterQuery = {}

	filterQuery['productDetails.status'] = true;

	if (brandsArr.length > 0) {
		filterQuery['productDetails.brandName'] = { $in: brandsArr };
	}
	if (categoriesArr.length > 0) {
		filterQuery['productDetails.categoryName'] = { $in: categoriesArr };
	}
	if (colorsArr.length > 0) {
		filterQuery['productDetails.variants.color'] = { $in: colorsArr };
	}
	if (sizesArr.length > 0) {
		filterQuery['productDetails.variants.size'] = { $in: sizesArr };
	}

	const products = await Order.aggregate([
		{ $unwind: "$order" },
		{ $group: { _id: "$order.productId", mostOrderedCount: { $sum: 1 } } },
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
				mostOrderedCount: { $first: "$mostOrderedCount" },
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
				mostOrderedCount: { $first: "$mostOrderedCount" },
				sumOfRatings: { $first: "$sumOfRatings" },
				countOfRatings: { $first: "$countOfRatings" },
				averageRating: { $first: "$averageRating" },
				sumOfQuantities: { $sum: { $ifNull: ["$productDetails.variants.quantity", 0] } },
				productDetails: { $first: "$productDetails" }
			}
		},
		{
			$project: {
				mostOrderedCount: 1,
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
	return res.render('user-pages/userListPopularProductsPage',
		{
			categories, sizes, brands, colors,
			totalPages, currentPage, paginatedProducts, limit,
			brandsArr, categoriesArr, colorsArr, sizesArr, sorted
		})
};
const userListAverageRated_get = async (req, res) => {
	let currentPage = Number(req.query.page) || 1;
	let limit = Number(req.query.limit) || 4;
	let skip = (currentPage - 1) * limit;

	let brandsArr = req.query.brand ? req.query.brand.split(',') : [];
	let categoriesArr = req.query.category ? req.query.category.split(',') : [];
	let colorsArr = req.query.color ? req.query.color.split(',') : [];
	let sizesArr = req.query.size ? req.query.size.split(',') : [];
	let sorted = req.query.sort ? req.query.sort : '';

	let filterQuery = {};

	filterQuery['productDetails.status'] = true;

	if (brandsArr.length > 0) {
		filterQuery['productDetails.brandName'] = { $in: brandsArr };
	}
	if (categoriesArr.length > 0) {
		filterQuery['productDetails.categoryName'] = { $in: categoriesArr };
	}
	if (colorsArr.length > 0) {
		filterQuery['productDetails.variants.color'] = { $in: colorsArr };
	}
	if (sizesArr.length > 0) {
		filterQuery['productDetails.variants.size'] = { $in: sizesArr };
	}

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
	} else {
		sortQuery.averageRating = 1;
	}

	const averageRatedProducts = await Product.aggregate([
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

	const paginatedProducts = averageRatedProducts.slice(skip, skip + limit)
	const totalPages = Math.ceil(averageRatedProducts.length / limit)
	const [categories, sizes, brands, colors] = await Promise.all([
		Category.find({ status: true }),
		Size.find({ status: true }),
		Brand.find({ status: true }),
		Color.find({ status: true })
	])

	return res.render('user-pages/userListAverageRatedPage',
		{
			categories, sizes, brands, colors,
			totalPages, currentPage, paginatedProducts, limit,
			brandsArr, categoriesArr, colorsArr, sizesArr, sorted
		})
};
const userListAverageRated_post = async (req, res) => {
	const { brand, category, color, size, sort } = req.body
	let currentPage = Number(req.query.page) || 1
	let limit = Number(req.query.limit) || 4
	let skip = (currentPage - 1) * limit;

	let brandsArr = brand && brand.length > 0 ? brand.map(bran => new ObjectId(bran)) : [];
	let categoriesArr = category && category.length > 0 ? category.map(cat => new ObjectId(cat)) : [];
	let colorsArr = color && color.length > 0 ? color : [];
	let sizesArr = size && size.length > 0 ? size : [];
	let sorted = sort ? sort : '';

	let filterQuery = {};

	filterQuery['productDetails.status'] = true;

	if (brandsArr.length > 0) {
		filterQuery['productDetails.brandName'] = { $in: brandsArr };
	}
	if (categoriesArr.length > 0) {
		filterQuery['productDetails.categoryName'] = { $in: categoriesArr };
	}
	if (colorsArr.length > 0) {
		filterQuery['productDetails.variants.color'] = { $in: colorsArr };
	}
	if (sizesArr.length > 0) {
		filterQuery['productDetails.variants.size'] = { $in: sizesArr };
	}

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
	} else {
		sortQuery.averageRating = 1;
	}

	const averageRatedProducts = await Product.aggregate([
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

	const totalPages = Math.ceil(averageRatedProducts.length / limit);
	const paginatedProducts = averageRatedProducts.slice(skip, skip + limit);
	return res.render('user-pages/userListAverageRatedPage',
		{
			categories, sizes, brands, colors,
			totalPages, currentPage, paginatedProducts, limit,
			brandsArr, categoriesArr, colorsArr, sizesArr, sorted
		})
};

module.exports = {
	homepage,
	userSignUp_get,
	userSignUpOTP_post,
	userSignUpOTPValidate_get,
	userSignUpOTPValidate_post,
	userLogin_get,
	userLogin_post,
	userLoginGoogleFailed_get,
	userLoginGoogleSuccess_get,
	userSignout,
	userListFlashSales_get,
	userListFlashSales_post,
	userListFeaturedProducts_get,
	userListFeaturedProducts_post,
	userListNewArrivals_get,
	userListNewArrivals_post,
	userListPopularProducts_get,
	userListPopularProducts_post,
	userListAverageRated_get,
	userListAverageRated_post,
};