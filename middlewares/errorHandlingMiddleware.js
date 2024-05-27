
const errorHandlerMiddleware = (handler) => async (req, res, next) => {
	try {
		await handler(req, res, next);
	} catch (error) {
		console.error(error);
		res.status(500).send('Internal Server Error');
	}
};

module.exports = errorHandlerMiddleware;
