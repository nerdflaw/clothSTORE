require('dotenv').config(); // Load environment variables

const express = require('express');
const nodemailer = require('nodemailer');
const otpGenerator = require('../helpers/functions/otpGenerator')
const users = require('../models/models');
const ObjectID = require('mongodb').ObjectId;
const mongoose = require('mongoose')
const bcrypt = require('bcrypt');
const OTPgenerator = require('../helpers/functions/otpGenerator');
const sendOTP = require('../helpers/functions/emailSender');
const flash = require ('connect-flash')

// userForgotPassword_get, userForgotPassword_post
// userValidateOTP_get, userValidateOTP_post
// userResetPassword_get, userResetPassword_post

const userForgotPassword_get = (req, res) => {
  res.render('user-pages/userForgotPasswordPage',
    {
      message: req.query.message,
      error: req.query.error,
    });
}
// Object to store generated OTP
const otpStore = {};
const userForgotPassword_post = async (req, res) => {
  const  email  = req.body.email
  req.session.email = email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).redirect('/user-forgot-password?error= Invalid email format')
  }

  const existingUser = await users.findOne({email:email},{})
  if(!existingUser){
    return res.status(400).redirect('/user-forgot-password?error= There is no user with this email')
  }

  const generatedOTP = OTPgenerator
  const recipientEmail = email ;

  // Store the OTP and its expiration timestamp in the object
  const expirationTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  const expirationTimestamp = Date.now() + expirationTime;
  otpStore[generatedOTP] = expirationTimestamp;


  try {
    await sendOTP(recipientEmail, generatedOTP);
    // Handle the logic for storing and verifying the OTP in your application
    res.redirect('/user-otp-validation?message=OTP sent to your email&email=' + encodeURIComponent(email));

  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).redirect('/user-forgot-password?error= error in sending OTP&email=' + encodeURIComponent(email));

  }
}
const userValidateOTP_get = (req, res) => {
  res.render('user-pages/userValidateOTPPage',
    {
      message: req.query.message,
      error: req.query.error,
      email: req.query.email
    }
  )
}
const userValidateOTP_post = (req, res) => {
  const { otp1, otp2, otp3, otp4, otp5, otp6} = req.body;
  const userEnteredOTP = otp1 + otp2 + otp3 + otp4 + otp5 + otp6;
  // Check if the OTP exists and is not expired
  if (otpStore[userEnteredOTP] && otpStore[userEnteredOTP] > Date.now()) {
    // Successful validation
    res.redirect('/user-reset-password?message=OTP validated successfully');
  } else {
    // Invalid or expired OTP
    res.status(500).redirect('/user-forgot-password?error= Invalid or expired OTP');
  }
};


const userResetPassword_get = (req, res) => {
  res.render('user-pages/userResetPasswordPage',
    {
      message: req.query.message
    })
}
const userResetPassword_post = async (req, res) => {
  try {
    const email = req.session.email || req.body.email
    const { newPassword, confirmPassword } = req.body
    if (newPassword === confirmPassword) {
      const salting = 10
      const hashPass = await bcrypt.hash(confirmPassword, salting)
      const updateUserPassword = await users.updateOne({ email: email }, { $set: { password: hashPass } })
      res.redirect('/user-login?success=Reset password successful')
    } else {
      res.redirect('/user-forgot-password?error=New password and Confirm password should be same')
    }

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error')
  }
}
const userChangePassword_post = async (req, res) => {
  try {
    const { newPassword, confirmPassword, firstName, lastName, email, phoneNumber } = req.body
    if (newPassword === confirmPassword) {
      const salting = 10
      const hashPass = await bcrypt.hash(confirmPassword, salting)
      const updateUserPassword = await users.updateOne(
        { email: req.session.email },
        { $set: { password: hashPass, firstName: firstName, lastName: lastName, email: email, phoneNumber:phoneNumber } })
      req.session.phoneNumber = phoneNumber;
      req.flash('success', 'password change successful')
      res.redirect('/user-dashboard')
    } else {
      req.flash('error', 'Something went wrong. Try again')
      res.redirect('/user-dashboard')
    }

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error')
  }
}


const userResendOTP_post = async (req, res) => {
  const email = req.session.email;

  // Generate a new OTP
  const resedOTP = OTPgenerator
  const expirationTime = Date.now() + 5 * 60 * 1000;
  otpStore[resedOTP] = expirationTime;

  try {
    await sendOTP(email, resedOTP);
    res.redirect('/user-resend-otp-validation?message=OTP sent to your email&email=' + encodeURIComponent(email));

  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).redirect('/user-forgot-password?error= error in sending OTP&email=' + encodeURIComponent(email));

  }
};

const userValidateResendOTP_get = (req, res) => {
  res.render('user-pages/userValidateOTPPage',
    {
      message: req.query.message,
      error: req.query.error,
      email: req.query.email
    }
  )
}

const userValidateResendOTP_post = (req, res) => {
  const { otp1, otp2, otp3, otp4, otp5, otp6} = req.body;

  const userEnteredOTP = otp1 + otp2 + otp3 + otp4 + otp5 + otp6;

  // Check if the OTP exists and is not expired
  if (otpStore[userEnteredOTP] && otpStore[userEnteredOTP] > Date.now()) {
    // Successful validation
    res.redirect('/user-reset-password?message=OTP validated successfully');
  } else {
    // Invalid or expired OTP
    res.status(500).redirect('/user-forgot-password?error= Invalid or expired OTP');
  }
};

module.exports = {
  userForgotPassword_get,
  userForgotPassword_post,
  userValidateOTP_get,
  userValidateOTP_post,
  userResetPassword_get,
  userResetPassword_post,
  userResendOTP_post,
  userValidateResendOTP_post,
  userValidateResendOTP_get,
  userChangePassword_post
}
