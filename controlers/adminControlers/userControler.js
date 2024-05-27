const express = require('express')
const mongoose = require('mongoose')
const users = require('../../models/models');

// adminUserControler
// adminBlockUserControler, adminUnblockUserControler

const adminUserControler = async (req, res) => {
	const i = 0
	const getUserDetails = await users.find()
	return res.render('admin-pages/adminUserManagementPage',
		{
			getUserDetails,
			i
		});
}

const adminBlockUserControler = async (req, res) => {
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).render('admin-pages/404', { title: '404 Error' })
	};
	const updateStatus = await users.updateOne({ _id: id }, { $set: { status: false } });
	return res.redirect('/admin-user-management');
}

const adminUnblockUserControler = async (req, res) => {
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).render('admin-pages/404', { title: '404 Error' })
	};
	const updateStatus = await users.updateOne({ _id: id }, { $set: { status: true } });
	return res.redirect('/admin-user-management');
}

module.exports = {
	adminUserControler,
	adminBlockUserControler,
	adminUnblockUserControler
}