// Import necessary modules
const Address = require('../models/address');
const {ObjectId} = require ('mongodb')

const fetchAddressesMiddleware = async (req, res, next) => {
  try {
    if(req.session.userLogged){
    const addresses = await Address.find({userId: new ObjectId(req.session.userId)});
    res.locals.addresses = addresses;
  }
    next();
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = fetchAddressesMiddleware;
