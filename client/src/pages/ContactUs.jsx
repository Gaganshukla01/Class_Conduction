import React, { useState, useContext, useEffect } from "react";
import { BookOpen, Mail, User, Phone, MessageSquare } from "lucide-react";
import { AppContent } from "../context/Context";
import { toast } from "react-toastify";
import axios from "axios";

function ContactUs() {
  const { backend_url } = useContext(AppContent);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    courseName: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    const res = await axios.post(
      `${backend_url}/api/contactus/contact`,
      formData
    );
    if (res.data.success) {
      toast.success(res.data.message);
    } else {
      toast.error(res.data.message);
    }
    setFormData({
      name: "",
      email: "",
      phone: "",
      courseName: "",
      message: "",
    });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div className="w-full max-w-2xl">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-center text-white mb-8">
            Contact Us About Course
          </h1>

          <div className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-white font-semibold mb-2 text-lg">
                Your Name
              </label>
              <div className="relative">
                <User
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300"
                  size={20}
                />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  className="w-full pl-12 pr-4 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-white font-semibold mb-2 text-lg">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300"
                  size={20}
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                />
              </div>
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-white font-semibold mb-2 text-lg">
                Phone Number
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300"
                  size={20}
                />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  className="w-full pl-12 pr-4 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                />
              </div>
            </div>

            {/* Course Name Field */}
            <div>
              <label className="block text-white font-semibold mb-2 text-lg">
                Course Interested In
              </label>
              <div className="relative">
                <BookOpen
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300"
                  size={20}
                />
                <input
                  type="text"
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleChange}
                  placeholder="Enter course name"
                  className="w-full pl-12 pr-4 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                />
              </div>
            </div>

            {/* Message Field */}
            <div>
              <label className="block text-white font-semibold mb-2 text-lg">
                Message
              </label>
              <div className="relative">
                <MessageSquare
                  className="absolute left-4 top-6 text-purple-300"
                  size={20}
                />
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us more about your interest..."
                  rows="5"
                  className="w-full pl-12 pr-4 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              className="w-full bg-white text-purple-700 font-bold py-4 px-6 rounded-xl hover:bg-purple-50 transform hover:scale-105 transition-all duration-200 shadow-lg text-lg"
            >
              Send Inquiry
            </button>
          </div>

          <p className="text-center text-white/80 mt-6 text-sm">
            We'll get back to you within 24 hours
          </p>
        </div>
      </div>
    </div>
  );
}

export default ContactUs;
