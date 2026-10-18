// src/repositories/comment.repository.js
const pool = require('../config/db');

function mapCommentRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    issueId: row.issueId ?? row.issue_id,
    userId: row.userId ?? row.user_id,
    content: row.content,
    ...(row.authorName && {
      author: {
        id: row.userId ?? row.user_id,
        name: row.authorName,
        email: row.authorEmail,
      },
    }),
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
  };
}

async function create({ issueId, userId, content }) {
  const insertQuery = `
    INSERT INTO comments (issue_id, user_id, content)
    VALUES ($1, $2, $3)
    RETURNING id
  `;
  const { rows } = await pool.query(insertQuery, [Number(issueId), Number(userId), content]);
  return await findById(rows[0].id);
}

async function findByIssueId(issueId) {
  const query = `
    SELECT 
      c.id, 
      c.issue_id AS "issueId", 
      c.user_id AS "userId", 
      c.content, 
      u.name AS "authorName", 
      u.email AS "authorEmail", 
      c.created_at AS "createdAt", 
      c.updated_at AS "updatedAt"
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.issue_id = $1
    ORDER BY c.created_at ASC, c.id ASC
  `;
  const { rows } = await pool.query(query, [Number(issueId)]);
  return rows.map(mapCommentRow);
}

async function findById(id) {
  const query = `
    SELECT 
      c.id, 
      c.issue_id AS "issueId", 
      c.user_id AS "userId", 
      c.content, 
      u.name AS "authorName", 
      u.email AS "authorEmail", 
      c.created_at AS "createdAt", 
      c.updated_at AS "updatedAt"
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.id = $1
  `;
  const { rows } = await pool.query(query, [Number(id)]);
  return mapCommentRow(rows[0]);
}

async function remove(id) {
  const query = 'DELETE FROM comments WHERE id = $1 RETURNING id';
  const { rows } = await pool.query(query, [Number(id)]);
  return rows[0] ? rows[0].id : null;
}

module.exports = {
  create,
  findByIssueId,
  findById,
  remove,
};

