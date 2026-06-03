const mongoose = require('mongoose');

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
        enum: ['processing', 'accepted', 'declined', 'withdrawn'],
        default: 'processing',
        required: true
    }
}, {
    timestamps: true
});

const Application = mongoose.model('Application', ApplicationSchema);

module.exports = Application;