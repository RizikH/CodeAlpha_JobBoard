const request = require('supertest');
const app = require('../../app');
const { connect, clearCollections } = require('../helpers/db');
const { createCandidate } = require('../helpers/factories');

beforeAll(async () => { await connect(); });
afterEach(async () => { await clearCollections(); });

const validCandidate = {
    name: 'John Doe',
    email: 'john@test.com',
    password: 'Test@1234!',
    phone: '+1 1234567890',
    role: 'candidate',
};

const validEmployer = {
    name: 'Jane Corp',
    email: 'jane@test.com',
    password: 'Test@1234!',
    phone: '+1 9876543210',
    company: 'Acme Inc',
    location: 'New York',
    role: 'employer',
};

describe('POST /api/auth/register', () => {
    it('registers a candidate successfully', async () => {
        const res = await request(app).post('/api/auth/register').send(validCandidate);
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBeDefined();
    });

    it('registers an employer successfully', async () => {
        const res = await request(app).post('/api/auth/register').send(validEmployer);
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBeDefined();
    });

    it('registers an admin successfully', async () => {
        const res = await request(app).post('/api/auth/register').send({
            name: 'Site Admin',
            email: 'admin@test.com',
            password: 'Admin@1234!',
            phone: '+1 5550000000',
            role: 'admin',
        });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBeDefined();
    });

    it('returns 400 on duplicate email', async () => {
        await request(app).post('/api/auth/register').send(validCandidate);
        const res = await request(app).post('/api/auth/register').send(validCandidate);
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('returns 400 when password is missing', async () => {
        const { password, ...body } = validCandidate;
        const res = await request(app).post('/api/auth/register').send(body);
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Password is required/i);
    });

    it('returns 400 for weak password (no special character)', async () => {
        const res = await request(app).post('/api/auth/register').send({ ...validCandidate, password: 'TestPass1' });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/special character/i);
    });

    it('returns 400 for invalid phone format', async () => {
        const res = await request(app).post('/api/auth/register').send({ ...validCandidate, phone: '123-456-7890' });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Phone number must follow/i);
    });

    it('returns 400 for invalid role', async () => {
        const res = await request(app).post('/api/auth/register').send({ ...validCandidate, role: 'superuser' });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Role must be one of/i);
    });

    it('returns 400 when name is missing', async () => {
        const { name, ...body } = validCandidate;
        const res = await request(app).post('/api/auth/register').send(body);
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Name is required/i);
    });
});

describe('POST /api/auth/login', () => {
    beforeEach(async () => {
        await request(app).post('/api/auth/register').send(validCandidate);
    });

    it('logs in with valid credentials', async () => {
        const res = await request(app).post('/api/auth/login').send({
            email: validCandidate.email,
            password: validCandidate.password,
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBeDefined();
    });

    it('returns 401 for wrong password', async () => {
        const res = await request(app).post('/api/auth/login').send({
            email: validCandidate.email,
            password: 'Wrong@Pass1',
        });
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it('returns 401 for unknown email', async () => {
        const res = await request(app).post('/api/auth/login').send({
            email: 'nobody@test.com',
            password: 'Test@1234!',
        });
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it('returns 400 when email is missing', async () => {
        const res = await request(app).post('/api/auth/login').send({ password: 'Test@1234!' });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Email is required/i);
    });

    it('returns 400 when password is missing', async () => {
        const res = await request(app).post('/api/auth/login').send({ email: validCandidate.email });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Password is required/i);
    });
});
