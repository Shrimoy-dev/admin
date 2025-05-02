const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const adminController = require('../../modules/user/controllers/admin.controller');
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

namedRouter.post('api.admin.signin', '/admin/signin', request_param.any(), adminController.signin);

namedRouter.post('api.admin.forgotPassword', '/admin/forgot-password', request_param.any(), adminController.forgotPassword);

namedRouter.post('api.admin.resetPassword', '/admin/reset-password', request_param.any(), adminController.resetPassword);

namedRouter.all('/admin*', auth.authenticateAPI);

namedRouter.post('api.admin.userList', '/admin/user-list', uploadFile.any(), adminController.getAllUsers);

namedRouter.get('api.admin.userDetails', '/admin/user-details', request_param.any(), adminController.getUserDetails);

namedRouter.get('api.admin.user.packageDetails', '/admin/user-package-details', request_param.any(), adminController.userPackageDetails);

/**
 * @swagger
 * /admin/delete-user:
 *   post:
 *     summary: Delete User Account
 *     tags:
 *       - Admin
 *     security:
 *       - Token: []
 *     produces:
 *       - application/json
 *     parameters:
 *         - name: body
 *           in: body
 *           description: User Account Delete
 *           required: true
 *           schema:
 *             type: object
 *             required:
 *                 - id
 *             properties:
 *                 id:
 *                     type: string               
 *     responses:
 *        200:
 *          description: Reset success!
 *        403:
 *          description: No account found!
 *        400:
 *          description: Bad Request
 *        500:
 *          description: Server Error
 */
namedRouter.post('api.admin.user.delete', '/admin/delete-user', request_param.any(), adminController.deleteUser);

/**
 * @swagger
 * /admin/overview-stats:
 *   get:
 *     summary: Overview Stats
 *     tags:
 *       - Admin
 *     security:
 *       - Token: []
 *     produces:
 *       - application/json          
 *     responses:
 *       200:
 *         description: Overview stats fetched successfully!
 *       403:
 *         description: No data found!
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Server Error
 */

namedRouter.get('api.admin.overview.stats', '/admin/overview-stats', request_param.any(), adminController.overview);
/**
 * @swagger
 * /admin/investment-graph:
 *   get:
 *     summary: Overview graph
 *     tags:
 *       - Admin
 *     security:
 *       - Token: []
 *     produces:
 *       - application/json          
 *     responses:
 *       200:
 *         description: Overview graph fetched successfully!
 *       403:
 *         description: No data found!
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Server Error
 */
namedRouter.get('api.admin.investment.graph', '/admin/investment-graph', request_param.any(), adminController.userInvestmentGraph);

module.exports = router;