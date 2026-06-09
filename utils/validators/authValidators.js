// Joi validation schemas for user registration and login request bodies

const Joi = require('joi');

const { ROLES } = require('../constants');

// Validates full registration payload: name, email, password strength, phone, company, location, and role
const validateRegister = Joi.object({
    name: Joi.string().required().messages({
        'any.required': 'Name is required',
        'string.empty': 'Name is required'
    }),
    email: Joi.string().email().required().messages({
        'any.required': 'Email is required',
        'string.empty': 'Email is required',
        'string.email': 'Email must be a valid email address'
    }),
    password: Joi.string()
        .pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*]).{8,}$/)
        .required()
        .messages({
            'any.required': 'Password is required',
            'string.empty': 'Password is required',
            'string.pattern.base': 'Password must be at least 8 characters and contain uppercase, lowercase, and a special character'
        }),
    phone: Joi.string()
        .pattern(/^\+\d{1,3}\s\d{6,14}$/)
        .required()
        .messages({
            'any.required': 'Phone number is required',
            'string.empty': 'Phone number is required',
            'string.pattern.base': 'Phone number must follow the format +[country code] [number], e.g. +1 1234567890'
        }),
    company: Joi.string().optional(),
    location: Joi.string().optional(),
    role: Joi.string()
        .valid(...Object.values(ROLES))
        .required()
        .messages({
            'any.required': 'Role is required',
            'string.empty': 'Role is required',
            'any.only': 'Role must be one of: employer, candidate, or admin'
        })
});

// Validates login credentials: email and password
const validateLogin = Joi.object({
    email: Joi.string().email().required().messages({
        'any.required': 'Email is required',
        'string.empty': 'Email is required',
        'string.email': 'Email must be a valid email address'
    }),
    password: Joi.string().required().messages({
        'any.required': 'Password is required',
        'string.empty': 'Password is required'
    })
});


module.exports = {
    validateRegister,
    validateLogin
}