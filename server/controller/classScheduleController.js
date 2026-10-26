import classSchedule from "../model/classesScheduleDetails.js";
import mongoose from "mongoose";
import {
  notifyClassScheduled,
  notifyAttendanceMarked,
  notifyPaymentReceived,
  summaryText,
} from "../services/notificationService.js";

const WEEKS_PER_SERIES = 30;

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

    if (
      !className ||
      !instructorId ||
      !classLink ||
      !classDuration ||
      classRate === undefined ||
      classRate === "" ||
      !Array.isArray(weeklySchedule) ||
      weeklySchedule.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: className, instructorId, classLink, classDuration, classRate, and weeklySchedule are required",
      });
    }

    const validSlots = weeklySchedule.filter((s) => s && s.date && s.time);
    if (validSlots.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Each schedule needs both a date and a time",
      });
    }

    const batchId = Date.now();
    const docs = [];

    for (const { date, time } of validSlots) {
      const initialDate = new Date(date);
      if (Number.isNaN(initialDate.getTime())) {
        return res
          .status(400)
          .json({ success: false, message: `Invalid date: ${date}` });
      }
      for (let i = 0; i < WEEKS_PER_SERIES; i++) {
        const weeklyDate = new Date(initialDate);
        weeklyDate.setUTCDate(initialDate.getUTCDate() + i * 7);
        docs.push({
          className,
          classDate: weeklyDate,
          classTime: time,
          instructorId,
          studentsEnrolled: studentsEnrolled || [],
          classLink,
          classDuration,
          classRate,
          attendance: "Absent",
          notes: "",
          topicCovered: "",
          weekNumber: i + 1,
          seriesId: `${batchId}_${date}`,
          originalDate: date,
        });
      }
    }

    const saved = await classSchedule.insertMany(docs);

    // Awaited on purpose: the API runs on Vercel serverless, where work that is
    // still pending after the response is sent can be frozen/killed.
    const email = await notifyClassScheduled({
      className,
      instructorId,
      studentsEnrolled: studentsEnrolled || [],
      classLink,
      classDuration,
      weeklySchedule: validSlots,
      weeks: WEEKS_PER_SERIES,
    });

    res.status(201).json({
      success: true,
      message: `${saved.length} class schedules created successfully (${WEEKS_PER_SERIES} weeks × ${validSlots.length} scheduled dates)`,
      email,
      emailMessage: summaryText(email),
      data: {
        totalClasses: saved.length,
        scheduledDates: validSlots.length,
        weeksPerDate: WEEKS_PER_SERIES,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: Object.values(error.errors).map((e) => e.message),
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

// Admins get every class. Students only get the classes they are enrolled in
// (previously every student could read every other student's schedule).
export const getAllClasses = async (req, res) => {
  try {
    const filter =
      req.user?.userType === "admin"
        ? {}
        : { studentsEnrolled: String(req.userId) };

    const allClasses = await classSchedule
      .find(filter)
      .sort({ classDate: -1, classTime: -1 })
      .lean();

    // 200 + empty array: "no classes yet" is not an error and used to show a
    // red toast on a brand-new account.
    res.status(200).json({
      success: true,
      message: "Class schedules retrieved successfully",
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class schedule ID format",
      });
    }

    if (attendance && !["Present", "Absent"].includes(attendance)) {
      return res.status(400).json({
        success: false,
        message: "Attendance must be either 'Present' or 'Absent'",
      });
    }

    const updateFields = {};
    if (attendance !== undefined) {
      updateFields.attendance = attendance;
      updateFields.attendanceMarkedAt = new Date();
    }
    if (notes !== undefined) updateFields.notes = notes;
    if (topicCovered !== undefined) updateFields.topicCovered = topicCovered;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const previous = await classSchedule.findById(id).select("attendance attendanceMarkedAt").lean();
    if (!previous) {
      return res
        .status(404)
        .json({ success: false, message: "Class schedule not found" });
    }

    const updatedClass = await classSchedule.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    // Email only when attendance was actually recorded / changed
    const attendanceChanged =
      attendance !== undefined &&
      (previous.attendance !== attendance || !previous.attendanceMarkedAt);
    const email = attendanceChanged
      ? await notifyAttendanceMarked(updatedClass.toObject())
      : null;

    res.status(200).json({
      success: true,
      message: "Attendance marked successfully",
      data: updatedClass,
      email,
      emailMessage: summaryText(email),
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
      return res
        .status(400)
        .json({ success: false, message: "Class ID is required" });
    }
    if (typeof paid !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Paid status must be a boolean value (true or false)",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid class ID format" });
    }

    const previous = await classSchedule.findById(id).select("paid").lean();
    if (!previous) {
      return res.status(404).json({
        success: false,
        message: "Class not found with the provided ID",
      });
    }

    const updatedClass = await classSchedule.findByIdAndUpdate(
      id,
      { paid, paymentUpdatedAt: new Date() },
      { new: true, runValidators: true }
    );

    const email =
      paid && !previous.paid
        ? await notifyPaymentReceived(updatedClass.toObject())
        : null;

    res.status(200).json({
      success: true,
      message: `Payment status updated successfully. Class marked as ${paid ? "paid" : "unpaid"}.`,
      data: updatedClass,
      email,
      emailMessage: summaryText(email),
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: Object.values(error.errors).map((e) => e.message),
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

    if (!Array.isArray(classIds) || classIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "classIds array is required and must not be empty",
      });
    }
    if (typeof paid !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Paid status must be a boolean value (true or false)",
      });
    }
    if (!classIds.every((x) => mongoose.Types.ObjectId.isValid(x))) {
      return res.status(400).json({
        success: false,
        message: "One or more class IDs have invalid format",
      });
    }

    const wasUnpaid = paid
      ? await classSchedule
          .find({ _id: { $in: classIds }, paid: { $ne: true } })
          .select("_id")
          .lean()
      : [];

    const updateResult = await classSchedule.updateMany(
      { _id: { $in: classIds } },
      { paid, paymentUpdatedAt: new Date() }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No classes were found. Please check the provided IDs.",
      });
    }

    const updatedClasses = await classSchedule
      .find({ _id: { $in: classIds } })
      .sort({ classDate: 1 })
      .lean();

    let email = null;
    if (paid && wasUnpaid.length) {
      const newlyPaid = new Set(wasUnpaid.map((c) => String(c._id)));
      email = await notifyPaymentReceived(
        updatedClasses.filter((c) => newlyPaid.has(String(c._id)))
      );
    }

    res.status(200).json({
      success: true,
      message: `${updateResult.modifiedCount} class(es) payment status updated successfully. Classes marked as ${paid ? "paid" : "unpaid"}.`,
      email,
      emailMessage: summaryText(email),
      data: {
        modifiedCount: updateResult.modifiedCount,
        matchedCount: updateResult.matchedCount,
        updatedClasses,
      },
    });
  } catch (error) {
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
    const matchConditions = {};
    if (instructorId) matchConditions.instructorId = instructorId;
    if (month && year) {
      matchConditions.classDate = {
        $gte: new Date(Date.UTC(year, month - 1, 1)),
        $lte: new Date(Date.UTC(year, month, 0, 23, 59, 59)),
      };
    }

    const stats = await classSchedule.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          totalClasses: { $sum: 1 },
          paidClasses: { $sum: { $cond: [{ $eq: ["$paid", true] }, 1, 0] } },
          unpaidClasses: { $sum: { $cond: [{ $ne: ["$paid", true] }, 1, 0] } },
          totalAmount: { $sum: "$classRate" },
          paidAmount: {
            $sum: { $cond: [{ $eq: ["$paid", true] }, "$classRate", 0] },
          },
          unpaidAmount: {
            $sum: { $cond: [{ $ne: ["$paid", true] }, "$classRate", 0] },
          },
        },
      },
    ]);

    const result = stats[0] || {
      totalClasses: 0,
      paidClasses: 0,
      unpaidClasses: 0,
      totalAmount: 0,
      paidAmount: 0,
      unpaidAmount: 0,
    };
    delete result._id;

    res.status(200).json({
      success: true,
      message: "Payment statistics retrieved successfully",
      data: {
        ...result,
        filters: {
          month: month || "all",
          year: year || "all",
          instructorId: instructorId || "all",
        },
      },
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
