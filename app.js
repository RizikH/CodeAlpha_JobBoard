require('dotenv').config();

const express = require('express');
const connectDB = require('./config/db');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;

connectDB();

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});