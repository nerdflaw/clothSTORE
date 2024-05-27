const express = require('express');
const { ObjectId } = require('mongodb');
const Order = require('../../models/order');
const fs = require('fs');
const moment = require('moment');
const puppeteer = require('puppeteer');
const path = require('path');
const generatePdf = require('../../helpers/functions/generatePdf')
const generateExcel = require('../../helpers/functions/generateExcel')


// adminDashboard,
// salesReport_get,
// showChartOnDashboard_get

const adminDashboard = async (req, res) => {
	const sales = await Order.aggregate([
		{ $unwind: "$order" },
		{
		  $project: {
			productId: '$order.productId',
			couponId: { $ifNull: ['$order.couponId', null] },
			quantity: '$order.quantity',
			createdAt: "$createdAt",
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
		{ $unwind: "$productData" },
		{ $unwind: { path: "$couponData", preserveNullAndEmptyArrays: true } },
		{
		  $addFields: {
			mrp: '$productData.mrp',
			discount: '$productData.discount',
			couponValue: { $ifNull: ['$couponData.couponValue', 0] },
			couponCode: { $ifNull: ['$couponData.couponCode', null] },
			couponName: { $ifNull: ['$couponData.coupon', null] },
		  }
		},
		{
		  $project: {
			taxRate: 0.18,
			year: { $year: "$createdAt" },
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
		  }
		},
		{
		  $group: {
			_id: { year: "$year" },
			productDetails: {
			  $push: {
				totalDiscount: "$totalDiscount",
				totalPrice: "$totalPrice",
				_id: "$_id"
			  }
			},
			ordersCount: { $sum: 1 },
			totalOrderPrice: { $sum: "$totalPrice" },
			totalDiscount: { $sum: "$totalDiscount" }
		  }
		},
		{ $sort: { "_id.year": -1 } }
	  ])
	const mostOrderedProduct = await Order.aggregate([
		{ $unwind: "$order" },
		{ $group: { _id: "$order.productId", mostOrderedCount: { $sum: "$order.quantity" } } },
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
			$project: {
				_id: 0,
				mostOrderedCount: 1,
				product: "$productDetails.title"
			}
		},
		{ $sort: { mostOrderedCount: -1 } }
	]);
	const mostOrderedBrand = await Order.aggregate([
		{ $unwind: "$order" },
		{ $group: { _id: "$order.brandId", mostOrderedCount: { $sum: "$order.quantity" } } },
		{
			$lookup: {
				from: "brands",
				localField: "_id",
				foreignField: "_id",
				as: "brandDetails"
			}
		},
		{ $unwind: "$brandDetails" },
		{
			$project: {
				_id: 0,
				mostOrderedCount: 1,
				brand: "$brandDetails.brand"
			}
		},
		{ $sort: { mostOrderedCount: -1 } }
	]);
	const mostOrderedCategory = await Order.aggregate([
		{ $unwind: "$order" },
		{ $group: { _id: "$order.categoryId", mostOrderedCount: { $sum: "$order.quantity" } } },
		{
			$lookup: {
				from: "categories",
				localField: "_id",
				foreignField: "_id",
				as: "categoryDetails"
			}
		},
		{ $unwind: "$categoryDetails" },
		{
			$project: {
				_id: 0,
				mostOrderedCount: 1,
				category: "$categoryDetails.category"
			}
		},
		{ $sort: { mostOrderedCount: -1 } }
	]);
	return res.render('admin-pages/adminDashboardPage',
		{ sales, mostOrderedProduct, mostOrderedBrand, mostOrderedCategory }
	);
}
const salesReport_get = async (req, res) => {
	const { customRange, endDate, startDate } = req.query;
	if (customRange === 'custom') {
		let currentPage = Number(req.query.page) || 1;
		let limit = Number(req.query.limit) || 5;
		let skip = (currentPage - 1) * limit;
		const order = await Order.aggregate([
			{
			  $match: {
				$or: [
				  {
					$expr: {
					  $and: [
						{ $gte: ["$createdAt", new Date(startDate)] },
						{ $lte: ["$createdAt", new Date(endDate)] }
					  ]
					}
				  },
				  {
					$expr: {
					  $eq: [
						{ $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
						{ $dateToString: { format: "%Y-%m-%d", date: new Date(startDate) } }
					  ]
					}
				  },
				  {
					$expr: {
					  $eq: [
						{ $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
						{ $dateToString: { format: "%Y-%m-%d", date: new Date(endDate) } }
					  ]
					}
				  }
				]
			  }
			},
			{ $unwind: "$order" },
			{
			  $addFields: {
				productId: '$order.productId',
				couponId: { $ifNull: ['$order.couponId', null] },
				quantity: '$order.quantity',
				createdAt: "$createdAt",
				orderId: "$_id",
				userId: "$userId",
				paymentMode: "$paymentMode",
				orderStatus: 'pending',
				createdAt: "$createdAt",
				updatedAt: "$updatedAt",
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
				from: "orders",
				localField: "orderId",
				foreignField: "_id",
				as: "orderDetails"
			  }
			},
			{ $unwind: "$productData" },
			{ $unwind: { path: "$couponData", preserveNullAndEmptyArrays: true } },
			{
			  $addFields: {
				mrp: '$productData.mrp',
				discount: '$productData.discount',
				product: '$productData.title',
				couponValue: { $ifNull: ['$couponData.couponValue', 0] },
				couponCode: { $ifNull: ['$couponData.couponCode', null] },
				couponName: { $ifNull: ['$couponData.coupon', null] },
				taxRate: 0.18,
			  }
			},
			{
			  $project: {
				productDetailsReview: 1,
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
				discount: 1,
				mrp: 1,
				quantity: 1,
				couponName: 1,
				couponCode: 1,
				couponValue: 1,
				orderId: 1,
				userId: 1,
				paymentMode: 1,
				orderStatus: 1,
				createdAt: 1,
				updatedAt: 1,
				productDetails: 1,
				orderDetails: 1,
				address: 1,
				order: 1,
				taxRate : 1,
				product: 1
			  }
			},
		  ])
		const totalPages = Math.ceil(order?.length / limit);
		const paginatedOrder = order?.slice(skip, skip + limit);
		return res.render('admin-pages/adminDashboardCustomPage', {
			paginatedOrder,
			startDate, endDate, customRange,
			currentPage, limit, totalPages
		});
	} else if (customRange === 'monthly') {
		let currentPage = Number(req.query.page) || 1;
		let limit = Number(req.query.limit) || 5;
		let skip = (currentPage - 1) * limit;
		const order = await Order.aggregate([
			{ $unwind: "$order" },
			{
			  $addFields: {
				productId: '$order.productId',
				couponId: { $ifNull: ['$order.couponId', null] },
				quantity: '$order.quantity',
				createdAt: "$createdAt",
				orderId: "$_id",
				userId: "$userId",
				paymentMode: "$paymentMode",
				orderStatus: 'pending',
				createdAt: "$createdAt",
				updatedAt: "$updatedAt",
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
				from: "orders",
				localField: "orderId",
				foreignField: "_id",
				as: "orderDetails"
			  }
			},
			{ $unwind: "$productData" },
			{ $unwind: { path: "$couponData", preserveNullAndEmptyArrays: true } },
			{
			  $addFields: {
				mrp: '$productData.mrp',
				discount: '$productData.discount',
				product: '$productData.title',
				couponValue: { $ifNull: ['$couponData.couponValue', 0] },
				couponCode: { $ifNull: ['$couponData.couponCode', null] },
				couponName: { $ifNull: ['$couponData.coupon', null] },
			  }
			},
			{
				$addFields: {
					month: { $month: "$createdAt" },
					year: { $year: "$createdAt" },
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
				}
			},
			{
				$group: {
					_id: { month: "$month", year: "$year" },
					productDetails: {
						$push: {
							product: "$product",
							mrp: "$mrp",
							discount: "$discount",
							couponValue: '$couponValue',
							quantity: "$quantity",
							taxRate : "$taxRate",
							individualTotal: "$individualTotal",
							mrpWithoutTax: "$mrpWithoutTax",
							firstDiscountAmount: "$firstDiscountAmount",
							AmountAfterfirstDiscount: "$AmountAfterfirstDiscount",
							seccondDiscountAmount: "$seccondDiscountAmount",
							AmountAfterSecondDiscount: "$AmountAfterSecondDiscount",
							gst: "$gst",
							sgst: "$sgst",
							cgst: "$cgst",
							totalDiscount: "$totalDiscount",
							totalDiscountPercentage: "$totalDiscountPercentage",
							totalPrice: "$totalPrice",
							_id: "$_id"
						}
					}
				}
			},
			{ $sort: { "_id.year": -1, "_id.month": -1 } }
		])
		const totalPages = Math.ceil(order[0]?.productDetails?.length / limit);
		const paginatedOrder = order[0]?.productDetails?.slice(skip, skip + limit);
		return res.render('admin-pages/adminDashboardMonthlyPage', {
			order, paginatedOrder, startDate, endDate, customRange,
			currentPage, limit, totalPages
		});
	} else if (customRange === 'weekly') {
		let currentPage = Number(req.query.page) || 1;
		let limit = Number(req.query.limit) || 1;
		let skip = (currentPage - 1) * limit;
		const order = await Order.aggregate([
			{ $unwind: "$order" },
			{
			  $addFields: {
				productId: '$order.productId',
				couponId: { $ifNull: ['$order.couponId', null] },
				quantity: '$order.quantity',
				createdAt: "$createdAt",
				orderId: "$_id",
				userId: "$userId",
				paymentMode: "$paymentMode",
				orderStatus: 'pending',
				createdAt: "$createdAt",
				updatedAt: "$updatedAt",
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
				from: "orders",
				localField: "orderId",
				foreignField: "_id",
				as: "orderDetails"
			  }
			},
			{ $unwind: "$productData" },
			{ $unwind: { path: "$couponData", preserveNullAndEmptyArrays: true } },
			{
			  $addFields: {
				mrp: '$productData.mrp',
				discount: '$productData.discount',
				product: '$productData.title',
				couponValue: { $ifNull: ['$couponData.couponValue', 0] },
				couponCode: { $ifNull: ['$couponData.couponCode', null] },
				couponName: { $ifNull: ['$couponData.coupon', null] },
			  }
			},
			{
				$addFields: {
					week: { $isoWeek: "$createdAt" },
					year: { $year: "$createdAt" },
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
				}
			},
			{
				$group: {
					_id: { week: "$week", year: "$year" },
					productDetails: {
						$push: {
							product: "$product",
							mrp: "$mrp",
							discount: "$discount",
							couponValue: '$couponValue',
							quantity: "$quantity",
							taxRate : "$taxRate",
							individualTotal: "$individualTotal",
							mrpWithoutTax: "$mrpWithoutTax",
							firstDiscountAmount: "$firstDiscountAmount",
							AmountAfterfirstDiscount: "$AmountAfterfirstDiscount",
							seccondDiscountAmount: "$seccondDiscountAmount",
							AmountAfterSecondDiscount: "$AmountAfterSecondDiscount",
							gst: "$gst",
							sgst: "$sgst",
							cgst: "$cgst",
							totalDiscount: "$totalDiscount",
							totalDiscountPercentage: "$totalDiscountPercentage",
							totalPrice: "$totalPrice",
							_id: "$_id"
						}
					}
				}
			},
			{ $sort: { "_id.year": -1, "_id.week": -1 } }
		])
		const totalPages = Math.ceil(order?.length / limit);
		const paginatedOrder = order?.slice(skip, skip + limit);
		return res.render('admin-pages/adminDashboardWeeklyPage', {
			paginatedOrder, startDate, endDate, customRange,
			currentPage, limit, totalPages
		});
	} else if (customRange === 'daily') {
		let currentPage = Number(req.query.page) || 1;
		let limit = Number(req.query.limit) || 1;
		let skip = (currentPage - 1) * limit;
		const order = await Order.aggregate([
			{ $unwind: "$order" },
			{
			  $addFields: {
				productId: '$order.productId',
				couponId: { $ifNull: ['$order.couponId', null] },
				quantity: '$order.quantity',
				createdAt: "$createdAt",
				orderId: "$_id",
				userId: "$userId",
				paymentMode: "$paymentMode",
				orderStatus: 'pending',
				createdAt: "$createdAt",
				updatedAt: "$updatedAt",
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
				from: "orders",
				localField: "orderId",
				foreignField: "_id",
				as: "orderDetails"
			  }
			},
			{ $unwind: "$productData" },
			{ $unwind: { path: "$couponData", preserveNullAndEmptyArrays: true } },
			{
			  $addFields: {
				mrp: '$productData.mrp',
				discount: '$productData.discount',
				product: '$productData.title',
				couponValue: { $ifNull: ['$couponData.couponValue', 0] },
				couponCode: { $ifNull: ['$couponData.couponCode', null] },
				couponName: { $ifNull: ['$couponData.coupon', null] },
			  }
			},
			{
				$addFields: {
					day: { $dayOfMonth: "$createdAt" },
					month: { $month: "$createdAt" },
					year: { $year: "$createdAt" },
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
				}
			},
			{
				$group: {
					_id: { day: "$day", month: "$month", year: "$year" },
					productDetails: {
						$push: {
							product: "$product",
							mrp: "$mrp",
							discount: "$discount",
							couponValue: '$couponValue',
							quantity: "$quantity",
							taxRate : "$taxRate",
							individualTotal: "$individualTotal",
							mrpWithoutTax: "$mrpWithoutTax",
							firstDiscountAmount: "$firstDiscountAmount",
							AmountAfterfirstDiscount: "$AmountAfterfirstDiscount",
							seccondDiscountAmount: "$seccondDiscountAmount",
							AmountAfterSecondDiscount: "$AmountAfterSecondDiscount",
							gst: "$gst",
							sgst: "$sgst",
							cgst: "$cgst",
							totalDiscount: "$totalDiscount",
							totalDiscountPercentage: "$totalDiscountPercentage",
							totalPrice: "$totalPrice",
							_id: "$_id",
							createdAt: "$createdAt"
						}
					}
				}
			},
			{ $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 } }
		])
		const totalPages = Math.ceil(order?.length / limit);
		const paginatedOrder = order?.slice(skip, skip + limit);
		return res.render('admin-pages/adminDashboardDailyPage', {
			order, paginatedOrder, startDate, endDate, customRange,
			currentPage, limit, totalPages
		});

	} else if (customRange === 'yearly') {
		let currentPage = Number(req.query.page) || 1;
		let limit = Number(req.query.limit) || 5;
		let skip = (currentPage - 1) * limit;
		const order = await Order.aggregate([
			{ $unwind: "$order" },
			{
			  $addFields: {
				productId: '$order.productId',
				couponId: { $ifNull: ['$order.couponId', null] },
				quantity: '$order.quantity',
				createdAt: "$createdAt",
				orderId: "$_id",
				userId: "$userId",
				paymentMode: "$paymentMode",
				orderStatus: 'pending',
				createdAt: "$createdAt",
				updatedAt: "$updatedAt",
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
				from: "orders",
				localField: "orderId",
				foreignField: "_id",
				as: "orderDetails"
			  }
			},
			{ $unwind: "$productData" },
			{ $unwind: { path: "$couponData", preserveNullAndEmptyArrays: true } },
			{
			  $addFields: {
				mrp: '$productData.mrp',
				discount: '$productData.discount',
				product: '$productData.title',
				couponValue: { $ifNull: ['$couponData.couponValue', 0] },
				couponCode: { $ifNull: ['$couponData.couponCode', null] },
				couponName: { $ifNull: ['$couponData.coupon', null] },
			  }
			},
			{
				$addFields: {
					year: { $year: "$createdAt" },
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
				}
			},
			{
				$group: {
					_id: { year: "$year" },
					productDetails: {
						$push: {
							product: "$product",
							mrp: "$mrp",
							discount: "$discount",
							couponValue: '$couponValue',
							quantity: "$quantity",
							taxRate : "$taxRate",
							individualTotal: "$individualTotal",
							mrpWithoutTax: "$mrpWithoutTax",
							firstDiscountAmount: "$firstDiscountAmount",
							AmountAfterfirstDiscount: "$AmountAfterfirstDiscount",
							seccondDiscountAmount: "$seccondDiscountAmount",
							AmountAfterSecondDiscount: "$AmountAfterSecondDiscount",
							gst: "$gst",
							sgst: "$sgst",
							cgst: "$cgst",
							totalDiscount: "$totalDiscount",
							totalDiscountPercentage: "$totalDiscountPercentage",
							totalPrice: "$totalPrice",
							_id: "$_id"
						}
					}
				}
			},
			{ $sort: { "_id.year": -1 } },
		])
		const totalPages = Math.ceil(order[0]?.productDetails?.length / limit);
		const paginatedOrder = order[0]?.productDetails?.slice(skip, skip + limit);
		return res.render('admin-pages/adminDashboardYearlyPage', {
			order, paginatedOrder, startDate, endDate, customRange,
			currentPage, limit, totalPages
		});
	}
}
const adminSalesReportDownload_get = async (req, res) => {
	const { customRange, endDate, startDate } = req.query;
	if (customRange === 'custom') {
		let currentPage = Number(req.query.page) || 1;
		let limit = Number(req.query.limit) || 5;
		let skip = (currentPage - 1) * limit;
		const order = await Order.aggregate([
			{
			  $match: {
				$or: [
				  {
					$expr: {
					  $and: [
						{ $gte: ["$createdAt", new Date(startDate)] },
						{ $lte: ["$createdAt", new Date(endDate)] }
					  ]
					}
				  },
				  {
					$expr: {
					  $eq: [
						{ $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
						{ $dateToString: { format: "%Y-%m-%d", date: new Date(startDate) } }
					  ]
					}
				  },
				  {
					$expr: {
					  $eq: [
						{ $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
						{ $dateToString: { format: "%Y-%m-%d", date: new Date(endDate) } }
					  ]
					}
				  }
				]
			  }
			},
			{ $unwind: "$order" },
			{
			  $addFields: {
				productId: '$order.productId',
				couponId: { $ifNull: ['$order.couponId', null] },
				quantity: '$order.quantity',
				createdAt: "$createdAt",
				orderId: "$_id",
				userId: "$userId",
				paymentMode: "$paymentMode",
				orderStatus: 'pending',
				createdAt: "$createdAt",
				updatedAt: "$updatedAt",
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
				from: "orders",
				localField: "orderId",
				foreignField: "_id",
				as: "orderDetails"
			  }
			},
			{ $unwind: "$productData" },
			{ $unwind: { path: "$couponData", preserveNullAndEmptyArrays: true } },
			{
			  $addFields: {
				mrp: '$productData.mrp',
				discount: '$productData.discount',
				product: '$productData.title',
				couponValue: { $ifNull: ['$couponData.couponValue', 0] },
				couponCode: { $ifNull: ['$couponData.couponCode', null] },
				couponName: { $ifNull: ['$couponData.coupon', null] },
				taxRate: 0.18,
			  }
			},
			{
			  $project: {
				productDetailsReview: 1,
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
				discount: 1,
				mrp: 1,
				quantity: 1,
				couponName: 1,
				couponCode: 1,
				couponValue: 1,
				orderId: 1,
				userId: 1,
				paymentMode: 1,
				orderStatus: 1,
				createdAt: 1,
				updatedAt: 1,
				productDetails: 1,
				orderDetails: 1,
				address: 1,
				order: 1,
				taxRate : 1,
				product: 1
			  }
			},
		  ])
		const totalPages = Math.ceil(order?.length / limit);
		const paginatedOrder = order?.slice(skip, skip + limit);
		return res.render('admin-pages/adminDashboardCustomDownloadPage', {
			paginatedOrder,
			startDate, endDate, customRange,
			currentPage, limit, totalPages
		});
	} else if (customRange === 'monthly') {
		let currentPage = Number(req.query.page) || 1;
		let limit = Number(req.query.limit) || 5;
		let skip = (currentPage - 1) * limit;
		const order = await Order.aggregate([
			{ $unwind: "$order" },
			{
			  $addFields: {
				productId: '$order.productId',
				couponId: { $ifNull: ['$order.couponId', null] },
				quantity: '$order.quantity',
				createdAt: "$createdAt",
				orderId: "$_id",
				userId: "$userId",
				paymentMode: "$paymentMode",
				orderStatus: 'pending',
				createdAt: "$createdAt",
				updatedAt: "$updatedAt",
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
				from: "orders",
				localField: "orderId",
				foreignField: "_id",
				as: "orderDetails"
			  }
			},
			{ $unwind: "$productData" },
			{ $unwind: { path: "$couponData", preserveNullAndEmptyArrays: true } },
			{
			  $addFields: {
				mrp: '$productData.mrp',
				discount: '$productData.discount',
				product: '$productData.title',
				couponValue: { $ifNull: ['$couponData.couponValue', 0] },
				couponCode: { $ifNull: ['$couponData.couponCode', null] },
				couponName: { $ifNull: ['$couponData.coupon', null] },
			  }
			},
			{
				$addFields: {
					month: { $month: "$createdAt" },
					year: { $year: "$createdAt" },
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
				}
			},
			{
				$group: {
					_id: { month: "$month", year: "$year" },
					productDetails: {
						$push: {
							product: "$product",
							mrp: "$mrp",
							discount: "$discount",
							couponValue: '$couponValue',
							quantity: "$quantity",
							taxRate : "$taxRate",
							individualTotal: "$individualTotal",
							mrpWithoutTax: "$mrpWithoutTax",
							firstDiscountAmount: "$firstDiscountAmount",
							AmountAfterfirstDiscount: "$AmountAfterfirstDiscount",
							seccondDiscountAmount: "$seccondDiscountAmount",
							AmountAfterSecondDiscount: "$AmountAfterSecondDiscount",
							gst: "$gst",
							sgst: "$sgst",
							cgst: "$cgst",
							totalDiscount: "$totalDiscount",
							totalDiscountPercentage: "$totalDiscountPercentage",
							totalPrice: "$totalPrice",
							_id: "$_id"
						}
					}
				}
			},
			{ $sort: { "_id.year": -1, "_id.month": -1 } }
		])
		const totalPages = Math.ceil(order[0]?.productDetails?.length / limit);
		const paginatedOrder = order[0]?.productDetails?.slice(skip, skip + limit);
		return res.render('admin-pages/adminDashboardMonthlyDownloadPage', {
			order, paginatedOrder, startDate, endDate, customRange,
			currentPage, limit, totalPages
		});
	} else if (customRange === 'weekly') {
		let currentPage = Number(req.query.page) || 1;
		let limit = Number(req.query.limit) || 1;
		let skip = (currentPage - 1) * limit;
		const order = await Order.aggregate([
			{ $unwind: "$order" },
			{
			  $addFields: {
				productId: '$order.productId',
				couponId: { $ifNull: ['$order.couponId', null] },
				quantity: '$order.quantity',
				createdAt: "$createdAt",
				orderId: "$_id",
				userId: "$userId",
				paymentMode: "$paymentMode",
				orderStatus: 'pending',
				createdAt: "$createdAt",
				updatedAt: "$updatedAt",
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
				from: "orders",
				localField: "orderId",
				foreignField: "_id",
				as: "orderDetails"
			  }
			},
			{ $unwind: "$productData" },
			{ $unwind: { path: "$couponData", preserveNullAndEmptyArrays: true } },
			{
			  $addFields: {
				mrp: '$productData.mrp',
				discount: '$productData.discount',
				product: '$productData.title',
				couponValue: { $ifNull: ['$couponData.couponValue', 0] },
				couponCode: { $ifNull: ['$couponData.couponCode', null] },
				couponName: { $ifNull: ['$couponData.coupon', null] },
			  }
			},
			{
				$addFields: {
					week: { $isoWeek: "$createdAt" },
					year: { $year: "$createdAt" },
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
				}
			},
			{
				$group: {
					_id: { week: "$week", year: "$year" },
					productDetails: {
						$push: {
							product: "$product",
							mrp: "$mrp",
							discount: "$discount",
							couponValue: '$couponValue',
							quantity: "$quantity",
							taxRate : "$taxRate",
							individualTotal: "$individualTotal",
							mrpWithoutTax: "$mrpWithoutTax",
							firstDiscountAmount: "$firstDiscountAmount",
							AmountAfterfirstDiscount: "$AmountAfterfirstDiscount",
							seccondDiscountAmount: "$seccondDiscountAmount",
							AmountAfterSecondDiscount: "$AmountAfterSecondDiscount",
							gst: "$gst",
							sgst: "$sgst",
							cgst: "$cgst",
							totalDiscount: "$totalDiscount",
							totalDiscountPercentage: "$totalDiscountPercentage",
							totalPrice: "$totalPrice",
							_id: "$_id"
						}
					}
				}
			},
			{ $sort: { "_id.year": -1, "_id.week": -1 } }
		])
		const totalPages = Math.ceil(order?.length / limit);
		const paginatedOrder = order?.slice(skip, skip + limit);
		return res.render('admin-pages/adminDashboardWeeklyDownloadPage', {
			paginatedOrder, startDate, endDate, customRange,
			currentPage, limit, totalPages
		});
	} else if (customRange === 'daily') {
		let currentPage = Number(req.query.page) || 1;
		let limit = Number(req.query.limit) || 1;
		let skip = (currentPage - 1) * limit;
		const order = await Order.aggregate([
			{ $unwind: "$order" },
			{
			  $addFields: {
				productId: '$order.productId',
				couponId: { $ifNull: ['$order.couponId', null] },
				quantity: '$order.quantity',
				createdAt: "$createdAt",
				orderId: "$_id",
				userId: "$userId",
				paymentMode: "$paymentMode",
				orderStatus: 'pending',
				createdAt: "$createdAt",
				updatedAt: "$updatedAt",
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
				from: "orders",
				localField: "orderId",
				foreignField: "_id",
				as: "orderDetails"
			  }
			},
			{ $unwind: "$productData" },
			{ $unwind: { path: "$couponData", preserveNullAndEmptyArrays: true } },
			{
			  $addFields: {
				mrp: '$productData.mrp',
				discount: '$productData.discount',
				product: '$productData.title',
				couponValue: { $ifNull: ['$couponData.couponValue', 0] },
				couponCode: { $ifNull: ['$couponData.couponCode', null] },
				couponName: { $ifNull: ['$couponData.coupon', null] },
			  }
			},
			{
				$addFields: {
					day: { $dayOfMonth: "$createdAt" },
					month: { $month: "$createdAt" },
					year: { $year: "$createdAt" },
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
				}
			},
			{
				$group: {
					_id: { day: "$day", month: "$month", year: "$year" },
					productDetails: {
						$push: {
							product: "$product",
							mrp: "$mrp",
							discount: "$discount",
							couponValue: '$couponValue',
							quantity: "$quantity",
							taxRate : "$taxRate",
							individualTotal: "$individualTotal",
							mrpWithoutTax: "$mrpWithoutTax",
							firstDiscountAmount: "$firstDiscountAmount",
							AmountAfterfirstDiscount: "$AmountAfterfirstDiscount",
							seccondDiscountAmount: "$seccondDiscountAmount",
							AmountAfterSecondDiscount: "$AmountAfterSecondDiscount",
							gst: "$gst",
							sgst: "$sgst",
							cgst: "$cgst",
							totalDiscount: "$totalDiscount",
							totalDiscountPercentage: "$totalDiscountPercentage",
							totalPrice: "$totalPrice",
							_id: "$_id",
							createdAt: "$createdAt"
						}
					}
				}
			},
			{ $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 } }
		])
		const totalPages = Math.ceil(order?.length / limit);
		const paginatedOrder = order?.slice(skip, skip + limit);
		return res.render('admin-pages/adminDashboardDailyDownloadPage', {
			order, paginatedOrder, startDate, endDate, customRange,
			currentPage, limit, totalPages
		});

	} else if (customRange === 'yearly') {
		let currentPage = Number(req.query.page) || 1;
		let limit = Number(req.query.limit) || 5;
		let skip = (currentPage - 1) * limit;
		const order = await Order.aggregate([
			{ $unwind: "$order" },
			{
			  $addFields: {
				productId: '$order.productId',
				couponId: { $ifNull: ['$order.couponId', null] },
				quantity: '$order.quantity',
				createdAt: "$createdAt",
				orderId: "$_id",
				userId: "$userId",
				paymentMode: "$paymentMode",
				orderStatus: 'pending',
				createdAt: "$createdAt",
				updatedAt: "$updatedAt",
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
				from: "orders",
				localField: "orderId",
				foreignField: "_id",
				as: "orderDetails"
			  }
			},
			{ $unwind: "$productData" },
			{ $unwind: { path: "$couponData", preserveNullAndEmptyArrays: true } },
			{
			  $addFields: {
				mrp: '$productData.mrp',
				discount: '$productData.discount',
				product: '$productData.title',
				couponValue: { $ifNull: ['$couponData.couponValue', 0] },
				couponCode: { $ifNull: ['$couponData.couponCode', null] },
				couponName: { $ifNull: ['$couponData.coupon', null] },
			  }
			},
			{
				$addFields: {
					year: { $year: "$createdAt" },
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
				}
			},
			{
				$group: {
					_id: { year: "$year" },
					productDetails: {
						$push: {
							product: "$product",
							mrp: "$mrp",
							discount: "$discount",
							couponValue: '$couponValue',
							quantity: "$quantity",
							taxRate : "$taxRate",
							individualTotal: "$individualTotal",
							mrpWithoutTax: "$mrpWithoutTax",
							firstDiscountAmount: "$firstDiscountAmount",
							AmountAfterfirstDiscount: "$AmountAfterfirstDiscount",
							seccondDiscountAmount: "$seccondDiscountAmount",
							AmountAfterSecondDiscount: "$AmountAfterSecondDiscount",
							gst: "$gst",
							sgst: "$sgst",
							cgst: "$cgst",
							totalDiscount: "$totalDiscount",
							totalDiscountPercentage: "$totalDiscountPercentage",
							totalPrice: "$totalPrice",
							_id: "$_id"
						}
					}
				}
			},
			{ $sort: { "_id.year": -1 } },
		])
		const totalPages = Math.ceil(order[0]?.productDetails?.length / limit);
		const paginatedOrder = order[0]?.productDetails?.slice(skip, skip + limit);
		return res.render('admin-pages/adminDashboardYearlyDownloadPage', {
			order, paginatedOrder, startDate, endDate, customRange,
			currentPage, limit, totalPages
		});
	}
}
const showChartOnDashboard_get = async (req, res) => {
	const { chart } = req.query;
	if (chart === 'monthly') {
		const order = await Order.aggregate([
			{ $unwind: "$order" },
			{
			  $addFields: {
				productId: '$order.productId',
				couponId: { $ifNull: ['$order.couponId', null] },
				quantity: '$order.quantity',
				createdAt: "$createdAt",
				orderId: "$_id",
				userId: "$userId",
				paymentMode: "$paymentMode",
				orderStatus: 'pending',
				createdAt: "$createdAt",
				updatedAt: "$updatedAt",
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
				from: "orders",
				localField: "orderId",
				foreignField: "_id",
				as: "orderDetails"
			  }
			},
			{ $unwind: "$productData" },
			{ $unwind: { path: "$couponData", preserveNullAndEmptyArrays: true } },
			{
			  $addFields: {
				mrp: '$productData.mrp',
				product : '$productData.title',
				discount: '$productData.discount',
				couponValue: { $ifNull: ['$couponData.couponValue', 0] },
				couponCode: { $ifNull: ['$couponData.couponCode', null] },
				couponName: { $ifNull: ['$couponData.coupon', null] },
			  }
			},
			{
			  $addFields: {
				month: { $month: "$createdAt" },
				year: { $year: "$createdAt" },
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
				order: "$order"
			  }
			},
			{
			  $group: {
				_id: { month: "$month", year: "$year" },
				salesData : {
				  $push : {
					totalPrice : "$totalPrice",
					product : "$product",
				  }
				}
			  }
			},
			{ $sort: { "_id.year": -1, "_id.month": -1 } }
		  ])
		return res.json({ order: order, chart: chart });
	} else if (chart === 'weekly') {
		const order = await Order.aggregate([
			{ $unwind: "$order" },
			{
			  $addFields: {
				productId: '$order.productId',
				couponId: { $ifNull: ['$order.couponId', null] },
				quantity: '$order.quantity',
				createdAt: "$createdAt",
				orderId: "$_id",
				userId: "$userId",
				paymentMode: "$paymentMode",
				orderStatus: 'pending',
				createdAt: "$createdAt",
				updatedAt: "$updatedAt",
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
				from: "orders",
				localField: "orderId",
				foreignField: "_id",
				as: "orderDetails"
			  }
			},
			{ $unwind: "$productData" },
			{ $unwind: { path: "$couponData", preserveNullAndEmptyArrays: true } },
			{
			  $addFields: {
				mrp: '$productData.mrp',
				product : '$productData.title',
				discount: '$productData.discount',
				couponValue: { $ifNull: ['$couponData.couponValue', 0] },
				couponCode: { $ifNull: ['$couponData.couponCode', null] },
				couponName: { $ifNull: ['$couponData.coupon', null] },
			  }
			},
			{
				$addFields: {
					week: { $isoWeek: "$createdAt" },
					year: { $year: "$createdAt" },
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
				}
			},
			{
				$group: {
					_id: { week: "$week", year: "$year" },
					salesData: {
						$push: {
							totalPrice: "$totalPrice",
							_id: "$_id",
							product: "$product"
						}
					}
				}
			},
			{ $sort: { "_id.year": -1, "_id.week": -1 } }
		])
		return res.json({ order: order , chart: chart });
	} else if (chart === 'daily') {
		const order = await Order.aggregate([
			{ $unwind: "$order" },
			{
			  $addFields: {
				productId: '$order.productId',
				couponId: { $ifNull: ['$order.couponId', null] },
				quantity: '$order.quantity',
				createdAt: "$createdAt",
				orderId: "$_id",
				userId: "$userId",
				paymentMode: "$paymentMode",
				orderStatus: 'pending',
				createdAt: "$createdAt",
				updatedAt: "$updatedAt",
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
				from: "orders",
				localField: "orderId",
				foreignField: "_id",
				as: "orderDetails"
			  }
			},
			{ $unwind: "$productData" },
			{ $unwind: { path: "$couponData", preserveNullAndEmptyArrays: true } },
			{
			  $addFields: {
				mrp: '$productData.mrp',
				product : '$productData.title',
				discount: '$productData.discount',
				couponValue: { $ifNull: ['$couponData.couponValue', 0] },
				couponCode: { $ifNull: ['$couponData.couponCode', null] },
				couponName: { $ifNull: ['$couponData.coupon', null] },
			  }
			},
			{
				$addFields: {
					day: { $dayOfMonth: "$createdAt" },
					month: { $month: "$createdAt" },
					year: { $year: "$createdAt" },
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
				}
			},
			{
				$group: {
					_id: { day: "$day", month: "$month", year: "$year" },
					salesData: {
						$push: {
							totalPrice: "$totalPrice",
							_id: "$_id",
							product : "$product",
						}
					}
				}
			},
			{ $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 } }
		])
		return res.json({ order: order , chart: chart });
	} else if (chart === 'yearly') {
		const order = await Order.aggregate([
			{ $unwind: "$order" },
			{
			  $addFields: {
				productId: '$order.productId',
				couponId: { $ifNull: ['$order.couponId', null] },
				quantity: '$order.quantity',
				createdAt: "$createdAt",
				orderId: "$_id",
				userId: "$userId",
				paymentMode: "$paymentMode",
				orderStatus: 'pending',
				createdAt: "$createdAt",
				updatedAt: "$updatedAt",
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
				from: "orders",
				localField: "orderId",
				foreignField: "_id",
				as: "orderDetails"
			  }
			},
			{ $unwind: "$productData" },
			{ $unwind: { path: "$couponData", preserveNullAndEmptyArrays: true } },
			{
			  $addFields: {
				mrp: '$productData.mrp',
				product : '$productData.title',
				discount: '$productData.discount',
				couponValue: { $ifNull: ['$couponData.couponValue', 0] },
				couponCode: { $ifNull: ['$couponData.couponCode', null] },
				couponName: { $ifNull: ['$couponData.coupon', null] },
			  }
			},
			{
				$addFields: {
					year: { $year: "$createdAt" },
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
				}
			},
			{
				$group: {
					_id: { year: "$year" },
					salesData: {
						$push: {
							totalPrice: "$totalPrice",
							product: "$product",
							_id: "$_id"
						}
					}
				}
			},
			{ $sort: { "_id.year": -1 } }
		])
		console.log(order, 'yearly charts')
		return res.json({ order: order , chart: chart });
	}
}
const adminGenerateSalesReportDownload_get = async (req, res )=> {
	const customRange = req.query.customRange? req.query.customRange : '' ;
	const startDate = req.query.startDate? req.query.startDate : '' ;
	const endDate = req.query.endDate? req.query.endDate : '' ;
	const fileType = req.query.fileType ? req.query.fileType : '' ;

	const url = `${req.protocol}://${req.get('host')}/download-sales-report?customRange=${customRange}&startDate=${startDate}&endDate=${endDate}`
	const timeStamp = new Date().getTime()
    const fileName =`clothSTORE_${customRange}_(${startDate}_${endDate})_${timeStamp}.${fileType}`     
	const pdfPath = path.join(__dirname, '../../public/files', `${fileName}`);
	await generatePdf(url,pdfPath );
	res.download(pdfPath, (error) => {
		if (error) {
			console.log(error);
		} else {
			// Optionally, delete the file after download
			fs.unlink(pdfPath, (err) => {
				if (err) console.error('Error deleting file:', err);
			});
		}
	})
}
module.exports = {
	adminDashboard,
	salesReport_get,
	adminSalesReportDownload_get,
	showChartOnDashboard_get,
	adminGenerateSalesReportDownload_get
}
