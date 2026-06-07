const Candidate = require('../models/Candidate');
const Resume = require('../models/Resume');
const { RESUME_STATUS } = require('../utils/constants');

const getAll = async (userId) => {
    const candidate = await Candidate.findOne({ user: userId });

    if (!candidate) {
        throw new Error("Server error occured: Candidate not found!");
    }

    return await Resume.find({ candidate: candidate._id, status: { $ne: RESUME_STATUS.DELETED } });
}

const getOneById = async (userId, resumeId) => {
    const candidate = await Candidate.findOne({ user: userId });

    if (!candidate) {
        throw new Error("Server error occured: Candidate not found!");
    }

    const resume = await Resume.findOne({ _id: resumeId, candidate: candidate._id });

    if (!resume) {
        throw new Error("Unautherized access: Resume does not belong to calling user!");
    }

    return resume;
}

const uploadResume = async (userId, resumes) => {
    const candidate = await Candidate.findOne({ user: userId });

    if (!candidate) {
        throw new Error("Server error occured: Candidate not found!");
    }

    const newResumes = resumes.map(element => ({
        fileName: element.originalname,
        filePath: element.path,
        candidate: candidate._id
    }));

    return await Resume.create(newResumes);
}

const deleteExistant = async (userId, resumeId) => {
    const candidate = await Candidate.findOne({ user: userId });

    if (!candidate) {
        throw new Error("Server error occured: Candidate not found!");
    }

    const resume = await Resume.findOneAndUpdate(
        { _id: resumeId, candidate: candidate._id },
        { status: RESUME_STATUS.DELETED },
        { new: true }
    );

    if (!resume) {
        throw new Error("Unautherized access: Resume does not belong to calling user!");
    }

    return resume;
}

module.exports = {
    getAll,
    getOneById,
    uploadResume,
    deleteExistant
}
