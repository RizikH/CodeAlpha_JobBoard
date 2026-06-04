const User = require('../models/User');
const Candidate = require('../models/Candidate');
const Employer = require('../models/Employer');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { ROLES } = require('../utils/constants');

// Registers a new user and creates a role-specific profile, returns a signed JWT.
const register = async (userData) => {

    const existingUser = await User.findOne({ email: userData.email });

    if (existingUser) {
        throw new Error("User already exists");
    }

    const { email, password, role } = userData;
    const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds

    const createdUser = await User.create({ email, password: hashedPassword, role });

    if (userData.role === ROLES.CANDIDATE) {

        const { name, phone } = userData;
        await Candidate.create({ name, phone, user: createdUser._id });

    } else if (userData.role === ROLES.EMPLOYER) {

        const { name, company, location, phone } = userData;
        await Employer.create({ name, company, location, phone, user: createdUser._id });

    }

    return generateToken(createdUser._id, createdUser.role);

};

// Looks up a user by email for authentication.
const login = async (userData) => {
    const existingUser = await User.findOne({ email: userData.email });

    if (!existingUser) {
        throw new Error("User Not Found, Please Register!");
    }

    const passwordCheck = await bcrypt.compare(userData.password, existingUser.password);

    if (!passwordCheck) {
        throw new Error("Incorrect Password, Please try again!");
    }

    return generateToken(existingUser._id, existingUser.role);
};

// Signs a JWT containing the user's id and role, valid for 1 day.
function generateToken(id, role) {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
}

module.exports = {
    register,
    login
};