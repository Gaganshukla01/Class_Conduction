import express from 'express';
import {classCreate} from '../controller/classScheduleController.js';
export const classScheduleRouter = express.Router();

classScheduleRouter.post('/add', classCreate); 

