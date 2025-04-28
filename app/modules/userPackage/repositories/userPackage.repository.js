const BaseRepository = require('../../../config/baseRepository');
const UserPackage = require('../models/userPackage.model'); // Adjust the path as necessary

class PackageRepository extends BaseRepository {
    constructor() {
        super(UserPackage);
    }
}
module.exports = new PackageRepository();

