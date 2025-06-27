import express from 'express';
import { addAttendance, getAllAttendance, getAttendanceByStudentId } from '../controller/classAttendenceController.js'

export const classAttendanceRouter = express.Router();

// POST - Add new attendance record
classAttendanceRouter.post('/add', addAttendance);

// GET - Get all attendance records
classAttendanceRouter.get('/all', getAllAttendance);

// GET - Get attendance by student ID
classAttendanceRouter.get('/student/:studentId', getAttendanceByStudentId);

