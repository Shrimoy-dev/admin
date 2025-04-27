const moment = require('moment');
const mongoose = require('mongoose');
const Logger = require(appRoot + '/helper/logger');
const logger = new Logger();
const RequestHandler = require(appRoot + '/helper/RequestHandler');
const requestHandler = new RequestHandler(logger);
const otp = require('otp-generator');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const User = require('user/models/user.model');
const userRepo = require('../../user/repositories/user.repository');
const roleRepo = require('../../roles/repositories/role.repository');
const userDevicesRepo = require('user_devices/repositories/user_devices.repository');

class UserController {
    constructor () {}


    /* @Method: signup
    // @Description: user signup
    */
    async signup (req, res) {
        try {
        
            if (!req.body.email) {
                requestHandler.throwError(400, 'Bad Request', 'Email is required.')();
            } else
            if (!req.body.password) {
                requestHandler.throwError(400, 'Bad Request', 'Password is required.')();
            } else {
                req.body.email = req.body.email.trim().toLowerCase();
                req.body.userName= Math.floor(new Date().getTime() / 1000)
                const userRole = await roleRepo.getByField({ role: "user" });
                // console.log(userRole,', oooooooooooooooooooooooo')
                req.body.role = userRole._id;
                const userExist = await userRepo.getByField({ email: req.body.email, role: userRole._id, isDeleted: false });
                if (userExist) {
                    requestHandler.throwError(403, 'Bad Request', 'User already exists with same email! Kindly proceed to the signin page.')();
                } else {
                    req.body = utils.handleNameFields(req.body);
                  
                    req.body.password = new User().generateHash(req.body.password);
                    if (req.files && req.files.length) {
                        for (let file of req.files) {
                            req.body[file.fieldname] = file.filename;
                        }
                    }
                    let otp =utils.betweenRandomNumber(100000, 999999);
                    req.body.otp = otp;
                    const saveUser = await userRepo.save(req.body);
                    if (saveUser && saveUser._id) {
                       
                        let emailData = { name: saveUser.fullName, email: saveUser.email, otp: otp };
                        await mailHelper.sendMail(`${project_name} Admin<${process.env.FROM_EMAIL}>`, saveUser.email, `Verify OTP || ${project_name}`, 'user-otp-verify', emailData);
                        // let userDetails = await userRepo.getUserDetails({ _id: saveUser._id });
                        // let token = jwt.sign({
                        //     id: saveUser._id
                        // }, config.auth.jwtSecret, {
                        //     expiresIn: config.auth.jwt_expiresin
                        // });
                        requestHandler.sendSuccess(res, "Successfully Registered! Please verify from the sent mail.")();
                    } else {
                        requestHandler.throwError(400, 'Bad Request', 'Something went wrong!')();
                    }
                }
            }
        } catch (error) {
            console.log(error)
            return requestHandler.sendError(req, res, error);
        }
    };


