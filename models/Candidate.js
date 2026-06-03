const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
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