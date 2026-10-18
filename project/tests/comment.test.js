process.env.NODE_ENV = 'test';

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const pool = require('../src/config/db');
const { createAdminUser } = require('./helpers/testUtils');

describe('Comments API Integration Tests (PostgreSQL + Auth)', () => {
  let server;
  let baseUrl;
  let user1Token;
  let user1Id;
  let user2Token;
  let user2Id;
  let adminToken;
  let testIssueId;

  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });
  });

  beforeEach(async () => {
    // Reset test tables before each test
    await pool.query('TRUNCATE TABLE comments, issues, projects, users RESTART IDENTITY CASCADE;');

    // Register User 1 (Author)
    const res1 = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Commenter One',
        email: 'commenter1@devflow.local',
        password: 'password123',
      }),
    });
    const data1 = await res1.json();
    user1Token = data1.token;
    user1Id = data1.user.id;

    // Register User 2 (Peer Member)
    const res2 = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Commenter Two',
        email: 'commenter2@devflow.local',
        password: 'password123',
      }),
    });
    const data2 = await res2.json();
    user2Token = data2.token;
    user2Id = data2.user.id;

    // Create Admin using secure test helper
    const adminData = await createAdminUser({
      name: 'Admin Moderator',
      email: 'admin@devflow.local',
      password: 'adminpassword123',
    });
    adminToken = adminData.token;

    // Create a Project and Issue to comment on
    const projRes = await fetch(`${baseUrl}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        name: 'Collaboration Project',
        key: 'COLLAB',
      }),
    });
    const proj = await projRes.json();

    const issueRes = await fetch(`${baseUrl}/issues`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        title: 'Review PR for search feature',
        description: 'Needs code review from backend team',
        projectId: proj.id,
      }),
    });
    const issue = await issueRes.json();
    testIssueId = issue.id;
  });

  after(async () => {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    await pool.end();
  });

  async function postComment(issueId, payload, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${baseUrl}/issues/${issueId}/comments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    return { res, body };
  }

  it('should reject comment creation without authentication with 401 status', async () => {
    const { res, body } = await postComment(testIssueId, {
      content: 'Unauthenticated comment',
    });
    assert.equal(res.status, 401);
    assert.equal(body.error, 'Authentication required');
  });

  it('should add a comment successfully with 201 status and author metadata', async () => {
    const { res, body } = await postComment(
      testIssueId,
      { content: 'Looks good to me, reviewed the schema!' },
      user1Token
    );

    assert.equal(res.status, 201);
    assert.ok(typeof body.id === 'number');
    assert.equal(body.issueId, testIssueId);
    assert.equal(body.userId, user1Id);
    assert.equal(body.content, 'Looks good to me, reviewed the schema!');
    assert.equal(body.author.name, 'Commenter One');
    assert.equal(body.author.email, 'commenter1@devflow.local');
    assert.ok(body.createdAt);
  });

  it('should reject comment on nonexistent issue with 404 status', async () => {
    const { res, body } = await postComment(
      999999,
      { content: 'Comment on non-existent issue' },
      user1Token
    );

    assert.equal(res.status, 404);
    assert.equal(body.error, 'Issue not found');
  });

  it('should reject comment with empty content with 400 status', async () => {
    const { res, body } = await postComment(
      testIssueId,
      { content: '   ' },
      user1Token
    );

    assert.equal(res.status, 400);
    assert.ok(body.error.includes('Comment content cannot be empty'));
  });

  it('should list all comments for an issue in chronological order with author details', async () => {
    await postComment(testIssueId, { content: 'First comment' }, user1Token);
    await postComment(testIssueId, { content: 'Second response' }, user2Token);

    const res = await fetch(`${baseUrl}/issues/${testIssueId}/comments`);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.length, 2);
    assert.equal(body[0].content, 'First comment');
    assert.equal(body[0].author.name, 'Commenter One');
    assert.equal(body[1].content, 'Second response');
    assert.equal(body[1].author.name, 'Commenter Two');
  });

  it('should return 404 when listing comments for a nonexistent issue', async () => {
    const res = await fetch(`${baseUrl}/issues/999999/comments`);
    const body = await res.json();

    assert.equal(res.status, 404);
    assert.equal(body.error, 'Issue not found');
  });

  it('should allow comment author to delete their comment with 200 status', async () => {
    const created = await postComment(
      testIssueId,
      { content: 'Typo in this comment, will delete' },
      user1Token
    );

    const delRes = await fetch(
      `${baseUrl}/issues/${testIssueId}/comments/${created.body.id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user1Token}` },
      }
    );
    const delBody = await delRes.json();

    assert.equal(delRes.status, 200);
    assert.equal(delBody.message, 'Comment deleted successfully');

    // Confirm it's gone
    const listRes = await fetch(`${baseUrl}/issues/${testIssueId}/comments`);
    const listBody = await listRes.json();
    assert.equal(listBody.length, 0);
  });

  it('should reject comment deletion from another non-admin user with 403 status', async () => {
    const created = await postComment(
      testIssueId,
      { content: 'Authored by user 1' },
      user1Token
    );

    const delRes = await fetch(
      `${baseUrl}/issues/${testIssueId}/comments/${created.body.id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user2Token}` },
      }
    );
    const delBody = await delRes.json();

    assert.equal(delRes.status, 403);
    assert.equal(delBody.error, 'Forbidden: You can only delete your own comments');
  });

  it('should allow an admin to delete any comment with 200 status', async () => {
    const created = await postComment(
      testIssueId,
      { content: 'Spam comment to be removed by admin' },
      user1Token
    );

    const delRes = await fetch(
      `${baseUrl}/issues/${testIssueId}/comments/${created.body.id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    assert.equal(delRes.status, 200);
  });

  it('should cascade delete comments when parent issue is deleted', async () => {
    const created = await postComment(
      testIssueId,
      { content: 'Comment on doomed issue' },
      user1Token
    );

    // Delete the issue
    const delIssueRes = await fetch(`${baseUrl}/issues/${testIssueId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert.equal(delIssueRes.status, 200);

    // Comment should no longer exist in db
    const { rows } = await pool.query('SELECT * FROM comments WHERE id = $1', [
      created.body.id,
    ]);
    assert.equal(rows.length, 0);
  });
});

