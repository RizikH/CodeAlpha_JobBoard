const Application = require('../models/Application');
const Candidate = require('../models/Candidate');
const Employer = require('../models/Employer');
const Job = require('../models/Job');
const { APPLICATION_STATUS } = require('../utils/constants');

// Retrieves all candidate applications matching the given filters.
const getAllCandidate = async (userId, filters) => {
    const candidate = await Candidate.findOne({ user: userId });
    if (!candidate) {
        throw new Error("Server error occured: Candidate not found!");
    }
    filters.candidate = candidate._id;

    return await Application.find(filters);
};

// Retrieves all applications for jobs owned by the given employer user.
const getAllEmployer = async (userId, filters) => {
    const employer = await Employer.findOne({ user: userId });
    if (!employer) {
        throw new Error("Server error occured: Employer not found!");
    }

    const jobs = await Job.find({ employer: employer._id }).select('_id');
    const jobIds = jobs.map(job => job._id);

    return await Application.find({ job: { $in: jobIds }, ...filters });
};

// Retrieves a single application by its ID owned by the candidate.
const getOneByIdCandidate = async (userId, applicationId) => {
    const candidate = await Candidate.findOne({ user: userId });
    if (!candidate) {
        throw new Error("Server error occured: Candidate not found!");
    }

    const application = await Application.findOne({ _id: applicationId, candidate: candidate._id });
    if (!application) {
        throw new Error("Unautherized access: Application does not belong to candidate!");
    }

    return application;
};

// Retrieves a single application by its ID that pertains to a job owned by the employer.
const getOneByIdEmployer = async (userId, applicationId) => {
    const employer = await Employer.findOne({ user: userId });
    if (!employer) {
        throw new Error("Server error occured: Employer not found!");
    }

    const application = await Application.findById(applicationId);
    if (!application) {
        throw new Error("Server error occured: Application not found!");
    }

    const job = await Job.findOne({ _id: application.job, employer: employer._id });
    if (!job) {
        throw new Error("Unautherized access: Application does not belong to a job listing by the employer!");
    }

    return application;
}

// Creates a new application for the given candidate user on the specified job.
const createNew = async (userId, jobId, resumeId) => {
    const candidate = await Candidate.findOne({ user: userId });

    if (!candidate) {
        throw new Error("Server error occured: Candidate is null");
    }

    const application = { candidate: candidate._id, job: jobId };
    if (resumeId) { application.resume = resumeId; }

    return await Application.create(application);
};

// Withdraws an application on behalf of the candidate owner.
const updateExistingCandidate = async (userId, applicationId) => {
    const candidate = await Candidate.findOne({ user: userId });
    if (!candidate) {
        throw new Error("Server error occured: Candidate not found!");
    }

    const application = await Application.findOneAndUpdate(
        { _id: applicationId, candidate: candidate._id },
        { status: APPLICATION_STATUS.WITHDRAWN }
    );

    if (!application) {
        throw new Error("Unautherized access: Application does not belong to candidate!");
    }

    return application;
};

// Updates an application's status on behalf of the employer who owns the job listing.
const updateExistingEmployer = async (userId, applicationId, newStatus) => {
    const employer = await Employer.findOne({ user: userId });
    if (!employer) {
        throw new Error("Server error occured: Employer not found!");
    }

    const jobs = await Job.find({ employer: employer._id }).select('_id');
    const jobIds = jobs.map(job => job._id);

    const application = await Application.findOneAndUpdate(
        { _id: applicationId, job: { $in: jobIds } },
        { status: newStatus }
    );

    if (!application) {
        throw new Error("Unautherized access: Application does not belong to a job listing by the employer!");
    }

    return application;
};

// Soft-deletes an application by marking its status as DELETED.
const deleteExistantApplication = async (userId, applicationId) => {
    const candidate = await Candidate.findOne({ user: userId });
    if (!candidate) {
        throw new Error("Server error occured: Candidate not found!");
    }

    const application = await Application.findOneAndUpdate(
        { _id: applicationId, candidate: candidate._id },
        { status: APPLICATION_STATUS.DELETED }
    );

    if (!application) {
        throw new Error("Unautherized access: Application does not belong to candidate!");
    }

    return application;
};

module.exports = {
    getAllCandidate,
    getAllEmployer,
    getOneByIdCandidate,
    getOneByIdEmployer,
    createNew,
    updateExistingCandidate,
    updateExistingEmployer,
    deleteExistantApplication,
};
