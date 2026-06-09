// Admin service — provides read/write access to all entities, including soft-deleted records.
const Employer = require('../models/Employer');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Resume = require('../models/Resume');
const User = require('../models/User');

const { ROLES } = require('../utils/constants');

// Users service functions

// Returns all users, optionally including soft-deleted ones.
const getAllUsers = async (filters, includeDeleted) => {
    const query = User.find(filters);
    if (includeDeleted) query.setOptions({ includeDeleted: true });

    return await query;
};

// Returns a single user by ID, optionally including soft-deleted.
const getOneUserById = async (userId, includeDeleted) => {
    const query = User.findById(userId);
    if (includeDeleted) query.setOptions({ includeDeleted: true });

    return await query;
};

// Updates the status field of a user by ID.
const updateUserById = async (userId, newStatus) => {
    return await User.findByIdAndUpdate(userId, { status: newStatus }, { new: true });
};


// Candidates service functions

// Returns all candidates, optionally including soft-deleted ones.
const getAllCandidates = async (filters, includeDeleted) => {
    const query = Candidate.find(filters);
    if (includeDeleted) query.setOptions({ includeDeleted: true });
    return await query;
};

// Returns a single candidate by ID, always includes soft-deleted.
const getCandidateById = async (candidateId) => {
    return await Candidate.findById(candidateId).setOptions({ includeDeleted: true });
};

// Employers Service Functions

// Returns all employers, optionally including soft-deleted ones.
const getAllEmployers = async (filters, includeDeleted) => {
    const query = Employer.find(filters);
    if (includeDeleted) query.setOptions({ includeDeleted: true });
    return await query;
};

// Returns a single employer by ID, always includes soft-deleted.
const getEmployerById = async (employerId) => {
    return await Employer.findById(employerId).setOptions({ includeDeleted: true });
};

// Jobs Service Functions

// Returns all jobs, optionally including soft-deleted ones.
const getAllJobs = async (filters, includeDeleted) => {
    const query = Job.find(filters);
    if (includeDeleted) query.setOptions({ includeDeleted: true });
    return await query;
};

// Returns a single job by ID, always includes soft-deleted.
const getJobById = async (jobId) => {
    return await Job.findById(jobId).setOptions({ includeDeleted: true });
};

// Applications service functions

// Returns all applications, optionally including soft-deleted ones.
const getAllApplications = async (filters, includeDeleted) => {
    const query = Application.find(filters);
    if (includeDeleted) query.setOptions({ includeDeleted: true });
    return await query;
};

// Returns a single application by ID, always includes soft-deleted.
const getApplicationById = async (applicationId) => {
    return await Application.findById(applicationId).setOptions({ includeDeleted: true });
};

// resumes service functions

// Returns all resumes, optionally including soft-deleted ones.
const getAllResumes = async (filters, includeDeleted) => {
    const query = Resume.find(filters);
    if (includeDeleted) query.setOptions({ includeDeleted: true });
    return await query;
};

// Returns a single resume by ID, always includes soft-deleted.
const getResumeById = async (resumeId) => {
    return await Resume.findById(resumeId).setOptions({ includeDeleted: true });
};

// Delete functions

// Soft-deletes a user and cascades the deletion to their associated profile.
const deleteUserById = async (userId) => {
    const user = await User.findByIdAndUpdate(userId, { isDeleted: true }, { new: true }).select('_id role');
    if (!user) throw new Error("Server error occured: User not found!");

    if (user.role === ROLES.CANDIDATE) {
        const candidate = await Candidate.findOneAndUpdate(
            { user: user._id }, { isDeleted: true }
        ).select('_id');
        await Promise.all([
            Resume.updateMany({ candidate: candidate._id }, { isDeleted: true }),
            Application.updateMany({ candidate: candidate._id }, { isDeleted: true }),
        ]);
    } else if (user.role === ROLES.EMPLOYER) {
        const employer = await Employer.findOneAndUpdate(
            { user: user._id }, { isDeleted: true }
        ).select('_id');
        const jobIds = await Job.distinct('_id', { employer: employer._id });
        await Promise.all([
            Application.updateMany({ job: { $in: jobIds } }, { isDeleted: true }),
            Job.updateMany({ _id: { $in: jobIds } }, { isDeleted: true }),
        ]);
    }

    return user;
};

// Soft-deletes an employer and cascades deletion to their jobs and applications.
const deleteEmployerById = async (employerId) => {
    const jobIds = await Job.distinct('_id', { employer: employerId });
    await Promise.all([
        Application.updateMany({ job: { $in: jobIds } }, { isDeleted: true }),
        Job.updateMany({ _id: { $in: jobIds } }, { isDeleted: true }),
    ]);
    return await Employer.findByIdAndUpdate(employerId, { isDeleted: true }, { new: true });
};

// Soft-deletes a candidate and cascades deletion to their resumes and applications.
const deleteCandidateById = async (candidateId) => {
    await Promise.all([
        Resume.updateMany({ candidate: candidateId }, { isDeleted: true }),
        Application.updateMany({ candidate: candidateId }, { isDeleted: true }),
    ]);
    return await Candidate.findByIdAndUpdate(candidateId, { isDeleted: true }, { new: true });
};

// Soft-deletes a job and cascades deletion to its applications.
const deleteJobById = async (jobId) => {
    const [, job] = await Promise.all([
        Application.updateMany({ job: jobId }, { isDeleted: true }),
        Job.findByIdAndUpdate(jobId, { isDeleted: true }, { new: true }),
    ]);
    return job;
};

// Soft-deletes an application by ID.
const deleteApplicationById = async (applicationId) => {
    return await Application.findByIdAndUpdate(applicationId, { isDeleted: true }, { new: true });
};

// Soft-deletes a resume by ID.
const deleteResumeById = async (resumeId) => {
    return Resume.findByIdAndUpdate(resumeId, { isDeleted: true }, { new: true });
};


// --- Bulk Delete ---

// Soft-deletes all applications submitted by a candidate.
const deleteAllApplicationsByCandidate = async (candidateId) => {
    await Application.updateMany({ candidate: candidateId }, { isDeleted: true });
};

// Soft-deletes all jobs belonging to an employer (by job ID list), cascading to their applications.
const deleteAllJobsByEmployer = async (jobIds) => {
    await deleteAllApplicationsToEmployerJobs(jobIds);
    await Job.updateMany({ _id: { $in: jobIds } }, { isDeleted: true });
};

// Soft-deletes all resumes uploaded by a candidate.
const deleteAllResumesByCandidate = async (candidateId) => {
    return await Resume.updateMany({ candidate: candidateId }, { isDeleted: true });
};

// Soft-deletes all applications associated with any of the given job IDs.
const deleteAllApplicationsToEmployerJobs = async (jobIds) => {
    await Application.updateMany({ job: { $in: jobIds } }, { isDeleted: true });
};

const deleteAllApplicationByJobId = async (jobId) => {
    return Application.updateMany({ job: jobId }, { isDeleted: true });
};

module.exports = {
    // User functions
    getAllUsers,
    getOneUserById,
    updateUserById,
    deleteUserById,

    // Candidate functions
    getAllCandidates,
    getCandidateById,
    deleteCandidateById,

    // Employer functions
    getAllEmployers,
    getEmployerById,
    deleteEmployerById,

    // Job functions
    getAllJobs,
    getJobById,
    deleteJobById,

    // Application functions
    getAllApplications,
    getApplicationById,
    deleteApplicationById,

    // Resume functions
    getAllResumes,
    getResumeById,
    deleteResumeById,
};
