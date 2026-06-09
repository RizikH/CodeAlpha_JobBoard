const request = require('supertest');
const app = require('../../app');
const { connect, clearCollections, findIncludingDeleted, findOneIncludingDeleted } = require('../helpers/db');
const { authHeader } = require('../helpers/authHelper');
const {
    createCandidate, createEmployer, createAdmin,
    createJob, createApplication, createResume,
} = require('../helpers/factories');
const User = require('../../models/User');
const Candidate = require('../../models/Candidate');
const Employer = require('../../models/Employer');
const Job = require('../../models/Job');
const Application = require('../../models/Application');
const Resume = require('../../models/Resume');
const { ROLES, USER_STATUS } = require('../../utils/constants');

beforeAll(async () => { await connect(); });
afterEach(async () => { await clearCollections(); });

// ─── Auth guards ─────────────────────────────────────────────────────────────

describe('Admin route auth guards', () => {
    it('returns 401 without token on all admin routes', async () => {
        const routes = [
            () => request(app).get('/api/admin/user'),
            () => request(app).get('/api/admin/candidate'),
            () => request(app).get('/api/admin/employer'),
            () => request(app).get('/api/admin/job'),
            () => request(app).get('/api/admin/application'),
            () => request(app).get('/api/admin/resume'),
        ];
        for (const route of routes) {
            const res = await route();
            expect(res.status).toBe(401);
        }
    });

    it('returns 403 with non-admin token', async () => {
        const { user } = await createCandidate();
        const res = await request(app)
            .get('/api/admin/user')
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE));
        expect(res.status).toBe(403);
    });
});

// ─── User management ──────────────────────────────────────────────────────────

