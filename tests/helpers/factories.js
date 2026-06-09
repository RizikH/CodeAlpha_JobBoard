const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const Candidate = require('../../models/Candidate');
const Employer = require('../../models/Employer');
const Job = require('../../models/Job');
const Application = require('../../models/Application');
const Resume = require('../../models/Resume');
const { ROLES, USER_STATUS, JOB_TYPE, JOB_STATUS, APPLICATION_STATUS } = require('../../utils/constants');

const createCandidate = async (overrides = {}) => {
    const password = await bcrypt.hash(overrides.password || 'Test@1234!', 10);
    const user = await User.create({
        email: overrides.email || `candidate_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`,
        password,
        role: ROLES.CANDIDATE,
        status: overrides.status || USER_STATUS.ACTIVE,
    });
    const candidate = await Candidate.create({
        user: user._id,
        name: overrides.name || 'test candidate',
        phone: overrides.phone || '+1 1234567890',
    });
    return { user, candidate };
};

const createEmployer = async (overrides = {}) => {
    const password = await bcrypt.hash(overrides.password || 'Test@1234!', 10);
    const user = await User.create({
        email: overrides.email || `employer_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`,
        password,
        role: ROLES.EMPLOYER,
        status: overrides.status || USER_STATUS.ACTIVE,
    });
    const employer = await Employer.create({
        user: user._id,
        name: overrides.name || 'test employer',
        company: overrides.company || 'Acme Corp',
        location: overrides.location || 'New York',
        phone: overrides.phone || '+1 9876543210',
    });
    return { user, employer };
};

const createAdmin = async (overrides = {}) => {
    const password = await bcrypt.hash(overrides.password || 'Admin@1234!', 10);
    return User.create({
        email: overrides.email || `admin_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`,
        password,
        role: ROLES.ADMIN,
        status: USER_STATUS.ACTIVE,
    });
};

const createJob = async (employer, overrides = {}) => {
    return Job.create({
        title: overrides.title || 'Software Engineer',
        employer: employer._id,
        description: overrides.description || 'Build things.',
        skills: overrides.skills || ['JavaScript'],
        location: overrides.location || 'Remote',
        jobType: overrides.jobType || JOB_TYPE.FULL_TIME,
        salary: overrides.salary || 80000,
        status: overrides.status || JOB_STATUS.ACCEPTING,
    });
};

const createApplication = async (candidate, job, overrides = {}) => {
    return Application.create({
        candidate: candidate._id,
        job: job._id,
        status: overrides.status || APPLICATION_STATUS.PROCESSING,
        resume: overrides.resume || undefined,
    });
};

const createResume = async (candidate, overrides = {}) => {
    const ts = Date.now();
    return Resume.create({
        fileName: overrides.fileName || `${ts}-test-resume.pdf`,
        filePath: overrides.filePath || `./uploads/test/${ts}-test-resume.pdf`,
        candidate: candidate._id,
    });
};

module.exports = {
    createCandidate,
    createEmployer,
    createAdmin,
    createJob,
    createApplication,
    createResume,
};
