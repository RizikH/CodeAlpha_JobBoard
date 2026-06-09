// Joi schemas for validating application create and update request bodies
const Joi = require('joi');
const { APPLICATION_STATUS } = require('../constants');

// Validates that a new application references a valid MongoDB ObjectId for the job
const validateCreateApplication = Joi.object({
    job: Joi.string()
        .pattern(/^[a-f\d]{24}$/i)
        .required()
        .messages({
            'any.required': 'Job ID is required',
            'string.empty': 'Job ID is required',
            'string.pattern.base': 'Job ID must be a valid MongoDB ObjectId'
        }),
    resume: Joi.string().pattern(/^[a-f\d]{24}$/i).messages({
        'string.pattern.base': 'Resume ID must be a valid MongoDB ObjectId'
    })
});

// Candidates may only withdraw their own application
const validateUpdateApplicationCandidate = Joi.object({
    status: Joi.string().valid(APPLICATION_STATUS.WITHDRAWN).required().messages({
        'any.required': 'Status is required',
        'string.empty': 'Status is required',
        'any.only': 'Candidates may only set status to: withdrawn'
    })
});

// Employers may accept or decline an application
const validateUpdateApplicationEmployer = Joi.object({
    status: Joi.string().valid(APPLICATION_STATUS.ACCEPTED, APPLICATION_STATUS.DECLINED).required().messages({
        'any.required': 'Status is required',
        'string.empty': 'Status is required',
        'any.only': 'Employers may only set status to: accepted or declined'
    })
});

module.exports = {
    validateCreateApplication,
    validateUpdateApplicationCandidate,
    validateUpdateApplicationEmployer
};
