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
    candidate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Candidate',
        required: true
    }
}, {
    timestamps: true
});
ResumeSchema.plugin(require('../utils/plugins/softDelete'));


const Resume = mongoose.model('Resume', ResumeSchema);

module.exports = Resume;