// Admin controller — full CRUD access across all entities for privileged admin users.
const { validateUpdateUser } = require('../utils/validators');
const service = require('../services/adminService');
const response = require('../utils/response');

// User admin functions

// Returns all users, with optional role/status filters and soft-deleted inclusion.
const getAllUsers = async (req, res) => {
    const includeDeleted = req.query.includeDeleted === 'true';
    const { role, status } = req.query;
    const filters = {};
    if (role) filters.role = role;
    if (status) filters.status = status;

    try {
        const data = await service.getAllUsers(filters, includeDeleted);
        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
};

// Returns a single user by their ID.
const getOneUserById = async (req, res) => {
    const userId = req.params.id;

    try {
        const data = await service.getOneUserById(userId);
        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
};

// Updates a user's status after validating the request body.
const updateUserById = async (req, res) => {
    const userId = req.params.id;
    const newStatus = req.body.newStatus;

    const { error, value } = validateUpdateUser.validate({ status: newStatus });
    if (error) {
        return response.error(res, error.message, 400);
    }

    try {
        const data = await service.updateUserById(userId, newStatus);
        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
};

// Soft-deletes a user by their ID.
const deleteUserById = async (req, res) => {
    const userId = req.params.id;

    try {
        const data = await service.deleteUserById(userId);
        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
};

// Candidate admin functions

// Returns all candidate profiles, with optional name/phone filters and soft-deleted inclusion.
const getAllCandidates = async (req, res) => {
    const includeDeleted = req.query.includeDeleted === 'true';
    const { name, phone } = req.query;
    const filters = {};
    if (name) filters.name = new RegExp(name, 'i');
    if (phone) filters.phone = new RegExp(phone, 'i');

    try {
        const data = await service.getAllCandidates(filters, includeDeleted);
        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
};

// Returns a single candidate profile by ID.
const getCandidateById = async (req, res) => {
    const candidateId = req.params.id;

    try {
        const data = await service.getCandidateById(candidateId);
        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
};

// Soft-deletes a candidate by their ID.
const deleteCandidateById = async (req, res) => {
    const candidateId = req.params.id;

    try {
        const data = await service.deleteCandidateById(candidateId);
        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
};

// Employer admin functions

// Returns all employer profiles, with optional name/company/location/phone filters.
const getAllEmployers = async (req, res) => {
    const includeDeleted = req.query.includeDeleted === 'true';
    const { name, company, location, phone } = req.query;
    const filters = {};

    if (name) filters.name = new RegExp(name, 'i');
    if (company) filters.company = new RegExp(company, 'i');
    if (location) filters.location = new RegExp(location, 'i');
    if (phone) filters.phone = new RegExp(phone, 'i');

    try {
        const data = await service.getAllEmployers(filters, includeDeleted);
        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
};

// Returns a single employer profile by ID.
const getEmployerById = async (req, res) => {
    const employerId = req.params.id;

    try {
        const data = await service.getEmployerById(employerId);
        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
};

// Soft-deletes an employer by their ID.
const deleteEmployerById = async (req, res) => {
    const employerId = req.params.id;

    try {
        const data = await service.deleteEmployerById(employerId);
        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
};

// Job admin functions

// Returns all job listings, with optional filters across all job fields.
const getAllJobs = async (req, res) => {
    const includeDeleted = req.query.includeDeleted === 'true';

    const { title, employer, description, skills, location, jobType, salary, status } = req.query;
    const filters = {};

    if (title) filters.title = new RegExp(title, 'i');
    if (employer) filters.employer = employer;
    if (description) filters.description = new RegExp(description, 'i');
    if (skills) filters.skills = new RegExp(skills, 'i');
    if (location) filters.location = new RegExp(location, 'i');
    if (jobType) filters.jobType = jobType;
    if (salary) filters.salary = salary;
    if (status) filters.status = status;

    try {
        const data = await service.getAllJobs(filters, includeDeleted);
        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
};

// Returns a single job listing by ID.
const getJobById = async (req, res) => {
    const jobId = req.params.id;

    try {
        const data = await service.getJobById(jobId);
        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
};

// Soft-deletes a job listing by ID.
const deleteJobById = async (req, res) => {
    const jobId = req.params.id;

    try {
        const data = await service.deleteJobById(jobId);
        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
};

// Application admin functions

// Returns all applications, with optional candidate/job/status filters.
const getAllApplications = async (req, res) => {
    const includeDeleted = req.query.includeDeleted === 'true';

    const { candidate, job, status } = req.query;
    const filters = {};

    if (candidate) filters.candidate = candidate;
    if (job) filters.job = job;
    if (status) filters.status = status;

    try {
        const data = await service.getAllApplications(filters, includeDeleted);
        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
};

// Returns a single application by ID.
const getApplicationById = async (req, res) => {
    const applicationId = req.params.id;

    try {
        const data = await service.getApplicationById(applicationId);
        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
};

// Soft-deletes an application by ID.
const deleteApplicationById = async (req, res) => {
    const applicationId = req.params.id;

    try {
        const data = await service.deleteApplicationById(applicationId);
        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
};

// Resume admin functions

// Returns all resumes, with optional fileName/candidate filters and soft-deleted inclusion.
const getAllResumes = async (req, res) => {
    const includeDeleted = req.query.includeDeleted === 'true';

    const { fileName, candidate } = req.query;
    const filters = {};
    if (fileName) filters.fileName = new RegExp(fileName, 'i');
    if (candidate) filters.candidate = candidate;

    try {
        const data = await service.getAllResumes(filters, includeDeleted);
        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
};

// Returns a single resume record by ID.
const getResumeById = async (req, res) => {
    const resumeId = req.params.id;

    try {
        const data = await service.getResumeById(resumeId);
        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
};

// Soft-deletes a resume record by ID.
const deleteResumeById = async (req, res) => {
    const resumeId = req.params.id;

    try {
        const data = await service.deleteResumeById(resumeId);
        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
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
