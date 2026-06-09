const request = require('supertest');
const app = require('../../app');
const { connect, clearCollections, findOneIncludingDeleted } = require('../helpers/db');
const { authHeader } = require('../helpers/authHelper');
const { createCandidate, createEmployer, createAdmin, createJob } = require('../helpers/factories');
const Job = require('../../models/Job');
const { ROLES } = require('../../utils/constants');

beforeAll(async () => { await connect(); });
afterEach(async () => { await clearCollections(); });

describe('GET /api/jobs', () => {
    it('returns all non-deleted jobs without auth', async () => {
        const { employer } = await createEmployer();
        await createJob(employer, { title: 'Backend Dev', location: 'Remote' });
        await createJob(employer, { title: 'Frontend Dev', location: 'NYC' });

        const res = await request(app).get('/api/jobs');
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(2);
    });

    it('filters by location', async () => {
        const { employer } = await createEmployer();
        await createJob(employer, { location: 'Remote' });
        await createJob(employer, { location: 'NYC' });

        const res = await request(app).get('/api/jobs').query({ location: 'Remote' });
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].location).toBe('Remote');
    });

    it('filters by jobType', async () => {
        const { employer } = await createEmployer();
        await createJob(employer, { jobType: 'full-time' });
        await createJob(employer, { jobType: 'contract' });

        const res = await request(app).get('/api/jobs').query({ jobType: 'contract' });
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].jobType).toBe('contract');
    });

    it('does not return soft-deleted jobs', async () => {
        const { employer } = await createEmployer();
        const job = await createJob(employer);
        await Job.findByIdAndUpdate(job._id, { isDeleted: true });

        const res = await request(app).get('/api/jobs');
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(0);
    });

    it('returns empty array when no jobs exist', async () => {
        const res = await request(app).get('/api/jobs');
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(0);
    });
});

describe('GET /api/jobs/:id', () => {
    it('returns a job by ID', async () => {
        const { employer } = await createEmployer();
        const job = await createJob(employer, { title: 'My Job' });

        const res = await request(app).get(`/api/jobs/${job._id}`);
        expect(res.status).toBe(200);
        expect(res.body.data.title).toBe('My Job');
    });

    it('returns 404 for non-existent ID', async () => {
        const res = await request(app).get('/api/jobs/64a000000000000000000001');
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });
});

describe('GET /api/jobs/mine', () => {
    it('returns employer\'s own jobs', async () => {
        const { user, employer } = await createEmployer();
        await createJob(employer, { title: 'My Job' });
        const { employer: other } = await createEmployer();
        await createJob(other, { title: 'Other Job' });

        const res = await request(app)
            .get('/api/jobs/mine')
            .set(authHeader(user._id.toString(), ROLES.EMPLOYER));
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].title).toBe('My Job');
    });

    it('returns 403 for candidate', async () => {
        const { user } = await createCandidate();
        const res = await request(app)
            .get('/api/jobs/mine')
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE));
        expect(res.status).toBe(403);
    });

    it('returns 401 without token', async () => {
        const res = await request(app).get('/api/jobs/mine');
        expect(res.status).toBe(401);
    });
});

describe('POST /api/jobs', () => {
    const validJob = {
        title: 'Software Engineer',
        description: 'Build things.',
        skills: ['JavaScript', 'Node.js'],
        location: 'Remote',
        jobType: 'full-time',
        salary: 80000,
    };

    it('creates a job for an employer', async () => {
        const { user } = await createEmployer();
        const res = await request(app)
            .post('/api/jobs')
            .set(authHeader(user._id.toString(), ROLES.EMPLOYER))
            .send(validJob);
        expect(res.status).toBe(201);
        expect(res.body.data.title).toBe('Software Engineer');
    });

    it('returns 400 when title is missing', async () => {
        const { user } = await createEmployer();
        const { title, ...body } = validJob;
        const res = await request(app)
            .post('/api/jobs')
            .set(authHeader(user._id.toString(), ROLES.EMPLOYER))
            .send(body);
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Title is required/i);
    });

    it('returns 400 for invalid jobType', async () => {
        const { user } = await createEmployer();
        const res = await request(app)
            .post('/api/jobs')
            .set(authHeader(user._id.toString(), ROLES.EMPLOYER))
            .send({ ...validJob, jobType: 'gig' });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Job type must be one of/i);
    });

    it('returns 403 for candidate', async () => {
        const { user } = await createCandidate();
        const res = await request(app)
            .post('/api/jobs')
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE))
            .send(validJob);
        expect(res.status).toBe(403);
    });

    it('returns 401 without token', async () => {
        const res = await request(app).post('/api/jobs').send(validJob);
        expect(res.status).toBe(401);
    });
});

describe('PUT /api/jobs/:id', () => {
    it('updates own job', async () => {
        const { user, employer } = await createEmployer();
        const job = await createJob(employer, { title: 'Old Title' });

        const res = await request(app)
            .put(`/api/jobs/${job._id}`)
            .set(authHeader(user._id.toString(), ROLES.EMPLOYER))
            .send({ title: 'New Title' });
        expect(res.status).toBe(200);
        expect(res.body.data.title).toBe('New Title');
    });

    it('returns 400 when updating another employer\'s job', async () => {
        const { employer: other } = await createEmployer();
        const job = await createJob(other);
        const { user } = await createEmployer();

        const res = await request(app)
            .put(`/api/jobs/${job._id}`)
            .set(authHeader(user._id.toString(), ROLES.EMPLOYER))
            .send({ title: 'Hijacked' });
        expect(res.status).toBe(400);
    });

    it('returns 400 for invalid jobType in update', async () => {
        const { user, employer } = await createEmployer();
        const job = await createJob(employer);

        const res = await request(app)
            .put(`/api/jobs/${job._id}`)
            .set(authHeader(user._id.toString(), ROLES.EMPLOYER))
            .send({ jobType: 'gig' });
        expect(res.status).toBe(400);
    });

    it('returns 403 for candidate', async () => {
        const { employer } = await createEmployer();
        const job = await createJob(employer);
        const { user } = await createCandidate();

        const res = await request(app)
            .put(`/api/jobs/${job._id}`)
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE))
            .send({ title: 'X' });
        expect(res.status).toBe(403);
    });
});

describe('DELETE /api/jobs/:id', () => {
    it('soft-deletes own job (isDeleted becomes true)', async () => {
        const { user, employer } = await createEmployer();
        const job = await createJob(employer);

        const res = await request(app)
            .delete(`/api/jobs/${job._id}`)
            .set(authHeader(user._id.toString(), ROLES.EMPLOYER));
        expect(res.status).toBe(200);

        const deleted = await findOneIncludingDeleted(Job, { _id: job._id });
        expect(deleted.isDeleted).toBe(true);

        const visible = await request(app).get('/api/jobs');
        expect(visible.body.data.find(j => j._id === job._id.toString())).toBeUndefined();
    });

    it('returns 400 when deleting another employer\'s job', async () => {
        const { employer: other } = await createEmployer();
        const job = await createJob(other);
        const { user } = await createEmployer();

        const res = await request(app)
            .delete(`/api/jobs/${job._id}`)
            .set(authHeader(user._id.toString(), ROLES.EMPLOYER));
        expect(res.status).toBe(400);
    });

    it('returns 403 for candidate', async () => {
        const { employer } = await createEmployer();
        const job = await createJob(employer);
        const { user } = await createCandidate();

        const res = await request(app)
            .delete(`/api/jobs/${job._id}`)
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE));
        expect(res.status).toBe(403);
    });
});
