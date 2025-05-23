const moment = require('moment');
const mongoose = require('mongoose');
const Logger = require(appRoot + '/helper/logger');
const logger = new Logger();
const RequestHandler = require(appRoot + '/helper/RequestHandler');
const requestHandler = new RequestHandler(logger);
const otp = require('otp-generator');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const packageRepo = require('../repositories/package.repository');

class PackageController {
    constructor () {}

    async save (req, res) {
        try {
       
            
            if (!req.body?.title?.trim()) {
              return  requestHandler.throwError(400, 'Bad Request', 'Package title is required.')();
            } 
            if (!req.body?.description?.trim()) {
                return  requestHandler.throwError(400, 'Bad Request', 'Package description is required.')();
              }
              if (!req.body?.minAmount) {
                return  requestHandler.throwError(400, 'Bad Request', 'Package minimum amount is required.')();
              }
              if (!req.body?.maxAmount) {
                return  requestHandler.throwError(400, 'Bad Request', 'Package maximum amount is required.')();
              }
              if (!req.body?.roi) {
                return  requestHandler.throwError(400, 'Bad Request', 'Package ROI is required.')();
              }
             if (req.user.role.role  === 'admin') {
              let saveRecord = await packageRepo.save(req.body);
              if (saveRecord && saveRecord._id) {
                  requestHandler.sendSuccess(res, "Package saved successfully.")(saveRecord);
              } else {
                  requestHandler.throwError(400, 'Bad Request', 'Something went wrong!')();
              }
             } else {
                requestHandler.throwError(403, 'Forbidden', 'You are not authorized to perform this action!')();
             }
                       
        } catch (error) {
            return requestHandler.sendError(req, res, error);
        }
    }

    async update (req, res) {
        try {
            if (!req.body?.id?.trim()) {
                return requestHandler.throwError(400, 'Bad Request', 'Package id is required.')();
            }
            if (!req.body?.title?.trim()) {
                return requestHandler.throwError(400, 'Bad Request', 'Package title is required.')();
            }
            if (!req.body?.description?.trim()) {
                return  requestHandler.throwError(400, 'Bad Request', 'Package description is required.')();
              }
              if (!req.body?.minAmount) {
                return  requestHandler.throwError(400, 'Bad Request', 'Package minimum amount is required.')();
              }
              if (!req.body?.maxAmount) {
                return  requestHandler.throwError(400, 'Bad Request', 'Package maximum amount is required.')();
              }
              if (!req.body?.roi) {
                return  requestHandler.throwError(400, 'Bad Request', 'Package ROI is required.')();
              }
            if (req.user.role.role  === 'admin') {
                let packageId = req.body.id;
                let packageData = await packageRepo.getByField({ _id: packageId, isDeleted: false });
                if (!_.isNull(packageData)) {
                    let updateRecord = await packageRepo.updateById(req.body, packageId);
                    if (updateRecord) {
                        requestHandler.sendSuccess(res, "Package updated successfully.")(updateRecord);
                    } else {
                        requestHandler.throwError(400, 'Bad Request', 'Something went wrong!')();
                    }
                } else {
                    requestHandler.throwError(400, 'Bad Request', 'No packages found!')();
                }
            } else {
                requestHandler.throwError(403, 'Forbidden', 'You are not authorized to perform this action!')();
            }
        } catch (error) {
            return requestHandler.sendError(req, res, error);
        }
    }

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

    async getAllForAdmin (req, res) {
        try {
            if (req.user.role.role  === 'admin') {
                let packages = await packageRepo.getAllForAdmin(req);
                if (!_.isNull(packages)) {
                    requestHandler.sendSuccess(res, "Packages fetched successfully.")(packages);
                } else {
                    requestHandler.throwError(400, 'Bad Request', 'No packages found!')();
                }
            } else {
                requestHandler.throwError(403, 'Forbidden', 'You are not authorized to perform this action!')();
            }
        } catch (error) {
            return requestHandler.sendError(req, res, error);
        }
    }

    async delete(req, res) {
        try {
       
            
            if ( !req.body?.id?.trim()) {
                return requestHandler.throwError(400, 'Bad Request', 'Package id is required.')();
            }
            if (req.user.role.role  === 'admin') {
                let packageId = req.body.id;
                let packageData = await packageRepo.getByField({ _id: packageId, isDeleted: false });
                if (!_.isNull(packageData)) {
                    let deleteRecord = await packageRepo.delete(packageId);
                    if (deleteRecord) {
                        requestHandler.sendSuccess(res, "Package deleted successfully.")(deleteRecord);
                    } else {
                        requestHandler.throwError(400, 'Bad Request', 'Something went wrong!')();
                    }
                } else {
                    requestHandler.throwError(400, 'Bad Request', 'No packages found!')();
                }
            } else {
                requestHandler.throwError(403, 'Forbidden', 'You are not authorized to perform this action!')();
            }
        } catch (error) {
            return requestHandler.sendError(req, res, error);
        }
    }

    async changeStatus(req, res) {
        try {
            if (!req.body?.id?.trim()) {
                return requestHandler.throwError(400, 'Bad Request', 'Package id is required.')();
            }
            if (req.user.role.role  === 'admin') {
                let packageId = req.body.id;
                let packageData = await packageRepo.getById( packageId);
                if (!_.isNull(packageData)) {
                    let status
                    if (packageData.status === 'Active') {
                        status = 'Inactive';
                    } else {
                        status = 'Active';
                    }
                    let updateRecord = await packageRepo.updateById({ status: status }, packageId);
                    if (updateRecord) {
                        requestHandler.sendSuccess(res, "Package status updated successfully.")(updateRecord);
                    } else {
                        requestHandler.throwError(400, 'Bad Request', 'Something went wrong!')();
                    }
                } else {
                    requestHandler.throwError(400, 'Bad Request', 'No packages found!')();
                }
            } else {
                requestHandler.throwError(403, 'Forbidden', 'You are not authorized to perform this action!')();
            }
        } catch (error) {
            return requestHandler.sendError(req, res, error);
            
        }
    }
}
module.exports = new PackageController();