describe('GET /api/admin/user', () => {
    it('returns all active users', async () => {
        await createCandidate();
        await createEmployer();
        const admin = await createAdmin();

        const res = await request(app)
            .get('/api/admin/user')
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('excludes soft-deleted users by default', async () => {
        const { user } = await createCandidate();
        await User.findByIdAndUpdate(user._id, { isDeleted: true });
        const admin = await createAdmin();

        const res = await request(app)
            .get('/api/admin/user')
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(200);
        const ids = res.body.data.map(u => u._id);
        expect(ids).not.toContain(user._id.toString());
    });

    it('includes soft-deleted users with ?includeDeleted=true', async () => {
        const { user } = await createCandidate();
        await User.findByIdAndUpdate(user._id, { isDeleted: true });
        const admin = await createAdmin();

        const res = await request(app)
            .get('/api/admin/user')
            .query({ includeDeleted: 'true' })
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(200);
        const ids = res.body.data.map(u => u._id);
        expect(ids).toContain(user._id.toString());
    });
});

describe('GET /api/admin/user — filters', () => {
    it('filters users by role', async () => {
        await createCandidate();
        await createEmployer();
        const admin = await createAdmin();

        const res = await request(app)
            .get('/api/admin/user')
            .query({ role: ROLES.EMPLOYER })
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(200);
        expect(res.body.data.every(u => u.role === ROLES.EMPLOYER)).toBe(true);
    });

    it('filters users by status', async () => {
        const { user } = await createCandidate();
        await User.findByIdAndUpdate(user._id, { status: USER_STATUS.BANNED });
        await createCandidate();
        const admin = await createAdmin();

        const res = await request(app)
            .get('/api/admin/user')
            .query({ status: USER_STATUS.BANNED })
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(200);
        expect(res.body.data.every(u => u.status === USER_STATUS.BANNED)).toBe(true);
        expect(res.body.data.map(u => u._id)).toContain(user._id.toString());
    });
});

describe('GET /api/admin/user/:id', () => {
    it('returns a user by ID', async () => {
        const { user } = await createCandidate();
        const admin = await createAdmin();

        const res = await request(app)
            .get(`/api/admin/user/${user._id}`)
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(200);
        expect(res.body.data._id).toBe(user._id.toString());
    });
});

describe('PUT /api/admin/user/:id', () => {
    it('bans a user and response reflects new status', async () => {
        const { user } = await createCandidate();
        const admin = await createAdmin();

        const res = await request(app)
            .put(`/api/admin/user/${user._id}`)
            .set(authHeader(admin._id.toString(), ROLES.ADMIN))
            .send({ newStatus: USER_STATUS.BANNED });
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe(USER_STATUS.BANNED);

        const updated = await User.findById(user._id);
        expect(updated.status).toBe(USER_STATUS.BANNED);
    });

    it('restores a banned user to active', async () => {
        const { user } = await createCandidate();
        await User.findByIdAndUpdate(user._id, { status: USER_STATUS.BANNED });
        const admin = await createAdmin();

        const res = await request(app)
            .put(`/api/admin/user/${user._id}`)
            .set(authHeader(admin._id.toString(), ROLES.ADMIN))
            .send({ newStatus: USER_STATUS.ACTIVE });
        expect(res.status).toBe(200);
    });

    it('returns 400 for invalid status value', async () => {
        const { user } = await createCandidate();
        const admin = await createAdmin();

        const res = await request(app)
            .put(`/api/admin/user/${user._id}`)
            .set(authHeader(admin._id.toString(), ROLES.ADMIN))
            .send({ newStatus: 'suspended' });
        expect(res.status).toBe(400);
    });
});

describe('DELETE /api/admin/user/:id — candidate cascade', () => {
    it('soft-deletes user, candidate, resumes, and applications', async () => {
        const { user, candidate } = await createCandidate();
        const { employer } = await createEmployer();
        const job = await createJob(employer);
        const resume = await createResume(candidate);
        const app1 = await createApplication(candidate, job, { resume: resume._id });
        const admin = await createAdmin();

        const res = await request(app)
            .delete(`/api/admin/user/${user._id}`)
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(200);

        const deletedUser = await findOneIncludingDeleted(User, { _id: user._id });
        expect(deletedUser.isDeleted).toBe(true);

        const deletedCandidate = await findOneIncludingDeleted(Candidate, { user: user._id });
        expect(deletedCandidate.isDeleted).toBe(true);

        const deletedResumes = await findIncludingDeleted(Resume, { candidate: candidate._id });
        expect(deletedResumes.every(r => r.isDeleted)).toBe(true);

        const deletedApps = await findIncludingDeleted(Application, { candidate: candidate._id });
        expect(deletedApps.every(a => a.isDeleted)).toBe(true);

        // Should not appear in regular queries
        const visibleResumes = await Resume.find({ candidate: candidate._id });
        expect(visibleResumes).toHaveLength(0);
        const visibleApps = await Application.find({ candidate: candidate._id });
        expect(visibleApps).toHaveLength(0);
    });
});

describe('DELETE /api/admin/user/:id — employer cascade', () => {
    it('soft-deletes user, employer, all jobs, and all applications to those jobs', async () => {
        const { user, employer } = await createEmployer();
        const job1 = await createJob(employer);
        const job2 = await createJob(employer);
        const { candidate: c1 } = await createCandidate();
        const { candidate: c2 } = await createCandidate();
        const app1 = await createApplication(c1, job1);
        const app2 = await createApplication(c2, job2);
        const admin = await createAdmin();

        const res = await request(app)
            .delete(`/api/admin/user/${user._id}`)
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(200);

        const deletedUser = await findOneIncludingDeleted(User, { _id: user._id });
        expect(deletedUser.isDeleted).toBe(true);

        const deletedEmployer = await findOneIncludingDeleted(Employer, { user: user._id });
        expect(deletedEmployer.isDeleted).toBe(true);

        const deletedJobs = await findIncludingDeleted(Job, { employer: employer._id });
        expect(deletedJobs.every(j => j.isDeleted)).toBe(true);

        const deletedApps = await findIncludingDeleted(Application, {
            job: { $in: [job1._id, job2._id] }
        });
        expect(deletedApps.every(a => a.isDeleted)).toBe(true);

        // Jobs and applications should not appear in regular queries
        const visibleJobs = await Job.find({ employer: employer._id });
        expect(visibleJobs).toHaveLength(0);
    });
});

describe('DELETE /api/admin/user/:id — non-existent user', () => {
    it('returns 400 when user is not found', async () => {
        const admin = await createAdmin();
        const res = await request(app)
            .delete('/api/admin/user/64a000000000000000000001')
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/User not found/i);
    });
});

// ─── Candidate management ─────────────────────────────────────────────────────

describe('GET /api/admin/candidate', () => {
    it('returns all candidates, excluding deleted by default', async () => {
        const { candidate } = await createCandidate();
        await Candidate.findByIdAndUpdate(candidate._id, { isDeleted: true });
        await createCandidate();
        const admin = await createAdmin();

        const res = await request(app)
            .get('/api/admin/candidate')
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(200);
        expect(res.body.data.every(c => !c.isDeleted)).toBe(true);
    });

    it('includes deleted candidates with ?includeDeleted=true', async () => {
        const { candidate } = await createCandidate();
        await Candidate.findByIdAndUpdate(candidate._id, { isDeleted: true });
        const admin = await createAdmin();

        const res = await request(app)
            .get('/api/admin/candidate')
            .query({ includeDeleted: 'true' })
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(200);
        const ids = res.body.data.map(c => c._id);
        expect(ids).toContain(candidate._id.toString());
    });
});

describe('GET /api/admin/candidate — filters', () => {
    it('filters candidates by name', async () => {
        await createCandidate({ name: 'alice smith' });
        await createCandidate({ name: 'bob jones' });
        const admin = await createAdmin();

        const res = await request(app)
            .get('/api/admin/candidate')
            .query({ name: 'alice smith' })
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(200);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.data.every(c => c.name === 'alice smith')).toBe(true);
    });
});

