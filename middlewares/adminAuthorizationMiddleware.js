const adminAuthorization = (req, res, next) => {
	if (!req.session.adminLogged) {
		next();
	}else{
		return res.redirect('/admin-dashboard');
	}
};

module.exports = adminAuthorization;
