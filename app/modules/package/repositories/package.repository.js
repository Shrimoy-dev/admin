const BaseRepository = require('../../../config/baseRepository');
const Package = require('../models/package.model'); // Adjust the path as necessary

class PackageRepository extends BaseRepository {
    constructor() {
        super(Package);
    }
}

module.exports = new PackageRepository();