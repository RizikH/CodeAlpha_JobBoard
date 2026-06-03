const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate',
        required: true
    }
}, {
    timestamps: true
});

const Resume = mongoose.model('Resume', ResumeSchema);

module.exports = Resume;