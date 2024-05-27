const fetchUserMiddleware = (req, res, next) => {
	try {
		if (req.session.userLogged) {
			// console.log('fetchUserMiddleware', req.session )
			let fullName = `${req.session.firstName} ${req.session.lastName}`
			const user = {
				firstName: req.session.firstName,
				lastName: req.session.lastName,
				fullName: fullName,
				email: req.session.email,
				userId: req.session.userId,
				phoneNumber: req.session.phoneNumber,
			}
			res.locals.user = user;
			// console.log(user, '<- fetchUserMiddleware');
		}
		next();
	} catch (error) {
		console.error('Error fetching brands:', error);
		res.status(500).send('Internal Server Error');
	}
};

module.exports = fetchUserMiddleware;