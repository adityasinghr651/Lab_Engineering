process.env.NODE_ENV = 'test';

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const pool = require('../src/config/db');

describe('Issues API Integration Tests (PostgreSQL)', () => {
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
    // Reset test table and sequence before every test
    await pool.query('TRUNCATE TABLE issues RESTART IDENTITY CASCADE;');
  });

  after(async () => {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    // Gracefully close pool connection
    await pool.end();
  });

  async function createTestIssue(data) {
    const res = await fetch(`${baseUrl}/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const body = await res.json();
    return { res, body };
  }

  it('should create a valid issue with 201 status', async () => {
    const payload = {
      title: 'Fix navbar responsiveness',
      description: 'Navbar collapses incorrectly on mobile screens',
    };
    const { res, body } = await createTestIssue(payload);

    assert.equal(res.status, 201);
    assert.ok(typeof body.id === 'number');
    assert.equal(body.title, payload.title);
    assert.equal(body.description, payload.description);
    assert.equal(body.status, 'open');
    assert.ok(body.createdAt);
  });

  it('should reject an invalid issue title with 400 status', async () => {
    const payload = {
      title: 'Bug',
      description: 'Too short title',
    };
    const { res, body } = await createTestIssue(payload);

    assert.equal(res.status, 400);
    assert.equal(body.error, 'Title must be at least 5 characters');
  });

  it('should retrieve an existing issue by id with 200 status', async () => {
    const { body: created } = await createTestIssue({
      title: 'Database connection timeout',
      description: 'Pool exhausting under heavy load',
    });

    const res = await fetch(`${baseUrl}/issues/${created.id}`);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.id, created.id);
    assert.equal(body.title, 'Database connection timeout');
    assert.equal(body.description, 'Pool exhausting under heavy load');
  });

  it('should return 404 for a missing issue', async () => {
    const nonExistentId = 999999;
    const res = await fetch(`${baseUrl}/issues/${nonExistentId}`);
    const body = await res.json();

    assert.equal(res.status, 404);
    assert.equal(body.error, 'Issue not found');
  });

  it('should update an existing issue with 200 status', async () => {
    const { body: created } = await createTestIssue({
      title: 'Initial pending task',
      description: 'Needs update',
    });

    const updatePayload = {
      status: 'closed',
      description: 'Task resolved successfully',
    };

    const res = await fetch(`${baseUrl}/issues/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.id, created.id);
    assert.equal(body.status, 'closed');
    assert.equal(body.description, 'Task resolved successfully');
    assert.ok(body.updatedAt);
  });

  it('should delete an existing issue successfully with 200 status', async () => {
    const { body: created } = await createTestIssue({
      title: 'Temporary item for delete test',
      description: 'Will be deleted',
    });

    const res = await fetch(`${baseUrl}/issues/${created.id}`, {
      method: 'DELETE',
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.message, 'Issue deleted successfully');
  });

  it('should return 404 when deleting a nonexistent issue', async () => {
    const nonExistentId = 999999;
    const res = await fetch(`${baseUrl}/issues/${nonExistentId}`, {
      method: 'DELETE',
    });
    const body = await res.json();

    assert.equal(res.status, 404);
    assert.equal(body.error, 'Issue not found');
  });

  it('should confirm a deleted issue cannot be retrieved (404 status)', async () => {
    const { body: created } = await createTestIssue({
      title: 'Item to verify non-retrievability',
      description: 'Check after deletion',
    });

    // Delete the issue
    const delRes = await fetch(`${baseUrl}/issues/${created.id}`, {
      method: 'DELETE',
    });
    assert.equal(delRes.status, 200);

    // Confirm subsequent retrieval fails with 404
    const getRes = await fetch(`${baseUrl}/issues/${created.id}`);
    const getBody = await getRes.json();

    assert.equal(getRes.status, 404);
    assert.equal(getBody.error, 'Issue not found');
  });
});
