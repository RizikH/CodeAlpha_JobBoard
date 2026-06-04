const express = require('express');
const router = express.Router();

const controller = require('../controllers/authController');
const rateLimiter = require('../middleware/rateLimiter');

// Apply rate limiting to all auth routes
router.use(rateLimiter.auth);

router.post('/login', controller.login);
router.post('/register', controller.register);

module.exports = router;
