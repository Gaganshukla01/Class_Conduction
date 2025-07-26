import React, { useContext, useState } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/Context";
import axios from "axios";
import { toast } from "react-toastify";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { app } from "../components/FirebaseConfig.jsx";
import { GraduationCap } from "lucide-react";

function Login() {
  const { backend_url, setIsLoggedin, getUserData } = useContext(AppContent);
  const navigate = useNavigate();
  const [state, setState] = useState("Sign Up");
  const [name, setName] = useState();
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();

  const handleGoogleSignIn = async (e) => {
    try {
      const provider = new GoogleAuthProvider();
      const auth = getAuth(app);
      const result = await signInWithPopup(auth, provider);
      console.log(result.user.displayName);
      console.log(result.user.email);

      axios.defaults.withCredentials = true;
      const { data } = await axios.post(backend_url + "/api/auth/googleauth", {
        name: result.user.displayName,
        email: result.user.email,
        Validuser: result.user.emailVerified,
      });

      if (data.sucess) {
        setIsLoggedin(true);
        toast.success(data.message);
        getUserData();
        navigate("/");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const onSumbitHandler = async (e) => {
    try {
      e.preventDefault();
      axios.defaults.withCredentials = true;

      if (state === "Sign Up") {
        const { data } = await axios.post(backend_url + "/api/auth/register", {
          name,
          email,
          password,
        });
        if (data.sucess) {
          toast.success("User Registerd.");
          setIsLoggedin(true);
          getUserData();
          navigate("/");
        } else {
          toast.error(data.message);
        }
      } else {
        axios.defaults.withCredentials = true;
        const { data } = await axios.post(backend_url + "/api/auth/login", {
          email,
          password,
        });
        if (data.sucess) {
          setIsLoggedin(true);
          toast.success(data.message);
          getUserData();
          navigate("/");
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      toast.error(data.message);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-6 sm:px-0 
 bg-gradient-to-br from-blue-200 to bg-purple-400 relative"
    >
      <div
        className="bg-slate-900 p-10 rounded-lg shadow-lg w-full 
        sm:w-96  text-indigo-300 text-sm"
      >
        <h2
          className="
            text-3xl font-semibold text-white  text-center mb-3 
            "
        >
          {state === "Sign Up" ? "Create Account" : "Login"}
        </h2>
        <p className=" text-center text-sm mb-6">
          {state === "Sign Up"
            ? "Create Your Account"
            : "Login To Your Account"}
        </p>
        <form onSubmit={onSumbitHandler}>
          {state === "Sign Up" && (
            <div
              className="mb-4 flex items-center gap-3 w-full
                 px-5 py-2.5 rounded-full bg-[#333A5C]"
            >
              <img src={assets.person_icon} alt="error" />
              <input
                className="bg-transparent outline-none"
                type="text"
                placeholder="Full Name"
                required
                onChange={(e) => setName(e.target.value)}
                value={name}
              />
            </div>
          )}

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
              onChange={(e) => setEmail(e.target.value)}
              value={email}
            />
          </div>

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
              onChange={(e) => setPassword(e.target.value)}
              value={password}
            />
          </div>
          {state != "Sign Up" && (
            <p
              className="mb-4 text-indigo-500 cursor-pointer"
              onClick={() => navigate("/resetPassword")}
            >
              Forgot Password?
            </p>
          )}

          <button
            className="w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900
          text-white font-medium cursor-pointer"
          >
            {state}
          </button>

          <button
            className="w-full py-2.5 mt-3 rounded-full bg-gradient-to-r from-red-500 to-indigo-900
          text-white font-medium cursor-pointer"
            onClick={handleGoogleSignIn}
          >
            {state} With Google
          </button>
        </form>

        {state === "Sign Up" ? (
          <p className="text-gray-400 text-center text-xs mt-4 ">
            Already have an account?{" "}
            <span
              className="text-blue-400 cursor-pointer "
              onClick={() => setState("Login")}
            >
              Login here
            </span>
          </p>
        ) : (
          <p className="text-gray-400 text-center text-xs mt-4 ">
            Don't have an account?{" "}
            <span
              className="text-blue-400 cursor-pointer "
              onClick={() => setState("Sign Up")}
            >
              Sign Up
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

export default Login;
