// Joi schemas for validating application create and update request bodies
const Joi = require('joi');
const { APPLICATION_STATUS } = require('../constants');

// Validates that a new application references a valid MongoDB ObjectId for the job
const validateCreateApplication = Joi.object({
    job: Joi.string().pattern(/^[a-f\d]{24}$/i).message('Job ID must be a valid MongoDB ObjectId').required(),
    resume: Joi.string().pattern(/^[a-f\d]{24}$/i)
});

// Candidates may only withdraw their own application
const validateUpdateApplicationCandidate = Joi.object({
    status: Joi.string().valid(APPLICATION_STATUS.WITHDRAWN)
});

// Employers may accept or decline an application
const validateUpdateApplicationEmployer = Joi.object({
    status: Joi.string().valid(APPLICATION_STATUS.ACCEPTED, APPLICATION_STATUS.DECLINED)
});

module.exports = {
    validateCreateApplication,
    validateUpdateApplicationCandidate,
    validateUpdateApplicationEmployer
};
