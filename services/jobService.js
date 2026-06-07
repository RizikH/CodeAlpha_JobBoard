// Service layer for job listing CRUD operations.
const Job = require('../models/Job');
const Employer = require('../models/Employer');
const { JOB_STATUS } = require('../utils/constants');

// Fetches all jobs matching the given filters.
const getAll = async (filters) => {
    return await Job.find(filters);
};

// Fetches a single job by its ID.
const getOneById = async (id) => {
    return await Job.findById(id);
};

// Creates a new job listing and associates it with the employer for the given user.
const createNew = async (jobData, userId) => {
    const employer = await Employer.findOne({ user: userId });

    if (!employer) {
        throw new Error("Server error occured: Employer account not found!");
    }

    jobData.employer = employer._id;

    return await Job.create(jobData);
};

// Updates a job listing if the requesting user owns it.
const updateExisting = async (jobId, userId, jobData) => {
    if (!(await isOwner(jobId, userId))) {
        throw new Error("Unautherized access: Job Listing does not belong to employer!");
    }

    return await Job.findByIdAndUpdate(jobId, jobData, { new: true });
};

// Fetches all job listings belonging to the employer associated with the given user.
const getMine = async (userId) => {
    const employer = await Employer.findOne({ user: userId });
    if (!employer) {
        throw new Error("Server error occured: Employer not found!");
    }

    return await Job.find({ employer: employer._id });
};

// Soft-deletes a job listing by setting its status to DELETED.
const deleteExistant = async (jobId, userId) => {
    if (!(await isOwner(jobId, userId))) {
        throw new Error("Unautherized access: Job Listing does not belong to employer!");
    }

    return await Job.findByIdAndUpdate(jobId, { status: JOB_STATUS.DELETED });
};

// Returns true if the given user (as employer) owns the given job listing.
async function isOwner(jobId, userId) {
    const employer = await Employer.findOne({ user: userId });
    const jobListing = await Job.findById(jobId);

    if (!employer || !jobListing) {
        throw new Error("Server error occured: Job Listing or Employer is null.");
    }

    return employer._id.equals(jobListing.employer);
}


module.exports = {
    getAll,
    getOneById,
    getMine,
    createNew,
    updateExisting,
    deleteExistant,
}