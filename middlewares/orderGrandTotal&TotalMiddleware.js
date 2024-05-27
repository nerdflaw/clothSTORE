const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Order = require('../models/order');

const fetchOrderGrandTotalMiddleware = async (req, res, next) => {
  try {
    if (req.session.userLogged) {
      const order = await Order.aggregate([
        {
          $match: {
            userId: new ObjectId(req.session.userId)
          }
        },
        {
          $addFields: {
            order: {
              $map: {
                input: "$order",
                as: "orderItem",
                in: {
                  $mergeObjects: [
                    "$$orderItem",
                    {
                      status: {
                        $cond: {
                          if: { $eq: ["$$orderItem.status", "pending"] },
                          then: "pending",
                          else: "other"
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        },
        {
          $unwind: "$order"
        },
        {
          $match: {
            "order.status": "pending"
          }
        },
        {
          $group: {
            _id: "$_id",
            individualOrderTotal: {
              $sum: {
                $multiply: ["$order.mrp", "$order.quantity"]
              }
            },
            grandTotal: {
              $sum: {
                $multiply: ["$order.mrp", "$order.quantity"]
              }
            }
          }
        },
        {
          $project: {
            _id: 1,
            individualOrderTotal: 1,
            grandTotal: 1,
            individualGST : "$productData.discount",
          }
        }
      ]);

      // console.log(order, 'order from middleware')

      const individualOrderTotals = order.map(order => ({
        orderId: order._id,
        individualOrderTotal: order.individualOrderTotal
      }));

      const grandTotal = order.reduce((total, order) => total + order.grandTotal, 0);

      res.locals.individualOrderTotals = individualOrderTotals;
      res.locals.orderGrandTotal = grandTotal;
    }
    next();
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = fetchOrderGrandTotalMiddleware;
