const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ['admin', 'candidate', 'employer'],
        required: true
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', UserSchema);

module.exports = User;