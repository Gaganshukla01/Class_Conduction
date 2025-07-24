import classSchedule from "../model/classesScheduleDetails.js";
import mongoose from "mongoose";

export const classCreate = async (req, res) => {
  try {
    const {
      className,
      instructorId,
      studentsEnrolled,
      classLink,
      classDuration,
      weeklySchedule,
    } = req.body;

    // Validate required fields
    if (
      !className ||
      !instructorId ||
      !weeklySchedule ||
      !Array.isArray(weeklySchedule) ||
      weeklySchedule.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: className, instructorId, and weeklySchedule are required",
      });
    }

    const allClassSchedulesToCreate = [];
    const seriesId = new Date().getTime(); // Common series ID for all classes

    // Process each schedule in the weeklySchedule array
    for (const schedule of weeklySchedule) {
      const { date, time } = schedule;

      if (!date || !time) {
        continue; // Skip invalid schedule entries
      }

      const initialDate = new Date(date);

      // Create 30 weekly recurring classes for this specific date/time
      for (let i = 0; i < 30; i++) {
        const weeklyDate = new Date(initialDate);
        weeklyDate.setDate(initialDate.getDate() + i * 7);

        const classScheduleData = {
          className,
          classDate: weeklyDate.toISOString().split("T")[0],
          classTime: time,
          instructorId,
          studentsEnrolled: studentsEnrolled || [],
          classLink,
          classDuration,
          weekNumber: i + 1,
          seriesId: `${seriesId}_${date}`, // Unique series ID for each date
          originalDate: date, // Store the original scheduled date
        };

        allClassSchedulesToCreate.push(classScheduleData);
      }
    }

    // Insert all class schedules at once
    const savedClassSchedules = await classSchedule.insertMany(
      allClassSchedulesToCreate
    );

    // Group results by original date for better response structure
    const resultsByDate = {};
    savedClassSchedules.forEach((classItem) => {
      const originalDate = classItem.originalDate;
      if (!resultsByDate[originalDate]) {
        resultsByDate[originalDate] = [];
      }
      resultsByDate[originalDate].push(classItem);
    });

    res.status(201).json({
      success: true,
      message: `${savedClassSchedules.length} class schedules created successfully (30 weeks × ${weeklySchedule.length} scheduled dates)`,
      data: {
        totalClasses: savedClassSchedules.length,
        scheduledDates: weeklySchedule.length,
        weeksPerDate: 30,
        resultsByDate,
        summary: Object.keys(resultsByDate).map((date) => ({
          originalDate: date,
          classesCreated: resultsByDate[date].length,
          firstClass: resultsByDate[date][0],
          lastClass: resultsByDate[date][resultsByDate[date].length - 1],
        })),
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    console.error("Error creating class schedules:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getAllClasses = async (req, res) => {
  try {
    const allClasses = await classSchedule
      .find({})
      .populate("instructorId", "name email")
      .sort({ classDate: -1, classTime: -1 });

    if (!allClasses || allClasses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No class schedules found",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Class schedules retrieved successfully (sorted from present to previous)",
      count: allClasses.length,
      data: allClasses,
    });
  } catch (error) {
    console.error("Error retrieving class schedules:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const markAttendance = async (req, res) => {
  try {
    const { id, attendance, notes, topicCovered } = req.body;

    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class schedule ID format",
      });
    }

    // Validate attendance value if provided
    if (attendance && !["Present", "Absent"].includes(attendance)) {
      return res.status(400).json({
        success: false,
        message: "Attendance must be either 'Present' or 'Absent'",
      });
    }

    // Build update object with only provided fields
    const updateFields = {};
    if (attendance !== undefined) updateFields.attendance = attendance;
    if (notes !== undefined) updateFields.notes = notes;
    if (topicCovered !== undefined) updateFields.topicCovered = topicCovered;

    // Check if there are fields to update
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const updatedClass = await classSchedule.findByIdAndUpdate(
      id,
      updateFields,
      {
        new: true,
        runValidators: true,
      }
    );

    // Check if class schedule exists
    if (!updatedClass) {
      return res.status(404).json({
        success: false,
        message: "Class schedule not found",
      });
    }

    // Success response
    res.status(200).json({
      success: true,
      message: "Attendance marked successfully",
      data: updatedClass,
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
