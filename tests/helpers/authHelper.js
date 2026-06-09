const jwt = require('jsonwebtoken');

const signToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

const authHeader = (id, role) => ({
    Authorization: `Bearer ${signToken(id, role)}`
});

module.exports = { signToken, authHeader };
