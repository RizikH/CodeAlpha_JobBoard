const service = require('../services/resumeService');
const response = require('../utils/response');

// Returns all resumes belonging to the authenticated user.
const getAll = async (req, res) => {
    const userId = req.user.id;

    try {
        const data = await service.getAll(userId);

        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
};

// Returns a single resume by ID, scoped to the authenticated user.
const getOneById = async (req, res) => {
    const userId = req.user.id;
    const resumeId = req.params.id;

    try {
        const data = await service.getOneById(userId, resumeId);

        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
};

// Uploads one or more resume files for the authenticated user.
const uploadResumes = async (req, res) => {
    const userId = req.user.id;
    const resumes = req.files;

    try {
        const data = await service.uploadResume(userId, resumes);

        return response.success(res, data, 201);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
};

// Streams a resume file to the client, stripping the stored date.now() prefix from the download name.
const downloadResume = async (req, res) => {
    const userId = req.user.id;
    const resumeId = req.params.id;

    try {
        const data = await service.getOneById(userId, resumeId);
        // Strip the date.now() prefix (everything before the first '-') from the file name.
        return res.download(data.filePath, data.fileName.slice(data.fileName.indexOf('-') + 1));
    } catch (err) {
        return response.error(res, err.message, 400);
    }
};

// Deletes a resume by ID, scoped to the authenticated user.
const deleteResume = async (req, res) => {
    const userId = req.user.id;
    const resumeId = req.params.id;

    try {
        const data = await service.deleteResume(userId, resumeId);

        return response.success(res, data, 200);
    } catch (err) {
        return response.error(res, err.message, 400);
    }
};

module.exports = {
    getAll,
    getOneById,
    uploadResumes,
    deleteResume,
    downloadResume,
};
