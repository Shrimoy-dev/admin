const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
const bools = [true, false];


const UserPackageSchema = new Schema({
   userId: { type: Schema.Types.ObjectId, ref: "user", default: null, index: true }, //by user
   packageId: { type: Schema.Types.ObjectId, ref: "package", default: null, index: true }, //by user
   referralCode: { type: String, default: null }, //by user
   investment: { type: Number, default: 0 }, //set by user
   currentPeriodStart: { type: Date, default: null }, //set by admin
   monthlyData: [
     {
       interestAmount: { type: Number, default: 0 },
       month: { type: String, default: '' }
     }
   ], // set by admin
   status: { type: String, default: 'Active', enum: ["Active", "Inactive"], index: true },
   isDeleted: { type: Boolean, default: false, index: true }
 }, { timestamps: true, versionKey: false });
 
// For pagination
UserPackageSchema.plugin(mongooseAggregatePaginate);
// create the model for user devices and expose it to our app
module.exports = mongoose.model('user_package', UserPackageSchema);