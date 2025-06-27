import classSchedule from "../model/classesScheduleDetails.js";

export const classCreate= async (req, res) => {
    try {
        // Extract data from request body
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

        // Create new class schedule instance
        const newClassSchedule = new classSchedule({
            className,
            classDescription,
            classImage,
            classDate,
            classTime,
            instructorId,
            studentsEnrolled: studentsEnrolled || [], // Default to empty array if not provided
            classLink,
            classDuration
        });

        // Save to database
        const savedClassSchedule = await newClassSchedule.save();

        // Send success response
        res.status(201).json({
            success: true,
            message: 'Class schedule created successfully',
            data: savedClassSchedule
        });

    } catch (error) {
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        // Handle other errors
        console.error('Error creating class schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};