const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
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
    phone: {
        type: String,
        required: true
    },
    resume: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Resume'
        }
    ]
}, {
    timestamps: true
});

const Candidate = mongoose.model('Candidate', CandidateSchema);

module.exports = Candidate;