import React, { useState, useEffect, useContext } from "react";
import {
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Sparkles,
  Globe,
  Calendar,
  Tag,
  X,
  Save,
  Image,
  Github,
  User,
  Eye,
  CheckCircle,
} from "lucide-react";
import { AppContent } from "../context/Context";
import { toast } from "react-toastify";

export default function ProjectShowcase() {
  const { userData, backend_url, refreshData } = useContext(AppContent);

  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    hostedUrl: "",
    imageUrl: "",
    githubUrl: "",
    technologies: "",
    category: "web",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchProjects();
  }, [userData]);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      // Fetch all approved projects
      const response = await fetch(
        `${backend_url}/api/project/projects/approved`
      );
      const result = await response.json();

      if (result.success) {
        setProjects(result.data);
      } else {
        console.error("Failed to fetch projects:", result.message);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const projectData = {
      ...formData,
      technologies: formData.technologies
        .split(",")
        .map((tech) => tech.trim())
        .filter(Boolean),
      studentId: userData?.userId,
      studentName: userData?.name,
      studentEmail: userData?.email,
    };

    try {
      setIsSubmitting(true);

      const url = editingId
        ? `${backend_url}/api/project/projects/${editingId}`
        : `${backend_url}/api/project/projects`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        fetchProjects(); // Refresh projects list
        refreshData(); // Refresh context data
        resetForm();
      } else {
        toast.error(result.message || "Failed to save project");
      }
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error("Failed to save project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (project) => {
    setEditingId(project._id);
    setFormData({
      title: project.title,
      description: project.description,
      hostedUrl: project.hostedUrl,
      imageUrl: project.imageUrl || "",
      githubUrl: project.githubUrl || "",
      technologies: project.technologies.join(", "),
      category: project.category,
    });
    setShowAddForm(true);
  };

  const deleteProject = async (id) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    setDeletingId(id);
    try {
      const response = await fetch(
        `${backend_url}/api/project/projects/${id}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Project deleted successfully!");
        fetchProjects(); // Refresh projects list
        refreshData(); // Refresh context data
      } else {
        toast.error(result.message || "Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project.");
    } finally {
      setDeletingId(null);
    }
  };

  const visitProject = async (project) => {
    // Increment view count in backend
    try {
      await fetch(`${backend_url}/api/project/projects/${project._id}/view`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Error incrementing view count:", error);
    }

    window.open(project.hostedUrl, "_blank");
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      hostedUrl: "",
      imageUrl: "",
      githubUrl: "",
      technologies: "",
      category: "web",
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const categories = [
    { value: "web", label: "Web App", color: "from-blue-500 to-cyan-400" },
    {
      value: "mobile",
      label: "Mobile App",
      color: "from-purple-500 to-pink-400",
    },
    {
      value: "portfolio",
      label: "Portfolio",
      color: "from-green-500 to-emerald-400",
    },
    { value: "game", label: "Game", color: "from-orange-500 to-red-400" },
    {
      value: "productivity",
      label: "Productivity",
      color: "from-indigo-500 to-purple-400",
    },
    { value: "other", label: "Other", color: "from-gray-500 to-slate-400" },
  ];

  const isOwnProject = (project) => {
    return (
      project.studentId === userData?.userId ||
      project.studentId?._id === userData?.userId
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-8">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center bg-blue-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-400/30 mb-4">
            <Sparkles className="mr-2 text-yellow-400" size={16} />
            <span className="text-sm">Student Project Showcase</span>
          </div>
          <h1 className="text-5xl font-bold mb-3">
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Students Projects
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Upload and showcase your live projects with the community
          </p>
        </div>

        {/* Upload Project Button */}
        {!showAddForm && (
          <div className="mb-8 flex justify-end">
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold hover:scale-105 transition-all cursor-pointer shadow-lg flex items-center"
            >
              <Plus className="mr-2" size={20} />
              Upload Project
            </button>
          </div>
        )}

        {/* Upload/Edit Form */}
        {showAddForm && (
          <div className="mb-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center">
                <Globe className="mr-2 text-blue-400" size={24} />
                {editingId ? "Edit Your Project" : "Upload Your Project"}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="My Awesome Project"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  >
                    {categories.map((cat) => (
                      <option
                        key={cat.value}
                        value={cat.value}
                        className="bg-slate-800"
                      >
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  placeholder="Describe your project and its features..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                ></textarea>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 flex items-center">
                  <Globe className="mr-1 text-blue-400" size={16} />
                  Hosted Website URL * (Netlify, Vercel, GitHub Pages, etc.)
                </label>
                <input
                  type="url"
                  name="hostedUrl"
                  value={formData.hostedUrl}
                  onChange={handleInputChange}
                  required
                  placeholder="https://myproject.netlify.app"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Enter the live URL where your project is hosted
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-2 flex items-center">
                    <Github className="mr-1 text-blue-400" size={16} />
                    GitHub Repository URL (optional)
                  </label>
                  <input
                    type="url"
                    name="githubUrl"
                    value={formData.githubUrl}
                    onChange={handleInputChange}
                    placeholder="https://github.com/username/repo"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold mb-2 flex items-center">
                    <Image className="mr-1 text-blue-400" size={16} />
                    Preview Image URL (optional)
                  </label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/screenshot.jpg"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 flex items-center">
                  <Tag className="mr-1 text-blue-400" size={16} />
                  Technologies Used (comma separated)
                </label>
                <input
                  type="text"
                  name="technologies"
                  value={formData.technologies}
                  onChange={handleInputChange}
                  placeholder="React, Node.js, MongoDB, Tailwind CSS"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold hover:scale-105 transition-all cursor-pointer shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={20} />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2" size={20} />
                      {editingId ? "Update Project" : "Submit Project"}
                    </>
                  )}
                </button>
                <button
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-white/10 rounded-xl font-semibold hover:bg-white/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-400" size={40} />
            <span className="ml-3 text-xl">Loading projects...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-12 text-center">
            <Globe className="mx-auto mb-4 text-gray-400" size={64} />
            <h3 className="text-2xl font-bold mb-2">No projects yet</h3>
            <p className="text-gray-400 mb-6">
              Be the first to upload and showcase your project!
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl font-semibold hover:scale-105 transition-all cursor-pointer shadow-lg inline-flex items-center"
            >
              <Plus className="mr-2" size={20} />
              Upload Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const category = categories.find(
                (c) => c.value === project.category
              );
              const isOwn = isOwnProject(project);

              return (
                <div
                  key={project._id}
                  className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden hover:scale-105 transition-all duration-300 shadow-xl group"
                >
                  {/* Project Image */}
                  <div className="relative h-48 bg-gradient-to-br from-blue-500/20 to-purple-500/20 overflow-hidden">
                    {project.imageUrl ? (
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Globe size={64} className="text-white/30" />
                      </div>
                    )}
                    <div
                      className={`absolute top-3 right-3 px-3 py-1 bg-gradient-to-r ${category?.color} rounded-full text-white text-xs font-semibold`}
                    >
                      {category?.label}
                    </div>
                    {project.status === "approved" && (
                      <div className="absolute top-3 left-3 px-2 py-1 bg-green-500/90 rounded-full text-white text-xs font-semibold flex items-center">
                        <CheckCircle size={12} className="mr-1" />
                        Approved
                      </div>
                    )}
                  </div>

                  {/* Project Content */}
                  <div className="p-5">
                    <h3 className="text-xl font-bold mb-2 text-white group-hover:text-blue-400 transition-colors">
                      {project.title}
                    </h3>

                    {/* Student Info */}
                    <div className="flex items-center text-sm text-gray-400 mb-2">
                      <User size={14} className="mr-1" />
                      <span>{project.studentName}</span>
                    </div>

                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                      {project.description}
                    </p>

                    {/* Technologies */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.technologies.slice(0, 3).map((tech, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.technologies.length > 3 && (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded-full text-xs">
                          +{project.technologies.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                      <div className="flex items-center">
                        <Calendar size={12} className="mr-1" />
                        <span>{formatDate(project.createdAt)}</span>
                      </div>
                      <div className="flex items-center">
                        <Eye size={12} className="mr-1" />
                        <span>{project.views} views</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => visitProject(project)}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold hover:scale-105 transition-all flex items-center justify-center text-sm"
                      >
                        <ExternalLink className="mr-1" size={16} />
                        Visit Live
                      </button>
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all flex items-center justify-center"
                          title="View on GitHub"
                        >
                          <Github size={18} />
                        </a>
                      )}
                      {isOwn && (
                        <>
                          <button
                            onClick={() => startEdit(project)}
                            className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
                            title="Edit project"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteProject(project._id)}
                            disabled={deletingId === project._id}
                            className="px-4 py-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-all disabled:opacity-50"
                            title="Delete project"
                          >
                            {deletingId === project._id ? (
                              <Loader2 className="animate-spin" size={16} />
                            ) : (
                              <Trash2 size={16} className="text-red-400" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
