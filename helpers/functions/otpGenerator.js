const otpGenerator = require('otp-generator')

const OTPgenerator = otpGenerator
.generate(6,{
	upperCaseAlphabets: false,
	specialChars: false,
	digits: true,
	lowerCaseAlphabets : false,
})

module.exports = OTPgenerator
