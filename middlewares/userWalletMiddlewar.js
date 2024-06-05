const Wallet = require('../models/wallet');
const { ObjectId } = require('mongodb');

const fetchWalletMiddleware = async (req, res, next) => {
  try {
    const existingWallet = await Wallet.findOne({ userId: new ObjectId(req.session.userId) });
    res.locals.wallet = existingWallet ? existingWallet : [];
    next();
  } catch (error) {
    console.error("Error fetching wallet:", error);
    res.status(500).send("An error occurred while fetching the wallet information.");
  }
};

module.exports = fetchWalletMiddleware;
