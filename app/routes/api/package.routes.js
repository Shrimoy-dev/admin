const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const packageController = require('../../modules/package/controllers/package.controller');
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
 * /package/list:
 *   get:
 *     summary: List All Packages
 *     tags:
 *       - Package
 *     produces:
 *       - application/json
 *     responses:
 *        200:
 *          description: Success
 *        400:
 *         description: Bad Request
 */
namedRouter.get('api.package.list', '/package/list', request_param.any(), packageController.getAll);
namedRouter.all('/package*', auth.authenticateAPI);
/**
 * @swagger
 * /admin/package/save:
 *   post:
 *     summary: Save Package by admin
 *     tags:
 *       - Package
 *     security:
 *       - Token: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - minAmount
 *               - maxAmount 
 *               - intervalInMonths
 *               - roi
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               minAmount:
 *                 type: number
 *               maxAmount:
 *                 type: number
 *               intervalInMonths:
 *                 type: number
 *               roi:
 *                 type: number
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 */

namedRouter.post('api.package.admin.save', '/admin/package/save', request_param.any(), packageController.save);

/**
 * @swagger
 * /admin/package/update:
 *   post:
 *     summary: Update Package by admin
 *     tags:
 *       - Package
 *     security:
 *       - Token: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - minAmount
 *               - maxAmount 
 *               - intervalInMonths
 *               - roi
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               minAmount:
 *                 type: number
 *               maxAmount:
 *                 type: number
 *               intervalInMonths:
 *                 type: number
 *               roi:
 *                 type: number
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 */
namedRouter.post('api.package.admin.update', '/admin/package/update', request_param.any(), packageController.update);

namedRouter.post('api.package.adminList', '/admin/package/list', request_param.any(), packageController.getAllForAdmin);

/**
 * @swagger
 * /admin/package/delete:
 *   post:
 *     summary: Delete Package by admin
 *     tags:
 *       - Package
 *     security:
 *       - Token: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 */
namedRouter.post('api.package.adminDelete', '/admin/package/delete', request_param.any(), packageController.delete);

/**
 * @swagger
 * /admin/package/update-status:
 *   post:
 *     summary: Update status of Package by admin
 *     tags:
 *       - Package
 *     security:
 *       - Token: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 */
namedRouter.post('api.package.admin.updateStatus', '/admin/package/update-status', request_param.any(), packageController.changeStatus);


module.exports = router;