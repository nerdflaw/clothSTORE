const Users = require('../models/models');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const blockedUserMiddleware = async (req, res, next) => {
  if(req.session){
    const users = await Users.find({ _id: new ObjectId(req.session.userId), status: true }, {});
    console.log('user found ----------------->', users)
    console.log('user length ----------------->', users.length)

    if (users && users.length > 0) {
      console.log('in if block')
      next();
    } else {
      console.log('in else block')
      // req.session.userLogged = false
      req.session.destroy();
      console.log('in else block', req.session)
      res.redirect('/user-login');
    }
  } else {
    res.redirect('/user-login');
  }
};

module.exports = blockedUserMiddleware;
