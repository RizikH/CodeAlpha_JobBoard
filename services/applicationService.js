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

// Retrieves a single application by its ID owned by candidate.
const getOneByIdCandidate = async (userId, applicationId) => {
    if (!(await isApplicationOwner(userId, applicationId))) {
        throw new Error("Unautherized access: Application does not belong to candidate!");

    }
    return await Application.findById(applicationId);
};

// Retrieves a single application by its ID that pertains to a job by an employer.
const getOneByIdEmployer = async (userId, applicationId) => {
    if (!(await isApplicationEmployer(userId, applicationId))) {
        throw new Error("Unautherized access: Application does not belong to job by employer!");
    }

    return await Application.findById(applicationId);
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
    if (!(await isApplicationOwner(userId, applicationId))) {
        throw new Error("Unautherized access: Application does not belong to candidate!");
    }

    return await Application.findByIdAndUpdate(
        applicationId,
        { status: APPLICATION_STATUS.WITHDRAWN }
    );
};

// Updates an application's status on behalf of the employer who owns the job listing.
const updateExistingEmployer = async (userId, applicationId, newStatus) => {
    if (!(await isApplicationEmployer(userId, applicationId))) {
        throw new Error(
            "Unautherized access: Application does not belong to a job listing by the employer!"
        );
    }

    return await Application.findByIdAndUpdate(applicationId, { status: newStatus });
};

// Soft-deletes an application by marking its status as DELETED.
const deleteExistantApplication = async (userId, applicationId) => {
    if (!(await isApplicationOwner(userId, applicationId))) {
        throw new Error("Unautherized access: Application does not belong to candidate!");
    }

    return await Application.findByIdAndUpdate(
        applicationId,
        { status: APPLICATION_STATUS.DELETED }
    );
};

// Returns true if the given user (as candidate) owns the given job application.
async function isApplicationOwner(userId, applicationId) {
    const candidate = await Candidate.findOne({ user: userId });
    const application = await Application.findById(applicationId);

    if (!candidate || !application) {
        throw new Error("Server error occured: Application or Candidate is null.");
    }

    return candidate._id.equals(application.candidate);
}

// Returns true if the given user (as employer) owns the job listing the application belongs to.
async function isApplicationEmployer(userId, applicationId) {
    const employer = await Employer.findOne({ user: userId });
    const application = await Application.findById(applicationId);

    if (!employer || !application) {
        throw new Error("Server error occured: Employer or Application not found");
    }
    const job = await Job.findById(application.job);

    if (!job) {
        throw new Error("Server error occured: Job not found");
    }

    return employer._id.equals(job.employer);
}

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
