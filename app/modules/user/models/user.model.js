const mongoose = require('mongoose');
require('@mongoosejs/double');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
const registerType = ['Normal', 'Google', 'Facebook'];

const UserSchema = new Schema({
  role: { type: Schema.Types.ObjectId, ref: 'Role', index: true },
  parent_id: { type: Schema.Types.ObjectId, default: null, ref: 'Users', index: true },

  /* User Personal Informations */
  first_name: { type: String, default: '', index: true },
  last_name: { type: String, default: '', index: true },
  fullName: { type: String, default: '', index: true },
  userName: { type: String, default: '', index: true },
  bio: { type: String, default: '' },
  profile_image: { type: String, default: '' },

  /* User Contact Informations */
  phone: { type: String, default: '', index: true },
  countryCode: { type: String, default: '', index: true },

  /* User Login Informations */
  email: { type: String, default: '', index: true },
  password: { type: String, default: '' },

  /* User Business Details */
  business_name: { type: String, default: '' },
  business_location: { type: String, default: '' },
  location: { type: { type: String, default: 'Point' }, coordinates: { type: [Number], default: [0, 0] } },

  /* User PrivacyPolicy & TermsAndConditions Consent */
  agreedToTerms: { type: Boolean, default: false, index: true },
  agreedToPrivaryPolicy: { type: Boolean, default: false, index: true },

  /* Registration Type And Social Login Informations */
  registerType: { type: String, default: 'Normal', enum: registerType },
  socialAccount: [{
    socialId: { type: String, default: '' },
    platform: { type: String, default: 'Google', enum: ["Google", 'Facebook'] },
  }],

  /* User Stripe Id */
  stripeCustomerId: { type: String, default: '' },
  /** OTP */
  otp: { type: String, default: '' },
  otpExpireTime: { type: Date, default: null },
  isOtpVerified: { type: Boolean, default: false },
  
  isDeleted: { type: Boolean, default: false, index: true },
  status: { type: String, default: 'Active', enum: ['Active', 'Inactive', 'Banned'], index: true }
}, { timestamps: true, versionKey: false });


// generating a hash
UserSchema.methods.generateHash = function (password) {
  return bcrypt.hashSync(password.toString(), bcrypt.genSaltSync(parseInt(config.auth.saltRounds)), null);
};


// checking if password is valid
UserSchema.methods.validPassword = function (password, checkPassword) {
  return bcrypt.compareSync(password, checkPassword);
};

UserSchema.virtual('userdevices', {
  ref: 'user_devices',
  localField: '_id',
  foreignField: 'userId'
});

// For pagination
UserSchema.plugin(mongooseAggregatePaginate);

// create the model for User and expose it to our app
module.exports = mongoose.model('User', UserSchema);