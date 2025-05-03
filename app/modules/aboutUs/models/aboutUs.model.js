const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
const deviceType = ["Web","Android","iOS"];
const bools = [true, false];


const AboutUsSchema = new Schema({
   title: { type: String, default: '' },
   description: { type: String, default: null },
   status:{ type: String, default: 'Active' , enum: ["Active", "Inactive"], index: true },
   isDeleted: { type: Boolean, default: false, enum: bools, index: true }
}, { timestamps: true, versionKey: false });
// For pagination
AboutUsSchema.plugin(mongooseAggregatePaginate);
// create the model for user devices and expose it to our app
module.exports = mongoose.model('about_us', AboutUsSchema);