const passport = require("passport");
const passportJWT = require("passport-jwt");
const users = require('user/models/user.model');
const userDevicesRepo = require('user_devices/repositories/user_devices.repository');
const config = require('../config/index');
const requestIp = require('request-ip');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');
const ExtractJwt = passportJWT.ExtractJwt;
const Strategy = passportJWT.Strategy;
const params = {
    secretOrKey: config.auth.jwtSecret,
    jwtFromRequest: ExtractJwt.fromHeader('token')
};
const RequestHandler = require('../helper/RequestHandler');
const Logger = require('../helper/logger');
const logger = new Logger();
const requestHandler = new RequestHandler(logger);
const mongoose = require('mongoose');

module.exports = () => {
    const strategy = new Strategy(params, (payload, done) => {
      

        users.aggregate([
            { $match: {
                 _id: mongoose.Types.ObjectId(payload.id) } 
                },
            {
                $lookup: {
                    from: 'roles',
                    let: { role: '$role' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$_id", "$$role"] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                isDeleted: 0
                            }
                        }
                    ],
                    as: 'role'
                }
            },
            { $unwind: "$role" },
            {
                $lookup: {
                    from: 'user_devices',
                    let: { userId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$userId", "$$userId"] },
                                        { $eq: ["$isDeleted", false] },
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                isDeleted: 0
                            }
                        }
                    ],
                    as: 'userdevices'
                }
            }
        ]).exec((err, user) => {
            console.log('111111111', user);
            if (err) {
               
                return done(err, false);
            }
            if (user && user.length) {
               
                
                done(null, user[0]);
            } else {
                done(null, false);
            }
        })
    });
    passport.use(strategy);
    return {
        initialize: () => {
            return passport.initialize();
        },
        authenticate: (req, res, next) => {
            passport.authenticate("jwt", config.auth.jwtSession, async (err, user, info) => {
                if (err) {
                    return next(err);
                }
                if (!user) {
                    return res.redirect('/')
                }
                if (user) {
                    let token = req.headers['token'];
                    let parser = new UAParser();
                    let ua = req.headers['user-agent'];
                    let browserName = parser.setUA(ua).getBrowser().name;
                    let fullBrowserVersion = parser.setUA(ua).getBrowser().version;
                    let ip = requestIp.getClientIp(req);
                    if (ip) {
                        let ipDetails = geoip.lookup(ip);
                        if (ipDetails) {
                            let userdevices = [];
                            if (user.userdevices) {
                                userdevices = user.userdevices;
                            }

                            if (userdevices.length) {
                                let deviceData = _.findWhere(userdevices, { access_token: token });
                                if (deviceData && !deviceData.expired) {
                                    // userdevices = userdevices.map(item=>{return (item.access_token != token)?item:null});
                                    // userdevices = _.without(userdevices, null);
                                    let obj = {
                                        session_id: req.sessionID,
                                        deviceToken: (req.body && req.body.deviceToken)?req.body.deviceToken:deviceData.deviceToken,
                                        deviceType: (req.body && req.body.deviceType)?req.body.deviceType:deviceData.deviceType,
                                        ip: ip,
                                        ip_lat: (ipDetails && ipDetails.ll.length>1)?ipDetails.ll[0]:'',
                                        ip_long: (ipDetails && ipDetails.ll.length>1)?ipDetails.ll[1]:'',
                                        browserInfo: {
                                            name: browserName?browserName:'',
                                            version: fullBrowserVersion?fullBrowserVersion:'',
                                        },
                                        deviceInfo: {
                                            vendor: parser.setUA(ua).getDevice().vendor?parser.setUA(ua).getDevice().vendor:'',
                                            model: parser.setUA(ua).getDevice().model?parser.setUA(ua).getDevice().model:'',
                                            type: parser.setUA(ua).getDevice().type?parser.setUA(ua).getDevice().type:'',
                                        },
                                        operatingSystem: {
                                            name: parser.setUA(ua).getOS().name?parser.setUA(ua).getOS().name:'',
                                            version: parser.setUA(ua).getOS().version?parser.setUA(ua).getOS().version:'',
                                        },
                                        last_active: Date.now(),
                                        createdAt: deviceData.createdAt?new Date(deviceData.createdAt):Date.now(),
                                        state: (ipDetails && ipDetails.region)?ipDetails.region:'',
                                        country: (ipDetails && ipDetails.country)?ipDetails.country:'',
                                        city: (ipDetails && ipDetails.city)?ipDetails.city:'',
                                        timezone: (ipDetails && ipDetails.timezone)?ipDetails.timezone:'',
                                        access_token: token,
                                        userId: user._id,
                                        role: user.role._id
                                    }

                                    // userdevices.push(obj);
                                    // await users.findByIdAndUpdate(user._id, { userdevices }, {
                                    //     new: true
                                    // });
                                    await userDevicesRepo.updateById(obj, deviceData._id);
                                } else if (deviceData && deviceData.expired) {
                                    await userDevicesRepo.delete(deviceData._id);
                                    // userdevices = userdevices.map(item=>{return (item.access_token != token)?item:null});
                                    // userdevices = _.without(userdevices, null);
                                    // await users.findByIdAndUpdate(user._id, { userdevices }, {
                                    //     new: true
                                    // });
                                    req.session.destroy(function (err) {
                                        res.redirect('/');
                                    });
                                } else {
                                    let obj = {
                                        session_id: req.sessionID,
                                        deviceToken: (req.body && req.body.deviceToken)?req.body.deviceToken:'',
                                        deviceType: (req.body && req.body.deviceType)?req.body.deviceType:'Web',
                                        ip: ip,
                                        ip_lat: (ipDetails && ipDetails.ll.length>1)?ipDetails.ll[0]:'',
                                        ip_long: (ipDetails && ipDetails.ll.length>1)?ipDetails.ll[1]:'',
                                        browserInfo: {
                                            name: browserName?browserName:'',
                                            version: fullBrowserVersion?fullBrowserVersion:'',
                                        },
                                        deviceInfo: {
                                            vendor: parser.setUA(ua).getDevice().vendor?parser.setUA(ua).getDevice().vendor:'',
                                            model: parser.setUA(ua).getDevice().model?parser.setUA(ua).getDevice().model:'',
                                            type: parser.setUA(ua).getDevice().type?parser.setUA(ua).getDevice().type:'',
                                        },
                                        operatingSystem: {
                                            name: parser.setUA(ua).getOS().name?parser.setUA(ua).getOS().name:'',
                                            version: parser.setUA(ua).getOS().version?parser.setUA(ua).getOS().version:'',
                                        },
                                        last_active: Date.now(),
                                        createdAt: Date.now(),
                                        state: (ipDetails && ipDetails.region)?ipDetails.region:'',
                                        country: (ipDetails && ipDetails.country)?ipDetails.country:'',
                                        city: (ipDetails && ipDetails.city)?ipDetails.city:'',
                                        timezone: (ipDetails && ipDetails.timezone)?ipDetails.timezone:'',
                                        access_token: token,
                                        userId: user._id,
                                        role: user.role._id
                                    }
    
                                    // userdevices.push(obj);
                                    // await users.findByIdAndUpdate(user._id, { userdevices }, {
                                    //     new: true
                                    // });
                                    await userDevicesRepo.save(obj);
                                }
                            } else {
                                let obj = {
                                    session_id: req.sessionID,
                                    deviceToken: (req.body && req.body.deviceToken)?req.body.deviceToken:'',
                                    deviceType: (req.body && req.body.deviceType)?req.body.deviceType:'Web',
                                    ip: ip,
                                    ip_lat: (ipDetails && ipDetails.ll.length>1)?ipDetails.ll[0]:'',
                                    ip_long: (ipDetails && ipDetails.ll.length>1)?ipDetails.ll[1]:'',
                                    browserInfo: {
                                        name: browserName?browserName:'',
                                        version: fullBrowserVersion?fullBrowserVersion:'',
                                    },
                                    deviceInfo: {
                                        vendor: parser.setUA(ua).getDevice().vendor?parser.setUA(ua).getDevice().vendor:'',
                                        model: parser.setUA(ua).getDevice().model?parser.setUA(ua).getDevice().model:'',
                                        type: parser.setUA(ua).getDevice().type?parser.setUA(ua).getDevice().type:'',
                                    },
                                    operatingSystem: {
                                        name: parser.setUA(ua).getOS().name?parser.setUA(ua).getOS().name:'',
                                        version: parser.setUA(ua).getOS().version?parser.setUA(ua).getOS().version:'',
                                    },
                                    last_active: Date.now(),
                                    createdAt: Date.now(),
                                    state: (ipDetails && ipDetails.region)?ipDetails.region:'',
                                    country: (ipDetails && ipDetails.country)?ipDetails.country:'',
                                    city: (ipDetails && ipDetails.city)?ipDetails.city:'',
                                    timezone: (ipDetails && ipDetails.timezone)?ipDetails.timezone:'',
                                    access_token: token,
                                    userId: user._id,
                                    role: user.role._id
                                }

                                // userdevices.push(obj);
                                await userDevicesRepo.save(obj);
                                // await users.findByIdAndUpdate(user._id, { userdevices }, {
                                //     new: true
                                // });
                            }
                        } else {
                            let userdevices = [];
                            if (user.userdevices) {
                                userdevices = user.userdevices;
                            }
                            if (userdevices.length) {
                                let deviceData = _.findWhere(userdevices, { access_token: token });
                                if (deviceData && !deviceData.expired) {
                                    // userdevices = userdevices.map(item=>{return (item.access_token != token)?item:null});
                                    // userdevices = _.without(userdevices, null);
                                    let obj = {
                                        session_id: req.sessionID,
                                        deviceToken: (req.body && req.body.deviceToken)?req.body.deviceToken:deviceData.deviceToken,
                                        deviceType: (req.body && req.body.deviceType)?req.body.deviceType:deviceData.deviceType,
                                        ip: ip,
                                        ip_lat: (ipDetails && ipDetails.ll.length>1)?ipDetails.ll[0]:'',
                                        ip_long: (ipDetails && ipDetails.ll.length>1)?ipDetails.ll[1]:'',
                                        browserInfo: {
                                            name: browserName?browserName:'',
                                            version: fullBrowserVersion?fullBrowserVersion:'',
                                        },
                                        deviceInfo: {
                                            vendor: parser.setUA(ua).getDevice().vendor?parser.setUA(ua).getDevice().vendor:'',
                                            model: parser.setUA(ua).getDevice().model?parser.setUA(ua).getDevice().model:'',
                                            type: parser.setUA(ua).getDevice().type?parser.setUA(ua).getDevice().type:'',
                                        },
                                        operatingSystem: {
                                            name: parser.setUA(ua).getOS().name?parser.setUA(ua).getOS().name:'',
                                            version: parser.setUA(ua).getOS().version?parser.setUA(ua).getOS().version:'',
                                        },
                                        last_active: Date.now(),
                                        createdAt: deviceData.createdAt?new Date(deviceData.createdAt):Date.now(),
                                        state: (ipDetails && ipDetails.region)?ipDetails.region:'',
                                        country: (ipDetails && ipDetails.country)?ipDetails.country:'',
                                        city: (ipDetails && ipDetails.city)?ipDetails.city:'',
                                        timezone: (ipDetails && ipDetails.timezone)?ipDetails.timezone:'',
                                        access_token: token,
                                        userId: user._id,
                                        role: user.role._id
                                    }

                                    // userdevices.push(obj);
                                    // await users.findByIdAndUpdate(user._id, { userdevices }, {
                                    //     new: true
                                    // });
                                    await userDevicesRepo.updateById(obj, deviceData._id);
                                } else if (deviceData && deviceData.expired) {
                                    await userDevicesRepo.delete(deviceData._id);
                                    // userdevices = userdevices.map(item=>{return (item.access_token != token)?item:null});
                                    // userdevices = _.without(userdevices, null);
                                    // await users.findByIdAndUpdate(user._id, { userdevices }, {
                                    //     new: true
                                    // });
                                    req.session.destroy(function (err) {
                                        res.redirect('/');
                                    });
                                } else {
                                    let obj = {
                                        session_id: req.sessionID,
                                        deviceToken: (req.body && req.body.deviceToken)?req.body.deviceToken:'',
                                        deviceType: (req.body && req.body.deviceType)?req.body.deviceType:'Web',
                                        ip: ip,
                                        ip_lat: (ipDetails && ipDetails.ll.length>1)?ipDetails.ll[0]:'',
                                        ip_long: (ipDetails && ipDetails.ll.length>1)?ipDetails.ll[1]:'',
                                        browserInfo: {
                                            name: browserName?browserName:'',
                                            version: fullBrowserVersion?fullBrowserVersion:'',
                                        },
                                        deviceInfo: {
                                            vendor: parser.setUA(ua).getDevice().vendor?parser.setUA(ua).getDevice().vendor:'',
                                            model: parser.setUA(ua).getDevice().model?parser.setUA(ua).getDevice().model:'',
                                            type: parser.setUA(ua).getDevice().type?parser.setUA(ua).getDevice().type:'',
                                        },
                                        operatingSystem: {
                                            name: parser.setUA(ua).getOS().name?parser.setUA(ua).getOS().name:'',
                                            version: parser.setUA(ua).getOS().version?parser.setUA(ua).getOS().version:'',
                                        },
                                        last_active: Date.now(),
                                        createdAt: Date.now(),
                                        state: (ipDetails && ipDetails.region)?ipDetails.region:'',
                                        country: (ipDetails && ipDetails.country)?ipDetails.country:'',
                                        city: (ipDetails && ipDetails.city)?ipDetails.city:'',
                                        timezone: (ipDetails && ipDetails.timezone)?ipDetails.timezone:'',
                                        access_token: token,
                                        userId: user._id,
                                        role: user.role._id
                                    }
    
                                    await userDevicesRepo.save(obj);
                                    // userdevices.push(obj);
                                    // await users.findByIdAndUpdate(user._id, { userdevices }, {
                                    //     new: true
                                    // });
                                }
                            } else {
                                let obj = {
                                    session_id: req.sessionID,
                                    deviceToken: (req.body && req.body.deviceToken)?req.body.deviceToken:'',
                                    deviceType: (req.body && req.body.deviceType)?req.body.deviceType:'Web',
                                    ip: ip,
                                    ip_lat: (ipDetails && ipDetails.ll.length>1)?ipDetails.ll[0]:'',
                                    ip_long: (ipDetails && ipDetails.ll.length>1)?ipDetails.ll[1]:'',
                                    browserInfo: {
                                        name: browserName?browserName:'',
                                        version: fullBrowserVersion?fullBrowserVersion:'',
                                    },
                                    deviceInfo: {
                                        vendor: parser.setUA(ua).getDevice().vendor?parser.setUA(ua).getDevice().vendor:'',
                                        model: parser.setUA(ua).getDevice().model?parser.setUA(ua).getDevice().model:'',
                                        type: parser.setUA(ua).getDevice().type?parser.setUA(ua).getDevice().type:'',
                                    },
                                    operatingSystem: {
                                        name: parser.setUA(ua).getOS().name?parser.setUA(ua).getOS().name:'',
                                        version: parser.setUA(ua).getOS().version?parser.setUA(ua).getOS().version:'',
                                    },
                                    last_active: Date.now(),
                                    createdAt: Date.now(),
                                    state: (ipDetails && ipDetails.region)?ipDetails.region:'',
                                    country: (ipDetails && ipDetails.country)?ipDetails.country:'',
                                    city: (ipDetails && ipDetails.city)?ipDetails.city:'',
                                    timezone: (ipDetails && ipDetails.timezone)?ipDetails.timezone:'',
                                    access_token: token,
                                    userId: user._id,
                                    role: user.role._id
                                }

                                // userdevices.push(obj);
                                await userDevicesRepo.save(obj);
                                // await users.findByIdAndUpdate(user._id, { userdevices }, {
                                //     new: true
                                // });
                            }
                        }
                    }

                    if (user.userdevices) {
                        delete user.userdevices;
                    }
                    req.user = user;
                    return next();
                } else {
                    return res.redirect('/');
                }

            })(req, res, next);
        },
         // This is for webservice jwt token check //
         authenticateAPI: (req, res, next) => {
           
            
             passport.authenticate("jwt", config.auth.jwtSession, async (err, user) => {
               
                
                 if (err) {
                    return requestHandler.throwError(400, 'bad request', 'Please provide a vaid token, your token might have expired')({token_expired:true,auth: false});
                 }
                 if (!user) {
                    return requestHandler.sendError(req, res, {status:401,token_expired:true,auth: false,message:'Sorry user not found!'});
                }
                if (user) {
                    let token = req.headers['token'];
                    let parser = new UAParser();
                    let ua = req.headers['user-agent'];
                    let browserName = parser.setUA(ua).getBrowser().name;
                    let fullBrowserVersion = parser.setUA(ua).getBrowser().version;
                    let ip = requestIp.getClientIp(req);
                    if (ip) {
                        let ipDetails = geoip.lookup(ip);
                        if (ipDetails) {
                            let userdevices = [];
                            if (user.userdevices) {
                                userdevices = user.userdevices;
                            }

                            if (userdevices.length) {
                                let deviceData = _.findWhere(userdevices, { access_token: token });
                                if (deviceData && !deviceData.expired) {
                                    let obj = {
                                        deviceToken: (req.body && req.body.deviceToken)?req.body.deviceToken:deviceData.deviceToken,
                                        deviceType: (req.body && req.body.deviceType)?req.body.deviceType:deviceData.deviceType,
                                        ip: ip,
                                        ip_lat: (ipDetails && ipDetails.ll.length>1)?ipDetails.ll[0]:'',
                                        ip_long: (ipDetails && ipDetails.ll.length>1)?ipDetails.ll[1]:'',
                                        browserInfo: {
                                            name: browserName?browserName:'',
                                            version: fullBrowserVersion?fullBrowserVersion:'',
                                        },
                                        deviceInfo: {
                                            vendor: parser.setUA(ua).getDevice().vendor?parser.setUA(ua).getDevice().vendor:'',
                                            model: parser.setUA(ua).getDevice().model?parser.setUA(ua).getDevice().model:'',
                                            type: parser.setUA(ua).getDevice().type?parser.setUA(ua).getDevice().type:'',
                                        },
                                        operatingSystem: {
                                            name: parser.setUA(ua).getOS().name?parser.setUA(ua).getOS().name:'',
                                            version: parser.setUA(ua).getOS().version?parser.setUA(ua).getOS().version:'',
                                        },
                                        last_active: Date.now(),
                                        createdAt: deviceData.createdAt?new Date(deviceData.createdAt):Date.now(),
                                        state: (ipDetails && ipDetails.region)?ipDetails.region:'',
                                        country: (ipDetails && ipDetails.country)?ipDetails.country:'',
                                        city: (ipDetails && ipDetails.city)?ipDetails.city:'',
                                        timezone: (ipDetails && ipDetails.timezone)?ipDetails.timezone:'',
                                        access_token: token,
                                        userId: user._id,
                                        role: user.role._id
                                    }

                                    await userDevicesRepo.updateById(obj, deviceData._id);
                                } else if (deviceData && deviceData.expired) {
                                    await userDevicesRepo.delete(deviceData._id);
                                    return requestHandler.throwError(400, 'bad request', 'Please sign in again to continue.')({token_expired:true,auth: false});
                                } else {
                                    let obj = {
                                        deviceToken: (req.body && req.body.deviceToken)?req.body.deviceToken:'',
                                        deviceType: (req.body && req.body.deviceType)?req.body.deviceType:'Web',
                                        ip: ip,
                                        ip_lat: (ipDetails && ipDetails.ll.length>1)?ipDetails.ll[0]:'',
                                        ip_long: (ipDetails && ipDetails.ll.length>1)?ipDetails.ll[1]:'',
                                        browserInfo: {
                                            name: browserName?browserName:'',
                                            version: fullBrowserVersion?fullBrowserVersion:'',
                                        },
                                        deviceInfo: {
                                            vendor: parser.setUA(ua).getDevice().vendor?parser.setUA(ua).getDevice().vendor:'',
                                            model: parser.setUA(ua).getDevice().model?parser.setUA(ua).getDevice().model:'',
                                            type: parser.setUA(ua).getDevice().type?parser.setUA(ua).getDevice().type:'',
                                        },
                                        operatingSystem: {
                                            name: parser.setUA(ua).getOS().name?parser.setUA(ua).getOS().name:'',
                                            version: parser.setUA(ua).getOS().version?parser.setUA(ua).getOS().version:'',
                                        },
                                        last_active: Date.now(),
                                        createdAt: Date.now(),
                                        state: (ipDetails && ipDetails.region)?ipDetails.region:'',
                                        country: (ipDetails && ipDetails.country)?ipDetails.country:'',
                                        city: (ipDetails && ipDetails.city)?ipDetails.city:'',
                                        timezone: (ipDetails && ipDetails.timezone)?ipDetails.timezone:'',
                                        access_token: token,
                                        userId: user._id,
                                        role: user.role._id
                                    }
    
                                    await userDevicesRepo.save(obj);
                                }
                            } else {
                                let obj = {
                                    deviceToken: (req.body && req.body.deviceToken)?req.body.deviceToken:'',
                                    deviceType: (req.body && req.body.deviceType)?req.body.deviceType:'Web',
                                    ip: ip,
                                    ip_lat: (ipDetails && ipDetails.ll.length>1)?ipDetails.ll[0]:'',
                                    ip_long: (ipDetails && ipDetails.ll.length>1)?ipDetails.ll[1]:'',
                                    browserInfo: {
                                        name: browserName?browserName:'',
                                        version: fullBrowserVersion?fullBrowserVersion:'',
                                    },
                                    deviceInfo: {
                                        vendor: parser.setUA(ua).getDevice().vendor?parser.setUA(ua).getDevice().vendor:'',
                                        model: parser.setUA(ua).getDevice().model?parser.setUA(ua).getDevice().model:'',
                                        type: parser.setUA(ua).getDevice().type?parser.setUA(ua).getDevice().type:'',
                                    },
                                    operatingSystem: {
                                        name: parser.setUA(ua).getOS().name?parser.setUA(ua).getOS().name:'',
                                        version: parser.setUA(ua).getOS().version?parser.setUA(ua).getOS().version:'',
                                    },
                                    last_active: Date.now(),
                                    createdAt: Date.now(),
                                    state: (ipDetails && ipDetails.region)?ipDetails.region:'',
                                    country: (ipDetails && ipDetails.country)?ipDetails.country:'',
                                    city: (ipDetails && ipDetails.city)?ipDetails.city:'',
                                    timezone: (ipDetails && ipDetails.timezone)?ipDetails.timezone:'',
                                    access_token: token,
                                    userId: user._id,
                                    role: user.role._id
                                }

                                await userDevicesRepo.save(obj);
                            }
                        } else {
                            let userdevices = [];
                            if (user.userdevices) {
                                userdevices = user.userdevices;
                            }
                            if (userdevices.length) {
                                let deviceData = _.findWhere(userdevices, { access_token: token });
                                if (deviceData && !deviceData.expired) {
                                    let obj = {
                                        deviceToken: (req.body && req.body.deviceToken)?req.body.deviceToken:deviceData.deviceToken,
                                        deviceType: (req.body && req.body.deviceType)?req.body.deviceType:deviceData.deviceType,
                                        ip: ip,
                                        ip_lat: (ipDetails && ipDetails.ll.length>1)?ipDetails.ll[0]:'',
                                        ip_long: (ipDetails && ipDetails.ll.length>1)?ipDetails.ll[1]:'',
                                        browserInfo: {
                                            name: browserName?browserName:'',
                                            version: fullBrowserVersion?fullBrowserVersion:'',
                                        },
                                        deviceInfo: {
                                            vendor: parser.setUA(ua).getDevice().vendor?parser.setUA(ua).getDevice().vendor:'',
                                            model: parser.setUA(ua).getDevice().model?parser.setUA(ua).getDevice().model:'',
                                            type: parser.setUA(ua).getDevice().type?parser.setUA(ua).getDevice().type:'',
                                        },
                                        operatingSystem: {
                                            name: parser.setUA(ua).getOS().name?parser.setUA(ua).getOS().name:'',
                                            version: parser.setUA(ua).getOS().version?parser.setUA(ua).getOS().version:'',
                                        },
                                        last_active: Date.now(),
                                        createdAt: deviceData.createdAt?new Date(deviceData.createdAt):Date.now(),
                                        state: (ipDetails && ipDetails.region)?ipDetails.region:'',
                                        country: (ipDetails && ipDetails.country)?ipDetails.country:'',
                                        city: (ipDetails && ipDetails.city)?ipDetails.city:'',
                                        timezone: (ipDetails && ipDetails.timezone)?ipDetails.timezone:'',
                                        access_token: token,
                                        userId: user._id,
                                        role: user.role._id
                                    }

                                    await userDevicesRepo.updateById(obj, deviceData._id);
                                } else if (deviceData && deviceData.expired) {
                                    await userDevicesRepo.delete(deviceData._id);
                                    return requestHandler.throwError(400, 'bad request', 'Please sign in again to continue.')({token_expired:true,auth: false});
                                } else {
                                    let obj = {
                                        deviceToken: (req.body && req.body.deviceToken)?req.body.deviceToken:'',
                                        deviceType: (req.body && req.body.deviceType)?req.body.deviceType:'Web',
                                        ip: ip,
                                        ip_lat: (ipDetails && ipDetails.ll.length>1)?ipDetails.ll[0]:'',
                                        ip_long: (ipDetails && ipDetails.ll.length>1)?ipDetails.ll[1]:'',
                                        browserInfo: {
                                            name: browserName?browserName:'',
                                            version: fullBrowserVersion?fullBrowserVersion:'',
                                        },
                                        deviceInfo: {
                                            vendor: parser.setUA(ua).getDevice().vendor?parser.setUA(ua).getDevice().vendor:'',
                                            model: parser.setUA(ua).getDevice().model?parser.setUA(ua).getDevice().model:'',
                                            type: parser.setUA(ua).getDevice().type?parser.setUA(ua).getDevice().type:'',
                                        },
                                        operatingSystem: {
                                            name: parser.setUA(ua).getOS().name?parser.setUA(ua).getOS().name:'',
                                            version: parser.setUA(ua).getOS().version?parser.setUA(ua).getOS().version:'',
                                        },
                                        last_active: Date.now(),
                                        createdAt: Date.now(),
                                        state: (ipDetails && ipDetails.region)?ipDetails.region:'',
                                        country: (ipDetails && ipDetails.country)?ipDetails.country:'',
                                        city: (ipDetails && ipDetails.city)?ipDetails.city:'',
                                        timezone: (ipDetails && ipDetails.timezone)?ipDetails.timezone:'',
                                        access_token: token,
                                        userId: user._id,
                                        role: user.role._id
                                    }
    
                                    await userDevicesRepo.save(obj);
                                }
                            } else {
                                let obj = {
                                    deviceToken: (req.body && req.body.deviceToken)?req.body.deviceToken:'',
                                    deviceType: (req.body && req.body.deviceType)?req.body.deviceType:'Web',
                                    ip: ip,
                                    ip_lat: (ipDetails && ipDetails.ll.length>1)?ipDetails.ll[0]:'',
                                    ip_long: (ipDetails && ipDetails.ll.length>1)?ipDetails.ll[1]:'',
                                    browserInfo: {
                                        name: browserName?browserName:'',
                                        version: fullBrowserVersion?fullBrowserVersion:'',
                                    },
                                    deviceInfo: {
                                        vendor: parser.setUA(ua).getDevice().vendor?parser.setUA(ua).getDevice().vendor:'',
                                        model: parser.setUA(ua).getDevice().model?parser.setUA(ua).getDevice().model:'',
                                        type: parser.setUA(ua).getDevice().type?parser.setUA(ua).getDevice().type:'',
                                    },
                                    operatingSystem: {
                                        name: parser.setUA(ua).getOS().name?parser.setUA(ua).getOS().name:'',
                                        version: parser.setUA(ua).getOS().version?parser.setUA(ua).getOS().version:'',
                                    },
                                    last_active: Date.now(),
                                    createdAt: Date.now(),
                                    state: (ipDetails && ipDetails.region)?ipDetails.region:'',
                                    country: (ipDetails && ipDetails.country)?ipDetails.country:'',
                                    city: (ipDetails && ipDetails.city)?ipDetails.city:'',
                                    timezone: (ipDetails && ipDetails.timezone)?ipDetails.timezone:'',
                                    access_token: token,
                                    userId: user._id,
                                    role: user.role._id
                                }

                                await userDevicesRepo.save(obj);
                            }
                        }
                    }

                    if (user.userdevices) {
                        delete user.userdevices;
                    }
                }
                req.user = user;
                return next();
             })(req, res, next);
         }
    };
};