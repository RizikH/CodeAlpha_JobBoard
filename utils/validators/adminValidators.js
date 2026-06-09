// Joi schemas for validating application create and update request bodies
const Joi = require('joi');
const { USER_STATUS } = require('../constants');

const validateUpdateUser = Joi.object({
    status: Joi.string().valid(...Object.values(USER_STATUS)).required().messages({
        'any.required': 'Status is required',
        'string.empty': 'Status is required',
        'any.only': 'Status must be one of: active or banned'
    })
})

module.exports = { validateUpdateUser };