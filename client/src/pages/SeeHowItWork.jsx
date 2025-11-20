import React, { useState, useEffect } from "react";
import {
  Play,
  ArrowRight,
  BookOpen,
  CreditCard,
  LogIn,
  Users,
  Calendar,
  Target,
  Video,
  FileText,
  MessageSquare,
  Award,
  Clock,
  CheckCircle,
  DollarSign,
  User,
  Settings,
  Lightbulb,
  BarChart3,
  Repeat,
  HelpCircle,
} from "lucide-react";

export default function SeeHowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const [animateArrows, setAnimateArrows] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 12);
      setAnimateArrows(true);
      setTimeout(() => setAnimateArrows(false), 500);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const flowSteps = [
    {
      id: 1,
      title: "Demo Class",
      subtitle: "FREE Trial",
      icon: Play,
      color: "from-green-500 to-emerald-400",
      description: "Experience our teaching style",
      badge: "FREE",
    },
    {
      id: 2,
      title: "Course Enrollment",
      subtitle: "Choose Payment Plan",
      icon: BookOpen,
      color: "from-blue-500 to-cyan-400",
      description: "Select your learning path",
    },
    {
      id: 3,
      title: "Payment Options",
      subtitle: "Flexible Plans",
      icon: CreditCard,
      color: "from-purple-500 to-pink-400",
      description: "Full: 15% off | 3-Split: 10% off | 2-Split: 5% off",
      isPayment: true,
    },
    {
      id: 4,
      title: "Student Login",
      subtitle: "Access Portal",
      icon: LogIn,
      color: "from-orange-500 to-red-400",
      description: "Get your credentials",
    },
    {
      id: 5,
      title: "Dashboard Access",
      subtitle: "Full Website Access",
      icon: Settings,
      color: "from-teal-500 to-blue-400",
      description: "Complete platform access",
    },
    {
      id: 6,
      title: "Attendance Tracking",
      subtitle: "Monitor Progress",
      icon: Users,
      color: "from-indigo-500 to-purple-400",
      description: "Track your learning journey",
    },
    {
      id: 7,
      title: "Live Classes",
      subtitle: "Interactive Learning",
      icon: Video,
      color: "from-red-500 to-pink-400",
      description: "Schedule & reschedule options",
    },
    {
      id: 8,
      title: "Projects & Homework",
      subtitle: "Hands-on Practice",
      icon: FileText,
      color: "from-yellow-500 to-orange-400",
      description: "2 Live + Multiple Mini Projects",
    },
    {
      id: 9,
      title: "Doubt Sessions",
      subtitle: "Expert Support",
      icon: MessageSquare,
      color: "from-green-500 to-teal-400",
      description: "Specialized doubt clearing",
    },
    {
      id: 10,
      title: "Recall Sessions",
      subtitle: "Revision Classes",
      icon: Repeat,
      color: "from-blue-500 to-indigo-400",
      description: "Strengthen your concepts",
    },
    {
      id: 11,
      title: "Course Completion",
      subtitle: "Achievement Unlocked",
      icon: Award,
      color: "from-purple-500 to-pink-400",
      description: "Certification awarded",
    },
    {
      id: 12,
      title: "Extended Support",
      subtitle: "2 Months Free",
      icon: HelpCircle,
      color: "from-emerald-500 to-green-400",
      description: "Free doubt sessions after completion",
      badge: "BONUS",
    },
  ];

  const paymentOptions = [
    {
      type: "Full Payment",
      discount: "15% OFF",
      color: "bg-green-500",
      popular: true,
    },
    {
      type: "3 Installments",
      discount: "10% OFF",
      color: "bg-blue-500",
      popular: false,
    },
    {
      type: "2 Installments",
      discount: "5% OFF",
      color: "bg-purple-500",
      popular: false,
    },
  ];

  const features = [
    { icon: BarChart3, text: "Progress Tracking" },
    { icon: Calendar, text: "Class Scheduling" },
    { icon: Target, text: "Goal Setting" },
    { icon: Clock, text: "Time Management" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-8">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            ClassWave Student Journey
          </h1>
          <p className="text-xl text-gray-300">
            From Demo to Mastery - Your Complete Learning Path
          </p>
        </div>

        {/* Main Flow */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {flowSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = activeStep === index;
            const nextStep = flowSteps[index + 1];

            return (
              <div key={step.id} className="relative">
                {/* Step Card */}
                <div
                  className={`relative p-6 rounded-2xl backdrop-blur-sm border transition-all duration-500 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/50 scale-105 shadow-2xl"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  {/* Badge */}
                  {step.badge && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-400 text-xs px-3 py-1 rounded-full font-bold">
                      {step.badge}
                    </div>
                  )}

                  {/* Icon */}
                  <div
                    className={`w-16 h-16 rounded-xl bg-gradient-to-r ${step.color} flex items-center justify-center mb-4 mx-auto transform transition-transform ${isActive ? "scale-110 rotate-6" : ""}`}
                  >
                    <Icon size={28} className="text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold mb-1 text-center">
                    {step.title}
                  </h3>
                  <p className="text-sm text-blue-400 mb-3 text-center font-medium">
                    {step.subtitle}
                  </p>
                  <p className="text-xs text-gray-400 text-center leading-relaxed">
                    {step.description}
                  </p>

                  {/* Payment Options */}
                  {step.isPayment && (
                    <div className="mt-4 space-y-2">
                      {paymentOptions.map((option, idx) => (
                        <div
                          key={idx}
                          className={`${option.color} ${option.popular ? "ring-2 ring-yellow-400" : ""} p-2 rounded-lg text-xs text-white relative`}
                        >
                          {option.popular && (
                            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-2 py-1 rounded text-xs font-bold">
                              POPULAR
                            </div>
                          )}
                          <div className="font-semibold">{option.type}</div>
                          <div className="text-yellow-200">
                            {option.discount}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Arrow */}
                {nextStep && (index + 1) % 4 !== 0 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight
                      size={24}
                      className={`text-blue-400 transition-all duration-300 ${
                        animateArrows ? "translate-x-2 text-purple-400" : ""
                      }`}
                    />
                  </div>
                )}

                {/* Down Arrow for mobile/tablet */}
                {nextStep && index < flowSteps.length - 1 && (
                  <div className="lg:hidden flex justify-center mt-4">
                    <div
                      className={`w-6 h-6 transform rotate-90 transition-all duration-300 ${animateArrows ? "translate-y-2 text-purple-400" : "text-blue-400"}`}
                    >
                      <ArrowRight size={24} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Platform Features
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="text-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                >
                  <Icon className="mx-auto mb-3 text-blue-400" size={32} />
                  <p className="text-sm font-medium">{feature.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: Users, number: "2M+", label: "Students Enrolled" },
            { icon: Video, number: "500+", label: "Live Classes Monthly" },
            { icon: Award, number: "95%", label: "Completion Rate" },
            { icon: CheckCircle, number: "24/7", label: "Support Available" },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10"
              >
                <Icon className="mx-auto mb-3 text-blue-400" size={32} />
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  {stat.number}
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
