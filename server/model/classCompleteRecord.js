import mongoose from "mongoose";

const classRecordSchema=new mongoose.Schema({

    classDate:{type:Date, required:true},
    classTime:{type:String, required:true},
    studentsEnrolled:[{type:mongoose.Schema.Types.ObjectId, ref:'user'}],
    
})

const classRecordModel=mongoose.model.classRecord || mongoose.model('classRecord' , classRecordSchema)

export default classRecordModel;