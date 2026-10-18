// src/controllers/issue.controller.js
const issueService = require('../services/issue.service');

async function getIssues(req, res, next) {
  try {
    const filters = {
      projectId: req.query.projectId || req.params.projectId,
      status: req.query.status,
      priority: req.query.priority,
      assigneeId: req.query.assigneeId,
      creatorId: req.query.creatorId,
      search: req.query.search || req.query.q,
      sortBy: req.query.sortBy,
      order: req.query.order,
      limit: req.query.limit,
      page: req.query.page,
      offset: req.query.offset,
    };
    const issues = await issueService.getAllIssues(filters);
    res.json(issues);
  } catch (err) {
    next(err);
  }
}

async function getIssueById(req, res, next) {
  try {
    const issue = await issueService.getIssueById(req.params.id);
    res.json(issue);
  } catch (err) {
    next(err);
  }
}

async function createIssue(req, res, next) {
  try {
    const data = {
      ...req.body,
      ...(req.params.projectId && { projectId: req.params.projectId }),
    };
    const newIssue = await issueService.createIssue(data, req.user?.id);
    res.status(201).json(newIssue);
  } catch (err) {
    next(err);
  }
}

async function updateIssue(req, res, next) {
  try {
    const updated = await issueService.updateIssue(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteIssue(req, res, next) {
  try {
    await issueService.deleteIssue(req.params.id);
    res.json({ message: 'Issue deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getIssues,
  getIssueById,
  createIssue,
  updateIssue,
  deleteIssue,
};
