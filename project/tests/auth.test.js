process.env.NODE_ENV = 'test';

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const pool = require('../src/config/db');
const { loginLimiter } = require('../src/middleware/rateLimiter');
const { createAdminUser } = require('./helpers/testUtils');

describe('Auth API Integration Tests (PostgreSQL + JWT)', () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });
  });

  beforeEach(async () => {
    // Truncate users table before every test to ensure test isolation
    await pool.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE;');
    loginLimiter.reset();
  });

  after(async () => {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    await pool.end();
  });

  async function registerUser(payload) {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    return { res, body };
  }

  async function loginUser(payload) {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    return { res, body };
  }

  async function getProfile(token) {
    const headers = {};
    if (token !== undefined) {
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(`${baseUrl}/auth/me`, {
      method: 'GET',
      headers,
    });
    const body = await res.json();
    return { res, body };
  }

  it('should register a new user successfully with 201 status and JWT token', async () => {
    const payload = {
      name: 'Alice Developer',
      email: 'alice@example.com',
      password: 'password123',
    };
    const { res, body } = await registerUser(payload);

    assert.equal(res.status, 201);
    assert.ok(body.token);
    assert.ok(body.user);
    assert.ok(typeof body.user.id === 'number');
    assert.equal(body.user.name, 'Alice Developer');
    assert.equal(body.user.email, 'alice@example.com');
    assert.equal(body.user.role, 'member');
    assert.equal(body.user.password_hash, undefined);
    assert.equal(body.user.passwordHash, undefined);
    assert.ok(body.user.createdAt);
  });

  it('should reject registration with duplicate email with 409 status', async () => {
    const payload = {
      name: 'Bob Smith',
      email: 'bob@example.com',
      password: 'securepassword',
    };
    const first = await registerUser(payload);
    assert.equal(first.res.status, 201);

    const duplicate = await registerUser({
      name: 'Bob Duplicate',
      email: 'BOB@EXAMPLE.COM', // test case insensitivity
      password: 'anotherpassword',
    });
    assert.equal(duplicate.res.status, 409);
    assert.equal(duplicate.body.error, 'Email already registered');
  });

  it('should reject registration when validation fails (short name, invalid email, short password)', async () => {
    const badName = await registerUser({
      name: 'A',
      email: 'valid@example.com',
      password: 'password123',
    });
    assert.equal(badName.res.status, 400);

    const badEmail = await registerUser({
      name: 'Valid Name',
      email: 'not-an-email',
      password: 'password123',
    });
    assert.equal(badEmail.res.status, 400);

    const badPassword = await registerUser({
      name: 'Valid Name',
      email: 'valid@example.com',
      password: '123',
    });
    assert.equal(badPassword.res.status, 400);
  });

  it('should login successfully with valid credentials and return 200 with JWT token', async () => {
    await registerUser({
      name: 'Charlie Test',
      email: 'charlie@example.com',
      password: 'mypassword456',
    });

    const { res, body } = await loginUser({
      email: 'charlie@example.com',
      password: 'mypassword456',
    });

    assert.equal(res.status, 200);
    assert.ok(body.token);
    assert.equal(body.user.email, 'charlie@example.com');
    assert.equal(body.user.name, 'Charlie Test');
    assert.equal(body.user.password_hash, undefined);
    assert.equal(body.user.passwordHash, undefined);
  });

  it('should reject login with wrong password with 401 status', async () => {
    await registerUser({
      name: 'David Test',
      email: 'david@example.com',
      password: 'correctpassword',
    });

    const { res, body } = await loginUser({
      email: 'david@example.com',
      password: 'wrongpassword',
    });

    assert.equal(res.status, 401);
    assert.equal(body.error, 'Invalid email or password');
  });

  it('should reject login with nonexistent email with 401 status', async () => {
    const { res, body } = await loginUser({
      email: 'nonexistent@example.com',
      password: 'password123',
    });

    assert.equal(res.status, 401);
    assert.equal(body.error, 'Invalid email or password');
  });

  it('should get current user profile with valid JWT on /auth/me', async () => {
    const reg = await registerUser({
      name: 'Elena Rostova',
      email: 'elena@example.com',
      password: 'strongpassword789',
    });

    const token = reg.body.token;
    const { res, body } = await getProfile(token);

    assert.equal(res.status, 200);
    assert.equal(body.id, reg.body.user.id);
    assert.equal(body.email, 'elena@example.com');
    assert.equal(body.name, 'Elena Rostova');
    assert.equal(body.password_hash, undefined);
    assert.equal(body.passwordHash, undefined);
  });

  it('should reject /auth/me when Authorization header is missing with 401 status', async () => {
    const { res, body } = await getProfile(undefined);

    assert.equal(res.status, 401);
    assert.equal(body.error, 'Authentication required');
  });

  it('should reject /auth/me with invalid or forged token with 401 status', async () => {
    const { res, body } = await getProfile('invalid.fake.jwt-token');

    assert.equal(res.status, 401);
    assert.equal(body.error, 'Invalid or expired token');
  });

  it('should ignore role in registration and always assign member role', async () => {
    const { res, body } = await registerUser({
      name: 'Malicious Attacker',
      email: 'hacker@example.com',
      password: 'password123',
      role: 'admin',
    });

    assert.equal(res.status, 201);
    assert.equal(body.user.role, 'member');
    assert.notEqual(body.user.role, 'admin');
  });

  it('should rate limit excessive login attempts and return 429 status', async () => {
    await registerUser({
      name: 'Rate Limit Target',
      email: 'ratelimit@example.com',
      password: 'password123',
    });

    // 5 allowed attempts
    for (let i = 0; i < 5; i++) {
      const { res } = await loginUser({
        email: 'ratelimit@example.com',
        password: 'wrongpassword',
      });
      assert.equal(res.status, 401);
    }

    // 6th attempt should be blocked with 429 Too Many Requests
    const { res, body } = await loginUser({
      email: 'ratelimit@example.com',
      password: 'wrongpassword',
    });
    assert.equal(res.status, 429);
    assert.ok(body.error.includes('Too many login attempts'));
    assert.ok(res.headers.get('retry-after'));
  });

  it('should protect /admin/stats requiring valid admin JWT token', async () => {
    // 1. Unauthenticated request -> 401
    const unauthRes = await fetch(`${baseUrl}/admin/stats`);
    assert.equal(unauthRes.status, 401);

    // 2. Member request -> 403
    const member = await registerUser({
      name: 'Regular Member',
      email: 'regular_member@example.com',
      password: 'password123',
    });
    const memberRes = await fetch(`${baseUrl}/admin/stats`, {
      headers: { Authorization: `Bearer ${member.body.token}` },
    });
    assert.equal(memberRes.status, 403);

    // 3. Admin request -> 200
    const admin = await createAdminUser({
      name: 'Admin For Stats',
      email: 'admin_stats@devflow.local',
      password: 'adminpassword123',
    });
    const adminRes = await fetch(`${baseUrl}/admin/stats`, {
      headers: { Authorization: `Bearer ${admin.token}` },
    });
    const adminBody = await adminRes.json();
    assert.equal(adminRes.status, 200);
    assert.equal(adminBody.stats, 'system operational');
  });

  it('should throw fatal error on boot when NODE_ENV=production and JWT_SECRET is missing or insecure', async () => {
    const { execSync } = require('node:child_process');
    assert.throws(
      () => {
        execSync(
          'node -e "process.env.NODE_ENV=\'production\'; delete process.env.JWT_SECRET; require(\'./src/config\')"',
          {
            cwd: process.cwd(),
            stdio: 'pipe',
          }
        );
      },
      (err) => {
        const stderr = err.stderr ? err.stderr.toString() : '';
        return stderr.includes('FATAL CONFIGURATION ERROR: In production mode, JWT_SECRET must be explicitly set');
      }
    );
  });
});

