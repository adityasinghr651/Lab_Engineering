// src/services/project.service.js
const projectRepository = require('../repositories/project.repository');
const AppError = require('../utils/AppError');

async function createProject(data, userId) {
  const normalizedKey = data.key.toUpperCase().trim();
  const existing = await projectRepository.findByKey(normalizedKey);
  if (existing) {
    throw new AppError(`Project with key '${normalizedKey}' already exists`, 409);
  }

  return await projectRepository.create({
    name: data.name.trim(),
    key: normalizedKey,
    description: data.description ? data.description.trim() : '',
    ownerId: userId,
  });
}

async function getAllProjects() {
  return await projectRepository.findAll();
}

async function getProjectById(id) {
  const project = await projectRepository.findById(id);
  if (!project) {
    throw new AppError('Project not found', 404);
  }
  return project;
}

async function updateProject(id, updates, currentUser) {
  const project = await projectRepository.findById(id);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (project.ownerId !== currentUser.id && currentUser.role !== 'admin') {
    throw new AppError('Forbidden: You can only update your own projects', 403);
  }

  return await projectRepository.update(id, {
    name: updates.name ? updates.name.trim() : undefined,
    description: updates.description !== undefined ? updates.description.trim() : undefined,
  });
}

async function deleteProject(id, currentUser) {
  const project = await projectRepository.findById(id);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  if (project.ownerId !== currentUser.id && currentUser.role !== 'admin') {
    throw new AppError('Forbidden: You can only delete your own projects', 403);
  }

  await projectRepository.remove(id);
  return true;
}

module.exports = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
};

