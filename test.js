db.orders.aggregate([
	{ $match: { _id: new ObjectId('665a978ea9bc5680130417b6') } },
	{ $unwind: "$order" },
	{
		$project: {
			addressId: '$addressId',
			productId: '$order.productId',
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
			wholeOrderId: '$_id',
			singleOrderId: '$order._id',
			userId: "$userId"
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
	{ $unwind: "$productData" },
	{ $unwind: { path: "$couponData", preserveNullAndEmptyArrays: true } },
	{ $unwind: "$colorData" },
	{ $unwind: "$sizeData" },
	{
		$addFields: {
			mrp: '$productData.mrp',
			discount: '$productData.discount',
			couponValue: { $ifNull: ['$couponData.couponValue', 0] },
			couponCode: { $ifNull: ['$couponData.couponCode', null] },
			couponName: { $ifNull: ['$couponData.coupon', null] }

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
			paymentStatus: 1,
			productId: 1,
			quantity: 1,
			colorId: 1,
			sizeId: 1,
			orderStatus: 1
		}
	},
	{
		$group: {
			_id: "$wholeOrderId",
			orders: { $push: "$$ROOT" },
			refundAmount: { $sum: "$totalPrice" }
		}
	}
]);