const BaseRepository = require('../../../config/baseRepository');
const Terms = require('../models/termsAndConditions.model'); // Adjust the path as necessary

class TermsRepository extends BaseRepository {
    constructor() {
        super(Terms);
    }

}

module.exports = new TermsRepository();