// Joi validation schemas for user registration and login request bodies

const Joi = require('joi');

const { ROLES } = require('../utils/constants');

// Validates full registration payload: name, email, password strength, phone, company, location, and role
const validateRegister = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string()
        .pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*]).{8,}$/)
        .message('Password must be at least 8 characters and contain uppercase, lowercase, and a special character')
        .required(),
    phone: Joi.string()
        .pattern(/^\+\d{1,3}\s\d{6,14}$/)
        .message('Phone number must follow the format +[country code] [number], e.g. +1 1234567890')
        .required(),
    company: Joi.string().optional(),
    location: Joi.string().optional(),
    role: Joi.string()
        .valid(...Object.values(ROLES))
        .required()
        .messages({
            'any.only': 'Role must be one of: employer, candidate, or admin'
        })
});

// Validates login credentials: email and password
const validateLogin = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});


module.exports = {
    validateRegister,
    validateLogin
}