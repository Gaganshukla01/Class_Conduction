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
      classRate,
      weeklySchedule,
    } = req.body;

    // Validate required fields
    if (
      !className ||
      !instructorId ||
      !classLink ||
      !classDuration ||
      !classRate ||
      !weeklySchedule ||
      !Array.isArray(weeklySchedule) ||
      weeklySchedule.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: className, instructorId, classLink, classDuration, classRate, and weeklySchedule are required",
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
          classDate: weeklyDate,
          classTime: time,
          instructorId,
          studentsEnrolled: studentsEnrolled || [],
          classLink,
          classDuration,
          classRate,
          attendance: "Absent", // Default value
          notes: "", // Default value
          topicCovered: "", // Default value
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

export const updatePaymentStatus = async (req, res) => {
  try {
    const { id, paid } = req.body;

   
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Class ID is required",
      });
    }

    // Validate paid field - should be boolean
    if (typeof paid !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Paid status must be a boolean value (true or false)",
      });
    }

    // Find and update the class schedule
    const updatedClass = await classSchedule.findByIdAndUpdate(
      id,
      { 
        paid: paid,
        // Optionally add timestamp for when payment status was updated
        paymentUpdatedAt: new Date()
      },
      { 
        new: true, // Return the updated document
        runValidators: true // Run mongoose validations
      }
    );

    // Check if class was found
    if (!updatedClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found with the provided ID",
      });
    }

    res.status(200).json({
      success: true,
      message: `Payment status updated successfully. Class marked as ${paid ? 'paid' : 'unpaid'}.`,
      data: updatedClass,
    });

  } catch (error) {
    // Handle mongoose validation errors
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

    // Handle mongoose cast errors (invalid ObjectId)
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID format",
      });
    }

    console.error("Error updating payment status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


export const updateBatchPaymentStatus = async (req, res) => {
  try {
    const { classIds, paid } = req.body;

    // Validate required fields
    if (!classIds || !Array.isArray(classIds) || classIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "classIds array is required and must not be empty",
      });
    }

    // Validate paid field - should be boolean
    if (typeof paid !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Paid status must be a boolean value (true or false)",
      });
    }

    // Update multiple classes at once
    const updateResult = await classSchedule.updateMany(
      { _id: { $in: classIds } },
      { 
        paid: paid,
        paymentUpdatedAt: new Date()
      }
    );

    // Get the updated classes to return in response
    const updatedClasses = await classSchedule.find({ 
      _id: { $in: classIds } 
    }).sort({ classDate: 1 });

    // Check if any classes were updated
    if (updateResult.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No classes were updated. Please check the provided IDs.",
      });
    }

    res.status(200).json({
      success: true,
      message: `${updateResult.modifiedCount} class(es) payment status updated successfully. Classes marked as ${paid ? 'paid' : 'unpaid'}.`,
      data: {
        modifiedCount: updateResult.modifiedCount,
        matchedCount: updateResult.matchedCount,
        updatedClasses: updatedClasses
      },
    });

  } catch (error) {
    // Handle mongoose validation errors
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

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "One or more class IDs have invalid format",
      });
    }

    console.error("Error updating batch payment status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


export const getPaymentStats = async (req, res) => {
  try {
    const { month, year, instructorId } = req.query;

    // Build match conditions
    let matchConditions = {};

    // Add instructor filter if provided
    if (instructorId) {
      matchConditions.instructorId = instructorId;
    }

    // Add date filter if month and year are provided
    if (month && year) {
      const startDate = new Date(year, month - 1, 1); // month - 1 because Date months are 0-indexed
      const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of the month
      
      matchConditions.classDate = {
        $gte: startDate,
        $lte: endDate
      };
    }

    // Aggregate payment statistics
    const stats = await classSchedule.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          totalClasses: { $sum: 1 },
          paidClasses: { 
            $sum: { $cond: [{ $eq: ["$paid", true] }, 1, 0] }
          },
          unpaidClasses: { 
            $sum: { $cond: [{ $eq: ["$paid", false] }, 1, 0] }
          },
          totalAmount: { $sum: "$classRate" },
          paidAmount: { 
            $sum: { $cond: [{ $eq: ["$paid", true] }, "$classRate", 0] }
          },
          unpaidAmount: { 
            $sum: { $cond: [{ $eq: ["$paid", false] }, "$classRate", 0] }
          }
        }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : {
      totalClasses: 0,
      paidClasses: 0,
      unpaidClasses: 0,
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0
    };

    // Remove the _id field from the result
    delete result._id;

    res.status(200).json({
      success: true,
      message: "Payment statistics retrieved successfully",
      data: {
        ...result,
        filters: {
          month: month || "all",
          year: year || "all",
          instructorId: instructorId || "all"
        }
      }
    });

  } catch (error) {
    console.error("Error getting payment statistics:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};