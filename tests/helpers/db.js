const mongoose = require('mongoose');

const connect = async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.TEST_MONGO_URI);
    }
};

const clearCollections = async () => {
    const collections = mongoose.connection.collections;
    await Promise.all(Object.values(collections).map(col => col.deleteMany({})));
};

const findIncludingDeleted = async (Model, filter) => {
    return Model.find(filter).setOptions({ includeDeleted: true });
};

const findOneIncludingDeleted = async (Model, filter) => {
    return Model.findOne(filter).setOptions({ includeDeleted: true });
};

module.exports = { connect, clearCollections, findIncludingDeleted, findOneIncludingDeleted };
