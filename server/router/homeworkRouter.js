import express from "express"
import { 
    getAllHomework, 
    getHomeworkById, 
    getHomeworkByStudentId, 
    createHomework, 
    updateHomework, 
    deleteHomework 
} from "../controller/homeWorkAssign.js"

export const homeworkRouter = express.Router()

homeworkRouter.get("/",getAllHomework)
homeworkRouter.get("/:id", getHomeworkById)
homeworkRouter.get("/student/:studentId", getHomeworkByStudentId)
homeworkRouter.post("/add", createHomework)
homeworkRouter.put("/:id",updateHomework)
homeworkRouter.delete("/:id",deleteHomework)