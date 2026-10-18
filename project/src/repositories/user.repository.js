// src/repositories/user.repository.js
const pool = require('../config/db');

function mapUserRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
  };
}

async function create({ name, email, passwordHash, role = 'member' }) {
  const query = `
    INSERT INTO users (name, email, password_hash, role)
    VALUES ($1, $2, $3, $4)
    RETURNING 
      id, 
      name, 
      email, 
      role, 
      created_at AS "createdAt", 
      updated_at AS "updatedAt"
  `;
  const values = [name, email, passwordHash, role];
  const { rows } = await pool.query(query, values);
  return mapUserRow(rows[0]);
}

async function findByEmail(email) {
  const query = `
    SELECT 
      id, 
      name, 
      email, 
      password_hash AS "passwordHash", 
      role, 
      created_at AS "createdAt", 
      updated_at AS "updatedAt"
    FROM users
    WHERE LOWER(email) = LOWER($1)
  `;
  const { rows } = await pool.query(query, [email]);
  if (!rows[0]) return null;
  return {
    id: rows[0].id,
    name: rows[0].name,
    email: rows[0].email,
    passwordHash: rows[0].passwordHash,
    role: rows[0].role,
    createdAt: rows[0].createdAt ? new Date(rows[0].createdAt).toISOString() : null,
    updatedAt: rows[0].updatedAt ? new Date(rows[0].updatedAt).toISOString() : null,
  };
}

async function findById(id) {
  const query = `
    SELECT 
      id, 
      name, 
      email, 
      role, 
      created_at AS "createdAt", 
      updated_at AS "updatedAt"
    FROM users
    WHERE id = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return mapUserRow(rows[0]);
}

module.exports = {
  create,
  findByEmail,
  findById,
};

