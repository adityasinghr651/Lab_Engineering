// src/controllers/project.controller.js
const projectService = require('../services/project.service');

async function createProject(req, res, next) {
  try {
    const project = await projectService.createProject(req.body, req.user.id);
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
}

async function getProjects(req, res, next) {
  try {
    const projects = await projectService.getAllProjects();
    res.json(projects);
  } catch (err) {
    next(err);
  }
}

async function getProjectById(req, res, next) {
  try {
    const project = await projectService.getProjectById(req.params.id);
    res.json(project);
  } catch (err) {
    next(err);
  }
}

async function updateProject(req, res, next) {
  try {
    const updated = await projectService.updateProject(req.params.id, req.body, req.user);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteProject(req, res, next) {
  try {
    await projectService.deleteProject(req.params.id, req.user);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};

