const express = require('express');
const routeLabel = require('route-label');
const router = express.Router();
const namedRouter = routeLabel(router);
const settingsController = require('../../modules/settings/controllers/settings.controller');
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
 * /settings/data:
 *   get:
 *     summary: Get Settings Data
 *     tags:
 *       - Settings
 *     produces:
 *       - application/json
 *     responses:
 *        200:
 *          description: Success
 *        400:
 *         description: Bad Request
 */
namedRouter.get('api.settings.data', '/settings/data', request_param.any(), settingsController.getData);
namedRouter.all('/admin*', auth.authenticateAPI);
/**
 * @swagger
 * /admin/settings-update:
 *   post:
 *     summary: Update Settings Data
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
 *             properties:
 *               minInvestment:
 *                 type: number
 *                 example: 1000
 *               maxInvestment:
 *                 type: number
 *                 example: 15000
 *               investStep:
 *                 type: number
 *                 example: 500
 *               punblishDay:
 *                 type: number
 *                 example: 2
 *               facebookLink:
 *                 type: string
 *                 example: "https://facebook.com/examplepage"
 *               twitterLink:
 *                 type: string
 *                 example: "https://twitter.com/example"
 *               instagramLink:
 *                 type: string
 *                 example: "https://instagram.com/exampleprofile"
 *               youtubeLink:
 *                 type: string
 *                 example: "https://youtube.com/channel/example"
 *               linkedinLink:
 *                 type: string
 *                 example: "https://linkedin.com/in/example"
 *               telegramLink:
 *                 type: string
 *                 example: "https://t.me/examplegroup"
 *               contactNumber:
 *                 type: string
 *                 example: "+1-800-555-1234"
 *               phone:
 *                 type: string
 *                 example: "+1-800-555-5678"
 *               email:
 *                 type: string
 *                 example: "contact@example.com"
 *               address:
 *                 type: string
 *                 example: "123 Main Street, Example City, EX 12345"
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *                 example: "Active"
 *               isDeleted:
 *                 type: boolean
 *                 example: false
 *     responses:
 *        200:
 *          description: Settings updated successfully
 *        400:
 *          description: Bad Request
 */

namedRouter.post('api.admin.settings.update', '/admin/settings-update', request_param.any(), settingsController.updateData);

module.exports = router;