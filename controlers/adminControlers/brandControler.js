const express = require('express')
const mongoose = require('mongoose')
const Brand = require('../../models/brand')
const flash = require('connect-flash');

// adminCategoryManagement
// adminAddCategory_get, adminAddCategory_post
// adminDeleteCategory
// adminEditCategory_get, adminEditCategory_post
// adminEnableCategory_post, adminDisableCategory_post

const adminBrandManagement = async (req, res) => {
	const i = 0
	const brandDetails = await Brand.find()
	return res.render('admin-pages/adminBrandManagementPage',
		{
			brandDetails,
			i,
			message: req.flash('message'),
			item: req.query.item,
		})
}

const adminAddBrand_get = async (req, res) => {
	const brands = await Brand.find()
	res.render('admin-pages/adminAddBrandPage',
		{
			message: req.flash('message'),
			brands
		})
}

const adminAddBrand_post = async (req, res) => {
	const { brand } = req.body;
	const existingBrand = await Brand.findOne({ brand: brand });
	if (existingBrand) {
		req.flash('message', 'This brand already exists!')
		res.redirect('/admin-add-brand');
	} else {
		// Store the new category in the database
		const newBrand = await Brand.create({
			brand: brand,
		});
		req.flash('message', 'New brand added successfully')
		res.redirect('/admin-brand-management');
	}
}

const adminDeleteBrand = async (req, res) => {
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).render('admin-pages/404');
	}
	const findbyId = await Brand.find({ _id: id })
	const brand = findbyId[0];
	const deletedBrand = brand.brand;
	const deleted = await Brand.deleteOne({ _id: id });
	res.redirect('/admin-brand-management?message=Brand deletion successfull&item=' + encodeURIComponent(deletedBrand));
}

const adminEditBrand_get = async (req, res) => {
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).render('admin-pages/404');
	}
	const editBrand = await Brand.findOne({ _id: id });
	if (!editBrand) {
		req.flash('message', 'Something went wrong, try agin')
		return res.status(404).redirect(`/admin-edit-brand/${id}`);
	}
	res.render('admin-pages/adminEditBrandPage',
		{
			editBrand,
			message: req.flash('message')
		}
	);
}

const adminEditBrand_post = async (req, res) => {
	const { brand } = req.body;
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).render('admin-pages/404');
	}
	const existingBrand = await Brand.find({ brand: brand });
	if (existingBrand.length > 0) {
		req.flash('message', 'This brand already exists!')
		return res.redirect(`/admin-edit-brand/${id}`);
	}
	const result = await Brand.updateOne(
		{ _id: id },
		{
			$set: {
				brand: brand,
			},
		}
	);
	if (result.nModified === 0) {
		req.flash('message', 'Something went wrong, try agin')
		return res.redirect(`/admin-edit-brand/${id}`);
	}
	res.flash('message', 'Brand editing successful')
	res.redirect(`/admin-brand-management`);
};

const adminEnableBrand_post = async (req, res) => {
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).render('admin-pages/404');
	}
	const updateStatus = await Brand.updateOne({ _id: id }, { $set: { status: true } });
	return res.redirect('/admin-brand-management');
}

const adminDisableBrand_post = async (req, res) => {
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).render('admin-pages/404');
	}
	const updateStatus = await Brand.updateOne({ _id: id }, { $set: { status: false } });
	return res.redirect('/admin-brand-management');
}


module.exports = {
	adminBrandManagement,
	adminAddBrand_get,
	adminAddBrand_post,
	adminDeleteBrand,
	adminEditBrand_get,
	adminEditBrand_post,
	adminEnableBrand_post,
	adminDisableBrand_post
}