const Cart = require('../models/cart');
const { ObjectId } = require('mongodb')

const fetchGrandTotalMiddleware = async (req, res, next) => {
	try {
		if (req.session.userLogged) {

			const grandTotal = await Cart.aggregate(
				[
					{ $match: { userId: new ObjectId(req.session.userId) } },
					{
						$unwind: '$cart'
					},
					{
						$project: {
							_id: '$cart._id',
							product: '$cart.product',
							color: '$cart.color',
							size: '$cart.size',
							quantity: '$cart.quantity',
						},
					},
					{
						$lookup: {
							from: "products",
							localField: "product",
							foreignField: "_id",
							as: "cartData",
						},
					},
					{
						$project: {
							_id: 1,
							product: 1,
							color: 1,
							size: 1,
							quantity: 1,
							productData: {
								$arrayElemAt: ['$cartData', 0],
							},
						},
					},
					{
						$project: {
							total: { $multiply: ['$quantity', '$productData.mrp'] }
						}
					},
					{
						$group: {
							_id: null,
							grandTotal: { $sum: '$total' }
						}
					}
				]
			)
			res.locals.grandTotal = grandTotal;
		}
		next();
	} catch (error) {
		console.error('Error fetching cart:', error);
		res.status(500).send('Internal Server Error');
	}
};

module.exports = fetchGrandTotalMiddleware;