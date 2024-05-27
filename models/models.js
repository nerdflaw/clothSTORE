const mongoose = require("mongoose")
require('dotenv').config();

mongoose.connect(process.env.MONGOURL, {})
   .then(() => {
      console.log("Database Connected Successfully");
   })
   .catch((err) => {

      console.log("Failed to connect", err);
   })

const users = new mongoose.Schema({
   firstName: {
      type: String,
      required: true
   },
   lastName: {
      type: String,
      required: true
   },
   email: {
      type: String,
      required: true
   },
   phoneNumber: {
      type: String,
   },
   password: {
      type: String,
      required: true
   },
   status: {
      type: Boolean,
      default: true
   }
})
const collection = new mongoose.model('users', users);
module.exports = collection;