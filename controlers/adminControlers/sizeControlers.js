const express = require('express')
const mongoose = require('mongoose')
const Size = require('../../models/size')
const flash = require('connect-flash')

// adminSizeManagement
// adminAddSize_get, adminAddSize_post
// adminDeleteSize
// adminEditSize_get, adminEditSize_post
// adminEnableSize_post, adminDisableSize_post

const adminSizeManagement = async (req, res) => {
	const i = 0
	const sizeDetails = await Size.find()
	return res.render('admin-pages/adminSizeManagementPage',
		{
			sizeDetails,
			i,
			message: req.flash('message'),
			item: req.query.item
		})
}

const adminAddSize_get = async (req, res) => {
	const sizes = await Size.find()
	res.render('admin-pages/adminAddSizePage',
		{
			message: req.flash('message'),
			sizes
		})
}

const adminAddSize_post = async (req, res) => {
	const { size } = req.body;
	const existingSize = await Size.findOne({ size: size });
	if (existingSize) {
		req.flash('message', `This size ${size} already exists!`)
		res.redirect('/admin-add-size');
	} else {
		const newSize = await Size.create({
			size: size,
		});
		req.flash('message', `New size ${size} added successfully`)
		res.redirect('/admin-size-management');
	}
}

const adminDeleteSize = async (req, res) => {
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).render('admin-pages/404', { title: '404 Error' })
	};
	const findbyId = await Size.find({ _id: id })
	const deleted = await Size.deleteOne({ _id: id });
	req.flash('message', `size ${findbyId[0]?.size} deletion successfull)`)
	res.redirect('/admin-size-management');
}

const adminEditSize_get = async (req, res) => {
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).render('admin-pages/404', { title: '404 Error' })
	};
	const editSize = await Size.findOne({ _id: id });
	if (!editSize) {
		req.flash('message', 'Something went wrong');
		return res.status(404).redirect(`admin-edit-size/${Id}`);
	}
	res.render('admin-pages/adminEditSizePage',
		{
			editSize,
			message: req.flash('message')
		}
	);
}

const adminEditSize_post = async (req, res) => {
	const { size } = req.body;
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).render('admin-pages/404', { title: '404 Error' })
	};
	const existingSize = await Size.find({ size: size });
	if (existingSize.length > 0) {
		req.flash('message', `This size ${size} already exists!`);
		return res.redirect(`/admin-edit-size/${id}`);
	}
	const result = await Size.updateOne(
		{ _id: id },
		{
			$set: {
				size: size
			},
		}
	);

	if (result.nModified === 0) {
		req.flash('message', `Something went wrong`);
		return res.redirect(`/admin-edit-size/${id}`);
	}
	req.flash('message', `Size ${size} editing successful`);
	res.redirect(`/admin-size-management`);
};

const adminEnableSize_post = async (req, res) => {
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).render('admin-pages/404', { title: '404 Error' })
	};
	const updateStatus = await Size.updateOne({ _id: id }, { $set: { status: true } });
	return res.redirect('/admin-size-management');
}

const adminDisableSize_post = async (req, res) => {
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).render('admin-pages/404', { title: '404 Error' })
	};
	const updateStatus = await Size.updateOne({ _id: id }, { $set: { status: false } });
	return res.redirect('/admin-size-management');
}


module.exports = {
	adminSizeManagement,
	adminAddSize_get,
	adminAddSize_post,
	adminDeleteSize,
	adminEditSize_get,
	adminEditSize_post,
	adminEnableSize_post,
	adminDisableSize_post
}