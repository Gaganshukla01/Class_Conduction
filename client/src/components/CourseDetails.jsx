import React, { useState,useEffect } from "react";
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
} from "lucide-react";

export default function CourseDetails() {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [filter, setFilter] = useState("all");
  const [favorites, setFavorites] = useState([]);

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (selectedCourse) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedCourse]);

  const courses = [
    {
      id: 1,
      title: "Complete Web Development Bootcamp",
      category: "Web Development",
      icon: <Globe className="w-8 h-8 text-blue-400" />,
      instructor: "Sarah Johnson",
      rating: 4.8,
      reviewCount: 2340,
      students: 15420,
      sessions: 45,
      duration: "12 weeks",
      price: 299,
      originalPrice: 399,
      level: "Beginner Friendly",
      description:
        "Start your web development journey! Learn HTML, CSS, JavaScript, React, and build real projects.",
      preview: "Watch a free preview lesson",
      difficulty: "beginner",
      topics: [
        "HTML5 & CSS3",
        "JavaScript Fundamentals",
        "React.js",
        "Node.js",
        "MongoDB",
        "Portfolio Projects",
      ],
      nextBatch: "Aug 15, 2025",
      features: [
        "Lifetime Access",
        "Certificate",
        "Career Support",
        "Community Access",
      ],
      whatYouLearn: [
        "Build responsive websites from scratch",
        "Master modern JavaScript and React",
        "Create full-stack web applications",
        "Deploy projects to the web",
      ],
    },
    {
      id: 2,
      title: "Python Programming Masterclass",
      category: "Python Development",
      icon: <Code className="w-8 h-8 text-green-400" />,
      instructor: "Michael Chen",
      rating: 4.9,
      reviewCount: 3120,
      students: 22100,
      sessions: 38,
      duration: "10 weeks",
      price: 249,
      originalPrice: 349,
      level: "Beginner Friendly",
      description:
        "Learn Python from zero to hero! Perfect for beginners who want to start programming.",
      preview: "Try a free coding exercise",
      difficulty: "beginner",
      topics: [
        "Python Basics",
        "Data Structures",
        "Web Development",
        "APIs",
        "Database Integration",
        "Real Projects",
      ],
      nextBatch: "Aug 22, 2025",
      features: [
        "Hands-on Projects",
        "Code Reviews",
        "Job Assistance",
        "Mobile App",
      ],
      whatYouLearn: [
        "Write clean, efficient Python code",
        "Build web applications with Django",
        "Work with databases and APIs",
        "Automate tasks with Python scripts",
      ],
    },
    {
      id: 3,
      title: "Advanced React & Next.js",
      category: "Web Development",
      icon: <Globe className="w-8 h-8 text-blue-400" />,
      instructor: "Emily Rodriguez",
      rating: 4.7,
      reviewCount: 890,
      students: 8900,
      sessions: 32,
      duration: "8 weeks",
      price: 199,
      originalPrice: 299,
      level: "Intermediate",
      description:
        "Take your React skills to the next level with advanced patterns and Next.js framework.",
      preview: "See what you'll build",
      difficulty: "intermediate",
      topics: [
        "Advanced React Hooks",
        "Next.js 14",
        "TypeScript",
        "Performance",
        "Testing",
        "Deployment",
      ],
      nextBatch: "Aug 10, 2025",
      features: [
        "Real Projects",
        "Code Mentorship",
        "Interview Prep",
        "Portfolio Review",
      ],
      whatYouLearn: [
        "Master advanced React patterns",
        "Build production-ready Next.js apps",
        "Optimize performance and SEO",
        "Deploy scalable applications",
      ],
    },
    {
      id: 4,
      title: "Python for Data Science & AI",
      category: "Python Development",
      icon: <Code className="w-8 h-8 text-green-400" />,
      instructor: "Dr. James Park",
      rating: 4.6,
      reviewCount: 1560,
      students: 12300,
      sessions: 42,
      duration: "14 weeks",
      price: 399,
      originalPrice: 549,
      level: "Intermediate",
      description:
        "Dive into data science and AI! Learn to analyze data and build machine learning models.",
      preview: "Explore sample projects",
      difficulty: "intermediate",
      topics: [
        "Data Analysis",
        "Machine Learning",
        "Deep Learning",
        "AI Projects",
        "Data Visualization",
        "Real Datasets",
      ],
      nextBatch: "Aug 28, 2025",
      features: [
        "Industry Projects",
        "Kaggle Competitions",
        "AI Certification",
        "Career Guidance",
      ],
      whatYouLearn: [
        "Analyze complex datasets",
        "Build predictive models",
        "Create AI-powered applications",
        "Present insights with visualizations",
      ],
    },
  ];

  const navigate = useNavigate();

  const toggleFavorite = (courseId) => {
    setFavorites((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const filteredCourses = courses.filter((course) => {
    if (filter === "all") return true;
    if (filter === "beginner") return course.difficulty === "beginner";
    if (filter === "intermediate") return course.difficulty === "intermediate";
    if (filter === "web") return course.category === "Web Development";
    if (filter === "python") return course.category === "Python Development";
    return true;
  });

  const StudentCourseCard = ({ course }) => (
    <div className="group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300 cursor-pointer">
      {/* Header with favorite button */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {course.icon}
          <div>
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
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <Heart
            className={`w-5 h-5 ${favorites.includes(course.id) ? "text-red-500 fill-current" : "text-gray-400"}`}
          />
        </button>
      </div>

      {/* Level Badge */}
      <div className="mb-3">
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            course.difficulty === "beginner"
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
          }`}
        >
          {course.level}
        </span>
      </div>

      {/* Description */}
      <p className="text-gray-300 mb-4 line-clamp-2">{course.description}</p>

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
          <span>Starts {course.nextBatch}</span>
        </div>
      </div>

      {/* Pricing */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-baseline space-x-2">
          <span className="font-bold text-2xl text-white">${course.price}</span>
          <span className="text-gray-400 line-through text-lg">
            ${course.originalPrice}
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

      {/* Preview Button */}
      <button className="w-full mb-3 bg-white/10 text-gray-300 py-2 px-4 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center space-x-2 border border-white/20">
        <Play className="w-4 h-4" />
        <span>{course.preview}</span>
      </button>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button
          onClick={() => setSelectedCourse(course)}
          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Learn More
        </button>
        <button
          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="font-bold text-3xl text-white mb-2">
                {course.title}
              </h2>
              <p className="text-gray-300 text-lg mb-4">{course.description}</p>
              <div className="flex items-center space-x-4">
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
              className="text-gray-400 hover:text-white text-2xl font-bold p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              ×
            </button>
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
                  <span className="text-gray-400">Next Batch:</span>
                  <span className="font-medium text-blue-400">
                    {course.nextBatch}
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
                    ${course.price}
                  </span>
                  <span className="text-gray-400 line-through text-xl">
                    ${course.originalPrice}
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

          {/* Enrollment Actions */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <button className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2">
              <span>Enroll Now - ${course.price}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => toggleFavorite(course.id)}
              className="flex-1 bg-white/10 backdrop-blur-sm text-white py-4 px-6 rounded-xl hover:bg-white/20 transition-all duration-300 font-medium shadow-lg hover:shadow-xl border border-white/20"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Background Effects - matching landing page */}
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
            Python programming
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
              { key: "python", label: "Python" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-6 py-2 rounded-full transition-all duration-300 font-medium ${
                  filter === key
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                    : "bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20 backdrop-blur-sm"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {filteredCourses.map((course) => (
            <StudentCourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedCourse && (
        <CourseDetailModal
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
        />
      )}
    </div>
  );
}
