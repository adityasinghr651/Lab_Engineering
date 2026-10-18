// src/repositories/project.repository.js
const pool = require('../config/db');

function mapProjectRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    key: row.key,
    description: row.description,
    ownerId: row.ownerId,
    ...(row.ownerName && {
      owner: {
        id: row.ownerId,
        name: row.ownerName,
        email: row.ownerEmail,
      },
    }),
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
  };
}

async function create({ name, key, description = '', ownerId }) {
  const query = `
    INSERT INTO projects (name, key, description, owner_id)
    VALUES ($1, $2, $3, $4)
    RETURNING 
      id, 
      name, 
      key, 
      description, 
      owner_id AS "ownerId", 
      created_at AS "createdAt", 
      updated_at AS "updatedAt"
  `;
  const { rows } = await pool.query(query, [name, key, description, ownerId]);
  return mapProjectRow(rows[0]);
}

async function findAll() {
  const query = `
    SELECT 
      p.id, 
      p.name, 
      p.key, 
      p.description, 
      p.owner_id AS "ownerId", 
      u.name AS "ownerName", 
      u.email AS "ownerEmail",
      p.created_at AS "createdAt", 
      p.updated_at AS "updatedAt"
    FROM projects p
    JOIN users u ON p.owner_id = u.id
    ORDER BY p.id ASC
  `;
  const { rows } = await pool.query(query);
  return rows.map(mapProjectRow);
}

async function findById(id) {
  const query = `
    SELECT 
      p.id, 
      p.name, 
      p.key, 
      p.description, 
      p.owner_id AS "ownerId", 
      u.name AS "ownerName", 
      u.email AS "ownerEmail",
      p.created_at AS "createdAt", 
      p.updated_at AS "updatedAt"
    FROM projects p
    JOIN users u ON p.owner_id = u.id
    WHERE p.id = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return mapProjectRow(rows[0]);
}

async function findByKey(key) {
  const query = `
    SELECT 
      id, 
      name, 
      key, 
      description, 
      owner_id AS "ownerId", 
      created_at AS "createdAt", 
      updated_at AS "updatedAt"
    FROM projects
    WHERE UPPER(key) = UPPER($1)
  `;
  const { rows } = await pool.query(query, [key]);
  return mapProjectRow(rows[0]);
}

async function update(id, { name, description }) {
  const query = `
    UPDATE projects
    SET 
      name = COALESCE($1, name),
      description = COALESCE($2, description),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING 
      id, 
      name, 
      key, 
      description, 
      owner_id AS "ownerId", 
      created_at AS "createdAt", 
      updated_at AS "updatedAt"
  `;
  const { rows } = await pool.query(query, [name ?? null, description ?? null, id]);
  return mapProjectRow(rows[0]);
}

async function remove(id) {
  const query = 'DELETE FROM projects WHERE id = $1 RETURNING id';
  const { rows } = await pool.query(query, [id]);
  return rows[0] ? rows[0].id : null;
}

module.exports = {
  create,
  findAll,
  findById,
  findByKey,
  update,
  remove,
};

