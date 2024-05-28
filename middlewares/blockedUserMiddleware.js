const Users = require('../models/models');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const blockedUserMiddleware = async (req, res, next) => {
  if(req.session){
    const users = await Users.find({ _id: new ObjectId(req.session.userId), status: true }, {});

    if (users && users.length > 0) {
      next();
    } else {
      req.session.destroy();
      res.redirect('/user-login');
    }
  } else {
    res.redirect('/user-login');
  }
};

module.exports = blockedUserMiddleware;
