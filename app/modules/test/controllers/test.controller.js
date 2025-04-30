const moment = require('moment');
const mongoose = require('mongoose');
const Logger = require(appRoot + '/helper/logger');
const logger = new Logger();
const RequestHandler = require(appRoot + '/helper/RequestHandler');
const requestHandler = new RequestHandler(logger);
const otp = require('otp-generator');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const packageRepo = require('../../package/repositories/package.repository');

class TestController {
    constructor () {}
     async getAll (req, res) {
            try {
      
              
                let packages = await packageRepo.getAllByField({ isDeleted: false, status: 'Active' });
                if (packages && packages.length) {
                    requestHandler.sendSuccess(res, "Packages fetched successfully.")(packages);
                } else {
                    requestHandler.throwError(400, 'Bad Request', 'No packages found!')();
                }
            } catch (error) {
                return requestHandler.sendError(req, res, error);
            }
        }
};

module.exports = new TestController();