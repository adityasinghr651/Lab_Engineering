process.env.NODE_ENV = 'test';

const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const pool = require('../src/config/db');

describe('Search, Sorting & Pagination API Integration Tests', () => {
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
    await pool.query('TRUNCATE TABLE issues, projects, users RESTART IDENTITY CASCADE;');

    // Seed 5 test issues with diverse titles, descriptions, priorities, and statuses
    const issues = [
      {
        title: 'Authentication token expiration bug',
        description: 'JWT tokens are expiring too fast in mobile client',
        status: 'open',
        priority: 'high',
      },
      {
        title: 'Database connection pool optimization',
        description: 'Configure idle connection timeouts and maximum pool limit',
        status: 'in-progress',
        priority: 'high',
      },
      {
        title: 'Fix button hover styling on landing page',
        description: 'CSS background transition does not trigger on Safari',
        status: 'open',
        priority: 'low',
      },
      {
        title: 'Add Redis cache layer for analytics',
        description: 'Cache daily summary statistics to reduce database load',
        status: 'open',
        priority: 'medium',
      },
      {
        title: 'Improve error handling in request logger',
        description: 'Sanitize sensitive headers and SQL stack traces',
        status: 'closed',
        priority: 'low',
      },
    ];

    for (const item of issues) {
      await fetch(`${baseUrl}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
    }
  });

  after(async () => {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    await pool.end();
  });

  it('should search issues by keyword in title (case-insensitive)', async () => {
    const res = await fetch(`${baseUrl}/issues?search=AUTHENTICATION`);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.length, 1);
    assert.equal(body[0].title, 'Authentication token expiration bug');
  });

  it('should search issues by keyword in description', async () => {
    const res = await fetch(`${baseUrl}/issues?q=Safari`);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.length, 1);
    assert.equal(body[0].title, 'Fix button hover styling on landing page');
  });

  it('should return empty list when search yields no matches', async () => {
    const res = await fetch(`${baseUrl}/issues?search=nonexistentkeyword12345`);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.length, 0);
  });

  it('should combine text search with status and priority filters', async () => {
    const res = await fetch(`${baseUrl}/issues?search=database&status=in-progress&priority=high`);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.length, 1);
    assert.equal(body[0].title, 'Database connection pool optimization');
  });

  it('should sort issues by title ascending and descending', async () => {
    const ascRes = await fetch(`${baseUrl}/issues?sortBy=title&order=asc`);
    const ascBody = await ascRes.json();
    assert.equal(ascRes.status, 200);
    assert.equal(ascBody[0].title, 'Add Redis cache layer for analytics');

    const descRes = await fetch(`${baseUrl}/issues?sortBy=title&order=desc`);
    const descBody = await descRes.json();
    assert.equal(descRes.status, 200);
    assert.equal(descBody[0].title, 'Improve error handling in request logger');
  });

  it('should paginate results with limit and page, returning metadata', async () => {
    // Page 1: 2 items
    const p1Res = await fetch(`${baseUrl}/issues?limit=2&page=1`);
    const p1 = await p1Res.json();

    assert.equal(p1Res.status, 200);
    assert.ok(p1.pagination);
    assert.equal(p1.pagination.total, 5);
    assert.equal(p1.pagination.limit, 2);
    assert.equal(p1.pagination.page, 1);
    assert.equal(p1.pagination.totalPages, 3);
    assert.equal(p1.pagination.hasMore, true);
    assert.equal(p1.data.length, 2);

    // Page 2: 2 items
    const p2Res = await fetch(`${baseUrl}/issues?limit=2&page=2`);
    const p2 = await p2Res.json();
    assert.equal(p2.pagination.page, 2);
    assert.equal(p2.pagination.hasMore, true);
    assert.equal(p2.data.length, 2);

    // Page 3: 1 item (last page)
    const p3Res = await fetch(`${baseUrl}/issues?limit=2&page=3`);
    const p3 = await p3Res.json();
    assert.equal(p3.pagination.page, 3);
    assert.equal(p3.pagination.hasMore, false);
    assert.equal(p3.data.length, 1);
  });

  it('should paginate results using offset', async () => {
    const res = await fetch(`${baseUrl}/issues?limit=2&offset=4`);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body.data.length, 1);
    assert.equal(body.pagination.hasMore, false);
  });

  it('should return unpaginated flat array when pagination parameters are omitted', async () => {
    const res = await fetch(`${baseUrl}/issues`);
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(body));
    assert.equal(body.length, 5);
    assert.equal(body.pagination, undefined);
  });
});

