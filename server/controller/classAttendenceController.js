import classAttendanceModel
 from "../model/classAttendence.js";

 export const addAttendance = async (req, res) => {
    try {
        const {
            studentId,
            studentName,
            classScheduleId,
            topicCovered,
            additionalNotes
        } = req.body;

        
        if (!studentId || !studentName) {
            return res.status(400).json({
                success: false,
                message: "Student ID and Student Name are required"
            });
        }


        const newAttendance = new classAttendanceModel({
            studentId,
            studentName,
            classScheduleId,
            topicCovered,
            additionalNotes
        });

        const savedAttendance = await newAttendance.save();

        res.status(201).json({
            success: true,
            message: "Attendance record added successfully",
            data: savedAttendance
        });

    } catch (error) {
        console.error("Error adding attendance:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};


export const getAllAttendance = async (req, res) => {
    try {
        const attendanceRecords = await classAttendanceModel
            .find()
            .sort({ createdAt: -1 }); 

        res.status(200).json({
            success: true,
            message: "Attendance records retrieved successfully",
            count: attendanceRecords.length,
            data: attendanceRecords
        });

    } catch (error) {
        console.error("Error fetching attendance:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};


export const getAttendanceByStudentId = async (req, res) => {
    try {
        const { studentId } = req.params;

        const attendanceRecords = await classAttendanceModel
            .find({ studentId })
            .sort({ createdAt: -1 });

        if (attendanceRecords.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No attendance records found for this student"
            });
        }

        res.status(200).json({
            success: true,
            message: "Student attendance records retrieved successfully",
            count: attendanceRecords.length,
            data: attendanceRecords
        });

    } catch (error) {
        console.error("Error fetching student attendance:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};