    /* @Method: signin
    // @Description: user signin
    */
    async signin (req, res) {
        try {
            if (!req.body.email) {
                requestHandler.throwError(400, 'Bad Request', 'Email is required.')();
            } else
            if (!req.body.password) {
                requestHandler.throwError(400, 'Bad Request', 'Password is required.')();
            } else {
                req.body.email = req.body.email.trim().toLowerCase();
                const userRole = await roleRepo.getByField({ role: "user" });
                const userExist = await userRepo.getByField({ email: req.body.email, role: userRole._id, isDeleted: false });
                if (userExist && userExist.isOtpVerified) {
                    if (userExist && userExist.status == 'Active') {
                        if (!(new User().validPassword(req.body.password, userExist.password))) {
                            requestHandler.throwError(400, 'Forbidden', 'Authentication failed!')();
                        } else {
                            // utils.saveUserActivity({
                            //     userId: userExist._id,
                            //     title: 'Logged In!',
                            //     description: (userExist.fullName?userExist.fullName:userExist.email) + ' has logged in.',
                            // });
    
                            let userDetails = await userRepo.getUserDetails({ _id: userExist._id });
                            let token = jwt.sign({
                                id: userExist._id
                            }, config.auth.jwtSecret, {
                                expiresIn: config.auth.jwt_expiresin
                            });
                            requestHandler.sendSuccess(res, "Logged in successfully.")(userDetails[0], { token });
                        }
                    } else if (userExist && userExist.status == 'Inactive') {
                        requestHandler.throwError(400, 'Bad Request', 'Oops! Your account was set as Inactive. Kindly contact support to access your account.')();
                    } else if (userExist && userExist.status == 'Banned') {
                        requestHandler.throwError(400, 'Bad Request', 'Oops! You\'re temporarily Banned from using your account.')();
                    } else {
                        requestHandler.throwError(403, 'Bad Request', 'Oops! No user found. Kindly proceed to the signup page.')();
                    }
                } else {
                    requestHandler.throwError(403, 'Bad Request', 'Email is not verified')();
                }
        
            }
        } catch (error) {
            return requestHandler.sendError(req, res, error);
        }
    };
       /* @Method: verifyEmail
    // @Description: user email verification
    */
   async verifyEmail (req, res) {
    try {
        let findUser = await userRepo.getByField({ otp: req.body.otp, isDeleted: false });
        if (findUser) {
            if (findUser && findUser.otpExpireTime) {

                await userRepo.updateById({
                    isOtpVerified: true,
                    otp: '',
                    otpExpireTime: null
                }, findUser._id);
                requestHandler.sendSuccess(res, 'Email verified successfully! Please login to continue')();
            } else {
                requestHandler.throwError(400, 'Bad Request', 'OTP expired!')();
            }
        } else {
            requestHandler.throwError(400, 'Bad Request', 'Invalid OTP!')();
        }
    } catch (error) {
        return requestHandler.sendError(req, res, error);
        
    }
   }
    /* @Method: profile
    // @Description: user profile
    */
    async profile (req, res) {
        try {
            let userDetails = await userRepo.getUserDetails({ _id: req.user._id });
            requestHandler.sendSuccess(res, "Profile details fetched successfully.")(userDetails[0]);
        } catch (error) {
            return requestHandler.sendError(req, res, error);
        }
    };


    /* @Method: logout
    // @Description: user logout
    */
    async logout (req, res) {
        try {
            const token = req.headers['token'];
            let findDevice = await userDevicesRepo.getByField({ access_token: token, isDeleted: false, userId: req.user._id });
            if (findDevice) {
                await userDevicesRepo.delete(findDevice._id);
            }
            utils.saveUserActivity({
                userId: req.user._id,
                title: 'Logged Out!',
                description: (req.user.fullName?req.user.fullName:req.user.email) + ' has logged out.',
            });
            requestHandler.sendSuccess(res, 'Logged out successfully')(null);
        } catch (error) {
            return requestHandler.sendError(req, res, error);
        }
    };


    /* @Method: deviceToken
    // @Description: user device token will be saved automatically from auth.js
    */
    async deviceToken (req, res) {
        try {
            if (req.body.deviceType && req.body.deviceToken) {
                const token = req.headers['token'];
                let findDevice = await userDevicesRepo.getByField({ access_token: token, isDeleted: false, userId: req.user._id });
                if (findDevice) {
                    delete findDevice.userId;
                    delete findDevice.role;
                    delete findDevice.isDeleted;
                    requestHandler.sendSuccess(res, 'This ' + (req.body.deviceType?req.body.deviceType:'') + ' device has been successfully registered for notification.')(findDevice);
                } else {
                    requestHandler.throwError(400, 'Forbidden', 'Something went wrong!')();
                }
            } else {
                requestHandler.throwError(400, 'Forbidden', 'Please check your input fields!')();
            }
        } catch (error) {
            return requestHandler.sendError(req, res, error);
        }
    };


    /* @Method: delete
    // @Description: user delete
    */
    async delete(req, res) {
        try {
            let userDelete = await userRepo.updateById({
                "isDeleted": true
            }, req.user._id);
            if (!_.isEmpty(userDelete) && userDelete._id) {
                utils.deleteUserActivity({userId: userDelete._id});
                userDevicesRepo.bulkDelete({userId: userDelete._id});
                if (userDelete.profile_image) {
                    if (fs.existsSync('./public/uploads/user/profile_pic/' + userDelete.profile_image)) {
                        fs.unlinkSync('./public/uploads/user/profile_pic/' + userDelete.profile_image);
                    }
                }

                requestHandler.sendSuccess(res, 'Your account deleted permanently!')(null);
            } else {
                requestHandler.throwError(400, 'Bad Request', 'Failed to delete your account')();
            }
        } catch (e) {
            return res.status(500).send({
                message: e.message
            });
        }
    };
};

module.exports = new UserController();