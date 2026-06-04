// Express app entry point — bootstraps middleware, routes, and starts the server
require('dotenv').config();

const express = require('express');
const swaggerUi = require('swagger-ui-express');

const connectDB = require('./config/db');
const swaggerSpec = require('./config/swagger');
const limiters = require('./middleware/rateLimiter');

const app = express();
app.use(express.json());

app.use(limiters.api);

const PORT = process.env.PORT || 5000;

connectDB();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/auth', require('./routes/auth'));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
