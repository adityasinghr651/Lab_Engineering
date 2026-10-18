// src/services/issue.service.js
const issueRepository = require('../repositories/issue.repository');
const AppError = require('../utils/AppError');

async function getAllIssues() {
  return await issueRepository.findAll();
}

async function getIssueById(id) {
  const issue = await issueRepository.findById(id);
  if (!issue) {
    throw new AppError('Issue not found', 404);
  }
  return issue;
}

async function createIssue(data) {
  // Business rule: title kam se kam 5 characters ka hona chahiye
  if (!data.title || data.title.length < 5) {
    throw new AppError('Title must be at least 5 characters', 400);
  }
  return await issueRepository.create(data);
}

async function updateIssue(id, updates) {
  const updated = await issueRepository.update(id, updates);
  if (!updated) {
    throw new AppError('Issue not found', 404);
  }
  return updated;
}

async function deleteIssue(id) {
  const deleted = await issueRepository.remove(id);
  if (!deleted) {
    throw new AppError('Issue not found', 404);
  }
  return true;
}

module.exports = { getAllIssues, getIssueById, createIssue, updateIssue, deleteIssue };