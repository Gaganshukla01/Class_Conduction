import React, { useState } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useContext } from "react";
import { AppContent } from "../context/Context";
import { toast } from "react-toastify";

function ResetPassword() {
  axios.defaults.withCredentials = true;
  const { getUserData, backend_url, setUserData, isLoggedIn, setIsLoggedin } = useContext(AppContent);
  const inputRefs = React.useRef([]);
  const navigate = useNavigate();

  const[email,setEmail]=useState()
  const[newPassword,setNewPassword]=useState()
  const[otp,setPasswordOtp]=useState()

  const [isEmailClicked, setIsEmailClicked] = useState(false);
  const [isOtpClicked, setIsOtpClicked] = useState(false);

  const handleInput = (e, index) => {
    if (e.target.value.length > 0 && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key == "Backspace" && e.target.value === "" && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text");
    const pasteArray = paste.split("");
    pasteArray.forEach((char, index) => {
      if (inputRefs.current[index]) {
        inputRefs.current[index].value = char;
      }
    });
  };

  const setOtp= async (e)=>{
    try {
     e.preventDefault()
     const otpArray=inputRefs.current.map(e=>e.value)
     const otp=otpArray.join("")
     setPasswordOtp(otp)
     setIsOtpClicked(true)
     console.log(otp)
     toast.success("OTP Added") 
    } catch (error) {
      toast.error(error.message)
    }
  }



const otpsendemail=async (e)=>{
  
    try {
      e.preventDefault()
      console.log(email)
      const {data}=await axios.post(backend_url+"/api/auth/resetotp",{email})
      if(data){
        toast.success(data.message)
        setIsEmailClicked(true)

      }
    } catch (error) {
      toast.error(data.message)
     
    }
}

const resetPassword=async (e)=>{
  e.preventDefault()
  try {

    const {data}=await axios.post(backend_url+"/api/auth/resetpassword",
      {email,otp,newPassword})
      if(data.sucess){
        toast.success(data.message)
        setIsLoggedin(false)
        setUserData(false)    
        navigate("/")    
      }
    
  } catch (error) {
    toast.error(data.message)
  }

}

  return (
    <>
      <div
        className="flex flex-row items-center justify-center min-h-screen px-6 sm:px-0 
     bg-gradient-to-br from-blue-200 to bg-purple-400"
      >
        <img
          src={assets.logo}
          alt=""
          className="absolute left-5 
        sm:left-20 top-5 w-28 sm:w-32 cursor:pointer"
          onClick={() => navigate("/")}
        />

        {/* reset email */}

        {!isEmailClicked && (
          <div
            className="bg-slate-900 p-10 rounded-lg shadow-lg w-full 
        sm:w-96  text-indigo-300 text-sm"
          >
            <h2
              className="
            text-3xl font-semibold text-white  text-center mb-3 
            "
            >
              Reset Password
            </h2>
            <p className=" text-center text-sm mb-6">Enter your Email Id</p>

            <form onSubmit={otpsendemail}>
              <div
                className="mb-4 flex items-center gap-3 w-full
            px-5 py-2.5 rounded-full bg-[#333A5C]"
              >
                <img src={assets.mail_icon} alt="error" />
                <input
                  className="bg-transparent outline-none"
                  type="email"
                  placeholder="Email"
                  required
                  value={email}
                  onChange={e=>setEmail(e.target.value)}
                  
                />
              </div>

              <button
                className="w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900
          text-white font-medium cursor-pointer" type="submit"
              >
                Send Otp
              </button>
            </form>
          </div>
        )}

        {/* for otp input for verification */}
        {!isOtpClicked && isEmailClicked && (
          <div
            className="bg-slate-900 p-10 rounded-lg shadow-lg w-full 
        sm:w-120  text-indigo-300 text-sm"
          >
            <h2
              className="
            text-3xl font-semibold text-white  text-center mb-3 
            "
            >
              Enter Otp
            </h2>
            <p className=" text-center text-sm mb-6">Enter your 6 Digit Otp</p>

            <form className="bg-slate-900 p-8 rounded-lg shadow-lg text-sm " onSubmit={setOtp}>
              <div className="flex justify-between mb-8" onPaste={handlePaste}>
                {Array(6)
                  .fill(0)
                  .map((_, index) => (
                    <input
                      type="text"
                      key={index}
                      maxLength="1"
                      required
                      className="w-12 h-12 bg-[#333A5C] text-white 
                  text-center text-xl rounded-md m-1"
                      ref={(e) => (inputRefs.current[index] = e)}
                      onInput={(e) => handleInput(e, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                    />
                  ))}
              </div>

              <button
                className="w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900
          text-white font-medium cursor-pointer" type="submit"
              >
                Verify Otp
              </button>
            </form>
          </div>
        )}
        {/* for password setting */}

        {isOtpClicked && isEmailClicked && (
          <div
            className="bg-slate-900 p-10 rounded-lg shadow-lg w-full 
        sm:w-96  text-indigo-300 text-sm"
          >
            <h2
              className="
            text-3xl font-semibold text-white  text-center mb-3 
            "
            >
              Reset Password
            </h2>
            <p className=" text-center text-sm mb-6">Enter your new password</p>

            <form onSubmit={resetPassword}>
              <div
                className="mb-4 flex items-center gap-3 w-full
            px-5 py-2.5 rounded-full bg-[#333A5C]"
              >
                <img src={assets.lock_icon} alt="error" />
                <input
                  className="bg-transparent outline-none"
                  type="password"
                  placeholder="Password"
                  required
                  value={newPassword}
                  onChange={e=>setNewPassword(e.target.value)}
                />
              </div>

              <button
                className="w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900
          text-white font-medium cursor-pointer"  type="submit"
              >
                Set Password
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}

export default ResetPassword;