describe('DELETE /api/admin/candidate/:id', () => {
    it('cascades deletion to resumes and applications', async () => {
        const { candidate } = await createCandidate();
        const { employer } = await createEmployer();
        const job = await createJob(employer);
        const resume = await createResume(candidate);
        await createApplication(candidate, job);
        const admin = await createAdmin();

        const res = await request(app)
            .delete(`/api/admin/candidate/${candidate._id}`)
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(200);

        const deletedCandidate = await findOneIncludingDeleted(Candidate, { _id: candidate._id });
        expect(deletedCandidate.isDeleted).toBe(true);

        const deletedResumes = await findIncludingDeleted(Resume, { candidate: candidate._id });
        expect(deletedResumes.every(r => r.isDeleted)).toBe(true);

        const deletedApps = await findIncludingDeleted(Application, { candidate: candidate._id });
        expect(deletedApps.every(a => a.isDeleted)).toBe(true);
    });

    it('succeeds for candidate with no resumes or applications', async () => {
        const { candidate } = await createCandidate();
        const admin = await createAdmin();

        const res = await request(app)
            .delete(`/api/admin/candidate/${candidate._id}`)
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(200);

        const deleted = await findOneIncludingDeleted(Candidate, { _id: candidate._id });
        expect(deleted.isDeleted).toBe(true);
    });
});

// ─── Employer management ──────────────────────────────────────────────────────

describe('GET /api/admin/employer', () => {
    it('returns all employers, excluding deleted by default', async () => {
        const { employer } = await createEmployer();
        await Employer.findByIdAndUpdate(employer._id, { isDeleted: true });
        await createEmployer();
        const admin = await createAdmin();

        const res = await request(app)
            .get('/api/admin/employer')
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(200);
        expect(res.body.data.every(e => !e.isDeleted)).toBe(true);
    });
});

describe('DELETE /api/admin/employer/:id', () => {
    it('cascades deletion to jobs and their applications', async () => {
        const { employer } = await createEmployer();
        const job = await createJob(employer);
        const { candidate } = await createCandidate();
        await createApplication(candidate, job);
        const admin = await createAdmin();

        const res = await request(app)
            .delete(`/api/admin/employer/${employer._id}`)
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(200);

        const deletedEmployer = await findOneIncludingDeleted(Employer, { _id: employer._id });
        expect(deletedEmployer.isDeleted).toBe(true);

        const deletedJobs = await findIncludingDeleted(Job, { employer: employer._id });
        expect(deletedJobs.every(j => j.isDeleted)).toBe(true);

        const deletedApps = await findIncludingDeleted(Application, { job: job._id });
        expect(deletedApps.every(a => a.isDeleted)).toBe(true);
    });

    it('succeeds for employer with no jobs', async () => {
        const { employer } = await createEmployer();
        const admin = await createAdmin();

        const res = await request(app)
            .delete(`/api/admin/employer/${employer._id}`)
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(200);
    });
});

// ─── Job management ───────────────────────────────────────────────────────────

describe('GET /api/admin/job', () => {
    it('excludes soft-deleted jobs by default', async () => {
        const { employer } = await createEmployer();
        const job = await createJob(employer);
        await Job.findByIdAndUpdate(job._id, { isDeleted: true });
        const admin = await createAdmin();

        const res = await request(app)
            .get('/api/admin/job')
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(200);
        expect(res.body.data.map(j => j._id)).not.toContain(job._id.toString());
    });

    it('includes deleted jobs with ?includeDeleted=true', async () => {
        const { employer } = await createEmployer();
        const job = await createJob(employer);
        await Job.findByIdAndUpdate(job._id, { isDeleted: true });
        const admin = await createAdmin();

        const res = await request(app)
            .get('/api/admin/job')
            .query({ includeDeleted: 'true' })
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(200);
        expect(res.body.data.map(j => j._id)).toContain(job._id.toString());
    });
});

