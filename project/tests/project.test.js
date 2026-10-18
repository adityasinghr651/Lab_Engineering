process.env.NODE_ENV = 'test';

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const pool = require('../src/config/db');
const { createAdminUser } = require('./helpers/testUtils');

describe('Projects API Integration Tests (PostgreSQL + Auth)', () => {
  let server;
  let baseUrl;
  let user1Token;
  let user1Id;
  let user2Token;
  let user2Id;
  let adminToken;
  let adminId;

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });
  });

  beforeEach(async () => {
    // Truncate projects and users tables before each test
    await pool.query('TRUNCATE TABLE projects, users RESTART IDENTITY CASCADE;');

    // Seed test users
    const res1 = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Project Owner',
        email: 'owner@example.com',
        password: 'password123',
      }),
    });
    const data1 = await res1.json();
    user1Token = data1.token;
    user1Id = data1.user.id;

    const res2 = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Other Member',
        email: 'member@example.com',
        password: 'password123',
      }),
    });
    const data2 = await res2.json();
    user2Token = data2.token;
    user2Id = data2.user.id;

    const adminData = await createAdminUser({
      name: 'System Admin',
      email: 'admin@example.com',
      password: 'adminpassword123',
    });
    adminToken = adminData.token;
    adminId = adminData.user.id;
  });

  after(async () => {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    await pool.end();
  });

  async function createProject(payload, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}/projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    return { res, body };
  }

  it('should reject project creation without authentication with 401 status', async () => {
    const { res, body } = await createProject({
      name: 'DevFlow Core',
      key: 'CORE',
    });
    assert.equal(res.status, 401);
    assert.equal(body.error, 'Authentication required');
  });

  it('should create a project successfully with 201 status and correct owner', async () => {
    const { res, body } = await createProject(
      {
        name: 'DevFlow Core',
        key: 'core',
        description: 'Main core services repository',
      },
      user1Token
    );

    assert.equal(res.status, 201);
    assert.ok(typeof body.id === 'number');
    assert.equal(body.name, 'DevFlow Core');
    assert.equal(body.key, 'CORE'); // normalized to uppercase
    assert.equal(body.description, 'Main core services repository');
    assert.equal(body.ownerId, user1Id);
    assert.ok(body.createdAt);
  });

  it('should reject project creation with duplicate key with 409 status', async () => {
    const first = await createProject(
      { name: 'First Project', key: 'DEV' },
      user1Token
    );
    assert.equal(first.res.status, 201);

    const duplicate = await createProject(
      { name: 'Second Project', key: 'dev' }, // case-insensitive check
      user2Token
    );
    assert.equal(duplicate.res.status, 409);
    assert.equal(duplicate.body.error, "Project with key 'DEV' already exists");
  });

  it('should reject invalid project creation with 400 status', async () => {
    const shortName = await createProject(
      { name: 'A', key: 'DEV' },
      user1Token
    );
    assert.equal(shortName.res.status, 400);

    const invalidKey = await createProject(
      { name: 'Valid Project', key: 'INVALID_LONG_KEY' },
      user1Token
    );
    assert.equal(invalidKey.res.status, 400);

    const specialCharKey = await createProject(
      { name: 'Valid Project', key: 'KEY!' },
      user1Token
    );
    assert.equal(specialCharKey.res.status, 400);
  });

  it('should list all projects with owner details with 200 status', async () => {
    await createProject({ name: 'Alpha', key: 'ALP' }, user1Token);
    await createProject({ name: 'Beta', key: 'BET' }, user2Token);

    const res = await fetch(`${baseUrl}/projects`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.length, 2);
    assert.equal(body[0].name, 'Alpha');
    assert.equal(body[0].owner.name, 'Project Owner');
    assert.equal(body[1].name, 'Beta');
    assert.equal(body[1].owner.name, 'Other Member');
  });

  it('should retrieve a single project by id with 200 status', async () => {
    const created = await createProject(
      { name: 'Project Detail', key: 'DET', description: 'Testing details' },
      user1Token
    );

    const res = await fetch(`${baseUrl}/projects/${created.body.id}`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.id, created.body.id);
    assert.equal(body.name, 'Project Detail');
    assert.equal(body.key, 'DET');
  });

  it('should return 404 for a nonexistent project id', async () => {
    const res = await fetch(`${baseUrl}/projects/999999`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const body = await res.json();

    assert.equal(res.status, 404);
    assert.equal(body.error, 'Project not found');
  });

  it('should allow the owner to update their project with 200 status', async () => {
    const created = await createProject(
      { name: 'Original Title', key: 'UPD' },
      user1Token
    );

    const res = await fetch(`${baseUrl}/projects/${created.body.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        name: 'Updated Project Title',
        description: 'New description text',
      }),
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.name, 'Updated Project Title');
    assert.equal(body.description, 'New description text');
  });

  it('should reject project update from another non-admin user with 403 status', async () => {
    const created = await createProject(
      { name: 'Owner Project', key: 'OWN' },
      user1Token
    );

    const res = await fetch(`${baseUrl}/projects/${created.body.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user2Token}`,
      },
      body: JSON.stringify({ name: 'Hacked Title' }),
    });
    const body = await res.json();

    assert.equal(res.status, 403);
    assert.equal(body.error, 'Forbidden: You can only update your own projects');
  });

  it('should allow an admin to update or delete any project', async () => {
    const created = await createProject(
      { name: 'User Project', key: 'USR' },
      user1Token
    );

    const updateRes = await fetch(`${baseUrl}/projects/${created.body.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ name: 'Admin Overridden Title' }),
    });
    assert.equal(updateRes.status, 200);

    const deleteRes = await fetch(`${baseUrl}/projects/${created.body.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.equal(deleteRes.status, 200);
  });

  it('should allow owner to delete project successfully with 200 status', async () => {
    const created = await createProject(
      { name: 'To Be Deleted', key: 'DEL' },
      user1Token
    );

    const deleteRes = await fetch(`${baseUrl}/projects/${created.body.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const deleteBody = await deleteRes.json();

    assert.equal(deleteRes.status, 200);
    assert.equal(deleteBody.message, 'Project deleted successfully');

    const getRes = await fetch(`${baseUrl}/projects/${created.body.id}`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert.equal(getRes.status, 404);
  });
});

