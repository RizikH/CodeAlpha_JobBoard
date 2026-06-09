const mongoose = require('mongoose');

const employerSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        lowercase: true,
        required: true
    },
    company: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

employerSchema.plugin(require('../utils/plugins/softDelete'));


const Employer = mongoose.model('Employer', employerSchema);

module.exports = Employer;  