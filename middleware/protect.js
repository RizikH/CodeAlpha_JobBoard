const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    const authHeaders = req.headers.authorization;

    if (!authHeaders || !authHeaders.startsWith('Bearer')) {
        return res.status(401).json({ message: 'Not authorized' });
    }

    const authToken = authHeaders.split(' ')[1];

    try {
        const decodedToken = jwt.verify(authToken, process.env.JWT_SECRET);

        const user = await User.findById(decodedToken.id).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        req.user = user;

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized' });
    }
}

module.exports = protect;