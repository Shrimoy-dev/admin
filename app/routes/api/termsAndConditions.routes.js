const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
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

/**
 * @swagger
 * /terms-and-conditions/data:
 *   get:
 *     summary: Get Terms and Conditions Data
 *     tags:
 *       - Terms and Conditions
 *     produces:
 *       - application/json
 *     responses:
 *        200:
 *          description: Success
 *        400:
 *         description: Bad Request
 */
namedRouter.get('api.termsAndConditions.data', '/terms-and-conditions/data', request_param.any(), termsController.getData);
namedRouter.all('/admin*', auth.authenticateAPI);
/**
 * @swagger
 * /admin/terms-update:
 *   get:
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