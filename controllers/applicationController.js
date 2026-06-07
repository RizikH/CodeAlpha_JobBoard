const {
    validateCreateApplication,
    validateUpdateApplicationEmployer,
} = require('../utils/validators');
const service = require('../services/applicationService');
const response = require('../utils/response');
const { ROLES } = require('../utils/constants');

// Returns all applications, optionally filtered by status query param.
const getAll = async (req, res) => {
    const userRole = req.user.role;
    const userId = req.user.id;
    const { status } = req.query;
    const filters = {};
    if (status) filters.status = status;

    try {
        if (userRole === ROLES.CANDIDATE) {
            const data = await service.getAllCandidate(userId, filters);
            return response.success(res, data, 200);
        } else if (userRole === ROLES.EMPLOYER) {
            const data = await service.getAllEmployer(userId, filters);
            return response.success(res, data, 200);
        } else {
            return response.error(res, 'Invalid role!', 403);
        }
    } catch (err) {
        return response.error(res, err.message, 400);
    }
};

// Returns a single application by its ID.
const getOneById = async (req, res) => {
    const applicationId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!applicationId) {
        return response.error(res, 'Id missing from params', 400);
    }

    try {
        if (userRole === ROLES.CANDIDATE) {
            const data = await service.getOneByIdCandidate(userId, applicationId);
            return response.success(res, data, 200);
        } else if (userRole === ROLES.EMPLOYER) {
            const data = await service.getOneByIdEmployer(userId, applicationId);
            return response.success(res, data, 200);
        } else {
            return response.error(res, 'Invalid role!', 403);
        }
    } catch (err) {
        return response.error(res, err.message, 400);
    }
};

// Creates a new application for the authenticated candidate.
const createNew = async (req, res) => {
    const userId = req.user.id;
    const { jobId, resume } = req.body;

    const { error, value } = validateCreateApplication.validate({ job: jobId, resume: resume });
    if (error) {
        return response.error(res, error.message, 400);
    }

    try {
        const data = await service.createNew(userId, jobId, resume);
        return response.success(res, data, 201);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
};

// Updates an existing application; behaviour differs by the caller's role.
const updateExisting = async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const applicationId = req.params.id;
    const { newStatus } = req.body;

    switch (userRole) {
        case ROLES.CANDIDATE:
            try {
                const data = await service.updateExistingCandidate(userId, applicationId);
                return response.success(res, data, 200);
            } catch (err) {
                return response.error(res, err.message, 400);
            }
            break;
        case ROLES.EMPLOYER:
            try {
                const { error, value } = validateUpdateApplicationEmployer
                    .validate({ status: newStatus });
                if (error) {
                    return response.error(res, error.message, 400);
                }
                const data = await service.updateExistingEmployer(userId, applicationId, newStatus);
                return response.success(res, data, 200);
            } catch (err) {
                return response.error(res, err.message, 400);
            }
            break;

        default:
            return response.error(res, 'Invalid Role', 403);
            break;
    }
};

// Deletes an application owned by the authenticated candidate.
const deleteExistantApplication = async (req, res) => {
    const userId = req.user.id;
    const applicationId = req.params.id;

    try {
        const data = await service.deleteExistantApplication(userId, applicationId);
        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
};

module.exports = {
    getAll,
    getOneById,
    createNew,
    updateExisting,
    deleteExistantApplication,
};
