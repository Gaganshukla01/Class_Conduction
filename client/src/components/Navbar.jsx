import React, { useContext } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/Context";
import { toast } from "react-toastify";
import axios from "axios";
import { Users, BookOpen, GraduationCap } from "lucide-react";

function Navbar() {
  const navigate = useNavigate();
  const { userData, setUserData, setIsLoggedin, backend_url } = useContext(AppContent);

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
      
      if (data.success) { // Fixed: was 'sucess'
        console.log("Logout successful");
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

  return (
    <>
      <div className="w-full flex justify-between items-center p-4 sm:p-6 sm:px-24 absolute top-0 z-50 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-md border-b border-white/10">
        {/* Logo/Brand with Class Conduct Icon */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <GraduationCap size={24} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-white">ClassConduct</span>
        </div>

        {userData && userData.name ? (
          <div className="w-10 h-10 flex justify-center items-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white relative group shadow-lg">
            {userData.name[0].toUpperCase()}

            <div className="absolute hidden group-hover:block top-0 right-0 z-10 text-black rounded pt-12">
              <ul className="list-none bg-white shadow-xl rounded-lg m-0 p-2 text-sm min-w-[140px] border border-gray-200">
                {!userData.isAccountVerified && (
                  <li 
                    onClick={sendVerificationMail} 
                    className="py-2 px-3 hover:bg-blue-50 cursor-pointer rounded text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Verify Email
                  </li>
                )}
                <li 
                  className="py-2 px-3 hover:bg-red-50 cursor-pointer rounded text-gray-700 hover:text-red-600 transition-colors" 
                  onClick={logout}
                >
                  Logout
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 border-2 border-blue-400 rounded-full px-6 py-2 text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 cursor-pointer transition-all shadow-lg hover:shadow-xl hover:scale-105 font-medium"
          >
            Login 
            <Users size={18} className="text-white" />
          </button>
        )}
      </div>
    </>
  );
}

export default Navbar;