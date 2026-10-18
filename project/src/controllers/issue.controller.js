// src/controllers/issue.controller.js
const issueService = require('../services/issue.service');

function getIssues(req, res, next) {
  try {
    const issues = issueService.getAllIssues();
    res.json(issues);
  } catch (err) {
    next(err);
  }
}

function getIssueById(req, res, next) {
  try {
    const issue = issueService.getIssueById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.json(issue);
  } catch (err) {
    next(err);
  }
}

function createIssue(req, res, next) {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const newIssue = issueService.createIssue(req.body);
    res.status(201).json(newIssue);
  } catch (err) {
    next(err);
  }
}

function updateIssue(req, res, next) {
  try {
    const updated = issueService.updateIssue(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

function deleteIssue(req, res, next) {
  try {
    const deleted = issueService.deleteIssue(req.params.id);
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
  deleteIssue
};

