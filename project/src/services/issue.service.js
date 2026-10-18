// Service ka kaam: business logic/rules. Repository ko call karta hai data ke liye.
const issueRepository = require('../repositories/issue.repository');

function getAllIssues() {
  return issueRepository.findAll();
}

function getIssueById(id) {
  const issue = issueRepository.findById(id);
  if (!issue) {
    // Business rule: agar issue na mile, ek specific error throw karo
    // Controller isko catch karke sahi HTTP status dega
    const error = new Error('Issue not found');
    error.statusCode = 404;
    throw error;
  }
  return issue;
}

function createIssue(data) {
  // Business rule: title kam se kam 5 characters ka hona chahiye
  if (!data.title || data.title.length < 5) {
    const error = new Error('Title must be at least 5 characters');
    error.statusCode = 400;
    throw error;
  }
  return issueRepository.create(data);
}

function updateIssue(id, updates) {
  const updated = issueRepository.update(id, updates);
  if (!updated) {
    const error = new Error('Issue not found');
    error.statusCode = 404;
    throw error;
  }
  return updated;
}

function deleteIssue(id) {
  const deleted = issueRepository.remove(id);
  if (!deleted) {
    const error = new Error('Issue not found');
    error.statusCode = 404;
    throw error;
  }
}

module.exports = { getAllIssues, getIssueById, createIssue, updateIssue, deleteIssue };