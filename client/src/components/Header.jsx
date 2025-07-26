import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Star,
  Play,
  ChevronRight,
  CheckCircle,
  Target,
  Rocket,
  Lightbulb,
} from "lucide-react";

export default function ClassWaveLanding() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(interval);
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
              <button className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-lg font-semibold hover:scale-105 transition-all duration-300 shadow-xl"
              onClick={() => navigate('/coursedetails')}>
                Start Learning Now
                <ChevronRight
                  className="inline ml-2 group-hover:translate-x-1 transition-transform"
                  size={20}
                />
              </button>
              <button className="group flex items-center justify-center px-8 py-4 border border-white/30 rounded-full text-lg font-semibold hover:bg-white/10 transition-all duration-300"
                onClick={() => navigate('/seehowitworks')}>
                <Play className="mr-2" size={20} />
                See How It Works
              </button>
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

      {/* Stats
      <section className="relative z-10 px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "2M+", label: "Students" },
              { number: "10K+", label: "Courses" },
              { number: "500+", label: "Experts" },
              { number: "4.9★", label: "Rating" }
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-1">{stat.number}</div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

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

      {/* Social Proof */}
      <section className="relative z-10 px-8 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <div className="flex justify-center mb-6">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={20}
                  className="text-yellow-400 fill-current"
                />
              ))}
            </div>
            <blockquote className="text-xl mb-6 text-gray-200 italic">
              "ClassWave helped me transition from marketing to tech in just 6
              months. The courses are practical and the instructors are
              world-class!"
            </blockquote>
            <div className="flex items-center justify-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <span className="font-bold">AK</span>
              </div>
              <div className="text-left">
                <div className="font-semibold">Alex Kim</div>
                <div className="text-gray-400 text-sm">
                  Software Engineer at Google
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
              <button className="px-10 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-lg font-semibold hover:scale-105 transition-transform shadow-xl">
                Get Started Free
              </button>
              <button className="px-10 py-4 border border-white/30 rounded-full text-lg font-semibold hover:bg-white/10 transition-all"
              onClick={() => navigate('/coursedetails')}>
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

          <div className="border-t border-white/10 pt-8 mt-8 text-gray-400">
            <p>&copy; 2025 ClassWave. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
