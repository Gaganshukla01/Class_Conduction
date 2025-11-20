import React, { useState, useEffect, useContext } from "react";
import {
  Search,
  X,
  Filter,
  Code,
  Calendar,
  FileText,
  ChevronDown,
  Loader2,
  FolderOpen,
  Clock,
} from "lucide-react";
import axios from "axios";
import { AppContent } from "../context/Context";

const CodeProjectsModal = ({ isOpen, onClose, onSelectProject, userId }) => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);
  const { userData, backend_url } = useContext(AppContent);

  const languages = [
    { value: "all", label: "All Languages", color: "bg-gray-500" },
    { value: "javascript", label: "JavaScript", color: "bg-yellow-500" },
    { value: "python", label: "Python", color: "bg-blue-500" },
    { value: "html", label: "HTML", color: "bg-orange-500" },
    { value: "css", label: "CSS", color: "bg-blue-400" },
    { value: "cpp", label: "C++", color: "bg-purple-500" },
    { value: "java", label: "Java", color: "bg-red-500" },
  ];

  const sortOptions = [
    { value: "createdAt", label: "Date Created" },
    { value: "updatedAt", label: "Last Modified" },
    { value: "title", label: "Title" },
    { value: "language", label: "Language" },
  ];

  const fetchProjects = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `${backend_url}/api/codesave/user/${userId}`
      );
      const data = response.data;

      if (data.success) {
        setProjects(data.data);
        setFilteredProjects(data.data);
      } else {
        console.error("Failed to fetch projects:", data.message);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search projects
  const filterProjects = () => {
    let filtered = [...projects];

    // Language filter
    if (selectedLanguage !== "all") {
      filtered = filtered.filter(
        (project) => project.language === selectedLanguage
      );
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.title?.toLowerCase().includes(searchLower) ||
          project.filename?.toLowerCase().includes(searchLower) ||
          project.description?.toLowerCase().includes(searchLower) ||
          project.language?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "createdAt" || sortBy === "updatedAt") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "desc") {
        return bValue > aValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

    setFilteredProjects(filtered);
  };

  // Effects
  useEffect(() => {
    if (isOpen && userId) {
      fetchProjects();
    }
  }, [isOpen, userId, sortBy, sortOrder]);

  useEffect(() => {
    filterProjects();
  }, [projects, searchTerm, selectedLanguage, sortBy, sortOrder]);

  // Handle project selection
  const handleProjectSelect = (project) => {
    onSelectProject({
      id: project._id,
      code: project.code,
      language: project.language,
      filename: project.filename,
      title: project.title,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });
    onClose();
  };

  // Format date
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

  // Get language color
  const getLanguageColor = (language) => {
    const lang = languages.find((l) => l.value === language);
    return lang ? lang.color : "bg-gray-500";
  };

  // Get file extension icon color
  const getFileIconColor = (language) => {
    const colors = {
      javascript: "text-yellow-400",
      python: "text-blue-400",
      html: "text-orange-400",
      css: "text-blue-300",
      cpp: "text-purple-400",
      java: "text-red-400",
    };
    return colors[language] || "text-gray-400";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <FolderOpen className="text-blue-400" size={24} />
            <h2 className="text-2xl font-bold text-white">My Code Projects</h2>
            <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-sm">
              {filteredProjects.length} projects
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-700 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search projects by title, filename, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <Filter size={16} />
            <span>Filters</span>
            <ChevronDown
              className={`transform transition-transform ${showFilters ? "rotate-180" : ""}`}
              size={16}
            />
          </button>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-700">
              {/* Language Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {languages.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Order
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-blue-400" size={32} />
              <span className="ml-3 text-gray-400">Loading projects...</span>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Code size={48} className="mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No projects found</h3>
              <p className="text-sm">
                {searchTerm || selectedLanguage !== "all"
                  ? "Try adjusting your search or filters"
                  : "Start coding to see your projects here"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleProjectSelect(project)}
                  className="bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] group"
                >
                  {/* Project Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${getLanguageColor(project.language)}`}
                      ></div>
                      <div>
                        <h3 className="font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                          {project.title || project.filename}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {project.filename}
                        </p>
                      </div>
                    </div>
                    <FileText
                      className={`${getFileIconColor(project.language)} group-hover:scale-110 transition-transform`}
                      size={18}
                    />
                  </div>

                  {/* Project Description */}
                  {project.description && (
                    <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* Project Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center space-x-4">
                      <span
                        className={`px-2 py-1 rounded-full text-white ${getLanguageColor(project.language)}`}
                      >
                        {project.language}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Calendar size={12} />
                        <span>{formatDate(project.createdAt)}</span>
                      </div>
                    </div>
                    {project.updatedAt !== project.createdAt && (
                      <div className="flex items-center space-x-1">
                        <Clock size={12} />
                        <span>Modified {formatDate(project.updatedAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Code Preview */}
                  <div className="mt-3 bg-gray-900/50 rounded-lg p-3">
                    <pre className="text-xs text-gray-300 overflow-hidden line-clamp-3">
                      <code>{project.code}</code>
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Click on any project to load it into the editor
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodeProjectsModal;
