const userAuthorization = (req, res, next) => {
	if (!req.session.userLogged) {
		next();
	}else {
		return res.redirect('/user-dashboard');
	}
};
module.exports = userAuthorization;

