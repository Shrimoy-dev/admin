const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const adminController = require('../../modules/user/controllers/admin.controller');
const abputUsController = require('../../modules/aboutUs/controllers/aboutUs.controller');
const termsController = require('../../modules/termsAndConditions/controllers/termsAndConditions.controller');
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

/**
 * @swagger
 * /admin/about-us-update:
 *   post:
 *     summary: Update About Us Data
 *     tags:
 *       - Admin
 *     security:
 *       - Token: []
 *     produces:
 *       - application/json
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *        200:
 *          description: About Us updated successfully
 *        400:
 *         description: Bad Request
 */
namedRouter.post('api.admin.about-us.update', '/admin/about-us-update', request_param.any(), abputUsController.updateData);

/**
 * @swagger
 * /admin/terms-update:
 *   post:
 *     summary: Update Terms and Conditions Data
 *     tags:
 *       - Admin
 *     security:
 *       - Token: []
 *     produces:
 *       - application/json
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *        200:
 *          description: Terms and Conditions updated successfully
 *        400:
 *         description: Bad Request
 */
namedRouter.post('api.admin.terms.update', '/admin/terms-update', request_param.any(), termsController.updateData);

module.exports = router;