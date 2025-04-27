// core modules
const { join, resolve } = require('path');
const http = require('http');
// 3rd party modules
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const engine = require('ejs-locals');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
// Import module in global scope
require('app-module-path').addPath(__dirname + '/app/modules');
require('mongoose-pagination');
require('dotenv').config();
_ = require("underscore");


// custom modules will goes here
global.appRoot = join(__dirname, '/app');
config = require(resolve(join(__dirname, 'app/config', 'index')));
utils = require(resolve(join(__dirname, 'app/helper', 'utils')));
global.auth = require(resolve(join(__dirname, 'app/middlewares', 'auth')))();
mailHelper = require(appRoot + '/helper/mailer');
// webpush_public_key = config.webPush.publicKey;

// For track log //
const Logger = require(resolve(join(__dirname, 'app/helper', 'logger')));
const logger = new Logger();

const app = express();
const namedRouter = require('route-label')(app);

app.set('views', [join(__dirname, './app/views'), join(__dirname, './app/modules')]);
app.engine('ejs', engine);
app.set('view engine', 'ejs');

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


/*****************************************************/
/********* Functions + variable declaration *********/
/***************************************************/

const isProd = config.app.isProd;
const getPort = config.app.port;
const getApiFolderName = config.app.getApiFolderName;

const getAdminFolderName = config.app.getAdminFolderName;
app.locals.moment = require('moment');
// Inclide main view path for (admin) //
app.locals.layout_directory = '../../../views/layouts';
app.locals.module_directory = '../../../../app/modules/';
app.locals.partial_directory = '../../../views/partials';
global.project_description = config.app.project_description;
global.project_name = config.app.project_name;
global.generateUrl = generateUrl = (route_name, route_param = {}) => namedRouter.urlFor(route_name, route_param);
global.generateUrlWithQuery = generateUrlWithQuery = (route_name, route_param = {}, route_query = {}) => namedRouter.urlFor(route_name, route_param, route_query);
adminThemeConfig = config.theme;

/***************  Swagger API DOC ***************/
const swaggerAdmin = require(resolve(join(__dirname, 'app/helper', 'swagger')));
app.use('/', swaggerAdmin.router);
/************************************************/

/******************** Middleware registrations *******************/
app.use(cors());
app.use(flash());
app.use(session({ secret: 'delivery@&beverage@#', resave: true, saveUninitialized: true }));
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000
})); // get information from html forms
app.use(bodyParser.json({
    limit: "50mb"
}));

app.use(express.static('./public'));

app.use((req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, max-age=3600');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    res.locals.messages = req.flash();
    auth = require(resolve(join(__dirname, 'app/middlewares', "auth")))(req, res, next);
    app.use(auth.initialize());
    // This is for admin end
    if (req.session.token && req.session.token != null) {
        req.headers['token'] = req.session.token;
    }
    // This is for webservice end
    if (req.headers['x-access-token'] != null) {
        req.headers['token'] = req.headers['x-access-token'];
    }
    // add this line to include winston logging
    next();
});
app.get('/', function (req, res) {
    // On getting the home route request,
    // the user will be redirected to GFG website
    // console.log('home route called');
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ADMIN Api!');

    // res.redirect(process.env.FRONTEND_WEBSITE_URL);
});
// For Error log 
app.use(function (err, req, res, next) {
    logger.log(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, 'error');
});


/**
 * Event listener for HTTP server "error" event.
 */
const onError = (error) => {
    const port = getPort;
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string' ?
        'Pipe ' + port :
        'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(0);
            break;
        default:
            throw error;
    }
}

(async () => {
    try {
        // Database connection//
        // await require(resolve(join(__dirname, 'app/config', 'database')))();

        /******************* Routes Api ************/
        const apiFiles = await utils._readdir(`./app/routes/${getApiFolderName}`);
        apiFiles.forEach(file => {

            if (!file && file[0] == '.') return;
            namedRouter.use('', `/${getApiFolderName}`, require(join(__dirname, file)));
        });

        /*********************** Routes Admin **********************/
        const adminApiFiles = await utils._readdir(`./app/routes/${getAdminFolderName}`);
        adminApiFiles.forEach(file => {
            if (!file && file[0] == '.') return;
            namedRouter.use('', require(join(__dirname, file)));
            // namedRouter.use('', `/${getAdminFolderName}`, require(join(__dirname, file)));
        });

        

        namedRouter.buildRouteTable();
        if (!isProd && process.env.SHOW_NAMED_ROUTES === 'true') {
            routeList = namedRouter.getRouteTable();
            console.log(routeList);
        }

        // const dbDriver = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}>@cluster0.uub861e.mongodb.net/${process.env.DB_DATABASE}`;
        const dbDriver = process.env.DB_URI;
        const port = process.env.PORT || 1579;

await mongoose.connect(dbDriver, {
    useUnifiedTopology: true,
    useNewUrlParser: true
}).then(res => {
    app.listen(port, () => {
        console.log('DB is connected');
        console.log(`Server is connected @ http://localhost:${port}`);
    })
}).catch(err => {
    console.log(err);
})
        /******************* Service Launch *****************/
        // const server = http.createServer(app);
        // server.listen(getPort);
        // server.on('error', onError);
        // console.log(`${config.app.project_name} is running on ${(global.BASE_URL && global.BASE_URL !== '') ? global.BASE_URL : `http://${process.env.HOST}:${getPort}`}`);
    } catch (error) {
        console.error(error);
    }
})();

module.exports = app;