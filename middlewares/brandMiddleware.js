const Brand = require('../models/brand');

const fetchBrandsMiddleware = async (req, res, next) => {
  try {
    const brands = await Brand.find({status: true});
    res.locals.brands = brands;
    next();
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = fetchBrandsMiddleware;
