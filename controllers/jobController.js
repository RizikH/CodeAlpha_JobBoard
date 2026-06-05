const service = require('../services/jobService');
const response = require('../utils/response');
const { validateCreateJob, validateUpdateJob } = require('../utils/validators')


const getAll = async (req, res) => {
    const { location, jobType, status, title } = req.query;
    const filters = {};
    if (location) filters.location = location;
    if (jobType) filters.jobType = jobType;
    if (status) filters.status = status;
    if (title) filters.title = new RegExp(title, 'i');

    try {
        const data = await service.getAll(filters);
        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
}

const getOneById = async (req, res) => {
    const id = req.params.id;
    if (!id) {
        return response.error(res, 'Missing job listing ID!', 400);
    }

    try {
        const data = await service.getOneById(id);
        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
}

const createNew = async (req, res) => {
    const { title, description, skills, location, jobType, salary } = req.body;

    const { error, value } = validateCreateJob.validate({ title, description, skills, location, jobType, salary });

    if (error) {
        return response.error(res, error.message, 400);
    }

    const jobData = {};

    if (title) jobData.title = title;
    if (description) jobData.description = description;
    if (skills) jobData.skills = skills;
    if (location) jobData.location = location;
    if (salary) jobData.salary = salary;
    if (jobType) jobData.jobType = jobType;


    try {
        const data = await service.createNew(jobData, req.user.id);
        return response.success(res, data, 201);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
}

const updateExisting = async (req, res) => {
    const jobId = req.params.id;
    const { title, description, skills, location, jobType, salary, status } = req.body;

    const { error, value } = validateUpdateJob.validate({ title, description, skills, location, jobType, salary, status });

    if (error) {
        return response.error(res, error.message, 400);
    }

    const jobData = {};

    if (title) jobData.title = title;
    if (description) jobData.description = description;
    if (skills) jobData.skills = skills;
    if (location) jobData.location = location;
    if (salary) jobData.salary = salary;
    if (jobType) jobData.jobType = jobType;
    if (status) jobData.status = status;


    try {
        const data = await service.updateExisting(jobId, req.user.id, jobData);
        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
}

const getMine = async (req, res) => {
    const userId = req.user.id;

    try {
        const data = await service.getMine(userId);
        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
}

const deleteExistant = async (req, res) => {
    const jobId = req.params.id;

    try {
        const data = await service.deleteExistant(jobId, req.user.id);
        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
}

module.exports = {
    getAll,
    getOneById,
    createNew,
    updateExisting,
    getMine,
    deleteExistant
}
