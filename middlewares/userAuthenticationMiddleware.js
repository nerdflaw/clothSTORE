const userAuthentication = (req, res, next) => {
	if (req.session.userLogged) {
		next();
	} else {
		res.redirect('/user-login');
	}
};

module.exports = userAuthentication;
// if user is logged in next process else redirect to login page

