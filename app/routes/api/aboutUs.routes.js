const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const aboutUsController = require('../../modules/aboutUs/controllers/aboutUs.controller');
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
 * /about-us/data:
 *   get:
 *     summary: Get About Us Data
 *     tags:
 *       - About Us
 *     produces:
 *       - application/json
 *     responses:
 *        200:
 *          description: Success
 *        400:
 *         description: Bad Request
 */
namedRouter.get('api.aboutUs.data', '/about-us/data', request_param.any(), aboutUsController.getData);
namedRouter.all('/admin*', auth.authenticateAPI);
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
namedRouter.post('api.admin.about-us.update', '/admin/about-us-update', request_param.any(), aboutUsController.updateData);

module.exports = router;