const response = require('../utils/response');
const service = require('../services/authService');
const { validateRegister, validateLogin } = require('../utils/validators');

// Validates input, delegates to authService, and returns the new user with a token.
const register = async (req, res) => {
    const { name, email, password, phone, company, location, role } = req.body;
    const { error, value } = validateRegister.validate(
      { name, email, password, phone, company, location, role }
    );

    if (error) {
        return response.error(res, error.message, 400);
    }

    try {
        const data = await service.register({ name, email, password, phone, company, location, role });

        return response.success(res, { token: data }, 201);
    } catch (err) {
        return response.error(res, err.message, 401);
    }
};

// Validates credentials, delegates to authService, and returns a JWT token.
const login = async (req, res) => {
    const { email, password } = req.body;
    const { error, value } = validateLogin.validate({ email, password });

    if (error) {
        return response.error(res, error.message, 400);
    }

    try {
        const data = await service.login({ email, password });

        return response.success(res, { token: data }, 200);
    } catch (err) {
        return response.error(res, err.message, 401);
    }
};

module.exports = {
    register,
    login
};
