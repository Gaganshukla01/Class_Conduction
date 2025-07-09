import express from 'express';
import { getAllCourses, getCourseById, createCourse, updateCourse, deleteCourse } from '../controller/courseController.js';
export const courseRouter = express.Router();

courseRouter.get('/', getAllCourses);   
courseRouter.get('/:id', getCourseById);
courseRouter.post('/add', createCourse);
courseRouter.put('/:id', updateCourse);
courseRouter.delete('/:id', deleteCourse);

