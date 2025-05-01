const moment = require('moment');
const mongoose = require('mongoose');
const Logger = require(appRoot + '/helper/logger');
const logger = new Logger();
const RequestHandler = require(appRoot + '/helper/RequestHandler');
const requestHandler = new RequestHandler(logger);
const otp = require('otp-generator');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const userPackageRepo = require('../repositories/userPackage.repository');
const packageRepo = require('../../package/repositories/package.repository');

class UserPackageController {
constructor () {}
/*Method to save user saveData*/
async save (req, res) {
    try {
        if (!req.body?.userId) {
            return requestHandler.throwError(400, 'Bad Request', 'User ID is required.')();
        }
        if (!req.body?.packageId) {
            return requestHandler.throwError(400, 'Bad Request', 'Package ID is required.')();
        }
        if (!req.body?.investment) {
            return requestHandler.throwError(400, 'Bad Request', 'Investment amount is required.')();
        }
        let saveData = await packageRepo.getById(req.body.packageId);
        if (req.body?.investment < saveData?.minAmount) {
            return requestHandler.throwError(400, 'Bad Request', `Investment amount should be greater than ${saveData?.minAmount}`)();
        } else if (req.body?.investment > saveData?.maxAmount) {
            return requestHandler.throwError(400, 'Bad Request', `Investment amount should be less than ${saveData?.maxAmount}`)();
        } else {
            let saveRecord = await userPackageRepo.save(req.body);
            if (saveRecord && saveRecord._id) {
                requestHandler.sendSuccess(res, "User saveData saved successfully.")(saveRecord);
            } else {
                requestHandler.throwError(400, 'Bad Request', 'Something went wrong!')();
            }
        }
   
       
   
    } catch (error) {
        return requestHandler.sendError(req, res, error);
    }
};
}

module.exports = new UserPackageController();
