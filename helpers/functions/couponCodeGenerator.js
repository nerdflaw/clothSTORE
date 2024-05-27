let generatedCodes = [];

function generateUniqueCouponCode(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let coupon = '';
    do {
        coupon = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            coupon += characters.charAt(randomIndex);
        }
    } while (generatedCodes.includes(coupon)); // Check if the coupon already exists
    generatedCodes.push(coupon); // Store the generated coupon code
    return coupon;
}

module.exports = { generateUniqueCouponCode }