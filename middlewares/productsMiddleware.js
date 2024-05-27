const Product = require('../models/product');

const fetchProductsMiddleware = async (req, res, next) => {
  try {
    const products = await Product.find({status: true});
    res.locals.products = products;
    // console.log(products, 'products');
    next();
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = fetchProductsMiddleware;
