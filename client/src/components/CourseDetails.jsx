import React, { useState, useEffect ,useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Users,
  Calendar,
  Star,
  BookOpen,
  Code,
  Globe,
  Play,
  Heart,
  Filter,
  ChevronRight,
  CheckCircle,
  Download,
  FileText,
  Loader,
} from "lucide-react";
import { AppContent } from "../context/Context";

export default function CourseDetails() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [filter, setFilter] = useState("all");
  const [favorites, setFavorites] = useState([]);
  const [pdfPreview, setPdfPreview] = useState(null);

  const navigate = useNavigate();

  const { backend_url } = useContext(AppContent);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`${backend_url}/api/course`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }
      
      const data = await response.json();
      
      const transformedCourses = data.map((course) => ({
        id: course._id,
        title: course.nameCourse,
        category: course.courseCategory,
        description: course.description,
        price: course.coursePrice,
        originalPrice: Math.round(course.coursePrice * 1.3), 
        courseImage: course.courseImage,
        courseVideo: course.courseVideo,
        icon: course.courseCategory === "WEB" ? 
          <Globe className="w-8 h-8 text-blue-400" /> : 
          <Code className="w-8 h-8 text-green-400" />,
        instructor: "Expert Instructor",
        rating: 4.8,
        reviewCount: Math.floor(Math.random() * 3000) + 500,
        students: Math.floor(Math.random() * 20000) + 5000,
        sessions: Math.floor(Math.random() * 30) + 20,
        duration: "8-12 weeks",
        level: "All Levels",
        difficulty: "beginner",
        nextBatch: "Starting Soon",
        topics: course.description.split(" ").slice(0, 6),
        features: [
          "Lifetime Access",
          "Certificate",
          "Career Support",
          "Community Access",
        ],
        whatYouLearn: [
          `Master ${course.nameCourse} from basics to advanced`,
          "Build real-world projects",
          "Get industry-ready skills",
          "Hands-on practical experience",
        ],
        pdfUrl: `/public/${course._id}.pdf`,
      }));

      setCourses(transformedCourses);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError("Failed to load courses. Please try again later.");
      setLoading(false);
    }
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedCourse || pdfPreview) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedCourse, pdfPreview]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggleFavorite = (courseId) => {
    setFavorites((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleDownloadPDF = (course) => {
    // Create download link
    const link = document.createElement("a");
    link.href = course.pdfUrl;
    link.download = `${course.title.replace(/\s+/g, "_")}_Course.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreviewPDF = (course) => {
    setPdfPreview(course);
  };

  const filteredCourses = courses.filter((course) => {
    if (filter === "all") return true;
    if (filter === "beginner") return course.difficulty === "beginner";
    if (filter === "intermediate") return course.difficulty === "intermediate";
    if (filter === "web") return course.category.toLowerCase().includes("web");
    if (filter === "tech") return course.category.toLowerCase().includes("tech");
    if (filter === "python") return course.title.toLowerCase().includes("python");
    return true;
  });

  const StudentCourseCard = ({ course }) => (
    <div className="group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300">
      {/* Course Image */}
      <div className="mb-4 rounded-xl overflow-hidden h-48 bg-white/5">
        <img
          src={course.courseImage}
          alt={course.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/400x200?text=Course+Image";
          }}
        />
      </div>

      {/* Header with favorite button */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1">
          {course.icon}
          <div className="flex-1">
            <h3 className="font-bold text-xl text-white mb-1">
              {course.title}
            </h3>
            <p className="text-gray-300 text-sm flex items-center space-x-2">
              <span>{course.instructor}</span>
              <span className="flex items-center space-x-1">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span>{course.rating}</span>
                <span className="text-gray-400">({course.reviewCount})</span>
              </span>
            </p>
          </div>
        </div>
        <button
          onClick={() => toggleFavorite(course.id)}
          className="p-2 hover:bg-white/10 cursor-pointer rounded-full transition-colors"
        >
          <Heart
            className={`w-5 h-5 ${favorites.includes(course.id) ? "text-red-500 fill-current" : "text-gray-400"}`}
          />
        </button>
      </div>

      {/* Level Badge & Category */}
      <div className="mb-3 flex items-center space-x-2">
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
          {course.level}
        </span>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
          {course.category}
        </span>
      </div>

      {/* Description */}
      <p className="text-gray-300 mb-4 line-clamp-3">{course.description}</p>

      {/* Course Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div className="flex items-center space-x-2 text-gray-400">
          <BookOpen className="w-4 h-4" />
          <span>{course.sessions} lessons</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-400">
          <Clock className="w-4 h-4" />
          <span>{course.duration}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-400">
          <Users className="w-4 h-4" />
          <span>{course.students.toLocaleString()} students</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>{course.nextBatch}</span>
        </div>
      </div>

      {/* Pricing */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline space-x-2">
          <span className="font-bold text-2xl text-white">₹{course.price}</span>
          <span className="text-gray-400 line-through text-lg">
            ₹{course.originalPrice}
          </span>
          <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded text-sm font-medium border border-red-500/30">
            {Math.round(
              ((course.originalPrice - course.price) / course.originalPrice) *
                100
            )}
            % off
          </span>
        </div>
      </div>

      {/* PDF Buttons */}
      <div className="flex space-x-2 mb-3">
        <button
          onClick={() => handlePreviewPDF(course)}
          className="flex-1 bg-white/10 text-gray-300 py-2 px-4 rounded-lg hover:bg-white/20 cursor-pointer transition-colors flex items-center justify-center space-x-2 border border-white/20"
        >
          <FileText className="w-4 h-4" />
          <span>Preview PDF</span>
        </button>
        <button
          onClick={() => handleDownloadPDF(course)}
          className="flex-1 bg-white/10 text-gray-300 py-2 px-4 rounded-lg hover:bg-white/20 cursor-pointer transition-colors flex items-center justify-center space-x-2 border border-white/20"
        >
          <Download className="w-4 h-4" />
          <span>Download</span>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={() => setSelectedCourse(course)}
          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 cursor-pointer transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Learn More
        </button>
        <button
          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-lg hover:from-green-600 hover:to-emerald-700 cursor-pointer transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          onClick={() => navigate("/contactus")}
        >
          Enroll Now
        </button>
      </div>
    </div>
  );

  const CourseDetailModal = ({ course, onClose }) => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
        <div className="p-8">
          {/* Modal Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="font-bold text-3xl text-white mb-2">
                {course.title}
              </h2>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="font-medium text-white">
                    {course.rating}
                  </span>
                  <span className="text-gray-400">
                    ({course.reviewCount} reviews)
                  </span>
                </div>
                <span className="text-gray-400">By {course.instructor}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl font-bold p-2 hover:bg-white/10 cursor-pointer rounded-full transition-colors"
            >
              ×
            </button>
          </div>

          {/* Course Image */}
          <div className="mb-6 rounded-xl overflow-hidden h-64 bg-white/5">
            <img
              src={course.courseImage}
              alt={course.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "https://via.placeholder.com/800x400?text=Course+Image";
              }}
            />
          </div>

          {/* Description */}
          <div className="mb-8">
            <h3 className="font-semibold text-xl mb-3 text-white">
              About this course
            </h3>
            <p className="text-gray-300 text-lg leading-relaxed">
              {course.description}
            </p>
          </div>

          {/* What You'll Learn */}
          <div className="mb-8">
            <h3 className="font-semibold text-xl mb-4 text-white">
              What you'll learn
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {course.whatYouLearn.map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Course Content */}
          <div className="mb-8">
            <h3 className="font-semibold text-xl mb-4 text-white">
              Course Content
            </h3>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium text-white">
                  {course.sessions} lessons
                </span>
                <span className="text-gray-400">{course.duration} total</span>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                {course.topics.map((topic, index) => (
                  <div
                    key={index}
                    className="bg-white/10 text-gray-300 px-4 py-2 rounded-lg text-sm backdrop-blur-sm border border-white/10"
                  >
                    {topic}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Course Details & Pricing */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-xl mb-4 text-white">
                Course Details
              </h3>
              <div className="space-y-4 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="flex justify-between">
                  <span className="text-gray-400">Level:</span>
                  <span className="font-medium text-white">{course.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration:</span>
                  <span className="font-medium text-white">
                    {course.duration}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Students Enrolled:</span>
                  <span className="font-medium text-white">
                    {course.students.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Category:</span>
                  <span className="font-medium text-blue-400">
                    {course.category}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-xl mb-4 text-white">
                Pricing & Features
              </h3>
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30">
                <div className="flex items-baseline space-x-2 mb-4">
                  <span className="font-bold text-3xl text-green-400">
                    ₹{course.price}
                  </span>
                  <span className="text-gray-400 line-through text-xl">
                    ₹{course.originalPrice}
                  </span>
                </div>
                <div className="space-y-3">
                  {course.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* PDF Download Section */}
          <div className="mb-8 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="font-semibold text-xl mb-4 text-white">
              Course Materials
            </h3>
            <div className="flex space-x-4">
              <button
                onClick={() => handlePreviewPDF(course)}
                className="flex-1 bg-blue-500/20 text-blue-400 py-3 px-6 rounded-lg hover:bg-blue-500/30 cursor-pointer transition-all duration-300 font-medium border border-blue-500/30 flex items-center justify-center space-x-2"
              >
                <FileText className="w-5 h-5" />
                <span>Preview Course PDF</span>
              </button>
              <button
                onClick={() => handleDownloadPDF(course)}
                className="flex-1 bg-green-500/20 text-green-400 py-3 px-6 rounded-lg hover:bg-green-500/30 cursor-pointer transition-all duration-300 font-medium border border-green-500/30 flex items-center justify-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          {/* Enrollment Actions */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => navigate("/contactus")}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 cursor-pointer transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2"
            >
              <span>Enroll Now - ₹{course.price}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => toggleFavorite(course.id)}
              className="flex-1 bg-white/10 backdrop-blur-sm text-white py-4 px-6 rounded-xl hover:bg-white/20 cursor-pointer transition-all duration-300 font-medium shadow-lg hover:shadow-xl border border-white/20"
            >
              {favorites.includes(course.id)
                ? "Remove from Wishlist"
                : "Add to Wishlist"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const PDFPreviewModal = ({ course, onClose }) => (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl max-w-6xl w-full h-[90vh] border border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-2xl text-white mb-1">
              {course.title} - Course PDF
            </h2>
            <p className="text-gray-400">Preview course materials</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold p-2 hover:bg-white/10 cursor-pointer rounded-full transition-colors"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-hidden p-6">
          <iframe
            src={course.pdfUrl}
            className="w-full h-full rounded-lg border border-white/10"
            title="Course PDF Preview"
          />
        </div>
        <div className="p-6 border-t border-white/10">
          <button
            onClick={() => handleDownloadPDF(course)}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 cursor-pointer transition-all duration-300 font-semibold shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center bg-red-500/10 border border-red-500/30 rounded-xl p-8">
          <p className="text-red-400 text-xl mb-4">{error}</p>
          <button
            onClick={fetchCourses}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 cursor-pointer transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 px-8 pt-20 pb-12">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Master Your
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Skills Today
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Transform your career with hands-on courses in web development and
            programming
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="relative z-10 max-w-6xl mx-auto px-8 py-6">
        <div className="flex items-center space-x-4 mb-8">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex flex-wrap gap-3">
            {[
              { key: "all", label: "All Courses" },
              { key: "beginner", label: "Beginner" },
              { key: "intermediate", label: "Intermediate" },
              { key: "web", label: "Web Development" },
              { key: "tech", label: "Tech" },
              { key: "python", label: "Python" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-6 py-2 rounded-full transition-all duration-300 font-medium ${
                  filter === key
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                    : "bg-white/10 text-gray-300 hover:bg-white/20 cursor-pointer border border-white/20 backdrop-blur-sm"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Course Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {filteredCourses.map((course) => (
              <StudentCourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-400 text-xl">No courses found for this filter.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedCourse && (
        <CourseDetailModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
        />
      )}

      {pdfPreview && (
        <PDFPreviewModal
          course={pdfPreview}
          onClose={() => setPdfPreview(null)}
        />
      )}
    </div>
  );
}