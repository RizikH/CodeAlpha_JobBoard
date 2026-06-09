const jwt = require('jsonwebtoken');
const User = require('../models/User');
const response = require('../utils/response');
const { USER_STATUS } = require('../utils/constants');

const protect = async (req, res, next) => {
    const authHeaders = req.headers.authorization;

    if (!authHeaders || !authHeaders.startsWith('Bearer ')) {
        return response.error(res, 'Not authorized', 401);

    }

    const authToken = authHeaders.split(' ')[1];

    try {
        const decodedToken = jwt.verify(authToken, process.env.JWT_SECRET);

        const user = await User.findById(decodedToken.id).select('-password');
        if (!user) {
            return response.error(res, 'Not authorized', 401);
        }
        if (user.status === USER_STATUS.BANNED) {
            return response.error(res, 'Request blocked: User is banned', 403);
        }
        req.user = user;

        next();
    } catch (err) {
        return response.error(res, 'Not authorized', 401);
    }
}

module.exports = protect;