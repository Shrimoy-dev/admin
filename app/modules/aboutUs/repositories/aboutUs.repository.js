const BaseRepository = require('../../../config/baseRepository');
const AboutUs = require('../models/aboutUs.model'); // Adjust the path as necessary

class AboutUsRepository extends BaseRepository {
    constructor() {
        super(AboutUs);
    }

}

module.exports = new AboutUsRepository();