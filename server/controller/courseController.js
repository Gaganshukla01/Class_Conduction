import courseModel from "../model/courseModel.js";

export const getAllCourses = async (req, res) => {
  try {
    const courses = await courseModel.find();
    res.status(200).json(courses);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching courses", error: error.message });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const course = await courseModel.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(200).json(course);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching course", error: error.message });
  }
};

export const createCourse = async (req, res) => {
  const {
    nameCourse,
    description,
    courseImage,
    courseVideo,
    courseCategory,
    coursePrice,
  } = req.body;

  try {
    const newCourse = new courseModel({
      nameCourse,
      description,
      courseImage,
      courseVideo,
      courseCategory,
      coursePrice,
    });

    const savedCourse = await newCourse.save();
    res.status(201).json(savedCourse);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating course", error: error.message });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const updatedCourse = await courseModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json(updatedCourse);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating course", error: error.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const deletedCourse = await courseModel.findByIdAndDelete(req.params.id);
    if (!deletedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting course", error: error.message });
  }
};
