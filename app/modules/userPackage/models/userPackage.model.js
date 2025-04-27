const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bools = [true, false];


const UserPackageSchema = new Schema({
   userId: { type: Schema.Types.ObjectId, ref:"user", default: null, index: true },
   packageId: { type: Schema.Types.ObjectId, ref:"package", default: null, index: true},
   currentPeriodStart: { type: Date, default: null },
   currentPeriodEnd: { type: Date, default: null },
   status:{ type: String, default: 'Active' , enum: ["Active", "Inactive"], index: true },
   isDeleted: { type: Boolean, default: false, enum: bools, index: true }
}, { timestamps: true, versionKey: false });

// create the model for user devices and expose it to our app
module.exports = mongoose.model('user_package', UserPackageSchema);