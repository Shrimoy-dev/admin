const moment = require('moment');
const mongoose = require('mongoose');
const Logger = require(appRoot + '/helper/logger');
const logger = new Logger();
const RequestHandler = require(appRoot + '/helper/RequestHandler');
const requestHandler = new RequestHandler(logger);
const otp = require('otp-generator');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const settingsRepo = require('../repositories/settings.repository');

class SettingsController {
    constructor () {}

    async getData (req, res) {
        try {
            let settingsDetail = await settingsRepo.getByField({ isDeleted: false });
            if (!_.isNull(settingsDetail)) {
                requestHandler.sendSuccess(res, "Settings data fetched successfully.")(settingsDetail);
            } else {
                requestHandler.throwError(400, 'Bad Request', 'No data found!')();
            }
        } catch (error) {
            return requestHandler.sendError(req, res, error);
        }
    }

    async updateData (req, res) {
        try {
            if (!req.body?.minInvestment && req.body?.minInvestment <= 0) {
                return requestHandler.throwError(400, 'Bad Request', 'Minimum investment value is required and must be greater than 0.')();
            }
            if (!req.body?.maxInvestment && req.body?.maxInvestment <= 0) {
                return requestHandler.throwError(400, 'Bad Request', 'Maximum investment value is required and must be greater than 0.')();
            }
            if (!req.body?.investStep && req.body?.investStep <= 0) {
                return requestHandler.throwError(400, 'Bad Request', 'Investment step value is required and must be greater than 0.')();
            }
            if (!req.body?.publishDay && req.body?.publishDay < 1) {
                return requestHandler.throwError(400, 'Bad Request', 'Investment step value is required and must be greater than 1.')();
            }
            let settingsDetail = await settingsRepo.getByField({ isDeleted: false });
            if( !_.isNull(settingsDetail)) {
                if (req.user.role.role === 'admin') {
                    let updateRecord = await settingsRepo.updateById( req.body, { _id: req.body._id });
                    if (updateRecord && updateRecord._id) {
                        requestHandler.sendSuccess(res, "Settings data updated successfully.")(updateRecord);
                    } else {
                        requestHandler.throwError(400, 'Bad Request', 'Something went wrong!')();
                    }
                } else {
                    requestHandler.throwError(403, 'Forbidden', 'You are not authorized to perform this action!')();
                }
              
            } else {
                requestHandler.throwError(400, 'Bad Request', 'No data found!')();
            }
    
        } catch (error) {
            return requestHandler.sendError(req, res, error);
            
        }
    }}

module.exports = new SettingsController();