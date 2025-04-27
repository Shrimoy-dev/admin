const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const deviceType = ["Web","Android","iOS"];
const bools = [true, false];


const PackageSchema = new Schema({
   title: { type: String, default: '' },
   description: { type: Schema.Types.Mixed, default: null },
   amount: { type: Number, default: 0 },
   status:{ type: String, default: 'Active' , enum: ["Active", "Inactive"], index: true },
   isDeleted: { type: Boolean, default: false, enum: bools, index: true }
}, { timestamps: true, versionKey: false });

// create the model for user devices and expose it to our app
module.exports = mongoose.model('package', PackageSchema);