import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/Context";
import {
  Star,
  Play,
  ChevronRight,
  CheckCircle,
  Target,
  Rocket,
  Lightbulb,
  Projector,
  Gamepad2,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import ReviewsSection from "./ReviewDispaly";

const ReviewInputBox = ({ onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userData, backend_url } = useContext(AppContent);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.warning("Please select a rating");
      return;
    }

    if (!comment.trim()) {
      toast.warning("Please write a comment");
      return;
    }

    setIsSubmitting(true);
    axios.defaults.withCredentials = true;
    const res = await axios.post(`${backend_url}/api/rating`, {
      userId: userData.userId,
      rating,
      comment,
    });

    onSubmit({ rating, comment });

    setRating(0);
    setComment("");
    setIsSubmitting(false);

    toast.success("Thank you for your review! ⭐");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            <span>Leave a Review</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <span className="text-2xl text-gray-400">×</span>
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            How would you rate your experience?
          </label>
          <div className="flex items-center justify-center space-x-2 py-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transform transition-all duration-200 hover:scale-125 focus:outline-none"
                disabled={isSubmitting}
              >
                <Star
                  className={`w-10 h-10 transition-all duration-200 ${
                    star <= (hoveredRating || rating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-600"
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center text-sm text-gray-400 mt-2">
              {rating === 1 && "😞 Poor"}
              {rating === 2 && "😐 Fair"}
              {rating === 3 && "🙂 Good"}
              {rating === 4 && "😊 Very Good"}
              {rating === 5 && "🤩 Excellent"}
            </p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Share your thoughts
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about your experience..."
            className="w-full px-4 py-3 bg-gray-800 text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none border border-gray-700 placeholder-gray-500"
            rows="4"
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {comment.length} characters
            </span>
            {comment.length > 0 && (
              <span className="text-xs text-green-400">✓ Looking good!</span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all font-medium"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || !comment.trim() || isSubmitting}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <span>{isSubmitting ? "Submitting..." : "Submit Review"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ClassWaveLanding() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const { userData, backend_url } = useContext(AppContent);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const features = [
    {
      icon: Lightbulb,
      title: "Learn Fast",
      desc: "Accelerated learning paths",
    },
    { icon: Target, title: "Get Skilled", desc: "Industry-relevant skills" },
    { icon: Rocket, title: "Launch Career", desc: "Land your dream job" },
  ];

  const categories = [
    {
      name: "Web Development",
      courses: "5+",
      color: "from-blue-500 to-cyan-400",
      icon: "💻",
    },
    {
      name: "Python Programming",
      courses: "2+",
      color: "from-green-500 to-emerald-400",
      icon: "📊",
    },
    {
      name: "C++ Programming",
      courses: "2+",
      color: "from-purple-500 to-pink-400",
      icon: "🎨",
    },
    {
      name: "Java Programming",
      courses: "1+",
      color: "from-orange-500 to-red-400",
      icon: "📈",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 px-8 pt-32 pb-16">
        <div className="max-w-6xl mx-auto text-center">
          <div
            className={`transform transition-all duration-1000 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
          >
            <div className="inline-flex items-center bg-blue-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-400/30 mb-8">
              <Star className="mr-2 text-yellow-400" size={16} />
              <span className="text-sm">Trusted by students worldwide</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Ride the Wave of
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Success
              </span>
            </h1>

            <p className="text-xl md:text-2xl mb-10 text-gray-300 max-w-3xl mx-auto">
              Master in-demand skills with expert-led courses. From beginner to
              pro, we'll get you there faster.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-lg font-semibold hover:scale-105 transition-all duration-300 shadow-xl hover:cursor-pointer"
                onClick={() => navigate("/coursedetails")}
              >
                Start Learning Now
                <ChevronRight
                  className="inline ml-2 group-hover:translate-x-1 transition-transform"
                  size={20}
                />
              </button>
              <button
                className="group flex items-center justify-center px-8 py-4 border border-white/30 rounded-full text-lg font-semibold hover:bg-white/10 transition-all duration-300 hover:cursor-pointer"
                onClick={() => navigate("/seehowitworks")}
              >
                <Play className="mr-2" size={20} />
                See How It Works
              </button>
              {/* only show if user is login is presnet  */}
              {userData && (
                <button
                  className="group flex items-center justify-center px-8 py-4 border border-white/30 rounded-full text-lg font-semibold hover:bg-white/10 transition-all duration-300 hover:cursor-pointer"
                  onClick={() => navigate("/projectview")}
                >
                  <Projector className="mr-2" size={20} />
                  Student Projects
                </button>
              )}
            </div>

            {/* Quick Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className={`p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
                      activeFeature === index
                        ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/50 scale-105"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    }`}
                  >
                    <Icon className="mx-auto mb-3 text-blue-400" size={32} />
                    <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                    <p className="text-gray-400 text-sm">{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "200+", label: "Students" },
              { number: "20+", label: "Courses" },
              { number: "50+", label: "Experts" },
              { number: "4.9★", label: "Rating" },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-1">
                  {stat.number}
                </div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="relative z-10 px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Choose Your Path
            </h2>
            <p className="text-xl text-gray-400">
              Explore our most popular course categories
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}
                >
                  {category.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{category.name}</h3>
                <p className="text-blue-400 font-medium">
                  {category.courses} courses
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-semibold hover:scale-105 transition-transform">
              View All Categories
            </button>
          </div>
        </div>
      </section>

      {/* Review*/}
      <ReviewsSection />

      {/* CTA */}
      <section className="relative z-10 px-8 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-md rounded-3xl p-12 border border-white/20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Level Up?
            </h2>
            <p className="text-xl mb-8 text-gray-300">
              Join millions of students already learning on ClassWave
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <button
                onClick={() => navigate("/contactus")}
                className="px-10 hover:cursor-pointer py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-lg font-semibold hover:scale-105 transition-transform shadow-xl"
              >
                Get Started Free
              </button>
              <button
                className="px-10 py-4 hover:cursor-pointer border  border-white/30 rounded-full text-lg font-semibold hover:bg-white/10 transition-all"
                onClick={() => navigate("/coursedetails")}
              >
                Browse Courses
              </button>
            </div>
            <div className="flex items-center justify-center text-gray-400">
              <CheckCircle size={16} className="mr-2 text-green-400" />
              Free trial • No credit card required
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <span className="text-xl font-bold">CW</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ClassWave
            </span>
          </div>
          {/* game button */}
          <button
            onClick={() => navigate("/funzone")}
            className="relative px-8 py-4 mb-8 bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 rounded-2xl font-bold text-white shadow-xl hover:shadow-2xl cursor-pointer hover:scale-110 transition-all duration-300 border-2 border-yellow-400/50 hover:border-yellow-400 animate-pulse hover:animate-none group sm:px-6 sm:py-3 text-sm sm:text-base"
          >
            <span className="flex items-center gap-2 justify-center">
              <Gamepad2
                size={20}
                className="group-hover:rotate-180 transition-transform duration-500"
              />
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent group-hover:from-white group-hover:to-white transition-all">
                FunZone
              </span>
            </span>
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 rounded-2xl blur opacity-30 group-hover:opacity-60 transition-opacity -z-10"></div>
          </button>
          <p className="text-gray-400 mb-8">
            Empowering students to achieve their dreams through quality
            education
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
            <div>
              <h4 className="font-semibold text-white mb-3">Learn</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    All Courses
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Free Courses
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Certificates
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Community
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 mt-8">
            {userData && (
              <button
                onClick={() => setShowReviewModal(true)}
                className="mb-6 hover:cursor-pointer px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white rounded-full font-semibold shadow-lg transition-all transform hover:scale-105 inline-flex items-center space-x-2"
              >
                <Star className="w-5 h-5 fill-current" />
                <span>Leave a Review</span>
              </button>
            )}
            <p className="text-gray-400">
              &copy; 2025 ClassWave. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      {/* Review Modal */}
      {showReviewModal && (
        <ReviewInputBox
          onClose={() => setShowReviewModal(false)}
          onSubmit={(reviewData) => {
            setShowReviewModal(false);
          }}
        />
      )}
    </div>
  );
}
