const { ObjectId } = require('mongodb');
const Wallet = require('../../models/wallet');

async function refundToWallet(userId, balance, creditedFor, creditedAgainst) {
	const updateWallet = await Wallet.updateOne(
		{ userId: new ObjectId(userId) },
		{
			$push: {
				wallet: {
					balance: balance,
					creditedFor: creditedFor,
					creditedAgainst: new ObjectId(creditedAgainst)
				}
			}
		}
	);
	return updateWallet;
}

module.exports = { refundToWallet };
