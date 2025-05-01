const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const userPackageController = require('../../modules/userPackage/controllers/userPackage.controller');
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
namedRouter.all('/user-package*', auth.authenticateAPI);
/**
 * @swagger
 * /user-package/save:
 *   post:
 *     summary: Save User Package
 *     tags:
 *       - User Package
 *     security:
 *       - Token: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               packageId:
 *                 type: string
 *               investment:
 *                 type: number
 *     responses:
 *        200:
 *          description: Success
 *        400:
 *         description: Bad Request
 * 
 */
namedRouter.post('api.userPackage.save', '/user-package/save', request_param.any(), userPackageController.save);
module.exports = router