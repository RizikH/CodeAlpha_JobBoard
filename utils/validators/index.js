const { validateLogin, validateRegister } = require('./authValidators');
const { validateCreateJob, validateUpdateJob } = require('./jobValidators');
const
    {
        validateCreateApplication,
        validateUpdateApplicationCandidate,
        validateUpdateApplicationEmployer
    } = require('./applicationValidators');

const { validateUpdateUser } = require('./adminValidators');
module.exports = {
    validateLogin,
    validateRegister,
    validateCreateJob,
    validateUpdateJob,
    validateCreateApplication,
    validateUpdateApplicationCandidate,
    validateUpdateApplicationEmployer,
    validateUpdateUser
}