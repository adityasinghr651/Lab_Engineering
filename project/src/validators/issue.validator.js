// src/validators/issue.validator.js
const { z } = require('zod');

const createIssueSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(5, 'Title must be at least 5 characters'),
  description: z.string().optional(),
  status: z.enum(['open', 'in-progress', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

const updateIssueSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .optional(),
  description: z.string().optional(),
  status: z.enum(['open', 'in-progress', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

module.exports = {
  createIssueSchema,
  updateIssueSchema,
};

