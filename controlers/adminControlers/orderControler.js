const express = require('express')
const mongoose = require('mongoose')
const { ObjectId } = require('mongodb')
const Category = require('../../models/category')
const Order = require('../../models/order')

const adminOrderManagement = async (req, res) => {

	let currentPage = Number(req.query.page) || 1;
	let limit = Number(req.query.limit) || 4;
	let skip = (currentPage - 1) * limit;

	const userOrders = await Order.aggregate([
		{
			$lookup: {
				from: 'users',
				localField: 'userId',
				foreignField: '_id',
				as: 'user_info'
			}
		},
		{
			$unwind: '$user_info'
		},
		{
			$project: {
				_id: 1,
				paymentMode: 1,
				address: 1,
				order: 1,
				orderStatus: 1,
				createdAt: 1,
				updatedAt: 1,
				"__v": 1,
				'user_info.firstName': 1,
				'user_info.lastName': 1,
				'user_info.phoneNumber': 1,
				'user_info.email': 1
			}
		},
		{ $sort : { createdAt : -1}}
	])
	const totalPages = Math.ceil(userOrders.length / limit);
	const paginatedUserOrders = userOrders.slice(skip, skip + limit);
	res.render('admin-pages/adminOrderManagementPage', {
		totalPages,
		limit,
		currentPage,
		paginatedUserOrders,
		message: req.query.message
	})
}
const adminOrderManagementSearch_get = async (req, res) => {
	let currentPage = Number(req.query.page) || 1;
	let limit = Number(req.query.limit) || 4;
	let skip = (currentPage - 1) * limit;

	const searchText = req.query.search;
	const searchRegex = new RegExp(searchText, 'i');

	const searchResult = await Order.aggregate([
		{
			$match: {
				$or: [
					{ 'order.product': { $regex: searchRegex } },
					{ 'order.status': { $regex: searchRegex } },
					{ 'order.mrp': { $regex: searchRegex } },
					{ 'order.color': { $regex: searchRegex } },
					{ 'order.size': { $regex: searchRegex } },
					{ paymentMode: { $regex: searchRegex } },
					{ orderStatus: { $regex: searchRegex } },
					{ 'address.fullName': { $regex: searchRegex } },
					{ 'address.phoneNumber': { $regex: searchRegex } },
					{ 'address.email': { $regex: searchRegex } },
					{ _id: searchRegex },
				]
			}
		},
		{
			$lookup: {
				from: 'users',
				localField: 'userId',
				foreignField: '_id',
				as: 'user_info'
			}
		},
		{
			$unwind: '$user_info'
		},
		{
			$project: {
				_id: 1,
				paymentMode: 1,
				address: 1,
				order: 1,
				orderStatus: 1,
				createdAt: 1,
				updatedAt: 1,
				"__v": 1,
				'user_info.firstName': 1,
				'user_info.lastName': 1,
				'user_info.phoneNumber': 1,
				'user_info.email': 1
			}
		}
	]);
	const totalPages = Math.ceil(searchResult.length / limit);
	const paginatedUserOrders = searchResult.slice(skip, skip + limit);
	return res.render('admin-pages/adminOrderManagementSearchPage', {
		totalPages,
		limit,
		currentPage,
		paginatedUserOrders,
		searchText,
		message: req.flash('message')
	})
};
const adminViewOrderDetails_get = async (req, res) => {
	if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
		return res.status(400).render('admin-pages/404', { title: '404 Error' })
	};

	const orderDetails = await Order.aggregate([
		{ $match: { _id: new ObjectId(req.params.id) } },
		{ $unwind: "$order" },
		{
			$project: {
				productId: '$order.productId',
				addressId: '$order.addressId',
				couponId: { $ifNull: ['$order.couponId', null] },
				colorId: '$order.colorId',
				sizeId: '$order.sizeId',
				quantity: '$order.quantity',
				status: '$order.status',
				paymentMode: "$paymentMode",
				orderStatus: "$orderStatus",
				paymentStatus: "$paymentStatus",
				createdAt: "$createdAt",
				updatedAt: "$updatedAt",
				addressId: '$addressId',
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
				from: "colors",
				localField: "colorId",
				foreignField: "_id",
				as: "colorData"
			}
		},
		{
			$lookup: {
				from: "sizes",
				localField: "sizeId",
				foreignField: "_id",
				as: "sizeData"
			}
		},
		{
			$lookup: {
				from: "addresses",
				localField: "addressId",
				foreignField: "addresses._id",
				as: "addressData"
			}
		},
		{ $unwind: "$productData" },
		{ $unwind: { path: "$couponData", preserveNullAndEmptyArrays: true } },
		{ $unwind: "$colorData" },
		{ $unwind: "$sizeData" },
		// { $unwind: "$addressData" },
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
				addressData: { $arrayElemAt: ["$addressData", 0] },
				paymentMode: 1,
				addressId: 1,
				orderStatus: 1,
				paymentStatus: 1,
				createdAt: 1,
				updatedAt: 1,
				mrp: 1,
				couponValue: 1,
				couponCode: 1,
				couponName: 1,
				discount: 1,
				status: 1,
				title: "$productData.title",
				images: "$productData.images",
				color: "$colorData.color",
				size: "$sizeData.size",
				productId: 1,
				quantity: 1,
				addressId: 1,
			}
		},
	])
	let totalIndividualTotal = 0
    let totalMrpWithoutTax = 0
    let totalFirstDiscountAmount = 0
    let totalAmountAfterfirstDiscount = 0  
    let totalSeccondDiscountAmount = 0
    let totalAmountAfterSecondDiscount = 0  
    let totalGst = 0
    let totalSgst = 0
    let totalCgst = 0

	orderDetails.forEach(orderItem => {
		totalIndividualTotal += orderItem.individualTotal
		totalMrpWithoutTax += orderItem.mrpWithoutTax
		totalFirstDiscountAmount += orderItem.firstDiscountAmount
		totalAmountAfterfirstDiscount += orderItem.AmountAfterfirstDiscount
		totalSeccondDiscountAmount += orderItem.seccondDiscountAmount
		totalAmountAfterSecondDiscount += orderItem.AmountAfterSecondDiscount
		totalGst += orderItem.gst
		totalSgst += orderItem.sgst
		totalCgst += orderItem.cgst
	});

	let totalDiscount = totalIndividualTotal - ( totalAmountAfterSecondDiscount + totalGst )
	let totalDiscountPercentage = ( totalDiscount / totalIndividualTotal ) * 100
	let roundOff = totalIndividualTotal - (totalAmountAfterSecondDiscount + totalGst + totalDiscount )
	let grandTotal = totalAmountAfterSecondDiscount + totalGst

	return res.render('admin-pages/adminViewOrderDetailsPage',
		{ orderDetails, message: req.query.message,
			totalAmountAfterSecondDiscount, totalGst,
			totalSgst, totalCgst, totalDiscount, totalDiscountPercentage, roundOff , grandTotal,
		}
	)
};
const adminChangeOrderStatus_post = async (req, res) => {
	if (!mongoose.Types.ObjectId.isValid(req.params.orderId)) {
		return res.status(400).render('admin-pages/404', { title: '404 Error' })
	};
	const id = req.params.orderId;
	const newStatus = req.query.newStatus;
	const currentOrderStatus = req.query.currentOrderStatus;	
	const order = await Order.findOne({ _id : new ObjectId(id), orderStatus : currentOrderStatus });
	if(!order){
		return res.json({ status: 404, message: 'Somehting went wrong!. Try again.' });
	}
	if (order) {
		let updated = false;
		order.order.forEach((item) => {
			if (item.status === currentOrderStatus) {
				item.status = newStatus;
				updated = true;
			}
		});
		if (updated) {
			order.orderStatus = newStatus;
			await order.save();
			res.json({ status: 200, message: 'Status changed successfully' });
		  } else {
			return res.json({ status: 404, message: 'Somehting went wrong!. Try again.' });
		  }
	}
	// if(updatedOrder.length > 0){
	// 	res.json({ status: 200, message: 'Status changed successdully' });
	// } else {
	// 	res.status(404).json({ error: 'Order not found or current order status does not match' });
	// }
};

module.exports = {
	adminOrderManagement,
	adminOrderManagementSearch_get,
	adminViewOrderDetails_get,
	adminChangeOrderStatus_post,
}