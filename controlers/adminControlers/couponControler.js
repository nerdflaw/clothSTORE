const express = require('express')
const mongoose = require('mongoose')
const Segment = require('../../models/segments')
const Brand = require('../../models/brand')
const Category = require('../../models/category')
const Product = require('../../models/product')
const Coupon = require('../../models/coupon')
const generateUniqueCouponCode = require('../../helpers/functions/couponCodeGenerator')

// adminCouponManagement,
// adminAddCoupon_get,
// adminAddCoupon_post,
// adminDeleteCoupon,
// adminEditCoupon_get,
// adminEditCoupon_post,
// adminEnableCoupon_post,
// adminDisableCoupon_post,

const adminCouponManagement = async (req, res) => {
	const i = 0
	const couponDetails = await Coupon.find()
	return res.render('admin-pages/adminCouponManagementPage',
		{
			couponDetails,
			i,
			message: req.flash('message'),
		})
}

const adminAddCoupon_get = async (req, res) => {
	const coupons = await Coupon.find()
	res.render('admin-pages/adminAddCouponPage',
		{
			message: req.flash('message'), coupons
		})
}

const adminAddCoupon_post = async (req, res) => {
	const couponCode = generateUniqueCouponCode.generateUniqueCouponCode(20)
	const { coupon, couponDiscount } = req.body;
	const existingCoupon = await Coupon.findOne({ coupon: coupon });
	if (existingCoupon) {
		req.flash('message', `Coupon ${coupon} already exists!`);
		return res.redirect('/admin-add-coupon');
	} else {
		const newCoupon = await Coupon.create({
			coupon: coupon,
			couponCode: couponCode,
			couponValue: couponDiscount,
		});
		req.flash('message', `New coupon ${coupon} added successfully`);
		return res.redirect('/admin-coupon-management');
	}
}

const adminEditCoupon_get = async (req, res) => {
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(400).render('admin-pages/404.ejs');
	}
	const editCoupon = await Coupon.findOne({ _id: id });
	if (!editCoupon) {
		req.flash('message', 'Somthing went wrong')
		return res.status(404).redirect(`/admin-edit-coupon/${id}`);
	}
	res.render('admin-pages/adminEditCouponPage',
		{
			editCoupon,
			message: req.flash('message')
		}
	);
}

const adminEditCoupon_post = async (req, res) => {
	const { coupon, couponCode, couponDiscount } = req.body;
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		req.flash('message', 'Something went wrong, try agin')
		return res.status(400).render('admin-pages/404.ejs');
	}

	const existingCoupon = await Coupon.find({ coupon: coupon });
	if (existingCoupon.length > 0) {
		req.flash('message', `Coupon ${coupon} already exists!`)
		return res.redirect(`/admin-edit-coupon/${id}`);
	}

	const result = await Coupon.updateOne(
		{ _id: id },
		{
			$set: {
				coupon: coupon,
				couponCode: couponCode,
				couponValue: couponDiscount,
			},
		}
	);

	if (result.nModified === 0) {
		req.flash('message', 'Something went wrong, try agin')
		return res.status(404).redirect(`/admin-edit-coupon`);
	}
	req.flash('message', `${coupon} editing successfull`)
	res.redirect('/admin-coupon-management');
};

const adminEnableCoupon_post = async (req, res) => {
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		req.flash('message', 'Something went wrong, try agin')
		return res.status(400).redirect(`/admin-coupon-management`);
	}
	const updateStatus = await Coupon.updateOne({ _id: id }, { $set: { status: true } });
	const couponName = await Coupon.find({ _id: id });
	req.flash('message', `Coupon ${couponName[0].coupon} enabled successfully`)
	return res.redirect('/admin-coupon-management');
}

const adminDisableCoupon_post = async (req, res) => {
	const id = req.params.id;
	if (!mongoose.Types.ObjectId.isValid(id)) {
		req.flash('message', 'Something went wrong, try agin')
		return res.status(400).redirect(`/admin-coupon-management`);
	}
	const updateStatus = await Coupon.updateOne({ _id: id }, { $set: { status: false } });
	const couponName = await Coupon.find({ _id: id });
	req.flash('message', `Coupon ${couponName[0].coupon} disabled successfully`)
	return res.redirect('/admin-coupon-management');
}
module.exports = {
	adminCouponManagement,
	adminAddCoupon_get,
	adminAddCoupon_post,
	adminEditCoupon_get,
	adminEditCoupon_post,
	adminEnableCoupon_post,
	adminDisableCoupon_post,
}