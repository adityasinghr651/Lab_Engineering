// src/validators/issue.validator.js
const { z } = require('zod');

const createIssueSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(5, 'Title must be at least 5 characters'),
  description: z.string().optional(),
  status: z.enum(['open', 'in-progress', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  projectId: z.coerce
    .number()
    .int()
    .positive('Project ID must be a positive integer')
    .optional()
    .nullable(),
  assigneeId: z.coerce
    .number()
    .int()
    .positive('Assignee ID must be a positive integer')
    .optional()
    .nullable(),
});

const updateIssueSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Title must be at least 5 characters')
    .optional(),
  description: z.string().optional(),
  status: z.enum(['open', 'in-progress', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  projectId: z.coerce
    .number()
    .int()
    .positive('Project ID must be a positive integer')
    .optional()
    .nullable(),
  assigneeId: z.coerce
    .number()
    .int()
    .positive('Assignee ID must be a positive integer')
    .optional()
    .nullable(),
});

module.exports = {
  createIssueSchema,
  updateIssueSchema,
};
