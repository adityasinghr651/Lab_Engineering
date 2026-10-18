// src/validators/project.validator.js
const { z } = require('zod');

const createProjectSchema = z.object({
  name: z
    .string({ required_error: 'Project name is required' })
    .trim()
    .min(2, 'Project name must be at least 2 characters')
    .max(100, 'Project name cannot exceed 100 characters'),
  key: z
    .string({ required_error: 'Project key is required' })
    .trim()
    .min(2, 'Project key must be between 2 and 10 alphanumeric characters')
    .max(10, 'Project key must be between 2 and 10 alphanumeric characters')
    .regex(/^[A-Za-z0-9]+$/, 'Project key must be alphanumeric (letters and numbers only)'),
  description: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Project name must be at least 2 characters')
    .max(100, 'Project name cannot exceed 100 characters')
    .optional(),
  description: z.string().optional(),
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
};

