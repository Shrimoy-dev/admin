const moment = require('moment');
const mongoose = require('mongoose');
const Logger = require(appRoot + '/helper/logger');
const logger = new Logger();
const RequestHandler = require(appRoot + '/helper/RequestHandler');
const requestHandler = new RequestHandler(logger);
const otp = require('otp-generator');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const aboutUsRepo = require('../repositories/aboutUs.repository');

class TermsController {
    constructor () {}

    async getData (req, res) {
        try {
            let terms = await aboutUsRepo.getByField({ isDeleted: false });
            if (!_.isNull(terms)) {
                requestHandler.sendSuccess(res, "About us fetched successfully.")(terms);
            } else {
                requestHandler.throwError(400, 'Bad Request', 'No data found!')();
            }
        } catch (error) {
            return requestHandler.sendError(req, res, error);
        }
    }

    async updateData (req, res) {
        try {
            if (!req.body?.title?.trim()) {
                return requestHandler.throwError(400, 'Bad Request', 'About us title is required.')();
            }
            if (!req.body?.description?.trim()) {
                return requestHandler.throwError(400, 'Bad Request', 'About us description is required.')();
            }
            let terms = await aboutUsRepo.getByField({ isDeleted: false });
            if( !_.isNull(terms)) {
                if (req.user.role.role === 'admin') {
                    let updateRecord = await aboutUsRepo.updateById( req.body,  terms._id );
                    if (updateRecord && updateRecord._id) {
                        requestHandler.sendSuccess(res, "About us updated successfully.")(updateRecord);
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

module.exports = new TermsController();