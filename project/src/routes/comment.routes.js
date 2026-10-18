// src/routes/comment.routes.js
const express = require('express');
const router = express.Router({ mergeParams: true });
const commentController = require('../controllers/comment.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth.middleware');
const { createCommentSchema } = require('../validators/comment.validator');

// List comments on issue (public / accessible)
router.get('/', commentController.getComments);

// Add comment to issue (authenticated)
router.post('/', authenticate, validate(createCommentSchema), commentController.createComment);

// Delete comment (authenticated, author or admin)
router.delete('/:commentId', authenticate, commentController.deleteComment);

module.exports = router;

