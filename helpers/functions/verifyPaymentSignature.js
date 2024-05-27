const crypto = require('crypto');

function verifyPaymentSignature(orderId, paymentId, razorpaySignature, secret) {
	// Concatenate order ID and payment ID with a pipe character
	const data = orderId + '|' + paymentId;
	// Generate HMAC SHA256 hash using the secret key
	const generatedSignature = crypto.createHmac('sha256', secret).update(data).digest('hex');

	// Compare the generated signature with the provided Razorpay signature
	if (generatedSignature === razorpaySignature) {
		return true; // Payment signature is valid
	} else {
		return false; // Payment signature is not valid
	}
}
module.exports = { verifyPaymentSignature };
