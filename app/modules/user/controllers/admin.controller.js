const moment = require('moment');
const mongoose = require('mongoose');
const Logger = require(appRoot + '/helper/logger');
const logger = new Logger();
const RequestHandler = require(appRoot + '/helper/RequestHandler');
const requestHandler = new RequestHandler(logger);
const otp = require('otp-generator');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const User = require('../../user/models/user.model');
const userRepo = require('../../user/repositories/user.repository');
const roleRepo = require('../../roles/repositories/role.repository');
const utils = require(appRoot + '/helper/utils');
const crypto = require('crypto');


class AdminController {
    constructor () {}
      async signin (req, res) {
           try {
               if (!req.body.email) {
                   requestHandler.throwError(400, 'Bad Request', 'Email is required.')();
               } else
               if (!req.body.password) {
                   requestHandler.throwError(400, 'Bad Request', 'Password is required.')();
               } else {
                   req.body.email = req.body.email.trim().toLowerCase();
                   const userRole = await roleRepo.getByField({ role: "admin" });
                   const userExist = await userRepo.getByField({ email: req.body.email, role: userRole._id, isDeleted: false });
                   console.log('userExist', userExist);
                   
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
                       requestHandler.throwError(403, 'Bad Request', 'Oops! No user found. Kindly contact support.')();
                   }
               }
           } catch (error) {
               return requestHandler.sendError(req, res, error);
           }
       };
       
    /*
        @Method: forgotPassword
        @Description: Admin forgotPassword
    */
        async forgotPassword(req, res) {
            try {
                if (!req.body?.email?.trim()) {
                   return requestHandler.throwError(400, 'Bad Request', 'Email is required.')();
                } 
                req.body.email = req.body.email.trim().toLowerCase().toString();
                let roleDetails = await roleRepo.getByField({ role: "admin" });
                let user = await User.findOne({ email: { $regex: '^' + req.body.email + '$', $options: 'i' }, role: { $in: [roleDetails._id] } }).exec();
                
                if (!user) {
                    requestHandler.throwError(403, 'Bad Request', 'Oops! No user found. Kindly contact support.')();
                } else {
        
                        // Encrypt email
                        const encryptedEmail = encryptEmail(user.email);
                    
                        // Build reset link
                        const resetLink = `${process.env.FRONT_END_URL}/admin/reset-password
?q=${encodeURIComponent(encryptedEmail)}`;
        
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
                let roleDetails = await roleRepo.getByField({ role: "admin" });
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

        async getAllUsers (req, res) {
            try {
                if (req.user.role.role !== 'admin') {
                    return requestHandler.throwError(403, 'Forbidden', 'You are not authorized to access this resource.')();
                }
                let role = await roleRepo.getByField({ role: "user" });
                req.body.role = role.role;
                let users = await userRepo.getAllUsers(req);
                if (_.isNull(users) && _.isEmpty(users)) {
                    return requestHandler.throwError(404, 'Not Found', 'No users found.')();
                } else {
                  return  requestHandler.sendSuccess(res, "User list fetched successfully.")(users);
                }
               
            } catch (error) {
                return requestHandler.sendError(req, res, error);
            }
        }

        async getUserDetails (req, res) {
            try {
                console.log('getUserDetails', req.query);
                
                if (!req.query?.id?.trim()) {
                    return requestHandler.throwError(400, 'Bad Request', 'User id is required.')();
                }
                if (req.user.role.role !== 'admin') {
                    return requestHandler.throwError(403, 'Forbidden', 'You are not authorized to access this resource.')();
                }
                let user = await userRepo.getUserDetails(req.query.id);
                if (_.isNull(user) && _.isEmpty(user)) {
                    return requestHandler.throwError(404, 'Not Found', 'No users found.')();
                } else {
                  return  requestHandler.sendSuccess(res, "User details fetched successfully.")(user[0]);
                }
               
            } catch (error) {
                return requestHandler.sendError(req, res, error);
            }
        }

        async deleteUser (req, res) {
            try {
                if (!req.body?.id?.trim()) {
                    return requestHandler.throwError(400, 'Bad Request', 'User id is required.')();
                }
                if (req.user.role.role !== 'admin') {
                    return requestHandler.throwError(403, 'Forbidden', 'You are not authorized to access this resource.')();
                }
                let user = await userRepo.updateById( { isDeleted: true }, req.body.id,);
                if (_.isNull(user)) {
                    return requestHandler.throwError(404, 'Not Found', 'No users found.')();
                } else {
                  return  requestHandler.sendSuccess(res, "User deleted successfully.")(user);
                }
               
            } catch (error) {
                return requestHandler.sendError(req, res, error);
            }
        }
}

module.exports = new AdminController();

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


