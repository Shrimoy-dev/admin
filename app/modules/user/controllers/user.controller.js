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
const packageRepo = require('../../package/repositories/package.repository');
const userPackageRepo = require('../../userPackage/repositories/userPackage.repository');
const userDevicesRepo = require('user_devices/repositories/user_devices.repository');
const crypto = require('crypto');

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
                    // req.body.fullName = req.body.first_name + ' ' + req.body.last_name;
                    const saveUser = await userRepo.save(req.body);
                    if (saveUser && saveUser._id) {
                        if (req.body.packageId) {
                            let packageData = await packageRepo.getById( req.body.packageId);
                            let packageParams = {
                                userId: saveUser._id,
                                packageId: req.body.packageId,
                                currentPeriodStart: new Date(),
                                currentPeriodEnd: moment().add(packageData.intervalInMonths, 'months').format('YYYY-MM-DD'),
                                status: 'Active'
                            }
                            await userPackageRepo.save(packageParams);
                        }
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

                await userRepo.updateById({
                    isOtpVerified: true,
                    otp: '',
                    otpExpireTime: null
                }, findUser._id);
                requestHandler.sendSuccess(res, 'Email verified successfully! Please login to continue')();
            } 
             else {
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

     /* @Method: delete
    // @Description: user delete
    */
   async getProfile(req, res) {
        try {
            let userDetails = await userRepo.getUserDetails( req.user._id);
            if (!userDetails || userDetails.length == 0) {
                requestHandler.throwError(400, 'Bad Request', 'User not found!')();
            } else {
                requestHandler.sendSuccess(res, "Profile details fetched successfully.")(userDetails[0]);
            }
        } catch (error) {
            return requestHandler.sendError(req, res, error);
        }
    }
    /* @Method: dashboardData
    // @Description: Get dashboard data
    */
   async dashboardData(req, res) {
        try {
            let userDetails = await userRepo.getById(req.user._id);
            if (!userDetails || userDetails.length == 0) {
                requestHandler.throwError(400, 'Bad Request', 'User not found!')();
            } else {
                let userDashboardData = await userRepo.getUserDashboardData( req.user._id );
                if (!_.isNull(userDashboardData)) {
                    requestHandler.sendSuccess(res, "Dashboard data fetched successfully.")(userDashboardData[0]);
                } else {
                    requestHandler.throwError(400, 'Bad Request', 'Something went wrong!')();
                }
               
            }
        } catch (error) {
            return requestHandler.sendError(req, res, error);
        }
    }

    /* @Method: forgetPassword
    // @Description: User forgot password
    */

         async forgotPassword(req, res) {
                   try {
                       if (!req.body?.email?.trim()) {
                          return requestHandler.throwError(400, 'Bad Request', 'Email is required.')();
                       } 
                       req.body.email = req.body.email.trim().toLowerCase().toString();
                       let roleDetails = await roleRepo.getByField({ role: "user" });
                       let user = await User.findOne({ email: { $regex: '^' + req.body.email + '$', $options: 'i' }, role: { $in: [roleDetails._id] } }).exec();
                       
                       if (!user) {
                           requestHandler.throwError(403, 'Bad Request', 'Oops! No user found. Kindly contact support.')();
                       } else {
               
                               // Encrypt email
                               const encryptedEmail = encryptEmail(user.email);
                           
                               // Build reset link
                               const resetLink = `${process.env.FRONT_END_URL}/reset-password?q=${encodeURIComponent(encryptedEmail)}`;
               
                               let emailData = { 
                                   name: user.fullName,
                                   resetLink: resetLink // <-- send the reset link!
                               };
               
                               let sendMail = await mailHelper.sendMail(
                                   `${project_name} Admin<${process.env.FROM_EMAIL}>`, 
                                   user.email, 
                                   `Forgot Password || ${project_name}`, 
                                   'admin-forgot-pass', 
                                   emailData
                               );
               
                               if (sendMail) {
                                   requestHandler.sendSuccess(res, "Reset link sent via email.")();
                               } else {
                                   requestHandler.throwError(400, 'Bad Request', 'Something went wrong!')();
                               }
                           
                       }
                   } catch (e) {
                       console.log(e);
                       
                       return requestHandler.sendError(req, res, e);
                   }
               }

             async  resetPassword(req, res) {
                        try {
                            if (!req.body?.token?.trim()) {
                                return requestHandler.throwError(400, 'Bad Request', 'Encrypted token is required.')();
                            }
                            if (!req.body?.newPassword?.trim()) {
                                return requestHandler.throwError(400, 'Bad Request', 'New password is required.')();
                            }
                            const encryptedEmail = req.body.token.trim();
                            // Decrypt the email
                            const userEmail = decryptEmail(encryptedEmail);
                    
                            // Find the user by decrypted email
                            let roleDetails = await roleRepo.getByField({ role: "user" });
                            let user = await User.findOne({ email: userEmail, role: { $in: [roleDetails._id] } }).exec();
                    
                            if (!user) {
                                return requestHandler.throwError(403, 'Bad Request', 'User not found or invalid email.')();
                            }
                    
                            // Generate a new random password
                            // let random_pass = utils.betweenRandomNumber(10000000, 99999999);
                            // let readable_pass = random_pass.toString();
                            // random_pass = new User().generateHash(random_pass.toString());
                            let userPass = new User().generateHash(req.body.newPassword);
                            // Update user password in the database
                            let updatedUser = await User.findByIdAndUpdate(user._id, { password: userPass }).exec();
                    
                            if (!updatedUser) {
                                return requestHandler.throwError(400, 'Bad Request', 'Unable to reset password at this time.')();
                            } else {
                               return requestHandler.sendSuccess(res, "Password reset successfully. Please signin to continue")(); 
                            }
                        } catch (e) {
                            console.log('eeeeeeeeeeeeeeeeeeeeee', e);
                            return requestHandler.sendError(req, res, e);
                        }
                    }
};

module.exports = new UserController();

function encryptEmail(email) {
    const algorithm = 'aes-256-cbc';
    const secretKey = process.env.ENCRYPTION_SECRET_KEY; // must be 32 bytes
    const iv = crypto.randomBytes(16); // Initialization vector

    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, 'utf8'), iv);
    let encrypted = cipher.update(email, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return IV + encrypted data (both hex)
    return iv.toString('hex') + ':' + encrypted;
}
function decryptEmail(encryptedText) {
    if (!encryptedText) {
        throw new Error("No encrypted text provided");
    }

    // URL-decode the encrypted string to handle '%3A'
    const decodedText = decodeURIComponent(encryptedText); // This will convert '%3A' back to ':'

    const algorithm = 'aes-256-cbc';
    const secretKey = process.env.ENCRYPTION_SECRET_KEY;

    // Split the decoded text into IV and encrypted data
    const parts = decodedText.split(':');

    // Ensure parts are correctly split
    if (parts.length !== 2) {
        throw new Error("Invalid encrypted text format");
    }

    const iv = Buffer.from(parts[0], 'hex'); // IV is the first part
    const encrypted = parts[1]; // Encrypted data is the second part

    if (!iv || !encrypted) {
        throw new Error("Invalid IV or encrypted data");
    }

    try {
        const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey, 'utf8'), iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted; // Returns the original email
    } catch (err) {
        console.error('Decryption error:', err);
        throw new Error("Failed to decrypt email");
    }
}