import classSchedule from "../model/classesScheduleDetails.js";

export const classCreate= async (req, res) => {
    try {

        const {
            className,
            classDescription,
            classImage,
            classDate,
            classTime,
            instructorId,
            studentsEnrolled,
            classLink,
            classDuration
        } = req.body;

        const newClassSchedule = new classSchedule({
            className,
            classDescription,
            classImage,
            classDate,
            classTime,
            instructorId,
            studentsEnrolled: studentsEnrolled || [], 
            classLink,
            classDuration
        });

    
        const savedClassSchedule = await newClassSchedule.save();

    
        res.status(201).json({
            success: true,
            message: 'Class schedule created successfully',
            data: savedClassSchedule
        });

    } catch (error) {
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        console.error('Error creating class schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};