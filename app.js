// Express app entry point — bootstraps middleware, routes, and starts the server
require('dotenv').config();

const express = require('express');
const swaggerUi = require('swagger-ui-express');

const connectDB = require('./config/db');
const swaggerSpec = require('./config/swagger');
const limiters = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
// Apply global API rate limiter before any route handlers
app.use(limiters.api);

connectDB();

// Swagger UI explorer
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/job'));
app.use('/api/application', require('./routes/application'));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
