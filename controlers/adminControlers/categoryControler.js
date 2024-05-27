const express = require('express')
const mongoose = require('mongoose')
const Category = require('../../models/category')

// adminCategoryManagement
// adminAddCategory_get, adminAddCategory_post
// adminDeleteCategory
// adminEditCategory_get, adminEditCategory_post
// adminEnableCategory_post, adminDisableCategory_post

const adminCategoryManagement = async (req, res) => {
	const i = 0
	const categoryDetails = await Category.find()
	return res.render('admin-pages/adminCategoryManagementPage',
		{
			categoryDetails,
			i,
			message: req.query.message,
			item: req.query.item,
		})
}

const adminAddCategory_get = async (req, res) => {
	const categories = await Category.find()
	res.render('admin-pages/adminAddCategoryPage',
		{
			message: req.query.message,
			categories
		})
}

const adminAddCategory_post = async (req, res) => {
	const { category } = req.body;
	const existingCategory = await Category.findOne({ category: category });
	if (existingCategory) {
		req.flash('message', `This category ${category} already exists!`)
		res.redirect('/admin-add-category?');
	} else {
		const newCategory = await Category.create({
			category: category,
		});
		req.flash('message', `New category ${category} added successfully`)
		res.redirect('/admin-category-management');
	}
}

const adminDeleteCategory = async (req, res) => {
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).render('admin-pages/404');
	}
	const findbyId = await Category.find({ _id: id })
	const category = findbyId[0];
	const deletedCategory = category.category;
	const deleted = await Category.deleteOne({ _id: id });
	req.flash('message', `Category ${category} deleted successfully`)
	res.redirect('/admin-category-management')
}

const adminEditCategory_get = async (req, res) => {
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).render('admin-pages/404');
	}
	const editCategory = await Category.findOne({ _id: id });
	if (!editCategory) {
		req.flash('message', 'Something went wrong, try again')
		return res.status(404).redirect(`/admin-edit-category/${id}`)
	}
	res.render('admin-pages/adminEditCategoryPage',
		{
			editCategory,
			message: req.query.message
		}
	);
}

const adminEditCategory_post = async (req, res) => {
	const { category } = req.body;
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).render('admin-pages/404');
	}
	const existingCategory = await Category.find({ category: category });
	if (existingCategory.length > 0) {
		req.flash('message', `This category ${category} already exists!`)
		return res.redirect(`/admin-edit-category/${id}`);
	}
	const result = await Category.updateOne(
		{ _id: id },
		{
			$set: {
				category: category,
			},
		}
	);
	if (result.nModified === 0) {
		req.flash('message', 'Something went wrong, try again')
		return res.status(404).redirect(`/admin-edit-category/${id}`)
	}
	req.flash('message', 'Category editing successfull')
	res.redirect(`/admin-category-management`);
};

const adminEnableCategory_post = async (req, res) => {
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).render('admin-pages/404');
	}
	const updateStatus = await Category.updateOne({ _id: id }, { $set: { status: true } });
	return res.redirect('/admin-category-management');
}

const adminDisableCategory_post = async (req, res) => {
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).render('admin-pages/404');
	}
	const updateStatus = await Category.updateOne({ _id: id }, { $set: { status: false } });
	return res.redirect('/admin-category-management');
}

module.exports = {
	adminCategoryManagement,
	adminAddCategory_get,
	adminAddCategory_post,
	adminDeleteCategory,
	adminEditCategory_get,
	adminEditCategory_post,
	adminEnableCategory_post,
	adminDisableCategory_post
}