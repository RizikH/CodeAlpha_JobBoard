const mongoose = require('mongoose');
const { RESUME_STATUS } = require('../utils/constants');

const ResumeSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate',
        required: true
    },
    status: {
        type: String,
        enum: Object.values(RESUME_STATUS),
        default: RESUME_STATUS.ACTIVE,
        required: true
    }
}, {
    timestamps: true
});

const Resume = mongoose.model('Resume', ResumeSchema);

module.exports = Resume;