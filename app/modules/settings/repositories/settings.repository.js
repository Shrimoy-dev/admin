const BaseRepository = require('../../../config/baseRepository');
const Settings = require('../models/settings.model'); // Adjust the path as necessary

class SettingsRepository extends BaseRepository {
    constructor() {
        super(Settings);
    }

}

module.exports = new SettingsRepository();