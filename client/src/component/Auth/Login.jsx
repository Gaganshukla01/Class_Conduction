import "./login.css";
import { FaEye } from "react-icons/fa6";
import Logo from "../../assets/logo.png";
import Image from "../../assets/image.png";
import { FaEyeSlash } from "react-icons/fa6";
import React, { useEffect, useState } from "react";
import GoogleSvg from "../../assets/icons8-google.svg";
import Navbar from "../Navbar";


const Login = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
    <Navbar></Navbar>
    <div className="login-main">
      <div className="login-left">
        <img src={Image} alt="" />
      </div>
      <div className="login-right">
        <div className="login-right-container">
          <div className="login-logo">
            <img src={Logo} alt="" />
          </div>
          <div className="login-center">
            <h2>Welcome back!</h2>
            <p>Please enter your details</p>
            <form>
              <input type="email" placeholder="Email" />
              <div className="pass-input-div">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                />
                {showPassword ? (
                  <FaEyeSlash
                    onClick={() => {
                      setShowPassword(!showPassword);
                    }}
                  />
                ) : (
                  <FaEye
                    onClick={() => {
                      setShowPassword(!showPassword);
                    }}
                  />
                )}
              </div>

              <div className="login-center-options">
                <a href="#" className="forgot-pass-link">
                  Forgot password?
                </a>
              </div>
              <div className="login-center-buttons">
                <button type="button">Log In</button>
              </div>
            </form>
          </div>

          <p className="login-bottom-p">
            Don't have an account? <a href="#">Sign Up</a>
          </p>
        </div>
      </div>
    </div>
    </>
  );
};

export default Login;
