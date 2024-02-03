// core modules
const {join, resolve } = require('path');
const express = require('express');
require('app-module-path').addPath(__dirname + '/app/modules');
require('dotenv').config();
const fs = require('fs');
const app = express();
const namedRouter = require('route-label')(app);
global.auth = require(resolve(join(__dirname, 'app/middlewares', 'auth')))();
global.appRoot = join(__dirname, '/app');


//Admin Route List //
// const userRoutes = require(resolve(join(__dirname, '/app/routes/admin', '/user.routes')));
// const roleRoutes = require(resolve(join(__dirname, '/app/routes/admin', '/role.routes')));
// const settingRoutes = require(resolve(join(__dirname, '/app/routes/admin', '/setting.routes')));
// app.use("/admin", userRoutes,roleRoutes,settingRoutes);

module.exports = app;