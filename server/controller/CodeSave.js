import codeModel from "../model/codeSaveModel.js";

export const saveCodeProject = async (req, res) => {
  try {
    const { _id, code, language, filename, userId, title, description } =
      req.body;

    // Validate required fields
    if (!code || !language || !filename || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: code, language, filename, userId",
      });
    }
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Enter File Name",
      });
    }

    // Check if _id is provided and is a valid ObjectId
    const hasValidId =
      _id &&
      _id.toString().trim() !== "" &&
      _id.toString().match(/^[0-9a-fA-F]{24}$/);

    console.log("Has valid ID:", hasValidId);

    if (hasValidId) {
      console.log("Attempting to update existing project with _id:", _id);

      // Try to find and update existing project
      const updatedProject = await codeModel.findByIdAndUpdate(
        _id.toString().trim(),
        {
          code,
          language,
          filename,
          title: title,
          description: description || "",
          updatedAt: new Date(),
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (updatedProject) {
        console.log("Project updated successfully");
        return res.status(200).json({
          success: true,
          message: "Project updated successfully",
          data: updatedProject,
        });
      } else {
        console.log(
          "No project found with _id:",
          _id,
          "Creating new project instead"
        );
      }
    } else {
      console.log("No valid _id provided, creating new project");
    }

    // Create new project
    console.log("Creating new project...");
    const newProject = new codeModel({
      userId,
      code,
      language,
      filename,
      title: title,
      description: description || "",
    });

    const savedProject = await newProject.save();
    console.log("New project created with _id:", savedProject._id);

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: savedProject,
    });
  } catch (error) {
    console.error("Error saving code project:", error);
    console.error("Error stack:", error.stack);

    // Handle duplicate key errors
    if (error.code === 11000) {
      console.log("Duplicate key error:", error.keyValue);
      return res.status(400).json({
        success: false,
        message: "Duplicate entry detected",
        details: error.keyValue,
      });
    }

    // Handle specific MongoDB errors
    if (error.name === "CastError" && error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        message: "Invalid ObjectId format provided",
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
export const getUserCodeProjects = async (req, res) => {
  console.log("Fetching user code projects for userId:", req.params.userId);
  try {
    const { userId } = req.params;
    const {
      language,
      limit = 50,
      page = 1,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Build query filter
    const filter = { userId };
    if (language && language !== "all") {
      filter.language = language;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Fetch projects with pagination and sorting
    const projects = await codeModel
      .find(filter)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(skip)
      .populate("userId", "name email")
      .lean();

    // Get total count for pagination info
    const totalProjects = await codeModel.countDocuments(filter);
    const totalPages = Math.ceil(totalProjects / parseInt(limit));

    res.status(200).json({
      success: true,
      message: "Code projects fetched successfully",
      data: projects,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProjects,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching code projects:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const getCodeProjectById = async (req, res) => {
  try {
    const { userId, projectId } = req.params;

    if (!userId || !projectId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Project ID are required",
      });
    }

    const project = await codeModel
      .findOne({
        id: parseInt(projectId),
        userId,
      })
      .populate("userId", "name email");

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Code project not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Code project fetched successfully",
      data: project,
    });
  } catch (error) {
    console.error("Error fetching code project:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateCodeProject = async (req, res) => {
  try {
    const { userId, projectId } = req.params;
    const { code, title, description } = req.body;

    if (!userId || !projectId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Project ID are required",
      });
    }

    const project = await codeModel.findOne({
      id: parseInt(projectId),
      userId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Code project not found",
      });
    }

    if (code !== undefined) project.code = code;
    if (title !== undefined) project.title = title;
    if (description !== undefined) project.description = description;

    const updatedProject = await project.save();

    res.status(200).json({
      success: true,
      message: "Code project updated successfully",
      data: updatedProject,
    });
  } catch (error) {
    console.error("Error updating code project:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const deleteCodeProject = async (req, res) => {
  try {
    const { userId, projectId } = req.params;

    if (!userId || !projectId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Project ID are required",
      });
    }

    const deletedProject = await codeModel.findOneAndDelete({
      id: parseInt(projectId),
      userId,
    });

    if (!deletedProject) {
      return res.status(404).json({
        success: false,
        message: "Code project not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Code project deleted successfully",
      data: deletedProject,
    });
  } catch (error) {
    console.error("Error deleting code project:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
