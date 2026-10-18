// Service ka kaam: business logic/rules. Repository ko call karta hai data ke liye.
const issueRepository = require('../repositories/issue.repository');
const AppError = require('../utils/AppError');

function getAllIssues() {
  return issueRepository.findAll();
}

function getIssueById(id) {
  const issue = issueRepository.findById(id);
  if (!issue) {
    throw new AppError('Issue not found', 404);
  }
  return issue;
}

function createIssue(data) {
  // Business rule: title kam se kam 5 characters ka hona chahiye
  if (!data.title || data.title.length < 5) {
    throw new AppError('Title must be at least 5 characters', 400);
  }
  return issueRepository.create(data);
}

function updateIssue(id, updates) {
  const updated = issueRepository.update(id, updates);
  if (!updated) {
    throw new AppError('Issue not found', 404);
  }
  return updated;
}

function deleteIssue(id) {
  const deleted = issueRepository.remove(id);
  if (!deleted) {
    throw new AppError('Issue not found', 404);
  }
}

module.exports = { getAllIssues, getIssueById, createIssue, updateIssue, deleteIssue };