const userAuthentication = (req, res, next) => {
	if (req.session && req.session.userLogged) {
		next();
	} else {
		res.redirect('/user-login');
	}
};

module.exports = userAuthentication;
