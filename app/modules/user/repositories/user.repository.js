const mongoose = require('mongoose');
const User = require('../models/user.model');
const perPage = config.other.pageLimit;

const userRepository = {
    fineOneWithRole: async (params) => {
        try {
            let user = await User.findOne({
                email: params.email,
                role: { $in: params.roles },
                isDeleted: false,
                status: "Active"
            }).populate('role').exec();

            if (!user) {
                throw {
                    "status": 500,
                    data: null,
                    "message": 'Authentication failed. User not found.'
                }
            }

            if (!user.validPassword(params.password, user.password)) {
                throw {
                    "status": 500,
                    data: null,
                    "message": 'Authentication failed. Wrong password.'
                }
            } else {
                throw {
                    "status": 200,
                    data: user,
                    "message": ""
                }
            }
        } catch (e) {
            return e;
        }
    },


    getAllUsers: async (req) => {
        try {
            let conditions = {};
            let and_clauses = [];
           
            
            and_clauses.push({ "isDeleted": false, parent_id: null });
            and_clauses.push({ "user_role.role": req.body.role });

            if (_.isObject(req.body) && _.has(req.body, 'search')) {
                and_clauses.push({
                    $or: [
                        { 'fullName': { $regex: req.body.search.trim(), $options: 'i' } },
                        { 'email': { $regex: '^' + req.body.search.trim(), $options: 'i' } },
                    ]
                });
            }

            conditions['$and'] = and_clauses;

            let sortOperator = { "$sort": {} };
            if (_.has(req.body, 'order') && req.body.order.length) {
                for (let order of req.body.order) {
                    let sortField = req.body.columns[+order.column].data;
                    if (order.dir == 'desc') {
                        var sortOrder = -1;
                    } else if (order.dir == 'asc') {
                        var sortOrder = 1;
                    }
                    sortOperator["$sort"][sortField] = sortOrder;
                }
            } else {
                sortOperator["$sort"]['_id'] = -1;
            }

            let aggregate = User.aggregate([
                {
                    $lookup: {
                        "from": "roles",
                        "let": { role: "$role" },
                        "pipeline": [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$_id", "$$role"] },
                                            { $eq: ["$isDeleted", false] }
                                        ]
                                    }
                                }
                            },
                            {
                                $project: {
                                    _id: "$_id",
                                    role: "$role",
                                    roleDisplayName: "$roleDisplayName"
                                }
                            }
                        ],
                        "as": "user_role"
                    }
                },
                { "$unwind": "$user_role" },
                {
                    $group: {
                        '_id': '$_id',
                        'fullName': { $first: '$fullName' },
                        'email': { $first: '$email' },
                        'isOtpVerified': { $first: '$isOtpVerified' },
                        'isDeleted': { $first: '$isDeleted' },
                        'status': { $first: '$status' },
                        'user_role': { $first: '$user_role' },
                        'profile_image': { $first: '$profile_image' },
                        'createdAt': { $first: '$createdAt' },
                    }
                },
                { $match: conditions },
                sortOperator
            ]);

            let options = { page: req.body.page, limit: req.body.length };
            let allUsers = await User.aggregatePaginate(aggregate, options);
            return allUsers;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    },

    getAllUsersByFields: async (params) => {
        try {
            return await User.aggregate([
                {
                    $project: {
                        _id: '$_id',
                        first_name: 1,
                        last_name: 1,
                        fullName: 1,
                        email: 1,
                        status: 1,
                        isDeleted: 1
                    }
                },
                { $match: params }
            ]);
        } catch (e) {
            return e;
        }
    },

    getUserDetails: async (id) => {
        try {
            let userId = mongoose.Types.ObjectId(id)
            let aggregate = await User.aggregate([
                { $match: { _id: userId, isDeleted: false } },
                
                {
                    $lookup: {
                        "from": "roles",
                        let: { role: "$role" },
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
                                    _id: "$_id",
                                    role: "$role",
                                    roleDisplayName: "$roleDisplayName"
                                }
                            }
                        ],
                        "as": "role"
                    }
                },
                { "$unwind": "$role" },
                //lookup to get user package details
                {
                    $lookup: {
                        "from": "user_packages",
                        let: { userId:userId },
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
                            //lookup to get package details
                            {
                                $lookup: {
                                    "from": "packages",
                                    let: { packageId: "$packageId" },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $and: [
                                                        { $eq: ["$_id", "$$packageId"] },
                                                        { $eq: ["$isDeleted", false] }
                                                    ]
                                                }
                                            }
                                        },
                                        {
                                            $project: {
                                                _id: "$_id",
                                                title: "$title",
                                                description: "$description",
                                                minAmount: "$minAmount",
                                                maxAmount: "$maxAmount",
                                                status: "$status",

                                            }
                                        }
                                    ],
                                    "as": "package"
                                }
                            },{
                                $unwind: {
                                    path: "$package",
                                    preserveNullAndEmptyArrays: true
                            }},
                            {
                                $project: {
                                    _id: 1,
                                    currentPeriodStart: 1,
                                    investment: 1,
                                    package: 1,
                                  
                                }
                            }
                            
                        ],
                        "as": "user_packages"
                    }
                },
                {
                    $project: {
                        password: 0,
                        deviceToken: 0,
                        deviceType: 0,
                        register_type: 0,
                        isDeleted: 0,
                        status: 0,
                        createdAt: 0,
                        updatedAt: 0,
                    }
                },
            ]);
           
            
            if (!aggregate) return null;
            return aggregate;
        } catch (e) {
            return e;
        }
    },
    getUserPackageDetails: async (id) => {
        try {
            let userId = mongoose.Types.ObjectId(id)
            let aggregate = await User.aggregate([
                { $match: { _id: userId, isDeleted: false } },
                
                {
                    $lookup: {
                        "from": "roles",
                        let: { role: "$role" },
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
                                    _id: "$_id",
                                    role: "$role",
                                    roleDisplayName: "$roleDisplayName"
                                }
                            }
                        ],
                        "as": "role"
                    }
                },
                { "$unwind": "$role" },
                //lookup to get user package details
                {
                    $lookup: {
                        "from": "user_packages",
                        let: { userId:userId },
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
                            //lookup to get package details
                            {
                                $lookup: {
                                    "from": "packages",
                                    let: { packageId: "$packageId" },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $and: [
                                                        { $eq: ["$_id", "$$packageId"] },
                                                        { $eq: ["$isDeleted", false] }
                                                    ]
                                                }
                                            }
                                        },
                                        {
                                            $project: {
                                                _id: "$_id",
                                                title: "$title",
                                                description: "$description",
                                                minAmount: "$minAmount",
                                                maxAmount: "$maxAmount",
                                                status: "$status",

                                            }
                                        }
                                    ],
                                    "as": "package"
                                }
                            },{
                                $unwind: {
                                    path: "$package",
                                    preserveNullAndEmptyArrays: true
                            }},
                            {
                                $project: {
                                    _id: 1,
                                    currentPeriodStart: 1,
                                    investment: 1,
                                    package: 1,
                                    monthlyData: {
                                        $map: {
                                            input: [
                                                { month: "jan", interestAmount: 0 },
                                                { month: "feb", interestAmount: 0 },
                                                { month: "mar", interestAmount: 0 },
                                                { month: "apr", interestAmount: 0 },
                                                { month: "may", interestAmount: 0 },
                                                { month: "jun", interestAmount: 0 },
                                                { month: "jul", interestAmount: 0 },
                                                { month: "aug", interestAmount: 0 },
                                                { month: "sep", interestAmount: 0 },
                                                { month: "oct", interestAmount: 0 },
                                                { month: "nov", interestAmount: 0 },
                                                { month: "dec", interestAmount: 0 }
                                            ],
                                            as: "monthItem",
                                            in: {
                                                $let: {
                                                    vars: {
                                                        existing: {
                                                            $first: {
                                                                $filter: {
                                                                    input: "$monthlyData",
                                                                    as: "m",
                                                                    cond: { $eq: ["$$m.month", "$$monthItem.month"] }
                                                                }
                                                            }
                                                        }
                                                    },
                                                    in: {
                                                        month: "$$monthItem.month",
                                                        interestAmount: {
                                                            $cond: {
                                                                if: { $gt: [ "$$existing", null ] },
                                                                then: "$$existing.interestAmount",
                                                                else: 0
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            
                        ],
                        "as": "user_packages"
                    }
                },
                {
                    $project: {
                       _id:1,
                       user_packages:1,
                       email:1,
                       phone:1,
                       userName:1,
                    }
                },
            ]);
           
            
            if (!aggregate) return null;
            return aggregate;
        } catch (error) {
            throw error;
            
        }
    },
    getUserDashboardData: async (id) => {
        try {

            const today = new Date();
            const currentDay = today.getDate();
            const monthNames = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
            const currentMonth = monthNames[today.getMonth()];

           let conditions = { _id: mongoose.Types.ObjectId(id), isDeleted: false };
            let aggregate = await User.aggregate([
                {
                    $match: conditions
                },
                //lookup to get settings data
                {
                    $lookup: {
                        from: "settings",
                        pipeline: [
                            {
                                $match: {
                                    isDeleted: false
                                }
                            }
                        ],
                        as: "settings"
                    }
                }, {
                    $unwind: {
                        path: "$settings",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        "from": "user_packages",
                        let: { userId: id },
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
                            //lookup to get package details
                            {
                                $lookup: {
                                    "from": "packages",
                                    let: { packageId: "$packageId" },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $and: [
                                                        { $eq: ["$_id", "$$packageId"] },
                                                        { $eq: ["$isDeleted", false] }
                                                    ]
                                                }
                                            }
                                        },
                                        {
                                            $project: {
                                                _id: "$_id",
                                                title: "$title",
                                                description: "$description",
                                                minAmount: "$minAmount",
                                                maxAmount: "$maxAmount",
                                                status: "$status",

                                            }
                                        }
                                    ],
                                    "as": "package"
                                }
                            }, {
                                $unwind: {
                                    path: "$package",
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    currentPeriodStart: 1,
                                    investment: 1,
                                    package: 1,
                                    monthlyData: {
                                        $map: {
                                          input: [
                                            { month: "jan", interestAmount: 0 },
                                            { month: "feb", interestAmount: 0 },
                                            { month: "mar", interestAmount: 0 },
                                            { month: "apr", interestAmount: 0 },
                                            { month: "may", interestAmount: 0 },
                                            { month: "jun", interestAmount: 0 },
                                            { month: "jul", interestAmount: 0 },
                                            { month: "aug", interestAmount: 0 },
                                            { month: "sep", interestAmount: 0 },
                                            { month: "oct", interestAmount: 0 },
                                            { month: "nov", interestAmount: 0 },
                                            { month: "dec", interestAmount: 0 }
                                          ],
                                          as: "monthItem",
                                          in: {
                                            $let: {
                                              vars: {
                                                existing: {
                                                  $first: {
                                                    $filter: {
                                                      input: "$monthlyData",
                                                      as: "m",
                                                      cond: { $eq: ["$$m.month", "$$monthItem.month"] }
                                                    }
                                                  }
                                                }
                                              },
                                              in: {
                                                month: "$$monthItem.month",
                                                interestAmount: {
                                                  $cond: {
                                                    if: {
                                                      $or: [
                                                        {
                                                          $lt: [
                                                            { $indexOfArray: [monthNames, "$$monthItem.month"] },
                                                            { $indexOfArray: [monthNames, currentMonth] }
                                                          ]
                                                        },
                                                        {
                                                          $and: [
                                                            { $eq: ["$$monthItem.month", currentMonth] },
                                                            { $gte: [currentDay, "$settings.publishDay"] }
                                                          ]
                                                        }
                                                      ]
                                                    },
                                                    then: {
                                                      $cond: {
                                                        if: { $gt: ["$$existing", null] },
                                                        then: "$$existing.interestAmount",
                                                        else: 0
                                                      }
                                                    },
                                                    else: 0
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                      
                                }
                            }


                        ],
                        "as": "user_packages"
                    }
                },
                {
                    $project: {
                        _id: 1,
                        user_packages: 1,
                    }
                },
            ]);
            if (!aggregate) return null;
           
            
            return aggregate;
        } catch (error) {
            console.log(error);
            
            throw error;
            
        }
    },
    getById: async (id) => {
        try {
            let user = await User.findById(id).populate('role').exec();
            if (!user) {
                return null;
            }
            return user;

        } catch (e) {
            return e;
        }
    },

    getByIdWithUserDevices: async (id) => {
        try {
            let user = await User.findById(id).populate('role').populate({
                path: 'userdevices',
                options: { sort: { updatedAt: -1 } }
            }).exec();
            if (!user) {
                return null;
            }
            return user;

        } catch (e) {
            return e;
        }
    },

    getByIdWithParam: async (id) => {
        try {
            let user = await User.findById(id).populate('role').populate({
                path: 'userdevices',
                options: { sort: { updatedAt: -1 } }
            }).exec();
            if (!user) {
                return null;
            }
            return user;

        } catch (e) {
            return e;
        }
    },

    getByField: async (params) => {
        try {
            let user = await User.findOne(params).exec();
            if (!user) {
                return null;
            }
            return user;

        } catch (e) {
            return e;
        }
    },

    getAllSelectedFields: async (params) => {
        try {
            let user = await User.find(params, { email: 1, first_name: 1, last_name: 1, fullName: 1, _id: 1 }).exec();
            if (!user) {
                return null;
            }
            return user;
        } catch (e) {
            return e;
        }
    },

    getDistinctDocument: async (field, params) => {
        try {
            let record = await User.distinct(field, params);
            if (!record) {
                return null;
            }
            return record;
        } catch (e) {
            return e;
        }
    },

    getUserCountByParam: async (params) => {
        try {
            let user = await User.countDocuments(params);
            return user;
        } catch (e) {
            throw (e);
        }
    },

    getDistinctDocumentCount: async (field, params) => {
        try {
            let recordCount = await User.distinct(field, params);
            if (!recordCount) {
                return 0;
            }
            return recordCount.length;
        } catch (e) {
            return e;
        }
    },


    getAllByField: async (params) => {
        try {
            let user = await User.find(params).populate('role').lean().exec();
            if (!user) {
                return null;
            }
            return user;

        } catch (e) {
            return e;
        }
    },

    getLimitUserByField: async (params, limit) => {
        try {
            let user = await User.find(params).populate('role').limit(limit).sort({
                _id: -1
            }).exec();
            if (!user) {
                return null;
            }
            return user;
        } catch (e) {
            return e;
        }
    },

    delete: async (id) => {
        try {
            let user = await User.findById(id);
            if (user) {
                let userDelete = await User.deleteOne({
                    _id: id
                }).exec();
                if (!userDelete) {
                    return null;
                } else {
                    await PrivacySettingsModel.deleteMany({ user_id: mongoose.Types.ObjectId(id) });
                    return userDelete;
                }
            } else {
                return null;
            }
        } catch (e) {
            return e;
        }
    },

    deleteByField: async (field, fieldValue) => {
        //todo: Implement delete by field
    },


    updateById: async (data, id) => {
        try {
            let user = await User.findByIdAndUpdate(id, data, {
                new: true
            });

            if (!user) {
                return null;
            }
            return user;
        } catch (e) {
            return e;
        }
    },


    updateByField: async (data, param) => {
        try {
            let user = await User.updateOne(param, data, {
                new: true
            });
            if (!user) {
                return null;
            }
            return user;
        } catch (e) {
            return e;
        }
    },

    updateAllByParams: async (data, params) => {
        try {
            let datas = await User.updateMany(params, data, { new: true });
            if (!datas) {
                return null;
            }
            return datas;
        } catch (e) {
            return e;
        }
    },

    save: async (data) => {
        try {
            let user = await User.create(data);

            if (!user) {
                return null;
            }
            return user;
        } catch (e) {
            return e;
        }
    },

    forgotPassword: async (params) => {
        try {
            let user = await User.findOne({ email: params.email.trim(), isDeleted: false }).exec();
            if (!user) {
                throw { "status": 500, data: null, "message": 'Authentication failed. User not found.' }
            } else if (user) {
                let random_pass = Math.random().toString(36).substr(2, 9);
                let readable_pass = random_pass;
                random_pass = user.generateHash(random_pass);
                let user_details = await User.findByIdAndUpdate(user._id, { password: random_pass }).exec();
                if (!user_details) {
                    throw { "status": 500, data: null, "message": 'User not found.' }
                } else {
                    throw { "status": 200, data: readable_pass, "message": "Mail is sending to your mail id with new password" }
                }
                //return readable_pass;	
            }
        } catch (e) {
            return e;
        }
    },

    getUser: async (id) => {
        try {
            let user = await User.findOne({
                id
            }).exec();
            if (!user) {
                return null;
            }
            return user;
        } catch (e) {
            return e;
        }
    },

    getUserByField: async (data) => {
        try {
            let user = await User.findOne(data).populate('role').exec();
            if (!user) {
                return null;
            }
            return user;
        } catch (e) {
            return e;
        }
    },

    getUsersByField: async (data) => {
        try {
            let user = await User.find(data).populate('role').exec();
            if (!user) {
                return null;
            }
            return user;
        } catch (e) {
            return e;
        }
    },

    findAllUsers: async () => {
        try {
            let data = await User.find({ "isDeleted": false });
            if (_.isEmpty(data)) {
                return null;
            }
            return data;
        } catch (err) {
            throw err;
        }
    },

    getByIdWithPopulate: async (id) => {
        try {
            let user = await User.findById(id).populate('role').lean().exec();
            if (!user) {
                return null;
            }
            return user;

        } catch (e) {
            return e;
        }
    },

    getByParam: async (params) => {
        try {
            let record = await User.aggregate([
                {
                    $match: {
                        $and: [params]
                    }
                },
                {
                    $project: {
                        createdAt: 0,
                        updatedAt: 0,
                        creditScores: 0,
                        stripeCustomerId: 0,
                        registerType: 0,
                        socialId: 0,
                        deviceToken: 0,
                        deviceType: 0,
                        isDeleted: 0,
                        isActive: 0,
                        status: 0,
                        subscription: 0,
                        promoCode: 0,
                        referralCode: 0,
                        isSubscribed: 0,
                        role: 0,
                        phone: 0,
                        email: 0,
                    }
                }
            ])
            if (!record) {
                return null;
            }
            return record;
        } catch (e) {
            throw e
        }
    }


};

module.exports = userRepository;