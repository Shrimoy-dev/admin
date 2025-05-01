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
     
        if (!req.body?.packageId) {
            return requestHandler.throwError(400, 'Bad Request', 'Package ID is required.')();
        }
        if (!req.body?.investment) {
            return requestHandler.throwError(400, 'Bad Request', 'Investment amount is required.')();
        }
        let packageData = await packageRepo.getById(req.body.packageId);
        if (_.isNull(packageData) && _.isEmpty(packageData)) {

            return requestHandler.throwError(400, 'Bad Request', 'Package not found.')();
        } else {
          
            if (req.body?.investment < packageData?.minAmount) {
                return requestHandler.throwError(400, 'Bad Request', `Investment amount should be greater than ${packageData?.minAmount}`)();
            } else if (req.body?.investment > packageData?.maxAmount) {
                return requestHandler.throwError(400, 'Bad Request', `Investment amount should be less than ${packageData?.maxAmount}`)();
            } else {
                req.body.userId = req.user._id;
                let saveRecord = await userPackageRepo.save(req.body);
                if (saveRecord && saveRecord._id) {
                    requestHandler.sendSuccess(res, "Package saved successfully.")(saveRecord);
                } else {
                    requestHandler.throwError(400, 'Bad Request', 'Something went wrong!')();
                }
            }
        }

   
       
   
    } catch (error) {
        return requestHandler.sendError(req, res, error);
    }
};

async update (req, res) {
    try {
        if (!req.body?.packageId) {
            return requestHandler.throwError(400, 'Bad Request', 'Package ID is required.')();
        }
   
        let packageData = await packageRepo.getById(req.body.packageId);
        if (_.isNull(packageData) && _.isEmpty(packageData)) {

            return requestHandler.throwError(400, 'Bad Request', 'Package not found.')();
        } else {
            if (req.body?.investment < packageData?.minAmount) {
                return requestHandler.throwError(400, 'Bad Request', `Investment amount should be greater than ${packageData?.minAmount}`)();
            } else if (req.body?.investment > packageData?.maxAmount) {
                return requestHandler.throwError(400, 'Bad Request', `Investment amount should be less than ${packageData?.maxAmount}`)();
            } else {
                req.body.userId = req.user._id;
                let saveRecord = await userPackageRepo.update(req.body);
                if (saveRecord && saveRecord._id) {
                    requestHandler.sendSuccess(res, "User saveData updated successfully.")(saveRecord);
                } else {
                    requestHandler.throwError(400, 'Bad Request', 'Something went wrong!')();
                }
            }
        }

    } catch (error) {
        return requestHandler.sendError(req, res, error);
    }
}
}

module.exports = new UserPackageController();
