const mongoose = require('mongoose');
const UserDevicesModel = require('user_devices/models/user_devices.model');

const userDevicesRepository = {
    getById: async (id) => {
        try {
            let datas = await UserDevicesModel.findById(id).exec();
            return datas;
        } catch (e) {
            throw (e);
        }
    },

    getByField: async (params) => {
        try {
            let datas = await UserDevicesModel.findOne(params).lean().exec();
            return datas;
        } catch (e) {
            throw (e);
        }
    },

    getAllByField: async (params) => {
        try {
            let datas = await UserDevicesModel.find(params).exec();
            return datas;
        } catch (e) {
            throw (e);
        }
    },

    getAllByFieldWithSortAndLimit: async (params, sort, limit) => {
        try {
            let datas = await UserDevicesModel.find(params).sort(sort).limit(limit).exec();
            return datas;
        } catch (e) {
            throw (e);
        }
    },

    getDistinctDocument: async (field, params) => {
        try {
            let datas = await UserDevicesModel.distinct(field, params);
            if (!datas) {
                return null;
            }
            return datas;
        } catch (e) {
            return e;
        }
    },

    getCountByParam: async (params) => {
        try {
            let datas = await UserDevicesModel.countDocuments(params);
            return datas;
        } catch (e) {
            throw (e);
        }
    },

    getDistinctDocumentCount: async (field, params) => {
        try {
            let datasCount = await UserDevicesModel.distinct(field, params);
            if (!datasCount) {
                return 0;
            }
            return datasCount.length;
        } catch (e) {
            return e;
        }
    },

    delete: async (id) => {
        try {
            let datas = await UserDevicesModel.findById(id);
            if (datas) {
                let dataDelete = await UserDevicesModel.remove({
                    _id: id
                }).exec();
                return dataDelete;
            } else {
                return null;
            }
        } catch (e) {
            throw (e);
        }
    },

    bulkDelete: async (params) => {
        try {
            await UserDevicesModel.deleteMany(params);
            return true;
        } catch (e) {
            return e;
        }
    },

    updateById: async (data, id) => {
        try {
            let datas = await UserDevicesModel.findByIdAndUpdate(id, data, {
                new: true,
                upsert: true
            }).exec();
            return datas;
        } catch (e) {
            throw (e);
        }
    },

    updateByField: async (data, param) => {
        try {
            let datas = await UserDevicesModel.updateOne(param, data, {
                new: true
            });
            if (!datas) {
                return null;
            }
            return datas;
        } catch (e) {
            return e;
        }
    },

    updateAllByParams: async (data, params) => {
        try {
            let datas = await UserDevicesModel.updateMany(params, data, { new: true });
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
            let datas = await UserDevicesModel.create(data);
            if (!datas) {
                return null;
            }
            return datas;
        } catch (e) {
            throw e;
        }
    }
};

module.exports = userDevicesRepository;