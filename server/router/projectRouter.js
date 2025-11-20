import express from 'express';
import {
  createProject,
  getAllApprovedProjects,
  getStudentProjects,
  getAllProjects,
  updateProject,
  deleteProject,
  incrementViewCount,
  updateProjectStatus,
  getProjectsByCategory,
} from '../controller/projectController.js';

export const projectRouter = express.Router();

// Public routes
projectRouter.get('/projects/approved', getAllApprovedProjects);
projectRouter.get('/projects/category/:category', getProjectsByCategory);
projectRouter.post('/projects/:projectId/view', incrementViewCount);

// Student routes
projectRouter.post('/projects', createProject);
projectRouter.get('/projects/student/:userId', getStudentProjects);
projectRouter.put('/projects/:projectId', updateProject);
projectRouter.delete('/projects/:projectId', deleteProject);

// Admin routes
projectRouter.get('/projects/admin/all', getAllProjects);
projectRouter.patch('/projects/:projectId/status', updateProjectStatus);