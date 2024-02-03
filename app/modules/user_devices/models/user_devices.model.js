const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const deviceType = ["Web","Android","iOS"];
const bools = [true, false];


const UserDevicesSchema = new Schema({
   endpoint: { type: String, default: '' },
   keys: { type: Schema.Types.Mixed, default: null },
   session_id: { type: String, default: '' },
   deviceToken: { type: String, default: '' },
   deviceType: { type: String, default: 'Web' , enum: deviceType, index: true },
   ip: { type: String, default: '' },
   ip_lat: { type: String, default: '' },
   ip_long: { type: String, default: '' }, 
   browserInfo: {
      name: { type: String, default: '' },
      version: { type: String, default: '' },
   },
   deviceInfo: {
      vendor: { type: String, default: '' },
      model: { type: String, default: '' },
      type: { type: String, default: '' },
   },
   operatingSystem: {
      name: { type: String, default: '' },
      version: { type: String, default: '' },
   },
   last_active: { type: Date, default: null, index: true },
   state: { type: String, default: '' },
   country: { type: String, default: '' },
   city: { type: String, default: '' },
   timezone: { type: String, default: '' },
   access_token: { type: String, default: '', unique: true, index: true },
   expired: { type: Boolean, default: false, enum: [true, false], index: true },
   userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
   role:  { type: Schema.Types.ObjectId, ref: 'Role', index: true },
   isDeleted: { type: Boolean, default: false, enum: bools, index: true }
}, { timestamps: true, versionKey: false });

// create the model for user devices and expose it to our app
module.exports = mongoose.model('user_devices', UserDevicesSchema);