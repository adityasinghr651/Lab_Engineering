// src/repositories/issue.repository.js

// In-memory data store
let issues = [];
let nextId = 1;

function findAll() {
  return issues;
}

function findById(id) {
  return issues.find((issue) => issue.id === Number(id));
}

function create(data) {
  const newIssue = {
    id: nextId++,
    title: data.title,
    description: data.description || '',
    status: data.status || 'open',
    createdAt: new Date().toISOString()
  };
  issues.push(newIssue);
  return newIssue;
}

function update(id, data) {
  const issue = findById(id);
  if (!issue) return null;

  if (data.title !== undefined) issue.title = data.title;
  if (data.description !== undefined) issue.description = data.description;
  if (data.status !== undefined) issue.status = data.status;
  issue.updatedAt = new Date().toISOString();

  return issue;
}

function remove(id) {
  const index = issues.findIndex((issue) => issue.id === Number(id));
  if (index === -1) return false;

  issues.splice(index, 1);
  return true;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove
};

