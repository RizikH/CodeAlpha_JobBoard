const { validateLogin, validateRegister } = require('./authValidator');
const { validateCreateJob, validateUpdateJob } = require('./jobValidators');
const
    {
        validateCreateApplication,
        validateUpdateApplicationCandidate,
        validateUpdateApplicationEmployer
    } = require('./applicationValidator');

module.exports = {
    validateLogin,
    validateRegister,
    validateCreateJob,
    validateUpdateJob,
    validateCreateApplication,
    validateUpdateApplicationCandidate,
    validateUpdateApplicationEmployer
}