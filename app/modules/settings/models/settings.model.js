const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
const deviceType = ["Web","Android","iOS"];
const bools = [true, false];


const SettingsSchema = new Schema({
   minInvestment: { type: Number, default: 500 },
   maxInvestment: { type: Number, default: 10000 },
   investStep: { type: Number, default: 100 },
   publishDay: { type: Number, default: 2 },
   facebookLink: { type: String, default: '' },
    twitterLink: { type: String, default: '' },
    instagramLink: { type: String, default: '' },
    youtubeLink: { type: String, default: '' },
    linkedinLink: { type: String, default: '' },
    telegramLink: { type: String, default: '' },
    contactNumber: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
   status:{ type: String, default: 'Active' , enum: ["Active", "Inactive"], index: true },
   isDeleted: { type: Boolean, default: false, enum: bools, index: true }
}, { timestamps: true, versionKey: false });
// For pagination
SettingsSchema.plugin(mongooseAggregatePaginate);
// create the model for user devices and expose it to our app
module.exports = mongoose.model('settings', SettingsSchema);