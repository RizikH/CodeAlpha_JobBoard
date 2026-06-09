require('dotenv').config();

const express = require('express');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const limiters = require('./middleware/rateLimiter');

const app = express();

app.use(express.json());

if (process.env.NODE_ENV !== 'test') {
    app.use(limiters.api);
}

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/job'));
app.use('/api/applications', require('./routes/application'));
app.use('/api/resumes', require('./routes/resume'));
app.use('/api/admin', require('./routes/admin'));

// Multer and general error handler
app.use((err, req, res, next) => {
    const multer = require('multer');
    if (err instanceof multer.MulterError || err.message === 'Only PDF and Word documents are allowed') {
        return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
});

module.exports = app;
