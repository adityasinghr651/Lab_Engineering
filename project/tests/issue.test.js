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
    // Reset test tables and sequences before every test
    await pool.query('TRUNCATE TABLE issues, projects, users RESTART IDENTITY CASCADE;');
  });

  after(async () => {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    // Gracefully close pool connection
    await pool.end();
  });

  async function createTestIssue(data, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}/issues`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    const body = await res.json();
    return { res, body };
  }

  async function setupUserAndProject() {
    const userRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dev Tester',
        email: 'tester@devflow.local',
        password: 'password123',
      }),
    });
    const userData = await userRes.json();

    const projRes = await fetch(`${baseUrl}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userData.token}`,
      },
      body: JSON.stringify({
        name: 'Backend Core',
        key: 'BACK',
        description: 'Core backend service',
      }),
    });
    const projData = await projRes.json();

    return { user: userData.user, token: userData.token, project: projData };
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

    const delRes = await fetch(`${baseUrl}/issues/${created.id}`, {
      method: 'DELETE',
    });
    assert.equal(delRes.status, 200);

    const getRes = await fetch(`${baseUrl}/issues/${created.id}`);
    const getBody = await getRes.json();

    assert.equal(getRes.status, 404);
    assert.equal(getBody.error, 'Issue not found');
  });

  it('should create a project-scoped issue with assignee and authenticated creator', async () => {
    const { user, token, project } = await setupUserAndProject();

    const { res, body } = await createTestIssue(
      {
        title: 'Implement database connection pooling',
        description: 'Configure pool max size and queue timeouts',
        priority: 'high',
        projectId: project.id,
        assigneeId: user.id,
      },
      token
    );

    assert.equal(res.status, 201);
    assert.equal(body.projectId, project.id);
    assert.equal(body.creatorId, user.id);
    assert.equal(body.assigneeId, user.id);

    const getRes = await fetch(`${baseUrl}/issues/${body.id}`);
    const getBody = await getRes.json();

    assert.equal(getRes.status, 200);
    assert.equal(getBody.project.key, 'BACK');
    assert.equal(getBody.creator.email, 'tester@devflow.local');
    assert.equal(getBody.assignee.email, 'tester@devflow.local');
  });

  it('should reject issue creation when referenced project does not exist (404 status)', async () => {
    const { token } = await setupUserAndProject();
    const { res, body } = await createTestIssue(
      {
        title: 'Orphaned issue attempt',
        projectId: 999999,
      },
      token
    );

    assert.equal(res.status, 404);
    assert.equal(body.error, 'Project not found');
  });

  it('should reject issue creation when referenced assignee does not exist (404 status)', async () => {
    const { token, project } = await setupUserAndProject();
    const { res, body } = await createTestIssue(
      {
        title: 'Nonexistent assignee issue',
        projectId: project.id,
        assigneeId: 999999,
      },
      token
    );

    assert.equal(res.status, 404);
    assert.equal(body.error, 'Assignee user not found');
  });

  it('should filter issues by projectId and status', async () => {
    const { token, project } = await setupUserAndProject();

    await createTestIssue(
      { title: 'Project Issue 1', projectId: project.id, status: 'open' },
      token
    );
    await createTestIssue(
      { title: 'Project Issue 2', projectId: project.id, status: 'closed' },
      token
    );
    await createTestIssue({ title: 'Unscoped Issue 3', status: 'open' });

    const res = await fetch(`${baseUrl}/issues?projectId=${project.id}&status=open`);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.length, 1);
    assert.equal(body[0].title, 'Project Issue 1');
    assert.equal(body[0].projectId, project.id);
  });

  it('should create and retrieve issues via nested /projects/:projectId/issues route', async () => {
    const { token, project } = await setupUserAndProject();

    const createRes = await fetch(`${baseUrl}/projects/${project.id}/issues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Nested route created issue',
        priority: 'high',
      }),
    });
    const created = await createRes.json();

    assert.equal(createRes.status, 201);
    assert.equal(created.projectId, project.id);

    const listRes = await fetch(`${baseUrl}/projects/${project.id}/issues`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const list = await listRes.json();

    assert.equal(listRes.status, 200);
    assert.ok(list.some((i) => i.id === created.id));
  });

  it('should cascade delete issues when parent project is deleted', async () => {
    const { token, project } = await setupUserAndProject();

    const { body: created } = await createTestIssue(
      { title: 'Issue to cascade delete', projectId: project.id },
      token
    );

    const delProjRes = await fetch(`${baseUrl}/projects/${project.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(delProjRes.status, 200);

    const getIssueRes = await fetch(`${baseUrl}/issues/${created.id}`);
    assert.equal(getIssueRes.status, 404);
  });
});
