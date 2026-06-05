// Joi schemas for validating job creation and update request bodies
const Joi = require('joi');
const { JOB_TYPE, JOB_STATUS } = require('../constants');

// Schema for creating a new job listing
const validateCreateJob = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    skills: Joi.array().items(Joi.string()).required(),
    location: Joi.string().required(),
    jobType: Joi.string()
        .valid(...Object.values(JOB_TYPE))
        .messages({
            'any.only': 'Job Type must be one of: full-time, part-time, contract, or internship'
        })
        .required(),
    salary: Joi.number(),
});

// Schema for updating an existing job listing (all fields optional)
const validateUpdateJob = Joi.object({
    title: Joi.string(),
    description: Joi.string(),
    skills: Joi.array().items(Joi.string()),
    location: Joi.string(),
    jobType: Joi.string()
        .valid(...Object.values(JOB_TYPE))
        .messages({
            'any.only': 'Job Type must be one of: full-time, part-time, contract, or internship'
        }),
    salary: Joi.number(),
    status: Joi.string()
        .valid(JOB_STATUS.ACCEPTING, JOB_STATUS.FILLED, JOB_STATUS.CANCELED)
        .messages({ 'any.only': 'Job Status must be one of: accepting, filled, canceled' })
});

module.exports = {
    validateCreateJob,
    validateUpdateJob
};
