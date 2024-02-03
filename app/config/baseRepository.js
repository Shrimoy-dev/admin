const mongoose = require('mongoose');

class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    /**
     * @param {string} id
     * @returns {{}}
    */
    async getById(id) {
        try {
            let record = await this.model.findById(id).lean().exec();
            if (!record) {
                return null;
            }
            return record;
        } catch (error) {
            throw error;
        }
    }

    /**
     * @param {object} params
     * @returns {{}}
    */
    async getByField(params) {
        try {
            let record = await this.model.findOne(params).exec();
            if (!record) {
                return null;
            }
            return record;
        } catch (error) {
            throw error;
        }
    }

    /**
     * @param {object} params
     * @returns {{}}
    */
    async getAllByField(params) {
        try {
            let record = await this.model.find(params).sort({ '_id': 1 }).exec();
            if (!record) {
                return null;
            }
            return record;
        } catch (error) {
            throw error;
        }
    }


    /**
     * @param {object} params
     * @param {object} project
     * @returns {{}}
    */
    async getAllByFieldDistinct(params, project) {
        try {
            let record = await this.model.find(params, project).sort({
                '_id': -1
            }).exec();
            if (!record) {
                return null;
            }
            return record;
        } catch (error) {
            throw error;
        }
    }

    /**
     * @param {object} data 
     * @returns {{}}
    */
    async save(data) {
        try {
            let save = await this.model.create(data);
            if (!save) {
                return null;
            }
            return save;
        } catch (error) {
            throw error;
        }
    }

    /**
     * @param {*} params 
     * @returns {{number}}
     */
    async getDocumentCount(params) {
        try {
            let recordCount = await this.model.countDocuments(params);
            if (!recordCount) {
                return null;
            }
            return recordCount;
        } catch (error) {
            throw error;
        }
    }

    /**
     * @param {id: string} id
     * @returns {{acknowledged: boolean, deletedCount: number}}
     */
    async delete(id) {
        try {
            let record = await this.model.findById(id);
            if (record) {
                let recordDelete = await this.model.findByIdAndUpdate(id, {
                    isDeleted: true
                }, {
                    new: true
                });
                if (!recordDelete) {
                    return null;
                }
                return recordDelete;
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * @param {object} data
     * @param {string} id
     * @returns {{}}
     */
    async updateById(data, id) {
        try {
            let record = await this.model.findByIdAndUpdate(id, data, {
                new: true
            });
            if (!record) {
                return null;
            }
            return record;
        } catch (error) {
            throw error;
        }
    }

    /**
     * @param {object} field
     * @param {object} fieldValue
     * @param {object} data
     * @returns {void}
     */
    async updateByField(field, fieldValue, data) {
        try {
            // Todo
        } catch (error) {
            throw error;
        }
    }

    /**
     * @description Get Stats For Dashboard & Detailed Counts View
     * @returns {{count: number, activeCount: number, inactiveCount: number}}
     */
    async getStats() {
        try {
            let count = await this.model.find({ "isDeleted": false }).count();
            let activeCount = await this.model.find({ "isDeleted": false, "status": "Active" }).count();
            let inactiveCount = await this.model.find({ "isDeleted": false, "status": "Inactive" }).count();

            return {
                count,
                activeCount,
                inactiveCount
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = BaseRepository;