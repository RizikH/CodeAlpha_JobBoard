const request = require('supertest');
const app = require('../../app');
const { connect, clearCollections, findOneIncludingDeleted } = require('../helpers/db');
const { authHeader } = require('../helpers/authHelper');
const { createCandidate, createEmployer, createResume } = require('../helpers/factories');
const Resume = require('../../models/Resume');
const { ROLES } = require('../../utils/constants');

beforeAll(async () => { await connect(); });
afterEach(async () => { await clearCollections(); });

const pdfBuffer = Buffer.from('%PDF-1.4 1 0 obj<</Type/Catalog>>endobj');

describe('GET /api/resumes', () => {
    it('returns candidate\'s own resumes', async () => {
        const { user, candidate } = await createCandidate();
        await createResume(candidate);
        await createResume(candidate);

        const res = await request(app)
            .get('/api/resumes')
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE));
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(2);
    });

    it('does not return another candidate\'s resumes', async () => {
        const { user } = await createCandidate();
        const { candidate: other } = await createCandidate();
        await createResume(other);

        const res = await request(app)
            .get('/api/resumes')
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE));
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(0);
    });

    it('does not return soft-deleted resumes', async () => {
        const { user, candidate } = await createCandidate();
        const r = await createResume(candidate);
        await Resume.findByIdAndUpdate(r._id, { isDeleted: true });

        const res = await request(app)
            .get('/api/resumes')
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE));
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveLength(0);
    });

    it('returns 403 for employer', async () => {
        const { user } = await createEmployer();
        const res = await request(app)
            .get('/api/resumes')
            .set(authHeader(user._id.toString(), ROLES.EMPLOYER));
        expect(res.status).toBe(403);
    });

    it('returns 401 without token', async () => {
        const res = await request(app).get('/api/resumes');
        expect(res.status).toBe(401);
    });
});

describe('GET /api/resumes/:id', () => {
    it('returns candidate\'s own resume', async () => {
        const { user, candidate } = await createCandidate();
        const r = await createResume(candidate);

        const res = await request(app)
            .get(`/api/resumes/${r._id}`)
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE));
        expect(res.status).toBe(200);
        expect(res.body.data._id).toBe(r._id.toString());
    });

    it('returns 400 for another candidate\'s resume', async () => {
        const { user } = await createCandidate();
        const { candidate: other } = await createCandidate();
        const r = await createResume(other);

        const res = await request(app)
            .get(`/api/resumes/${r._id}`)
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE));
        expect(res.status).toBe(400);
    });

    it('returns 400 for non-existent ID', async () => {
        const { user } = await createCandidate();
        const res = await request(app)
            .get('/api/resumes/64a000000000000000000001')
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE));
        expect(res.status).toBe(400);
    });
});

describe('POST /api/resumes', () => {
    it('uploads a valid PDF', async () => {
        const { user } = await createCandidate();
        const res = await request(app)
            .post('/api/resumes')
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE))
            .attach('resumes', pdfBuffer, { filename: 'cv.pdf', contentType: 'application/pdf' });
        expect(res.status).toBe(201);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].fileName).toBe('cv.pdf');
    });

    it('uploads multiple PDFs', async () => {
        const { user } = await createCandidate();
        const res = await request(app)
            .post('/api/resumes')
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE))
            .attach('resumes', pdfBuffer, { filename: 'cv1.pdf', contentType: 'application/pdf' })
            .attach('resumes', pdfBuffer, { filename: 'cv2.pdf', contentType: 'application/pdf' });
        expect(res.status).toBe(201);
        expect(res.body.data).toHaveLength(2);
    });

    it('returns 400 for non-PDF file', async () => {
        const { user } = await createCandidate();
        const txtBuffer = Buffer.from('plain text content');
        const res = await request(app)
            .post('/api/resumes')
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE))
            .attach('resumes', txtBuffer, { filename: 'notes.txt', contentType: 'text/plain' });
        expect(res.status).toBe(400);
    });

    it('returns 400 for file exceeding 5 MB', async () => {
        const { user } = await createCandidate();
        const bigBuffer = Buffer.alloc(5 * 1024 * 1024 + 1, 'a');
        const res = await request(app)
            .post('/api/resumes')
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE))
            .attach('resumes', bigBuffer, { filename: 'large.pdf', contentType: 'application/pdf' });
        expect(res.status).toBe(400);
    });

    it('returns 403 for employer', async () => {
        const { user } = await createEmployer();
        const res = await request(app)
            .post('/api/resumes')
            .set(authHeader(user._id.toString(), ROLES.EMPLOYER))
            .attach('resumes', pdfBuffer, { filename: 'cv.pdf', contentType: 'application/pdf' });
        expect(res.status).toBe(403);
    });

    it('returns 401 without token', async () => {
        const res = await request(app)
            .post('/api/resumes')
            .attach('resumes', pdfBuffer, { filename: 'cv.pdf', contentType: 'application/pdf' });
        expect(res.status).toBe(401);
    });
});

describe('DELETE /api/resumes/:id', () => {
    it('soft-deletes candidate\'s own resume (isDeleted becomes true)', async () => {
        const { user, candidate } = await createCandidate();
        const r = await createResume(candidate);

        const res = await request(app)
            .delete(`/api/resumes/${r._id}`)
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE));
        expect(res.status).toBe(200);

        const deleted = await findOneIncludingDeleted(Resume, { _id: r._id });
        expect(deleted.isDeleted).toBe(true);

        const visible = await request(app)
            .get('/api/resumes')
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE));
        expect(visible.body.data).toHaveLength(0);
    });

    it('returns 400 when deleting another candidate\'s resume', async () => {
        const { user } = await createCandidate();
        const { candidate: other } = await createCandidate();
        const r = await createResume(other);

        const res = await request(app)
            .delete(`/api/resumes/${r._id}`)
            .set(authHeader(user._id.toString(), ROLES.CANDIDATE));
        expect(res.status).toBe(400);
    });

    it('returns 403 for employer', async () => {
        const { candidate } = await createCandidate();
        const r = await createResume(candidate);
        const { user } = await createEmployer();

        const res = await request(app)
            .delete(`/api/resumes/${r._id}`)
            .set(authHeader(user._id.toString(), ROLES.EMPLOYER));
        expect(res.status).toBe(403);
    });
});
