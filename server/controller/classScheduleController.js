import classSchedule from "../model/classesScheduleDetails.js";

export const classCreate = async (req, res) => {
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
      classDuration,
    } = req.body;

    const initialDate = new Date(classDate);

    const classSchedulesToCreate = [];

    for (let i = 0; i < 40; i++) {
      const weeklyDate = new Date(initialDate);
      weeklyDate.setDate(initialDate.getDate() + i * 7);

      const classScheduleData = {
        className,
        classDescription,
        classImage,
        classDate: weeklyDate.toISOString().split("T")[0],
        classTime,
        instructorId,
        studentsEnrolled: studentsEnrolled || [],
        classLink,
        classDuration,
        weekNumber: i + 1,
        seriesId: new Date().getTime(),
      };

      classSchedulesToCreate.push(classScheduleData);
    }

    const savedClassSchedules = await classSchedule.insertMany(
      classSchedulesToCreate
    );

    res.status(201).json({
      success: true,
      message: `40 weekly class schedules created successfully starting from ${classDate}`,
      data: {
        totalClasses: savedClassSchedules.length,
        firstClass: savedClassSchedules[0],
        lastClass: savedClassSchedules[savedClassSchedules.length - 1],
        allClasses: savedClassSchedules,
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
