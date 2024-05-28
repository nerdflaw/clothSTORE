const express = require('express')
const mongoose = require('mongoose')
const Product = require('../../models/product')
const Category = require('../../models/category')
const Size = require('../../models/size')
const Color = require('../../models/color')
const Brand = require('../../models/brand')
const Order = require('../../models/order')
const moment = require('moment');
const { ObjectId } = require('mongodb')
const flash = require('connect-flash')

// adminProductManagement
// adminAddProduct_get, adminAddProduct_post
// adminDeleteProduct
// adminEditProduct_get, adminEditProduct_post

const adminProductManagement = async (req, res) => {
	const i = 0
	const ProductDetails = await Product.find();
	const categoryArray = await Category.find({ status: true });
	const colorsArray = await Color.find({ status: true });
	const sizesArray = await Size.find({ status: true });
	const brandArray = await Brand.find();

	return res.render('admin-pages/adminProductManagementPage',
		{
			ProductDetails,
			categoryArray,
			brandArray,
			i,
			message: req.flash('message'),
			colorsArray, sizesArray
		})
}

const adminAddProduct_get = async (req, res) => {
	const categories = await Category.find({ status: true }, {})
	const sizes = await Size.find({ status: true }, {})
	const products = await Product.find({ status: true }, {})
	const brands = await Brand.find({ status: true }, {})
	const colors = await Color.find({ status: true }, {})
	res.render('admin-pages/adminAddProductPage',
		{
			message: req.flash('message'),
			categories, sizes, products, colors, brands
		})
}

const adminAddProduct_post = async (req, res) => {
	const formData = req.body
	const flashsale = formData.flashsale ? 'true' : 'false';
	const featured = formData.featured ? 'true' : 'false';
	const variants = formData.color.map((color, index) => ({
		color: new ObjectId(color),
		size: new ObjectId(formData.size[index]),
		quantity: parseInt(formData.quantity[index], 10) || 0,
	}));
	const productImages = req.files;
	const imageArrays = Object.values(productImages);
	// Extract all filenames from productImages
	const filenamesFromProductImages = Object.values(productImages).flatMap(fileArray =>
		fileArray.map(fileObject => fileObject.filename)
	);

	// Extract all filenames from imageArrays
	const filenamesFromImageArrays = imageArrays.flatMap(innerArray =>
		innerArray.map(fileObject => fileObject.filename)
	);

	// Combine all filenames into a single array
	const allFilenames = [...filenamesFromProductImages, ...filenamesFromImageArrays];

	// Check for an existing product with the same title and category
	const existingProduct = await Product
		.findOne({ title: formData.title }, {});
	if (existingProduct) {
		req.flash('message', 'This product name is already in use!')
		return res.redirect('/admin-add-product');
	}
	const newProduct = await Product.create({
		title: formData.title,
		categoryName: new ObjectId(formData.category),
		brandName: new ObjectId(formData.brand),
		description: formData.description,
		mrp: formData.mrp,
		images: filenamesFromProductImages,
		variants: variants,
		flashsale: flashsale,
		featured: featured,
	})
	req.flash('message', `New product ${formData.title} added successfully`)
	return res.redirect('/admin-product-management');
};

const adminAddProductCheck_get = async (req, res) => {
	const productTitle = req.body.text;
	let searchResult = await Product.find({ title: { $in: [productTitle] } });
	if (searchResult.length === 0) {
		res.json({ status: true, message: 'Available' });
	} else {
		res.json({ status: false, message: 'Not Available' });
	}
};

const adminEditProduct_get = async (req, res) => {
	const id = req.params.id;
	const editProduct = await Product.findOne({ _id: id });
	const categories = await Category.find({ status: true }, {})
	const sizes = await Size.find({ status: true }, {})
	const colors = await Color.find({ status: true }, {})
	const brands = await Brand.find({ status: true }, {})
	if (!editProduct) {
		req.flash('message', 'Something went wrong, try again')
		return res.status(404).redirect(`/admin-edit-product/${id}`)
	}
	res.render('admin-pages/adminEditProductPage',
		{
			editProduct,
			categories, sizes, colors, brands,
			message: req.flash('message')
		}
	)
}

const adminEditProduct_post = async (req, res) => {
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).render('admin-pages/404', { title: '404 Error' })
	};
	const formData = req.body
	const flashsale = formData.flashsale ? 'true' : 'false';
	const featured = formData.featured ? 'true' : 'false';

	const existingProduct = await Product.findById(id);

	if (!existingProduct) {
		return res.status(404).send("Product not found");
	}
	// Map the new variants
	const newVariants = formData.color.map((color, index) => ({
		color: new ObjectId(color),
		size: new ObjectId(formData.size[index]),
		quantity: parseInt(formData.quantity[index], 10) || 0,
	}));
	const combinedVariants = newVariants.reduce((acc, variant) => {
		const existingIndex = acc.findIndex(
			(v) => v.color.toString() === variant.color.toString() && v.size.toString() === variant.size.toString()
		);

		if (existingIndex !== -1) {
			acc[existingIndex].quantity += variant.quantity;
		} else {
			acc.push(variant);
		}
		return acc;
	}, []);

	const existingImages = existingProduct.images;
	const updatedImages = [];

	for (let i = 1; i <= 4; i++) {
		const existingImage = existingImages[i - 1];
		const newImage = req.files[`newProductImage${i}`];
		const image = newImage ? newImage[0].filename : existingImage;

		updatedImages.push(image);
	}

	const result = await Product.updateOne(
		{ _id: id },
		{
			$set: {
				title: formData.title,
				brandName: formData.brand,
				categoryName: formData.category,
				description: formData.description,
				mrp: formData.mrp,
				images: updatedImages,
				variants: combinedVariants,
				flashsale: flashsale,
				featured: featured,
			},
		}
	);

	if (result.nModified === 0) {
		req.flash('message', 'Something went wrong, please try again')
		return res.status(404).redirect(`/admin-edit-product/${id}`);
	}
	req.flash('message', `Product ${formData.title} editing successfull`)
	res.redirect('/admin-product-management');
}

const adminEnableProduct_post = async (req, res) => {
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).render('admin-pages/404', { title: '404 Error' })
	};
	const updateStatus = await Product.updateOne({ _id: id }, { $set: { status: true } });
	console.log(updateStatus)
	req.flash('message', `Enabled successfully`)
	return res.redirect('/admin-product-management');
}

const adminDisableProduct_post = async (req, res) => {
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).render('admin-pages/404', { title: '404 Error' })
	};
	const updateStatus = await Product.updateOne({ _id: id }, { $set: { status: false } });
	req.flash('message', `Disabled successfully`)
	return res.redirect('/admin-product-management');
}

module.exports = {
	adminProductManagement,
	adminAddProduct_get,
	adminAddProduct_post,
	adminAddProductCheck_get,
	adminEditProduct_get,
	adminEditProduct_post,
	adminEnableProduct_post,
	adminDisableProduct_post
}