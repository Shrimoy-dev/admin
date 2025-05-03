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



module.exports = router;