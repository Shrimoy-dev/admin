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
async save(req, res) {
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
            } else if (req.body.investment % 100 !== 0) {
                return requestHandler.throwError(400, 'Bad Request', 'Investment amount must be a multiple of 100.')();
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


async  updatePackage(req, res) {
    try {
        if (req.user.role.role !== 'admin') {
            return requestHandler.throwError(403, 'Forbidden', 'You are not authorized to perform this action.')();
        }
        console.log(req.body);
        
        const userPackages = req.body?.user_packages;
       
        if (!Array.isArray(userPackages) || userPackages.length === 0) {
            return requestHandler.throwError(400, 'Bad Request', 'User packages are required.')();
        }

        await Promise.all(
            userPackages.map(ele => userPackageRepo.updateById(ele, ele._id))
        );

        requestHandler.sendSuccess(res, "User packages updated successfully.")();

    } catch (error) {
        return requestHandler.sendError(req, res, error);
    }
}


}

module.exports = new UserPackageController();
