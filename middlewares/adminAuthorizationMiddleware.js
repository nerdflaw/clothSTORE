const adminAuthorization = (req, res, next) => {
	if (req.session && req.session.adminLogged) {
		return res.redirect('/admin-dashboard')
	}
	next();
};

module.exports = adminAuthorization;
