import express from 'express';
import {classCreate,getAllClasses} from '../controller/classScheduleController.js';
export const classScheduleRouter = express.Router();

classScheduleRouter.post('/add', classCreate); 
classScheduleRouter.get('/getallclasses', getAllClasses); 

