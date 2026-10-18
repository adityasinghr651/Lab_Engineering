// src/routes/project.routes.js
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth.middleware');
const {
  createProjectSchema,
  updateProjectSchema,
} = require('../validators/project.validator');

// All project routes require authentication
router.use(authenticate);

router.post('/', validate(createProjectSchema), projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);
router.put('/:id', validate(updateProjectSchema), projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

// Nested project issue routes
const issueRoutes = require('./issue.routes');
router.use('/:projectId/issues', issueRoutes);

module.exports = router;

