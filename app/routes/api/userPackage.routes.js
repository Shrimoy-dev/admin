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
 *     summary: Save User Package (for user)
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

/**
 * @swagger
 * /admin/user-package/update:
 *   post:
 *     summary: Update multiple user packages (for admin)
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
 *               user_packages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: ID of the user package
 *                     investment:
 *                       type: number
 *                     monthlyData:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                             example: jan
 *                           interestAmount:
 *                             type: number
 *     responses:
 *       200:
 *         description: Packages updated successfully.
 *       400:
 *         description: Bad Request - Missing or invalid input.
 *       403:
 *         description: Forbidden - Not authorized.
 *       500:
 *         description: Internal Server Error.
 */

namedRouter.post('api.admin.userPackage.save', '/admin/user-package/update', request_param.any(), userPackageController.updatePackage);
module.exports = router