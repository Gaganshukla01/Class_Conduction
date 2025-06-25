import mongoose from "mongoose";

const classScheduleSchema=new mongoose.Schema({

    className:{type:String, required:true},
    classDescription:{type:String, required:true},
    classImage:{type:String, required:true},
    classDate:{type:Date, required:true},
    classTime:{type:String, required:true},
    instructorId:{type:String},
    studentsEnrolled:[{type:String}],
    classLink:{type:String, required:true},
    classDuration:{type:String, required:true},
    
})

const classSchedule=mongoose.model.classSchedule || mongoose.model('classSchedule' , classScheduleSchema)

export default classSchedule;