describe('DELETE /api/admin/job/:id', () => {
    it('soft-deletes a job and cascades to its applications', async () => {
        const { employer } = await createEmployer();
        const { candidate } = await createCandidate();
        const job = await createJob(employer);
        await createApplication(candidate, job);
        const admin = await createAdmin();

        const res = await request(app)
            .delete(`/api/admin/job/${job._id}`)
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(200);

        const deletedJob = await findOneIncludingDeleted(Job, { _id: job._id });
        expect(deletedJob.isDeleted).toBe(true);

        const deletedApps = await findIncludingDeleted(Application, { job: job._id });
        expect(deletedApps.every(a => a.isDeleted)).toBe(true);
    });

    it('succeeds for job with no applications', async () => {
        const { employer } = await createEmployer();
        const job = await createJob(employer);
        const admin = await createAdmin();

        const res = await request(app)
            .delete(`/api/admin/job/${job._id}`)
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(200);
    });
});

// ─── Application management ───────────────────────────────────────────────────

describe('GET /api/admin/application', () => {
    it('excludes soft-deleted applications by default', async () => {
        const { candidate } = await createCandidate();
        const { employer } = await createEmployer();
        const job = await createJob(employer);
        const app1 = await createApplication(candidate, job);
        await Application.findByIdAndUpdate(app1._id, { isDeleted: true });
        const admin = await createAdmin();

        const res = await request(app)
            .get('/api/admin/application')
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(200);
        expect(res.body.data.map(a => a._id)).not.toContain(app1._id.toString());
    });

    it('includes deleted applications with ?includeDeleted=true', async () => {
        const { candidate } = await createCandidate();
        const { employer } = await createEmployer();
        const job = await createJob(employer);
        const app1 = await createApplication(candidate, job);
        await Application.findByIdAndUpdate(app1._id, { isDeleted: true });
        const admin = await createAdmin();

        const res = await request(app)
            .get('/api/admin/application')
            .query({ includeDeleted: 'true' })
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(200);
        expect(res.body.data.map(a => a._id)).toContain(app1._id.toString());
    });
});

describe('DELETE /api/admin/application/:id', () => {
    it('soft-deletes an application', async () => {
        const { candidate } = await createCandidate();
        const { employer } = await createEmployer();
        const job = await createJob(employer);
        const app1 = await createApplication(candidate, job);
        const admin = await createAdmin();

        const res = await request(app)
            .delete(`/api/admin/application/${app1._id}`)
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(200);

        const deleted = await findOneIncludingDeleted(Application, { _id: app1._id });
        expect(deleted.isDeleted).toBe(true);
    });
});

// ─── Resume management ────────────────────────────────────────────────────────

describe('GET /api/admin/resume', () => {
    it('excludes soft-deleted resumes by default', async () => {
        const { candidate } = await createCandidate();
        const r = await createResume(candidate);
        await Resume.findByIdAndUpdate(r._id, { isDeleted: true });
        const admin = await createAdmin();

        const res = await request(app)
            .get('/api/admin/resume')
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(200);
        expect(res.body.data.map(rv => rv._id)).not.toContain(r._id.toString());
    });

    it('includes deleted resumes with ?includeDeleted=true', async () => {
        const { candidate } = await createCandidate();
        const r = await createResume(candidate);
        await Resume.findByIdAndUpdate(r._id, { isDeleted: true });
        const admin = await createAdmin();

        const res = await request(app)
            .get('/api/admin/resume')
            .query({ includeDeleted: 'true' })
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(200);
        expect(res.body.data.map(rv => rv._id)).toContain(r._id.toString());
    });
});

describe('DELETE /api/admin/resume/:id', () => {
    it('soft-deletes a resume', async () => {
        const { candidate } = await createCandidate();
        const r = await createResume(candidate);
        const admin = await createAdmin();

        const res = await request(app)
            .delete(`/api/admin/resume/${r._id}`)
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(200);

        const deleted = await findOneIncludingDeleted(Resume, { _id: r._id });
        expect(deleted.isDeleted).toBe(true);
    });
});
