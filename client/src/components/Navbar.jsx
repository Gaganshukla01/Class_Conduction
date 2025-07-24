import React, { useEffect, useContext, useState } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/Context";
import { toast } from "react-toastify";
import axios from "axios";
import { Users, BookOpen, GraduationCap, ArrowLeft, Mail, LogOut, User } from "lucide-react";


function Navbar() {
  const navigate = useNavigate();
  const { userData, setUserData, setIsLoggedin, backend_url } = useContext(AppContent);
  const [userType, setUserType] = useState("")

  const goBack = () => {
    navigate(-1);
  };
 
  const sendVerificationMail = async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.post(backend_url + "/api/auth/sendverifyOtp");
      if (data.sucess) { 
        navigate("/EmailVerify");
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
  
  useEffect(() => {
    if (userData && userData.userType) setUserType(userData.userType);
  }, [userData]);
 
  return (
    <>
      <nav className="w-full backdrop-blur-xl bg-gradient-to-r from-blue-600/95 to-purple-600/95 border-b border-white/10 sticky top-0 z-50">
        <div className="flex justify-between items-center px-6 py-4 sm:px-12 lg:px-24 max-w-full mx-auto">
          {/* Left Section - Back Button and Logo */}
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            {/* Back Button - only show if not on home page */}
            {window.location.pathname !== '/' && (
              <button 
                onClick={goBack}
                className="w-11 h-11 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 flex-shrink-0 border border-white/20"
              >
                <ArrowLeft size={20} className="text-white" />
              </button>
            )}
            
            {/* Logo/Brand */}
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:opacity-90 transition-all duration-300 flex-shrink-0 group"
              onClick={() => navigate('/')}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 via-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 border border-white/20">
                <GraduationCap size={26} className="text-white drop-shadow-sm" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent drop-shadow-sm">
                ClassWave..
              </span>
            </div>
          </div>

          {/* Right Section - User Menu or Login */}
          <div className="flex items-center justify-end flex-shrink-0">
            {userData && userData.name ? (
              <div className="relative group">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/20">
                  {userData.name[0].toUpperCase()}
                </div>

                {/* Dropdown Menu */}
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
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-3 bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 hover:from-blue-600 hover:via-blue-700 hover:to-purple-700 rounded-2xl px-6 py-3 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/20 backdrop-blur-sm"
              >
                <User size={18} className="text-white" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}

export default Navbar;