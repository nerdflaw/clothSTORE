const userAuthorization = (req, res, next) => {
	if (req.session && req.session.userLogged) {
		next();
	}
};

module.exports = userAuthorization;
 