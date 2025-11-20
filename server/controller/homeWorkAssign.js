import homeworkModel from "../model/homeworkModel.js";

export const getAllHomework = async (req, res) => {
  try {
    const homework = await homeworkModel.find();
    res.status(200).json(homework);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching homework", error: error.message });
  }
};

export const getHomeworkById = async (req, res) => {
  try {
    const homework = await homeworkModel.findById(req.params.id);
    if (!homework) {
      return res.status(404).json({ message: "Homework not found" });
    }
    res.status(200).json(homework);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching homework", error: error.message });
  }
};

export const getHomeworkByStudentId = async (req, res) => {
  try {
    const homework = await homeworkModel.find({
      studentId: req.params.studentId,
    });
    if (!homework || homework.length === 0) {
      return res
        .status(404)
        .json({ message: "No homework found for this student" });
    }
    res.status(200).json(homework);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching homework for student",
      error: error.message,
    });
  }
};

export const createHomework = async (req, res) => {
  const {
    studentId,
    studentName,
    classScheduleId,
    homeworkTitle,
    homeworkDescription,
    homeworkType,
    priority,
    additionalNotes,
  } = req.body;

  try {
    const newHomework = new homeworkModel({
      studentId,
      studentName,
      classScheduleId,
      homeworkTitle,
      homeworkDescription,
      homeworkType,
      priority,
      additionalNotes,
    });

    const savedHomework = await newHomework.save();
    res.status(201).json({
      success: true,
      message: "Homework assigned successfully",
      data: savedHomework,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating homework",
      error: error.message,
    });
  }
};

export const updateHomework = async (req, res) => {
  try {
    const updatedHomework = await homeworkModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedHomework) {
      return res.status(404).json({
        success: false,
        message: "Homework not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Homework updated successfully",
      data: updatedHomework,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating homework",
      error: error.message,
    });
  }
};

export const deleteHomework = async (req, res) => {
  try {
    const deletedHomework = await homeworkModel.findByIdAndDelete(
      req.params.id
    );
    if (!deletedHomework) {
      return res.status(404).json({ message: "Homework not found" });
    }
    res.status(200).json({ message: "Homework deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting homework", error: error.message });
  }
};
