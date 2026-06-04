const mongoose = require('mongoose');
const { APPLICATION_STATUS } = require('../utils/constants');

const ApplicationSchema = new mongoose.Schema({
    candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate',
        required: true
    },
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    status: {
        type: String,
        enum: Object.values(APPLICATION_STATUS),
        default: 'processing',
        required: true
    }
}, {
    timestamps: true
});

const Application = mongoose.model('Application', ApplicationSchema);

module.exports = Application;