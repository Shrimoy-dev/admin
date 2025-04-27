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
              if (!req.body?.amount?.trim()) {
                return  requestHandler.throwError(400, 'Bad Request', 'Package amount is required.')();
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

    async getAll (req, res) {
        try {
          console.log('getAll');
          
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
}
module.exports = new PackageController();