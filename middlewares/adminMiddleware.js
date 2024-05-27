const fetchAdminMiddleware = (req, res, next) => {
	try {
		if (req.session.adminLogged) {
			res.locals.admin = "admin";
		}
		next();
	} catch (error) {
		console.error('Error fetching brands:', error);
		return res.status(500).render('admin-pages/404', { title: '404 Error' })
	}
};

module.exports = fetchAdminMiddleware;