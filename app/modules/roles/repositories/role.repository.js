const Role = require('roles/models/role.model');
const perPage = config.other.pageLimit;

class RoleRepository {
    constructor() { }

    async getAll(searchQuery, page) {
        try {
            const match = [{}];
            match.push({'role': {$ne: 'admin'}});
            match.push({'role': {$ne: 'user'}});

            // match.push({'rolegroup': {$eq: 'backend'}});
            if (_.has(searchQuery, "keyword")) {
                if (searchQuery.keyword != '') {
                    const search_string = searchQuery.keyword.trim();
                    match.push({
                        "$or": [{ 'roleDisplayName': { '$regex': search_string, '$options': 'i' } },
                            { 'desc': { '$regex': search_string, '$options': 'i' } }
                        ]
                    });
                }
            }
            let roles = await Role.paginate({ "$and": match }, { sort: { _id: 1 }, page: page, limit: perPage });
            return roles;
        } catch (error) {
            return error;
        }
    }

    async getById(id) {
        try {
            return await Role.findById(id).lean().exec();
        } catch (error) {
            return error;
        }
    }

    async getByField(params) {
        try {
            return await Role.findOne(params).exec();
        } catch (error) {
            return error;
        }
    }

    async getDistinctDocument(field, params) {
        try {
            let record = await Role.distinct(field, params);
            if (!record) {
                return null;
            }
            return record;
        } catch (e) {
            return e;
        }
    }

    async getAllByField(params) {
        try {
            return await Role.find(params).lean().exec();
        } catch (error) {
            return error;
        }
    }

    async delete(id) {
        try {
            await Role.findById(id).lean().exec();
            return await Role.deleteOne({ _id: id }).lean().exec();
        } catch (error) {
            return error;
        }
    }

    async updateById(data, id) {
        try {
            return await Role.findByIdAndUpdate(id, data, { new: true, upsert: true })
                .lean().exec();
        } catch (error) {
            return error;
        }
    }

    async save(data) {
        try {
            return await Role.create(data).lean().exec();
        } catch (error) {
            return error;
        }
    }
}

module.exports = new RoleRepository();