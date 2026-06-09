require('dotenv').config({ path: '.env.test' });
const mongoose = require('mongoose');

module.exports = async () => {
    await mongoose.connect(process.env.TEST_MONGO_URI);
};
