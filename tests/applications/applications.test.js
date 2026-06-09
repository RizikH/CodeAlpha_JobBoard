const request = require('supertest');
const app = require('../../app');
const { connect, clearCollections, findOneIncludingDeleted } = require('../helpers/db');
const { authHeader } = require('../helpers/authHelper');
const { createCandidate, createEmployer, createAdmin, createJob, createApplication, createResume } = require('../helpers/factories');
const Application = require('../../models/Application');
const { ROLES, APPLICATION_STATUS } = require('../../utils/constants');

beforeAll(async () => { await connect(); });
afterEach(async () => { await clearCollections(); });

describe('GET /api/applications', () => {
    it('candidate sees only their own applications', async () => {
        const { user, candidate } = await createCandidate();
        const { candidate: other } = await createCandidate();
        const { employer } = await createEmployer();
        const job = await createJob(employer);
        await createApplication(candidate, job);
        await createApplication(other, job);

        const res = await request(app)
            .get('/api/applications')
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE));
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
    });

    it('employer sees applications to their jobs only', async () => {
        const { user, employer } = await createEmployer();
        const { employer: other } = await createEmployer();
        const job = await createJob(employer);
        const otherJob = await createJob(other);
        const { candidate } = await createCandidate();
        await createApplication(candidate, job);
        await createApplication(candidate, otherJob);

        const res = await request(app)
            .get('/api/applications')
            .set(authHeader(user._id.toString(), ROLES.EMPLOYER));
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
    });

    it('returns 403 for admin role', async () => {
        const admin = await createAdmin();
        const res = await request(app)
            .get('/api/applications')
            .set(authHeader(admin._id.toString(), ROLES.ADMIN));
        expect(res.status).toBe(403);
    });

    it('returns 401 without token', async () => {
        const res = await request(app).get('/api/applications');
        expect(res.status).toBe(401);
    });

    it('does not return soft-deleted applications', async () => {
        const { user, candidate } = await createCandidate();
        const { employer } = await createEmployer();
        const job = await createJob(employer);
        const app1 = await createApplication(candidate, job);
        await Application.findByIdAndUpdate(app1._id, { isDeleted: true });

        const res = await request(app)
            .get('/api/applications')
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE));
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(0);
    });
});

describe('GET /api/applications/:id', () => {
    it('candidate gets their own application', async () => {
        const { user, candidate } = await createCandidate();
        const { employer } = await createEmployer();
        const job = await createJob(employer);
        const app1 = await createApplication(candidate, job);

        const res = await request(app)
            .get(`/api/applications/${app1._id}`)
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE));
        expect(res.status).toBe(200);
        expect(res.body.data._id).toBe(app1._id.toString());
    });

    it('candidate cannot access another candidate\'s application', async () => {
        const { user } = await createCandidate();
        const { candidate: other } = await createCandidate();
        const { employer } = await createEmployer();
        const job = await createJob(employer);
        const app1 = await createApplication(other, job);

        const res = await request(app)
            .get(`/api/applications/${app1._id}`)
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE));
        expect(res.status).toBe(400);
    });

    it('employer gets application to their job', async () => {
        const { user, employer } = await createEmployer();
        const { candidate } = await createCandidate();
        const job = await createJob(employer);
        const app1 = await createApplication(candidate, job);

        const res = await request(app)
            .get(`/api/applications/${app1._id}`)
            .set(authHeader(user._id.toString(), ROLES.EMPLOYER));
        expect(res.status).toBe(200);
    });

    it('employer cannot access application to another employer\'s job', async () => {
        const { user } = await createEmployer();
        const { employer: other } = await createEmployer();
        const { candidate } = await createCandidate();
        const job = await createJob(other);
        const app1 = await createApplication(candidate, job);

        const res = await request(app)
            .get(`/api/applications/${app1._id}`)
            .set(authHeader(user._id.toString(), ROLES.EMPLOYER));
        expect(res.status).toBe(400);
    });
});

