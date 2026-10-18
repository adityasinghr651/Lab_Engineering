// src/validators/comment.validator.js
const { z } = require('zod');

const createCommentSchema = z.object({
  content: z
    .string({ required_error: 'Comment content is required' })
    .trim()
    .min(1, 'Comment content cannot be empty')
    .max(5000, 'Comment cannot exceed 5000 characters'),
});

module.exports = {
  createCommentSchema,
};

