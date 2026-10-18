// src/controllers/issue.controller.js
const issueService = require('../services/issue.service');

async function getIssues(req, res, next) {
  try {
    const issues = await issueService.getAllIssues();
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
    const newIssue = await issueService.createIssue(req.body);
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
    const deleted = await issueService.deleteIssue(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Issue not found' });
    }
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
