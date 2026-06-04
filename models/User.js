const mongoose = require('mongoose');
const { ROLES } = require('../utils/constants')

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: Object.values(ROLES),
        required: true
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', UserSchema);

module.exports = User;