describe('POST /api/applications', () => {
    it('candidate submits a valid application', async () => {
        const { user } = await createCandidate();
        const { employer } = await createEmployer();
        const job = await createJob(employer);

        const res = await request(app)
            .post('/api/applications')
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE))
            .send({ jobId: job._id.toString() });
        expect(res.status).toBe(201);
        expect(res.body.data.job).toBe(job._id.toString());
    });

    it('candidate applies with a resume ID', async () => {
        const { user, candidate } = await createCandidate();
        const { employer } = await createEmployer();
        const job = await createJob(employer);
        const resume = await createResume(candidate);

        const res = await request(app)
            .post('/api/applications')
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE))
            .send({ jobId: job._id.toString(), resume: resume._id.toString() });
        expect(res.status).toBe(201);
        expect(res.body.data.resume).toBe(resume._id.toString());
    });

    it('returns 400 when job ID is missing', async () => {
        const { user } = await createCandidate();
        const res = await request(app)
            .post('/api/applications')
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE))
            .send({});
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Job ID is required/i);
    });

    it('returns 400 for invalid ObjectId format', async () => {
        const { user } = await createCandidate();
        const res = await request(app)
            .post('/api/applications')
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE))
            .send({ jobId: 'not-an-objectid' });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/valid MongoDB ObjectId/i);
    });

    it('returns 403 for employer', async () => {
        const { user } = await createEmployer();
        const { employer } = await createEmployer();
        const job = await createJob(employer);
        const res = await request(app)
            .post('/api/applications')
            .set(authHeader(user._id.toString(), ROLES.EMPLOYER))
            .send({ jobId: job._id.toString() });
        expect(res.status).toBe(403);
    });

    it('returns 401 without token', async () => {
        const res = await request(app).post('/api/applications').send({ job: '64a000000000000000000001' });
        expect(res.status).toBe(401);
    });
});

describe('PUT /api/applications/:id', () => {
    it('candidate withdraws their application and response reflects new status', async () => {
        const { user, candidate } = await createCandidate();
        const { employer } = await createEmployer();
        const job = await createJob(employer);
        const app1 = await createApplication(candidate, job);

        const res = await request(app)
            .put(`/api/applications/${app1._id}`)
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE))
            .send({});
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe(APPLICATION_STATUS.WITHDRAWN);
    });

    it('employer accepts an application and response reflects new status', async () => {
        const { user, employer } = await createEmployer();
        const { candidate } = await createCandidate();
        const job = await createJob(employer);
        const app1 = await createApplication(candidate, job);

        const res = await request(app)
            .put(`/api/applications/${app1._id}`)
            .set(authHeader(user._id.toString(), ROLES.EMPLOYER))
            .send({ newStatus: APPLICATION_STATUS.ACCEPTED });
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe(APPLICATION_STATUS.ACCEPTED);
    });

    it('employer declines an application and response reflects new status', async () => {
        const { user, employer } = await createEmployer();
        const { candidate } = await createCandidate();
        const job = await createJob(employer);
        const app1 = await createApplication(candidate, job);

        const res = await request(app)
            .put(`/api/applications/${app1._id}`)
            .set(authHeader(user._id.toString(), ROLES.EMPLOYER))
            .send({ newStatus: APPLICATION_STATUS.DECLINED });
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe(APPLICATION_STATUS.DECLINED);
    });

    it('employer cannot set status to withdrawn (missing newStatus returns validation error)', async () => {
        const { user, employer } = await createEmployer();
        const { candidate } = await createCandidate();
        const job = await createJob(employer);
        const app1 = await createApplication(candidate, job);

        const res = await request(app)
            .put(`/api/applications/${app1._id}`)
            .set(authHeader(user._id.toString(), ROLES.EMPLOYER))
            .send({ newStatus: APPLICATION_STATUS.WITHDRAWN });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/accepted or declined/i);
    });
});

describe('DELETE /api/applications/:id', () => {
    it('candidate soft-deletes their own application (isDeleted becomes true)', async () => {
        const { user, candidate } = await createCandidate();
        const { employer } = await createEmployer();
        const job = await createJob(employer);
        const app1 = await createApplication(candidate, job);

        const res = await request(app)
            .delete(`/api/applications/${app1._id}`)
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE));
        expect(res.status).toBe(200);

        const deleted = await findOneIncludingDeleted(Application, { _id: app1._id });
        expect(deleted.isDeleted).toBe(true);
    });

    it('returns 403 for employer', async () => {
        const { user } = await createEmployer();
        const { candidate } = await createCandidate();
        const { employer } = await createEmployer();
        const job = await createJob(employer);
        const app1 = await createApplication(candidate, job);

        const res = await request(app)
            .delete(`/api/applications/${app1._id}`)
            .set(authHeader(user._id.toString(), ROLES.EMPLOYER));
        expect(res.status).toBe(403);
    });
});
