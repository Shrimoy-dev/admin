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

            if (_.isObject(req.body.search) && _.has(req.body.search, 'value')) {
                and_clauses.push({
                    $or: [
                        { 'fullName': { $regex: req.body.search.value.trim(), $options: 'i' } },
                        { 'email': { $regex: '^' + req.body.search.value.trim(), $options: 'i' } },
                    ]
                });
            }

            if (req.body.columns && req.body.columns.length) {
                let statusFilter = _.findWhere(req.body.columns, { data: 'status' });
                if (statusFilter && statusFilter.search && statusFilter.search.value) {
                    and_clauses.push({
                        "status": statusFilter.search.value
                    });
                }
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
                        'isDeleted': { $first: '$isDeleted' },
                        'status': { $first: '$status' },
                        'user_role': { $first: '$user_role' },
                        'profile_image': { $first: '$profile_image' },
                        'createdAt': { $first: '$createdAt' },
                        'parent_id':{$first:'$parent_id'}
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

    getUserDetails: async (params) => {
        try {
            let aggregate = await User.aggregate([
                { $match: params },
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