const Job = require('../models/Job');
const Employer = require('../models/Employer');
const { JOB_STATUS } = require('../utils/constants');

const getAll = async (filters) => {
    return await Job.find(filters);
};

const getOneById = async (id) => {
    return await Job.findById(id);
};

const createNew = async (jobData, userId) => {
    const employer = await Employer.findOne({ user: userId });

    if (!employer) {
        throw new Error("Server error occured: Employer account not found!");
    }

    jobData.employer = employer._id;

    return await Job.create(jobData);
};

const getMine = async (userId) => {
    const employer = await Employer.findOne({ user: userId });

    if (!employer) {
        throw new Error("Server error occured: Employer not found!");
    }

    return await Job.find({ employer: employer._id });
};

const updateExisting = async (jobId, userId, jobData) => {
    const employer = await Employer.findOne({ user: userId });

    if (!employer) {
        throw new Error("Server error occured: Employer account not found!");
    }

    const job = await Job.findOneAndUpdate(
        { _id: jobId, employer: employer._id },
        jobData,
        { new: true }
    );

    if (!job) {
        throw new Error("Unautherized access: Job Listing does not belong to employer!");
    }

    return job;
};

const deleteExistant = async (jobId, userId) => {
    const employer = await Employer.findOne({ user: userId });

    if (!employer) {
        throw new Error("Server error occured: Employer account not found!");
    }

    const job = await Job.findOneAndUpdate(
        { _id: jobId, employer: employer._id },
        { status: JOB_STATUS.DELETED }
    );

    if (!job) {
        throw new Error("Unautherized access: Job Listing does not belong to employer!");
    }

    return job;
};

module.exports = {
    getAll,
    getOneById,
    getMine,
    createNew,
    updateExisting,
    deleteExistant,
}
