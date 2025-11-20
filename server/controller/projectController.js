import userModel from "../model/userModel.js";
import projectModel from "../model/ProjectModel.js";

export const createProject = async (req, res) => {
  try {
    const {
      studentId,
      studentName,
      studentEmail,
      title,
      description,
      hostedUrl,
      imageUrl,
      githubUrl,
      technologies,
      category,
    } = req.body;

    // Validation
    if (!studentId || !studentName || !title || !description || !hostedUrl) {
      return res.json({
        success: false,
        message: "Required fields are missing",
      });
    }

    // Verify student exists
    const student = await userModel.findById(studentId);
    if (!student) {
      return res.json({
        success: false,
        message: "Student not found",
      });
    }

    // Create new project
    const newProject = new projectModel({
      studentId,
      studentName,
      studentEmail: student.email,
      title,
      description,
      hostedUrl,
      imageUrl: imageUrl || "",
      githubUrl: githubUrl || "",
      technologies: technologies || [],
      category: category || "web",
      views: 0,
      status: "pending",
    });

    await newProject.save();

    return res.json({
      success: true,
      message: "Project submitted successfully. Awaiting admin approval.",
      data: newProject,
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return res.json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all approved projects (public view)
export const getAllApprovedProjects = async (req, res) => {
  try {
    const projects = await projectModel
      .find({ status: "approved" })
      .sort({ createdAt: -1 })
      .populate("studentId", "name email");

    return res.json({
      success: true,
      message: "Projects fetched successfully",
      data: projects,
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return res.json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all projects for a specific student
export const getStudentProjects = async (req, res) => {
  try {
    const { userId } = req.params;

    const projects = await projectModel
      .find({ studentId: userId })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      message: "Student projects fetched successfully",
      data: projects,
    });
  } catch (error) {
    console.error("Error fetching student projects:", error);
    return res.json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all projects (admin view - includes pending)
export const getAllProjects = async (req, res) => {
  try {
    const projects = await projectModel
      .find()
      .sort({ createdAt: -1 })
      .populate("studentId", "name email userType");

    return res.json({
      success: true,
      message: "All projects fetched successfully",
      data: projects,
    });
  } catch (error) {
    console.error("Error fetching all projects:", error);
    return res.json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update a project
export const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      title,
      description,
      hostedUrl,
      imageUrl,
      githubUrl,
      technologies,
      category,
    } = req.body;

    const project = await projectModel.findById(projectId);

    if (!project) {
      return res.json({
        success: false,
        message: "Project not found",
      });
    }

    // Update fields
    if (title) project.title = title;
    if (description) project.description = description;
    if (hostedUrl) project.hostedUrl = hostedUrl;
    if (imageUrl !== undefined) project.imageUrl = imageUrl;
    if (githubUrl !== undefined) project.githubUrl = githubUrl;
    if (technologies) project.technologies = technologies;
    if (category) project.category = category;

    // Reset status to pending when student updates
    project.status = "pending";

    await project.save();

    return res.json({
      success: true,
      message: "Project updated successfully. Awaiting admin approval.",
      data: project,
    });
  } catch (error) {
    console.error("Error updating project:", error);
    return res.json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete a project
export const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const deletedProject = await projectModel.findByIdAndDelete(projectId);

    if (!deletedProject) {
      return res.json({
        success: false,
        message: "Project not found",
      });
    }

    return res.json({
      success: true,
      message: "Project deleted successfully",
      data: deletedProject,
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return res.json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Increment view count
export const incrementViewCount = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await projectModel.findByIdAndUpdate(
      projectId,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!project) {
      return res.json({
        success: false,
        message: "Project not found",
      });
    }

    return res.json({
      success: true,
      message: "View count incremented",
      data: project,
    });
  } catch (error) {
    console.error("Error incrementing view count:", error);
    return res.json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Approve/Reject project (Admin only)
export const updateProjectStatus = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.json({
        success: false,
        message: "Invalid status",
      });
    }

    const project = await projectModel.findByIdAndUpdate(
      projectId,
      { status },
      { new: true }
    );

    if (!project) {
      return res.json({
        success: false,
        message: "Project not found",
      });
    }

    return res.json({
      success: true,
      message: `Project ${status} successfully`,
      data: project,
    });
  } catch (error) {
    console.error("Error updating project status:", error);
    return res.json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get projects by category
export const getProjectsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const projects = await projectModel
      .find({ category, status: "approved" })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      message: `${category} projects fetched successfully`,
      data: projects,
    });
  } catch (error) {
    console.error("Error fetching projects by category:", error);
    return res.json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
