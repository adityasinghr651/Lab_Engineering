// src/services/comment.service.js
const commentRepository = require('../repositories/comment.repository');
const issueRepository = require('../repositories/issue.repository');
const AppError = require('../utils/AppError');

async function addComment({ issueId, userId, content }) {
  const issue = await issueRepository.findById(issueId);
  if (!issue) {
    throw new AppError('Issue not found', 404);
  }

  return await commentRepository.create({
    issueId,
    userId,
    content: content.trim(),
  });
}

async function getCommentsByIssue(issueId) {
  const issue = await issueRepository.findById(issueId);
  if (!issue) {
    throw new AppError('Issue not found', 404);
  }

  return await commentRepository.findByIssueId(issueId);
}

async function deleteComment(commentId, currentUser) {
  const comment = await commentRepository.findById(commentId);
  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  if (comment.userId !== currentUser.id && currentUser.role !== 'admin') {
    throw new AppError('Forbidden: You can only delete your own comments', 403);
  }

  await commentRepository.remove(commentId);
  return true;
}

module.exports = {
  addComment,
  getCommentsByIssue,
  deleteComment,
};

