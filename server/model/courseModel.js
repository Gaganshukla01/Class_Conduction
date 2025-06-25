import mongoose from "mongoose";

const courseSchema=new mongoose.Schema({

    nameCourse:{type:String, required:true},
    description:{type:String},
    courseImage:{type:String},
    courseVideo:{type:String},
    courseCategory:{type:String},
    coursePrice:{type:Number, default:0},
    
})

const courseModel=mongoose.model.course || mongoose.model('course' , courseSchema)

export default courseModel;