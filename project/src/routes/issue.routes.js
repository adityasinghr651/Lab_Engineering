const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issue.controller');
const validate = require('../middleware/validate');
const { createIssueSchema, updateIssueSchema } = require('../validators/issue.validator');

router.get('/', issueController.getIssues);
router.get('/:id', issueController.getIssueById);
router.post('/', validate(createIssueSchema), issueController.createIssue);
router.put('/:id', validate(updateIssueSchema), issueController.updateIssue);
router.delete('/:id', issueController.deleteIssue);

module.exports = router;

