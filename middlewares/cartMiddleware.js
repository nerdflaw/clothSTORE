const Cart = require('../models/cart');
const {ObjectId} = require('mongodb')

const fetchCartsMiddleware = async (req, res, next) => {
  try {
    if (req.session.userLogged) {
      const carts = await Cart.findOne({ userId: new ObjectId(req.session.userId)});

      if (carts) {
        res.locals.carts = carts;
        // console.log('Cart found:', carts);
      }
    }
    next();
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = fetchCartsMiddleware;
