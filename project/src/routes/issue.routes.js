// src/routes/issue.routes.js
const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issue.controller');

router.get('/', issueController.getIssues);
router.get('/:id', issueController.getIssueById);
router.post('/', issueController.createIssue);
router.put('/:id', issueController.updateIssue);
router.delete('/:id', issueController.deleteIssue);

module.exports = router;

