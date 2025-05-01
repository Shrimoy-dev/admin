const { duration } = require('moment');
const BaseRepository = require('../../../config/baseRepository');
const Package = require('../models/package.model'); // Adjust the path as necessary

class PackageRepository extends BaseRepository {
    constructor() {
        super(Package);
    }

   async getAllForAdmin(req) {
        try {
            let conditions = {};
            let and_clauses = [];
            
            and_clauses.push({ "isDeleted": false });
            if (_.isObject(req.body) && _.has(req.body, 'search')) {
                and_clauses.push({
                    $or: [
                        { 'title': { $regex: req.body.search.trim(), $options: 'i' } },
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
            let aggregate = Package.aggregate([
                //lookup for user package
                {
                    $lookup: {
                        "from": "user_packages",
                        "let": { packageId: "$_id" },
                        "pipeline": [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$packageId", "$$packageId"] },
                                            { $eq: ["$isDeleted", false] }
                                        ]
                                    }
                                }
                            },
                        ],
                        "as": "user_packages"
                    }
                },
                {
                    $addFields:{
                        user_packages: {
                            $cond: {
                                if: { $gt: [{ $size: "$user_packages" }, 0] },
                                then:{ $size: "$user_packages" },
                                else: 0
                            }
                        }
                    }
                },
                {
                    $project: {
                        title: 1,
                        isDeleted: 1,
                        intervalInMonths: 1,
                        usersInPackage:'$user_packages',
                        minAmount: 1,
                        maxAmount: 1,
                        roi:1,
                        status: 1,
                        createdAt: 1,
                    }
                },
                { $match: conditions },
                sortOperator
            ]);
            let options = { page: req.body.page, limit: req.body.length };
            console.log(req.body.page, req.body.length, "page and limit");
            
            let alldata = await Package.aggregatePaginate(aggregate, options);
            return alldata;

        } catch (error) {
            throw error;
        }
    }
}

module.exports = new PackageRepository();