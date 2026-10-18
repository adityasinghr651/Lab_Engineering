// src/services/issue.service.js
const issueRepository = require('../repositories/issue.repository');
const projectRepository = require('../repositories/project.repository');
const userRepository = require('../repositories/user.repository');
const AppError = require('../utils/AppError');

async function getAllIssues(filters = {}) {
  return await issueRepository.findAll(filters);
}

async function getIssueById(id) {
  const issue = await issueRepository.findById(id);
  if (!issue) {
    throw new AppError('Issue not found', 404);
  }
  return issue;
}

async function createIssue(data, creatorId = null) {
  if (!data.title || data.title.length < 5) {
    throw new AppError('Title must be at least 5 characters', 400);
  }

  if (data.projectId) {
    const project = await projectRepository.findById(data.projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }
  }

  if (data.assigneeId) {
    const assignee = await userRepository.findById(data.assigneeId);
    if (!assignee) {
      throw new AppError('Assignee user not found', 404);
    }
  }

  const issueData = {
    ...data,
    creatorId: creatorId || data.creatorId || null,
  };

  return await issueRepository.create(issueData);
}

async function updateIssue(id, updates) {
  if (updates.projectId) {
    const project = await projectRepository.findById(updates.projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }
  }

  if (updates.assigneeId) {
    const assignee = await userRepository.findById(updates.assigneeId);
    if (!assignee) {
      throw new AppError('Assignee user not found', 404);
    }
  }

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

module.exports = {
  getAllIssues,
  getIssueById,
  createIssue,
  updateIssue,
  deleteIssue,
};