const mongoose = require('mongoose');
const { ROLES, USER_STATUS } = require('../utils/constants');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: Object.values(ROLES),
        required: true
    },
    status: {
        type: String,
        enum: Object.values(USER_STATUS),
        default: USER_STATUS.ACTIVE,
        required: true
    }
}, {
    timestamps: true
});

UserSchema.plugin(require('../utils/plugins/softDelete'));
const User = mongoose.model('User', UserSchema);

module.exports = User;