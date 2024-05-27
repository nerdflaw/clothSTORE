
const nodemailer = require('nodemailer');
require('dotenv').config();

const sendOTP = async (recipientEmail, otp) => {
  // Create a Nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass:  process.env.EMAIL_PASSWORD,
    },
  });

  // Email content
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: recipientEmail,
    subject: 'Your OTP for Verification',
    text: `Your OTP is: ${otp}`,
  };

  // Send mail with defined transport object
  await transporter.sendMail(mailOptions);
};

module.exports = sendOTP;
