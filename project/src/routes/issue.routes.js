// src/routes/issue.routes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const issueController = require('../controllers/issue.controller');
const validate = require('../middleware/validate');
const { optionalAuth } = require('../middleware/auth.middleware');
const { createIssueSchema, updateIssueSchema } = require('../validators/issue.validator');

router.use(optionalAuth);

router.get('/', issueController.getIssues);
router.get('/:id', issueController.getIssueById);
router.post('/', validate(createIssueSchema), issueController.createIssue);
router.put('/:id', validate(updateIssueSchema), issueController.updateIssue);
router.delete('/:id', issueController.deleteIssue);

// Nested comments routes
const commentRoutes = require('./comment.routes');
router.use('/:issueId/comments', commentRoutes);

module.exports = router;
