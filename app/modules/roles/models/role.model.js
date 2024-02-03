const mongoose = require('mongoose');
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate');
const roleGroup = ['backend', 'frontend'];
const status = ["Active", "Inactive"];
// define the schema for our user model
const roleSchema = mongoose.Schema({
    roleDisplayName: {type: String, default: '' },
    role: {type: String, default: '' },
    rolegroup: { type: String, default: 'backend', enum: roleGroup },
    desc: {type: String, default: '' },
    isDeleted: {type: Boolean,default: false,enum: [true, false]},
    status: {type: String,default: "Active",enum: status},
},{ timestamps: true, versionKey: false });

roleSchema.set('toJSON', { virtuals: true });
roleSchema.virtual('rolepermission', {
    ref: 'RolePermission', // The model to use
    localField: '_id', // Find people where `localField`
    foreignField: 'role', // is equal to `foreignField`
    // If `justOne` is true, 'members' will be a single doc as opposed to
    // an array. `justOne` is false by default.
    justOne: false
});

roleSchema.virtual('user_data', {
    ref: 'User', // the model to use
    localField: '_id', // find children where 'localField' 
    foreignField: 'role', // is equal to foreignField
    justOne: false
});
// For pagination
roleSchema.plugin(mongooseAggregatePaginate);
module.exports = mongoose.model('Role', roleSchema);