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
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
  };
}

async function findAll() {
  const query = `
    SELECT 
      id, 
      title, 
      description, 
      status, 
      priority, 
      created_at AS "createdAt", 
      updated_at AS "updatedAt"
    FROM issues
    ORDER BY id ASC
  `;
  const res = await pool.query(query);
  return res.rows.map(mapRow);
}

async function findById(id) {
  const query = `
    SELECT 
      id, 
      title, 
      description, 
      status, 
      priority, 
      created_at AS "createdAt", 
      updated_at AS "updatedAt"
    FROM issues
    WHERE id = $1
  `;
  const res = await pool.query(query, [Number(id)]);
  if (res.rows.length === 0) return null;
  return mapRow(res.rows[0]);
}

async function create(data) {
  const query = `
    INSERT INTO issues (title, description, status, priority)
    VALUES ($1, $2, $3, $4)
    RETURNING 
      id, 
      title, 
      description, 
      status, 
      priority, 
      created_at AS "createdAt", 
      updated_at AS "updatedAt"
  `;
  const values = [
    data.title,
    data.description || '',
    data.status || 'open',
    data.priority || 'medium',
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
