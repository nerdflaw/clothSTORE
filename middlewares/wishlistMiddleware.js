const Wishlist = require('../models/wishlist');
const { ObjectId } = require('mongodb')

const fetchWishlistsMiddleware = async (req, res, next) => {
  try {
    if (req?.session?.userLogged) {
      const wishlists = await Wishlist.aggregate([
        { $match: { userId: new ObjectId(req.session.userId) } },
      ]);
      res.locals.wishlists = wishlists[0]?.wishlist;
    }
    next();
  } catch (error) {
    console.error('Error fetching wishlists:', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = fetchWishlistsMiddleware;