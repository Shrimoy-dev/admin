const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const userController = require('../../modules/user/controllers/user.controller');
const multer = require('multer');
const fs = require('fs');

const Storage = multer.diskStorage({
    destination: (req, file, callback) => {
        if (!fs.existsSync("./public/uploads/user")) {
            fs.mkdirSync("./public/uploads/user");
        }
        if (!fs.existsSync("./public/uploads/user/profile_pic")) {
            fs.mkdirSync("./public/uploads/user/profile_pic");
        }
        callback(null, "./public/uploads/user/profile_pic");

    },
    filename: (req, file, callback) => {
        callback(null, Date.now() + "_" + file.originalname.replace(/\s/g, '_'));
    }
});

const uploadFile = multer({
    storage: Storage
});
const request_param = multer();


/**
 * @swagger
 * /user/signup:
 *   post:
 *     summary: Create User Account
 *     tags:
 *       - User
 *     produces:
 *       - application/json
 *     parameters:
 *      - in: formData
 *        name: profile_image
 *        type: file
 *        description: The image file to upload.
 *      - in: body
 *        name: body
 *        description: User Account Create
 *        required: true
 *        schema:
 *             type: object
 *             required:
 *                 - email
 *                 - password
 *                 - first_name
 *                 - last_name
 *                 - fullName
 *             properties:
 *                 email:
 *                     type: string 
 *                 password:
 *                     type: string
 *                 first_name:
 *                     type: string
 *                 last_name:
 *                     type: string
 *                 fullName:
 *                     type: string
 *                 phone:
 *                     type: string
 *                 packageId:
 *                     type: string
 *     responses:
 *        200:
 *          description: Account created successfully!
 *        403:
 *          description: Account already exist
 *        400:
 *          description: Bad Request
 *        500:
 *          description: Server Error
 */
//User signup Route
namedRouter.post('api.user.signup', '/user/signup', uploadFile.any(), userController.signup);

namedRouter.post('api.user.verifyEmail', '/user/verify-email', userController.verifyEmail);

/**
 * @swagger
 * /user/signin:
 *   post:
 *     summary: Signin
 *     tags:
 *       - Auth
 *     produces:
 *       - application/json
 *     parameters:
 *         - name: body
 *           in: body
 *           description: User Account Signin
 *           required: true
 *           schema:
 *             type: object
 *             required:
 *                 - email
 *                 - password
 *             properties:
 *                 email:
 *                     type: string
 *                 password:
 *                     type: string
 *                 
 *     responses:
 *        200:
 *          description: Logged in successfully!
 *        403:
 *          description: No account found!
 *        400:
 *          description: Bad Request
 *        500:
 *          description: Server Error
 */
//User signin Route
namedRouter.post('api.user.signin', '/user/signin', request_param.any(), userController.signin);


namedRouter.all('/user*', auth.authenticateAPI);

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: Profile Details
 *     tags:
 *       - User
 *     security:
 *       - Token: []
 *     produces:
 *       - application/json
 *     responses:
 *        200:
 *          description: Profile Details Fetched Successfully
 *        400:
 *          description: Bad Request
 */
// User Profile Details route
namedRouter.get('api.user.profile', '/user/profile', userController.getProfile);

/**
 * @swagger
 * /user/device-token:
 *   post:
 *     summary: Submit Device Token
 *     tags:
 *       - User
 *     security:
 *       - Token: []
 *     produces:
 *       - application/json
 *     parameters:
 *         - name: body
 *           in: body
 *           description: Submit User Device Type and Device Token to register device for Notification whenever user navigates to the dashboard page after signup/signin. <br><h4>Valid Enum for deviceType field = Web,iOS,Android</h4>
 *           required: true
 *           schema:
 *             type: object
 *             required:
 *                 - deviceToken
 *                 - deviceType
 *             properties:
 *                 deviceToken:
 *                     type: string 
 *                 deviceType:
 *                     type: string
 *                     enum: [Web,iOS,Android]
 *                 
 *     responses:
 *        200:
 *          description: Profile Details Fetched Successfully
 *        400:
 *          description: Bad Request
 */
// User Device Token Submit route
namedRouter.post('api.user.deviceToken', '/user/device-token', userController.deviceToken);

/**
 * @swagger
 * /user/delete:
 *   get:
 *     summary: User Account Delete
 *     tags:
 *       - User
 *     security:
 *       - Token: []
 *     produces:
 *       - application/json
 *     responses:
 *        200:
 *          description: Account Deleted Successfully
 *        400:
 *          description: Bad Request
 */
// User Account Delete route
namedRouter.get('api.user.delete', '/user/delete', userController.delete);

namedRouter.get('api.user.dashboard', '/user/dashboard-data', userController.dashboardData);

/**
  * @swagger
  * /user/logout:
  *   get:
  *     summary: User Logout
  *     tags:
  *       - User
  *     security:
  *       - Token: []
  *     produces:
  *       - application/json
  *     responses:
  *       200:
  *         description: User Logged Out Successfully
  *       400:
  *         description: Bad Request
  *       500:
  *         description: Server Error
*/
// User Account Logout route
namedRouter.get('api.user.logout', '/user/logout', userController.logout);


module.exports = router;