// src/repositories/issue.repository.js
const pool = require('../config/db');

// Helper to format rows with camelCase keys consistent with existing API contract
function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    projectId: row.projectId ?? row.project_id ?? null,
    creatorId: row.creatorId ?? row.creator_id ?? null,
    assigneeId: row.assigneeId ?? row.assignee_id ?? null,
    ...(row.projectKey && {
      project: {
        id: row.projectId ?? row.project_id,
        name: row.projectName,
        key: row.projectKey,
      },
    }),
    ...(row.creatorName && {
      creator: {
        id: row.creatorId ?? row.creator_id,
        name: row.creatorName,
        email: row.creatorEmail,
      },
    }),
    ...(row.assigneeName && {
      assignee: {
        id: row.assigneeId ?? row.assignee_id,
        name: row.assigneeName,
        email: row.assigneeEmail,
      },
    }),
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
  };
}

// Temporary instrumentation for pool queue latency benchmarking
const poolMetrics = {
  count: 0,
  totalWaitMs: 0,
  totalSqlMs: 0,
  maxWaitMs: 0,
  maxSqlMs: 0,
};

if (process.env.TRACK_POOL_METRICS === 'true') {
  setInterval(() => {
    if (poolMetrics.count === 0) return;
    const avgWait = (poolMetrics.totalWaitMs / poolMetrics.count).toFixed(2);
    const avgSql = (poolMetrics.totalSqlMs / poolMetrics.count).toFixed(2);
    console.log(
      `[POOL METRICS] Requests: ${poolMetrics.count} | Avg Wait: ${avgWait}ms (Max: ${poolMetrics.maxWaitMs.toFixed(2)}ms) | Avg SQL: ${avgSql}ms (Max: ${poolMetrics.maxSqlMs.toFixed(2)}ms)`
    );
  }, 5000).unref();
}

async function findAll(filters = {}) {
  const conditions = [];
  const values = [];
  let idx = 1;

  if (filters.projectId !== undefined && filters.projectId !== null && filters.projectId !== '') {
    conditions.push(`i.project_id = $${idx++}`);
    values.push(Number(filters.projectId));
  }
  if (filters.status) {
    conditions.push(`i.status = $${idx++}`);
    values.push(filters.status);
  }
  if (filters.priority) {
    conditions.push(`i.priority = $${idx++}`);
    values.push(filters.priority);
  }
  if (filters.assigneeId !== undefined && filters.assigneeId !== null && filters.assigneeId !== '') {
    conditions.push(`i.assignee_id = $${idx++}`);
    values.push(Number(filters.assigneeId));
  }
  if (filters.creatorId !== undefined && filters.creatorId !== null && filters.creatorId !== '') {
    conditions.push(`i.creator_id = $${idx++}`);
    values.push(Number(filters.creatorId));
  }

  const searchTerm = filters.search || filters.q;
  if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim() !== '') {
    conditions.push(`(i.title ILIKE $${idx} OR i.description ILIKE $${idx})`);
    values.push(`%${searchTerm.trim()}%`);
    idx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const allowedSortFields = {
    id: 'i.id',
    title: 'i.title',
    status: 'i.status',
    priority: 'i.priority',
    createdat: 'i.created_at',
    updatedat: 'i.updated_at',
  };
  const sortKey = (filters.sortBy || 'id').toLowerCase();
  const sortColumn = allowedSortFields[sortKey] || 'i.id';
  const sortOrder = (filters.order || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  const orderClause = `ORDER BY ${sortColumn} ${sortOrder}`;

  const isPaginated =
    filters.limit !== undefined || filters.page !== undefined || filters.offset !== undefined;

  let limit = null;
  let page = null;
  let offset = null;
  let limitClause = '';

  if (isPaginated) {
    limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 100);
    if (filters.page !== undefined) {
      page = Math.max(Number(filters.page) || 1, 1);
      offset = (page - 1) * limit;
    } else {
      offset = Math.max(Number(filters.offset) || 0, 0);
      page = Math.floor(offset / limit) + 1;
    }
    limitClause = `LIMIT $${idx++} OFFSET $${idx++}`;
    values.push(limit, offset);
  }

  const countSelect = isPaginated ? ', COUNT(*) OVER()::int AS "totalCount"' : '';

  const query = `
    SELECT 
      i.id, 
      i.title, 
      i.description, 
      i.status, 
      i.priority, 
      i.project_id AS "projectId",
      i.creator_id AS "creatorId",
      i.assignee_id AS "assigneeId",
      p.name AS "projectName",
      p.key AS "projectKey",
      c.name AS "creatorName",
      c.email AS "creatorEmail",
      a.name AS "assigneeName",
      a.email AS "assigneeEmail",
      i.created_at AS "createdAt", 
      i.updated_at AS "updatedAt"
      ${countSelect}
    FROM issues i
    LEFT JOIN projects p ON i.project_id = p.id
    LEFT JOIN users c ON i.creator_id = c.id
    LEFT JOIN users a ON i.assignee_id = a.id
    ${whereClause}
    ${orderClause}
    ${limitClause}
  `;

  async function formatResult(rows) {
    if (!isPaginated) {
      return rows.map(mapRow);
    }

    let total = 0;
    if (rows.length > 0) {
      total = rows[0].totalCount;
    } else if (offset > 0) {
      const countFilterValues = values.slice(0, values.length - 2);
      const countQuery = `SELECT COUNT(*)::int AS count FROM issues i ${whereClause}`;
      const countRes = await pool.query(countQuery, countFilterValues);
      total = countRes.rows[0].count;
    }

    return {
      data: rows.map(mapRow),
      pagination: {
        total,
        limit,
        page,
        totalPages: Math.ceil(total / limit),
        hasMore: offset + rows.length < total,
      },
    };
  }

  if (process.env.TRACK_POOL_METRICS === 'true') {
    const t0 = performance.now();
    const client = await pool.connect();
    const t1 = performance.now();

    try {
      const q0 = performance.now();
      const res = await client.query(query, values);
      const q1 = performance.now();

      const wait = t1 - t0;
      const sql = q1 - q0;

      poolMetrics.count++;
      poolMetrics.totalWaitMs += wait;
      poolMetrics.totalSqlMs += sql;
      if (wait > poolMetrics.maxWaitMs) poolMetrics.maxWaitMs = wait;
      if (sql > poolMetrics.maxSqlMs) poolMetrics.maxSqlMs = sql;

      return await formatResult(res.rows);
    } finally {
      client.release();
    }
  }

  const res = await pool.query(query, values);
  return await formatResult(res.rows);
}

