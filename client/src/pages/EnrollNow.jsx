import React, { useState, useContext, use } from 'react';
import { Phone, Mail, MessageCircle, Send, User, BookOpen, IndianRupee, Calendar, Clock, CheckCircle, ArrowLeft, Globe, Code } from 'lucide-react';
import { AppContent } from '../context/Context';

export default function EnrollNow() {
  const { allCourse } = useContext(AppContent);
  const allcourses = allCourse || [];
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    selectedCourse: '',
    message: '',
    preferredTime: '',
    experience: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 2000);
  };

  const contactMethods = [
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Call Us",
      value: "+91 8349061831",
      description: "Mon-Fri, 10 AM - 8 PM",
      action: "tel:+918349061831"
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email Us",
      value: "classwavee@gmail.com",
      description: "We'll respond within 24 hours",
      action: "mailto:classwavee@gmail.com"
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "WhatsApp",
      value: "Chat with us",
      description: "Quick responses guaranteed",
      action: "https://wa.me/8349061831"
    }
  ];

  const getCourseIcon = (category) => {
    if (category?.toLowerCase().includes('web') || category?.toLowerCase().includes('development')) {
      return <Globe className="w-5 h-5 text-blue-400" />;
    } else if (category?.toLowerCase().includes('python') || category?.toLowerCase().includes('tech')) {
      return <Code className="w-5 h-5 text-green-400" />;
    }
    return <BookOpen className="w-5 h-5 text-purple-400" />;
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white flex items-center justify-center">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10 text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-white">Thank You!</h2>
          <p className="text-gray-300 mb-6">
            Your enrollment request has been submitted successfully. We'll contact you within 24 hours to discuss your learning journey.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
          >
            Submit Another Request
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
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Courses</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Start Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Learning Journey
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Ready to transform your career? Let's discuss which course is perfect for you
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-8 pb-20">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Methods */}
          <div>
            <h2 className="text-3xl font-bold mb-8 text-white">Get in Touch</h2>
            
            <div className="space-y-6 mb-8">
              {contactMethods.map((method, index) => (
                <a
                  key={index}
                  href={method.action}
                  className="block p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-blue-500/30 group-hover:border-blue-400/50 transition-colors">
                      {method.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">{method.title}</h3>
                      <p className="text-blue-400 font-medium mb-1">{method.value}</p>
                      <p className="text-gray-400 text-sm">{method.description}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* Why Choose Us */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <h3 className="font-semibold text-xl mb-4 text-white">Why Choose Our Courses?</h3>
              <div className="space-y-3">
                {[
                  "Expert instructors with industry experience",
                  "Hands-on projects and real-world applications",
                  "Lifetime access to course materials",
                  "Career support and job assistance",
                  "Certificate upon completion",
                  "Flexible learning schedule"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Enrollment Form */}
          <div>
            <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <h2 className="text-3xl font-bold mb-6 text-white">Enroll Now</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Personal Information</h3>
                  
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Full Name"
                      required
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white/20 transition-all"
                    />
                  </div>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Email Address"
                      required
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white/20 transition-all"
                    />
                  </div>

                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="Phone Number with country code"
                      required
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white/20 transition-all"
                    />
                  </div>
                </div>

                {/* Course Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Course Preference</h3>
                  
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
                    <select
                      name="selectedCourse"
                      value={formData.selectedCourse}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:bg-white/20 transition-all appearance-none"
                    >
                      <option value="" className="bg-slate-800">Select a course</option>
                      {allcourses.map((course) => (
                        <option key={course._id} value={course._id} className="bg-slate-800">
                          {course.nameCourse} - ₹{course.coursePrice}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <Calendar className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
                    <select
                      name="preferredTime"
                      value={formData.preferredTime}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:bg-white/20 transition-all appearance-none"
                    >
                      <option value="" className="bg-slate-800">Preferred Contact Time</option>
                      <option value="morning" className="bg-slate-800">Morning (9 AM - 12 PM)</option>
                      <option value="afternoon" className="bg-slate-800">Afternoon (12 PM - 4 PM)</option>
                      <option value="evening" className="bg-slate-800">Evening (4 PM - 8 PM)</option>
                    </select>
                  </div>

                  <div className="relative">
                    <Clock className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
                    <select
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:bg-white/20 transition-all appearance-none"
                    >
                      <option value="" className="bg-slate-800">Your Experience Level</option>
                      <option value="beginner" className="bg-slate-800">Complete Beginner</option>
                      <option value="some" className="bg-slate-800">Some Experience</option>
                      <option value="intermediate" className="bg-slate-800">Intermediate</option>
                      <option value="advanced" className="bg-slate-800">Advanced</option>
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us about your goals and any specific questions you have..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white/20 transition-all resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Send Enrollment Request</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Course Preview Cards */}
            {allcourses.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-white mb-4">Available Courses</h3>
                <div className="space-y-3">
                  {allcourses.slice(0, 3).map((course) => (
                    <div key={course._id} className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                        {getCourseIcon(course.courseCategory)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{course.nameCourse}</h4>
                        <p className="text-gray-400 text-sm">{course.courseCategory}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-1 text-green-400 font-semibold">
                          <IndianRupee className="w-4 h-4" />
                          <span>{course.coursePrice}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}