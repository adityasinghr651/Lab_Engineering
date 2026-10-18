// src/routes/issue.routes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const issueController = require('../controllers/issue.controller');
const validate = require('../middleware/validate');
const { optionalAuth, authenticate } = require('../middleware/auth.middleware');
const { createIssueSchema, updateIssueSchema } = require('../validators/issue.validator');

router.get('/', optionalAuth, issueController.getIssues);
router.get('/:id', optionalAuth, issueController.getIssueById);
router.post('/', optionalAuth, validate(createIssueSchema), issueController.createIssue);
router.put('/:id', authenticate, validate(updateIssueSchema), issueController.updateIssue);
router.delete('/:id', authenticate, issueController.deleteIssue);

// Nested comments routes
const commentRoutes = require('./comment.routes');
router.use('/:issueId/comments', commentRoutes);

module.exports = router;
