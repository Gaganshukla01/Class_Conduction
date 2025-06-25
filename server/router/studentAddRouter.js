import express from 'express';
import {studentAdd} from '../controller/studentAddController.js';
export const studentAddRouter = express.Router();

studentAddRouter.post('/add', studentAdd); 

