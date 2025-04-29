const moment = require('moment');
const mongoose = require('mongoose');
const Logger = require(appRoot + '/helper/logger');
const logger = new Logger();
const RequestHandler = require(appRoot + '/helper/RequestHandler');
const requestHandler = new RequestHandler(logger);
const otp = require('otp-generator');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const termsRepo = require('../repositories/termsAndConditions.repository');

class TermsController {
    constructor () {}

    async getData (req, res) {
        try {
            let terms = await termsRepo.getByField({ isDeleted: false });
            if (!_.isNull(terms)) {
                requestHandler.sendSuccess(res, "Terms and conditions fetched successfully.")(terms);
            } else {
                requestHandler.throwError(400, 'Bad Request', 'No terms and conditions found!')();
            }
        } catch (error) {
            return requestHandler.sendError(req, res, error);
        }
    }

    async updateData (req, res) {
        try {
            if (!req.body?.title?.trim()) {
                return requestHandler.throwError(400, 'Bad Request', 'Terms and conditions title is required.')();
            }
            if (!req.body?.description?.trim()) {
                return requestHandler.throwError(400, 'Bad Request', 'Terms and conditions description is required.')();
            }
            let terms = await termsRepo.getByField({ isDeleted: false });
            if( !_.isNull(terms)) {
                if (req.user.role.role === 'admin') {
                    let updateRecord = await termsRepo.updateById( req.body, { _id: req.body._id });
                    if (updateRecord && updateRecord._id) {
                        requestHandler.sendSuccess(res, "Terms and conditions updated successfully.")(updateRecord);
                    } else {
                        requestHandler.throwError(400, 'Bad Request', 'Something went wrong!')();
                    }
                } else {
                    requestHandler.throwError(403, 'Forbidden', 'You are not authorized to perform this action!')();
                }
              
            } else {
                requestHandler.throwError(400, 'Bad Request', 'No terms and conditions found!')();
            }
    
        } catch (error) {
            return requestHandler.sendError(req, res, error);
            
        }
    }}

module.exports = new TermsController();