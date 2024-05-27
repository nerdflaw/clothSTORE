const express = require('express')
const mongoose = require('mongoose')
const Color = require('../../models/color')
const Brand = require('../../models/brand')
const Size = require('../../models/size')
const Product = require('../../models/product')
const Segment = require('../../models/segments')
const Category = require('../../models/category')
const flash = require('connect-flash');


const adminCriteriaCheck_get = async (req, res) => {
	const message = `This color ${req.query.value} already exists!`
	if (req.query.criteria === 'color') {
		const existingColor = await Color.findOne({ color: req.query.value });
		if (existingColor) {
			res.json({ status: false, message: message })
		} else {
			res.json({ status: true, message: 'Available' })
		}
	} else if (req.query.criteria === 'title') {
		const existingColor = await Product.findOne({ title: req.query.value });
		if (existingColor) {
			res.json({ status: false, message: message })
		} else {
			res.json({ status: true, message: 'Available' })
		}
	} else if (req.query.criteria === 'brand') {
		const existingColor = await Brand.findOne({ brand: req.query.value });
		if (existingColor) {
			res.json({ status: false, message: message })
		} else {
			res.json({ status: true, message: 'Available' })
		}
	} else if (req.query.criteria === 'segment') {
		const existingColor = await Segment.findOne({ segment: req.query.value });
		if (existingColor) {
			res.json({ status: false, message: message })
		} else {
			res.json({ status: true, message: 'Available' })
		}
	} else if (req.query.criteria === 'size') {
		const existingColor = await Size.findOne({ size: req.query.value });
		if (existingColor) {
			res.json({ status: false, message: message })
		} else {
			res.json({ status: true, message: 'Available' })
		}
	} else if (req.query.criteria === 'category') {
		const existingColor = await Category.findOne({ category: req.query.value });
		if (existingColor) {
			res.json({ status: false, message: message })
		} else {
			res.json({ status: true, message: 'Available' })
		}
	}
}

module.exports = {
	adminCriteriaCheck_get
}