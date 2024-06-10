const adminAuthentication = (req, res, next) => {
	if (req.session.adminLogged) {
		next();
	} else {
		return res.redirect('/user-login');
	}
};

module.exports = adminAuthentication;
