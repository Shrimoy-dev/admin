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
 *               - amount
 *               - intervalInMonths
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               intervalInMonths:
 *                 type: number
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Bad Request
 */

namedRouter.post('api.package.save', '/admin/package/save', request_param.any(), packageController.save);
namedRouter.post('api.package.adminList', '/admin/package/list', request_param.any(), packageController.getAllForAdmin);
namedRouter.post('api.package.adminDelete', '/admin/package/delete', request_param.any(), packageController.delete);


module.exports = router;