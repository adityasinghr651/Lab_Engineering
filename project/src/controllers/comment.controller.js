// src/controllers/comment.controller.js
const commentService = require('../services/comment.service');

async function createComment(req, res, next) {
  try {
    const comment = await commentService.addComment({
      issueId: req.params.issueId,
      userId: req.user.id,
      content: req.body.content,
    });
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
}

async function getComments(req, res, next) {
  try {
    const comments = await commentService.getCommentsByIssue(req.params.issueId);
    res.json(comments);
  } catch (err) {
    next(err);
  }
}

async function deleteComment(req, res, next) {
  try {
    await commentService.deleteComment(req.params.commentId, req.user);
    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createComment,
  getComments,
  deleteComment,
};

