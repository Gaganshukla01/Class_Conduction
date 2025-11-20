import React, { useState, useEffect, useContext } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ExternalLink,
  Github,
  Eye,
  Calendar,
  User,
  Mail,
  Tag,
  Globe,
  Filter,
  AlertCircle,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { AppContent } from "../context/Context";
import { toast } from "react-toastify";

export default function AdminProjectApproval() {
  const { userData, backend_url, refreshData } = useContext(AppContent);

  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [processingId, setProcessingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    projectId: null,
    status: null,
    projectTitle: "",
  });

  useEffect(() => {
    fetchAllProjects();
  }, []);

  const fetchAllProjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${backend_url}/api/project/projects/admin/all`
      );
      const result = await response.json();

      if (result.success) {
        setProjects(result.data);
      } else {
        toast.error("Failed to fetch projects: " + result.message);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to fetch projects. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const openConfirmModal = (projectId, status, projectTitle) => {
    setConfirmModal({
      isOpen: true,
      projectId,
      status,
      projectTitle,
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      projectId: null,
      status: null,
      projectTitle: "",
    });
  };

  const updateProjectStatus = async () => {
    const { projectId, status } = confirmModal;

    setProcessingId(projectId);
    closeConfirmModal();

    try {
      const response = await fetch(
        `${backend_url}/api/project/projects/${projectId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success(`Project ${status} successfully!`, {
          position: "top-right",
          autoClose: 3000,
        });
        fetchAllProjects();
        refreshData();
      } else {
        toast.error(result.message || `Failed to ${status} project`);
      }
    } catch (error) {
      console.error("Error updating project status:", error);
      toast.error("Failed to update project status.");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const categories = {
    web: { label: "Web App", color: "from-blue-500 to-cyan-400" },
    mobile: { label: "Mobile App", color: "from-purple-500 to-pink-400" },
    portfolio: { label: "Portfolio", color: "from-green-500 to-emerald-400" },
    game: { label: "Game", color: "from-orange-500 to-red-400" },
    productivity: {
      label: "Productivity",
      color: "from-indigo-500 to-purple-400",
    },
    other: { label: "Other", color: "from-gray-500 to-slate-400" },
  };

  const statusConfig = {
    pending: {
      label: "Pending",
      color: "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
      icon: Clock,
    },
    approved: {
      label: "Approved",
      color: "bg-green-500/20 text-green-300 border-green-400/30",
      icon: CheckCircle,
    },
    rejected: {
      label: "Rejected",
      color: "bg-red-500/20 text-red-300 border-red-400/30",
      icon: XCircle,
    },
  };

  const filteredProjects = projects.filter((project) => {
    if (filterStatus === "all") return true;
    return project.status === filterStatus;
  });

  const stats = {
    total: projects.length,
    pending: projects.filter((p) => p.status === "pending").length,
    approved: projects.filter((p) => p.status === "approved").length,
    rejected: projects.filter((p) => p.status === "rejected").length,
  };

  const isAdmin = userData?.userType === "admin" || userData?.role === "admin";

  const getActionText = () => {
    const { status } = confirmModal;
    if (status === "approved") return "approve";
    if (status === "rejected") return "reject";
    return status;
  };

  const getActionColor = () => {
    const { status } = confirmModal;
    if (status === "approved") return "green";
    if (status === "rejected") return "red";
    return "blue";
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center p-8">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-12 text-center max-w-md">
          <AlertCircle className="mx-auto mb-4 text-red-400" size={64} />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-400">
            You don't have permission to access this page. Admin access
            required.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-8">
      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/20 p-8 max-w-md w-full shadow-2xl transform transition-all">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Confirm Action</h3>
              <button
                onClick={closeConfirmModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <div
                className={`w-16 h-16 rounded-full bg-${getActionColor()}-500/20 flex items-center justify-center mx-auto mb-4`}
              >
                {confirmModal.status === "approved" ? (
                  <CheckCircle
                    className={`text-${getActionColor()}-400`}
                    size={32}
                  />
                ) : (
                  <XCircle
                    className={`text-${getActionColor()}-400`}
                    size={32}
                  />
                )}
              </div>

              <p className="text-gray-300 text-center text-lg">
                Are you sure you want to{" "}
                <span className={`font-bold text-${getActionColor()}-400`}>
                  {getActionText()}
                </span>{" "}
                this project?
              </p>

              <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-white font-semibold text-center">
                  {confirmModal.projectTitle}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeConfirmModal}
                className="flex-1 px-4 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={updateProjectStatus}
                className={`flex-1 px-4 py-3 bg-gradient-to-r ${
                  confirmModal.status === "approved"
                    ? "from-green-500 to-emerald-600"
                    : "from-red-500 to-rose-600"
                } rounded-lg hover:scale-105 transition-all font-semibold text-white shadow-lg`}
              >
                Confirm {getActionText()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-3">
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Project Approval Dashboard
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            Review and manage submitted student projects
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Projects</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Globe className="text-blue-400" size={40} />
            </div>
          </div>

          <div className="bg-yellow-500/10 backdrop-blur-md rounded-xl border border-yellow-400/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-300 text-sm">Pending Review</p>
                <p className="text-3xl font-bold text-yellow-300">
                  {stats.pending}
                </p>
              </div>
              <Clock className="text-yellow-400" size={40} />
            </div>
          </div>

          <div className="bg-green-500/10 backdrop-blur-md rounded-xl border border-green-400/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm">Approved</p>
                <p className="text-3xl font-bold text-green-300">
                  {stats.approved}
                </p>
              </div>
              <CheckCircle className="text-green-400" size={40} />
            </div>
          </div>

          <div className="bg-red-500/10 backdrop-blur-md rounded-xl border border-red-400/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-300 text-sm">Rejected</p>
                <p className="text-3xl font-bold text-red-300">
                  {stats.rejected}
                </p>
              </div>
              <XCircle className="text-red-400" size={40} />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-2">
          {[
            { value: "all", label: "All Projects" },
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value)}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold hover:cursor-pointer transition-all  ${
                filterStatus === filter.value
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                  : "hover:bg-white/10 text-gray-300"
              }`}
            >
              <Filter className="inline mr-2" size={16} />
              {filter.label}
            </button>
          ))}
        </div>

        {/* Projects List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-400" size={40} />
            <span className="ml-3 text-xl">Loading projects...</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-12 text-center">
            <Globe className="mx-auto mb-4 text-gray-400" size={64} />
            <h3 className="text-2xl font-bold mb-2">No projects found</h3>
            <p className="text-gray-400">
              {filterStatus === "all"
                ? "No projects have been submitted yet."
                : `No ${filterStatus} projects found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => {
              const category = categories[project.category];
              const status = statusConfig[project.status];
              const StatusIcon = status.icon;
              const isProcessing = processingId === project._id;

              return (
                <div
                  key={project._id}
                  className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden hover:border-white/40 transition-all"
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Project Image */}
                      <div className="lg:w-64 h-48 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl overflow-hidden flex-shrink-0">
                        {project.imageUrl ? (
                          <img
                            src={project.imageUrl}
                            alt={project.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon size={48} className="text-white/30" />
                          </div>
                        )}
                      </div>

                      {/* Project Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-2xl font-bold text-white">
                                {project.title}
                              </h3>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center ${status.color}`}
                              >
                                <StatusIcon size={12} className="mr-1" />
                                {status.label}
                              </span>
                              <span
                                className={`px-3 py-1 bg-gradient-to-r ${category?.color} rounded-full text-white text-xs font-semibold`}
                              >
                                {category?.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                              <div className="flex items-center">
                                <User size={14} className="mr-1" />
                                <span>{project.studentName}</span>
                              </div>
                              <div className="flex items-center">
                                <Mail size={14} className="mr-1" />
                                <span>{project.studentEmail}</span>
                              </div>
                              <div className="flex items-center">
                                <Calendar size={14} className="mr-1" />
                                <span>{formatDate(project.createdAt)}</span>
                              </div>
                              <div className="flex items-center">
                                <Eye size={14} className="mr-1" />
                                <span>{project.views} views</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-300 mb-4">
                          {project.description}
                        </p>

                        {/* Technologies */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Tag size={16} className="text-blue-400" />
                          {project.technologies.map((tech, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3">
                          <a
                            href={project.hostedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold hover:scale-105 transition-all flex items-center text-sm"
                          >
                            <ExternalLink className="mr-2" size={16} />
                            Visit Live Site
                          </a>

                          {project.githubUrl && (
                            <a
                              href={project.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all flex items-center text-sm"
                            >
                              <Github className="mr-2" size={16} />
                              View Code
                            </a>
                          )}

                          {project.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  openConfirmModal(
                                    project._id,
                                    "approved",
                                    project.title
                                  )
                                }
                                disabled={isProcessing}
                                className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-all cursor-pointer flex items-center text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-green-400/30"
                              >
                                {isProcessing ? (
                                  <Loader2
                                    className="mr-2 animate-spin"
                                    size={16}
                                  />
                                ) : (
                                  <CheckCircle className="mr-2" size={16} />
                                )}
                                Approve
                              </button>

                              <button
                                onClick={() =>
                                  openConfirmModal(
                                    project._id,
                                    "rejected",
                                    project.title
                                  )
                                }
                                disabled={isProcessing}
                                className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all flex items-center text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-red-400/30"
                              >
                                {isProcessing ? (
                                  <Loader2
                                    className="mr-2 animate-spin"
                                    size={16}
                                  />
                                ) : (
                                  <XCircle className="mr-2" size={16} />
                                )}
                                Reject
                              </button>
                            </>
                          )}

                          {project.status === "approved" && (
                            <button
                              onClick={() =>
                                openConfirmModal(
                                  project._id,
                                  "rejected",
                                  project.title
                                )
                              }
                              disabled={isProcessing}
                              className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-all flex items-center text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-red-400/30"
                            >
                              {isProcessing ? (
                                <Loader2
                                  className="mr-2 animate-spin"
                                  size={16}
                                />
                              ) : (
                                <XCircle className="mr-2" size={16} />
                              )}
                              Revoke Approval
                            </button>
                          )}

                          {project.status === "rejected" && (
                            <button
                              onClick={() =>
                                openConfirmModal(
                                  project._id,
                                  "approved",
                                  project.title
                                )
                              }
                              disabled={isProcessing}
                              className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-all cursor-pointer flex items-center text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-green-400/30"
                            >
                              {isProcessing ? (
                                <Loader2
                                  className="mr-2 animate-spin"
                                  size={16}
                                />
                              ) : (
                                <CheckCircle className="mr-2 " size={16} />
                              )}
                              Approve Project
                            </button>
                          )}
                        </div>
                      </div>
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
