import React, { useContext, useEffect } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/Context";
import { toast } from "react-toastify";
import axios from "axios";


function EmailVerify() {
 
  axios.defaults.withCredentials=true
  const inputRefs=React.useRef([])
  const navigate=useNavigate()
  
  const {getUserData,backend_url,userData,isLoggedIn,setIsLoggedin}=useContext(AppContent)
  

  const handleInput=(e,index)=>{

    if(e.target.value.length >0 && index<inputRefs.current.length-1 ){
      inputRefs.current[index+1].focus()
    }
  }

  const handleKeyDown=(e,index)=>{

    if(e.key=='Backspace' && e.target.value==='' && index>0){
      inputRefs.current[index-1].focus()
    }
  }

  const handlePaste=(e)=>{

    const paste=e.clipboardData.getData("text")
    const pasteArray=paste.split("")
    pasteArray.forEach((char,index)=>{
       
      if(inputRefs.current[index]){
        inputRefs.current[index].value=char
      }
    })
  }

  const verifyEmail= async (e)=>{
     try {
      e.preventDefault()
      const otpArray=inputRefs.current.map(e=>e.value)
      const otp=otpArray.join("")
      const {data}=await axios.post(backend_url+"/api/auth//verifyemail",{otp})
      

      if(data){
        toast.success(data.message)
        getUserData()
        navigate('/')
            }
      
     } catch (error) {
       toast.error(error.message)
     }
  }
  
  // if user is verified so make sure user unable to go on verify page
  useEffect(()=>{
   console.log(userData)
    isLoggedIn && userData && userData.isAccountVerifed && navigate("/")
  },[isLoggedIn,userData])


  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen px-6 sm:px-0 
    bg-gradient-to-br from-blue-200 to bg-purple-400"
    >
      <img
        src={assets.logo}
        alt=""
        className="absolute left-5  
              sm:left-20 top-5 w-28 sm:w-32 cursor:pointer"
        onClick={() =>navigate("/")}
      />

      <div 
        className="bg-slate-900 p-10 rounded-lg shadow-lg w-full 
        sm:w-115  text-indigo-300 text-sm"
      >
        <h2
          className="
            text-3xl font-semibold text-white  text-center mb-3 
            "
        >
          Verify Your Email
        </h2>
        <p className=" text-center text-sm mb-6">Enter 6 Digit Otp</p>

        <form className="bg-slate-900 p-8 rounded-lg shadow-lg text-sm " onSubmit={verifyEmail}>
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
                  ref={e=>inputRefs.current[index]=e}
                  onInput={(e)=>handleInput(e,index)}
                  onKeyDown={(e)=>handleKeyDown(e,index)}
                />
              ))}
          </div>

          <button
          className="w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900
          text-white font-medium cursor-pointer" type="submit"
        >
          Verify Email
        </button>
        </form>
        
      </div>
    </div>
  );
}

export default EmailVerify;
