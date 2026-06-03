const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    employer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employer',
        required: true
    },
    description: { type: String, required: true },
    skills: [{ type: String, required: true }],
    location: { type: String, required: true },
    jobType: {
        type: String,
        enum: ['full-time', 'part-time', 'contract', 'internship'],
        required: true
    },
    salary: { type: Number },
    status: {
        type: String,
        enum: ['accepting', 'filled', 'canceled'],
        default: 'accepting',
        required: true
    }
}, {
    timestamps: true
});

const Job = mongoose.model('Job', JobSchema);

module.exports = Job;