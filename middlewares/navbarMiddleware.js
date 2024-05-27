
const yourMiddleware = (req, res, next) => {
	// Your data that you want to pass to views
	const dataToPass = {
	  key1: 'value1',
	  key2: 'value2',
	  // Add more data as needed
	};
  
	// Make the data accessible in views by attaching it to the response locals
	res.locals.yourData = dataToPass;
  
	// Continue to the next middleware or route handler
	next();
  };
  
  module.exports = yourMiddleware;
  