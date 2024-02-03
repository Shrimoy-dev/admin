const _ = require('lodash');

class RequestHandler {
	constructor(logger) {
		this.logger = logger;
	}

	throwIf(fn, status, errorType, errorMessage) {
		return result => (fn(result) ? this.throwError(status, errorType, errorMessage)() : result);
	}
	
	throwError(status, errorType, errorMessage) {
		return (e) => {
			if (!e) e = new Error(errorMessage || 'Default Error');
			e.status = status;
			e.errorType = errorType;
			throw e;
		};
	}

	catchError(res, error) {
		if (!error) error = new Error('Default error');
		res.status(error.status || 500).json({ status: error.status || 500, type: 'error', message: error.message || 'Unhandled error', error });
	}

	sendSuccess(res, message, status) {
		//this.logger.log(`a request has been made and proccessed successfully at: ${new Date()}`, 'info');
		return (data, globalData) => {
			if (_.isUndefined(status)) {
				status = 200;
			}
			res.status(status).json({
				status: status, type: 'success', message: message || 'Success result', data, ...globalData,
			});
		};
	}

	sendError(req, res, error) {
		//this.logger.log(`error ,Error during processing request: ${`${req.protocol}://${req.get('host')}${req.originalUrl}`} details message: ${error.message}`, 'error');
		return res.status(error.status || 500).json({
			status: error.status || 500, type: 'error', message: error.message || error.message || 'Unhandled Error', error,
		});
	}
}
module.exports = RequestHandler;
