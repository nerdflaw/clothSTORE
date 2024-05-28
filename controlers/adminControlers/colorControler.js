const express = require('express')
const mongoose = require('mongoose')
const Color = require('../../models/color')
const flash = require('connect-flash');

const adminColorManagement = async (req, res) => {
	const i = 0
	const colorDetails = await Color.find()
	return res.render('admin-pages/adminColorManagementPage',
		{
			colorDetails,
			i,
			message: req.flash('message'),
			item: req.query.item
		})
}

const adminAddColor_get = async (req, res) => {
	const colors = await Color.find()
	res.render('admin-pages/adminAddColorPage',
		{
			message: req.flash('message'),
			colors
		})
}

const adminAddColor_post = async (req, res) => {
	const { color } = req.body;
	const existingColor = await Color.findOne({ color: color });
	if (existingColor) {
		req.flash('message', `This ${color} already exists!`)
		res.redirect('/admin-add-color');
	} else {
		const newColor = await Color.create({
			color: color,
		});
		req.flash('message', `New color ${color} added successfully`);
		res.redirect('/admin-color-management');
	}
}

const adminEditColor_get = async (req, res) => {
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).render('admin-pages/404.ejs');
	}
	const editColor = await Color.findOne({ _id: id });
	if (!editColor) {
		req.flash('message', 'Somthing went wrong')
		return res.status(404).redirect(`/admin-edit-color/${id}`);
	}
	res.render('admin-pages/adminEditColorPage.ejs',
		{
			editColor,
			message: req.flash('message')
		}
	);
}

const adminEditColor_post = async (req, res) => {
	const { color } = req.body;
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).render('admin-pages/404.ejs');
	}
	const existingColor = await Color.find({ color: color });
	if (existingColor.length > 0) {
		req.flash('message', `This color ${color} already exists!`);
		return res.redirect(`/admin-edit-color/${id}`);
	}
	const result = await Color.updateOne(
		{ _id: id },
		{
			$set: {
				color: color,
			},
		}
	);
	if (result.nModified === 0) {
		req.flash('message', 'Somthing went wrong')
		return res.status(404).redirect(`/admin-edit-color/${id}`);
	}
	req.flash('message', `Color ${color} editing successfull`);
	res.redirect(`/admin-color-management`);
}

const adminEnableColor_post = async (req, res) => {
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).render('admin-pages/404.ejs');
	}
	const updateStatus = await Color.updateOne({ _id: id }, { $set: { status: true } });
	return res.redirect('/admin-color-management');
}

const adminDisableColor_post = async (req, res) => {
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).render('admin-pages/404.ejs');
	}
	const updateStatus = await Color.updateOne({ _id: id }, { $set: { status: false } });
	return res.redirect('/admin-color-management');
}

module.exports = {
	adminColorManagement,
	adminAddColor_get,
	adminAddColor_post,
	adminEditColor_get,
	adminEditColor_post,
	adminEnableColor_post,
	adminDisableColor_post
}