async function findById(id) {
  const query = `
    SELECT 
      i.id, 
      i.title, 
      i.description, 
      i.status, 
      i.priority, 
      i.project_id AS "projectId",
      i.creator_id AS "creatorId",
      i.assignee_id AS "assigneeId",
      p.name AS "projectName",
      p.key AS "projectKey",
      c.name AS "creatorName",
      c.email AS "creatorEmail",
      a.name AS "assigneeName",
      a.email AS "assigneeEmail",
      i.created_at AS "createdAt", 
      i.updated_at AS "updatedAt"
    FROM issues i
    LEFT JOIN projects p ON i.project_id = p.id
    LEFT JOIN users c ON i.creator_id = c.id
    LEFT JOIN users a ON i.assignee_id = a.id
    WHERE i.id = $1
  `;
  const res = await pool.query(query, [Number(id)]);
  if (res.rows.length === 0) return null;
  return mapRow(res.rows[0]);
}

async function create(data) {
  const query = `
    INSERT INTO issues (title, description, status, priority, project_id, creator_id, assignee_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING 
      id, 
      title, 
      description, 
      status, 
      priority, 
      project_id AS "projectId",
      creator_id AS "creatorId",
      assignee_id AS "assigneeId",
      created_at AS "createdAt", 
      updated_at AS "updatedAt"
  `;
  const values = [
    data.title,
    data.description || '',
    data.status || 'open',
    data.priority || 'medium',
    data.projectId ? Number(data.projectId) : null,
    data.creatorId ? Number(data.creatorId) : null,
    data.assigneeId ? Number(data.assigneeId) : null,
  ];
  const res = await pool.query(query, values);
  return mapRow(res.rows[0]);
}

async function update(id, data) {
  const fields = [];
  const values = [];
  let index = 1;

  if (data.title !== undefined) {
    fields.push(`title = $${index++}`);
    values.push(data.title);
  }
  if (data.description !== undefined) {
    fields.push(`description = $${index++}`);
    values.push(data.description);
  }
  if (data.status !== undefined) {
    fields.push(`status = $${index++}`);
    values.push(data.status);
  }
  if (data.priority !== undefined) {
    fields.push(`priority = $${index++}`);
    values.push(data.priority);
  }
  if (data.projectId !== undefined) {
    fields.push(`project_id = $${index++}`);
    values.push(data.projectId ? Number(data.projectId) : null);
  }
  if (data.assigneeId !== undefined) {
    fields.push(`assignee_id = $${index++}`);
    values.push(data.assigneeId ? Number(data.assigneeId) : null);
  }

  if (fields.length === 0) {
    return findById(id);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(Number(id));

  const query = `
    UPDATE issues
    SET ${fields.join(', ')}
    WHERE id = $${index}
    RETURNING 
      id, 
      title, 
      description, 
      status, 
      priority, 
      project_id AS "projectId",
      creator_id AS "creatorId",
      assignee_id AS "assigneeId",
      created_at AS "createdAt", 
      updated_at AS "updatedAt"
  `;

  const res = await pool.query(query, values);
  if (res.rows.length === 0) return null;
  return mapRow(res.rows[0]);
}

async function remove(id) {
  const query = `DELETE FROM issues WHERE id = $1 RETURNING id`;
  const res = await pool.query(query, [Number(id)]);
  return res.rowCount > 0;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};
