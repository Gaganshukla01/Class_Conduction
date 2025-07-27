import React, { useEffect, useContext, useState } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/Context";
import { toast } from "react-toastify";
import axios from "axios";
import { Users, BookOpen, GraduationCap, ArrowLeft, Mail, LogOut, User, LayoutDashboard, Code, Menu, X } from "lucide-react";

function Navbar() {
  const navigate = useNavigate();
  const { userData, setUserData, setIsLoggedin, backend_url } = useContext(AppContent);
  const [userType, setUserType] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const goBack = () => {
    navigate(-1);
  };
 
  const sendVerificationMail = async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(backend_url + "/api/auth/sendverifyOtp");
      if (data.sucess) { 
        navigate("/emailVerify");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "An error occurred");
    }
  };

  const logout = async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(backend_url + "/api/auth/logout");
      
      if (data.sucess) { 
        toast.warning("Logout successful");
        setIsLoggedin(false);
        setUserData(false);
        navigate("/");
      } else {
        toast.error(data.message || "Logout failed");
      }
    } catch (error) {
      toast.error(error.message || "Logout error");
    }
  }; 

  const goToDashboard = () => {
    if (userData.userType === 'student') {
      navigate('/studentdash');
    } else if (userData.userType === 'admin') {
      navigate('/admin');
    }
    setIsMobileMenuOpen(false);
  };

  const goToCodeEditor = () => {
    navigate('/playground');
    setIsMobileMenuOpen(false);
  };
  
  useEffect(() => {
    if (userData && userData.userType) setUserType(userData.userType);
  }, [userData]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.mobile-menu-container')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);
 
  return (
    <>
      <nav className="w-full backdrop-blur-xl bg-gradient-to-r from-blue-600/95 to-purple-600/95 border-b border-white/10 sticky top-0 z-50">
        <div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 lg:px-24 max-w-full mx-auto">
          {/* Left Section - Back Button and Logo */}
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            {/* Back Button - only show if not on home page */}
            {window.location.pathname !== '/' && (
              <button 
                onClick={goBack}
                className="w-9 h-9 sm:w-11 sm:h-11 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 flex-shrink-0 border border-white/20"
              >
                <ArrowLeft size={18} className="text-white sm:w-5 sm:h-5" />
              </button>
            )}
            
            {/* Logo/Brand */}
            <div 
              className="flex items-center space-x-2 sm:space-x-3 cursor-pointer hover:opacity-90 transition-all duration-300 flex-shrink-0 group"
              onClick={() => navigate('/')}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 via-blue-500 to-purple-500 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 border border-white/20">
                <GraduationCap size={20} className="text-white drop-shadow-sm sm:w-6 sm:h-6" />
              </div>
              <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent drop-shadow-sm">
                ClassWave..
              </span>
            </div>
          </div>

          {/* Center Section - Navigation Buttons (desktop only) */}
          {userData && userData.name && (
            <div className="hidden lg:flex items-center space-x-3 mx-4">
              <button
                onClick={goToDashboard}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/20"
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </button>
              
              <button
                onClick={goToCodeEditor}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/20"
              >
                <Code size={18} />
                <span>Code Editor</span>
              </button>
            </div>
          )}

          {/* Right Section - User Menu or Login */}
          <div className="flex items-center justify-end flex-shrink-0">
            {userData && userData.name ? (
              <div className="flex items-center space-x-2">
                {/* Mobile Menu Toggle for logged in users */}
                <div className="lg:hidden mobile-menu-container relative">
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 border border-white/20"
                  >
                    {isMobileMenuOpen ? (
                      <X size={18} className="text-white" />
                    ) : (
                      <Menu size={18} className="text-white" />
                    )}
                  </button>

                  {/* Mobile Dropdown Menu */}
                  {isMobileMenuOpen && (
                    <div className="absolute right-0 top-12 w-64 opacity-100 visible">
                      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                        {/* User Info Header */}
                        <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-semibold text-sm">
                              {userData.name[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800 text-sm">{userData.name}</p>
                              <p className="text-xs text-gray-600">{userData.email}</p>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-2">
                          {/* Dashboard Button */}
                          <button 
                            onClick={goToDashboard}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors duration-200 text-left group/item"
                          >
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover/item:bg-blue-200 transition-colors">
                              <LayoutDashboard size={16} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 text-sm">Dashboard</p>
                              <p className="text-xs text-gray-500">View your dashboard</p>
                            </div>
                          </button>

                          {/* Code Editor Button */}
                          <button 
                            onClick={goToCodeEditor}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-purple-50 transition-colors duration-200 text-left group/item"
                          >
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover/item:bg-purple-200 transition-colors">
                              <Code size={16} className="text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 text-sm">Code Editor</p>
                              <p className="text-xs text-gray-500">Open playground</p>
                            </div>
                          </button>

                          {!userData.isAccountVerified && (
                            <button 
                              onClick={sendVerificationMail} 
                              className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors duration-200 text-left group/item"
                            >
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover/item:bg-blue-200 transition-colors">
                                <Mail size={16} className="text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-800 text-sm">Verify Email</p>
                                <p className="text-xs text-gray-500">Complete account verification</p>
                              </div>
                            </button>
                          )}
                          
                          <button 
                            onClick={logout}
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-colors duration-200 text-left group/item"
                          >
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover/item:bg-red-200 transition-colors">
                              <LogOut size={16} className="text-red-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 text-sm">Sign Out</p>
                              <p className="text-xs text-gray-500">End your session</p>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Desktop User Avatar */}
                <div className="relative group hidden lg:block">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-sm sm:text-lg cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/20">
                    {userData.name[0].toUpperCase()}
                  </div>

                  {/* Desktop Dropdown Menu */}
                  <div className="absolute right-0 top-16 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                      {/* User Info Header */}
                      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-semibold text-sm">
                            {userData.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{userData.name}</p>
                            <p className="text-xs text-gray-600">{userData.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        {!userData.isAccountVerified && (
                          <button 
                            onClick={sendVerificationMail} 
                            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-blue-50 transition-colors duration-200 text-left group/item"
                          >
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center group-hover/item:bg-blue-200 transition-colors">
                              <Mail size={16} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 text-sm">Verify Email</p>
                              <p className="text-xs text-gray-500">Complete account verification</p>
                            </div>
                          </button>
                        )}
                        
                        <button 
                          onClick={logout}
                          className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-colors duration-200 text-left group/item"
                        >
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center group-hover/item:bg-red-200 transition-colors">
                            <LogOut size={16} className="text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm">Sign Out</p>
                            <p className="text-xs text-gray-500">End your session</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 hover:from-blue-600 hover:via-blue-700 hover:to-purple-700 rounded-xl sm:rounded-2xl px-3 py-2 sm:px-6 sm:py-3 text-white font-medium sm:font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/20 backdrop-blur-sm text-sm sm:text-base"
              >
                <User size={16} className="text-white sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Sign In</span>
                <span className="xs:hidden">Login</span>
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;