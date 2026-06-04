const response = require('../utils/response');

const authorizeRole = (...roles) => {
    return (req, res, next) => {
        if (roles.includes(req.user.role)) {
            return next()
        }

        return response.error(res, 'Access forbidden', 403);
    }
}

module.exports = authorizeRole;