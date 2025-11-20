import React, { useContext, useState } from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/Context";
import axios from "axios";
import { toast } from "react-toastify";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { app } from "../components/FirebaseConfig.jsx";
import { Mail, Lock, User, Eye, EyeOff, Loader2, Sparkles } from "lucide-react";

function Login() {
  const { backend_url, setIsLoggedin, getUserData } = useContext(AppContent);
  const navigate = useNavigate();
  const [state, setState] = useState("Sign Up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async (e) => {
    try {
      e.preventDefault();
      setIsGoogleLoading(true);

      const provider = new GoogleAuthProvider();
      const auth = getAuth(app);
      const result = await signInWithPopup(auth, provider);
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
      console.error("Google auth error:", error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const onSumbitHandler = async (e) => {
    try {
      e.preventDefault();
      setIsLoading(true);
      axios.defaults.withCredentials = true;

      if (state === "Sign Up") {
        const { data } = await axios.post(backend_url + "/api/auth/register", {
          name,
          email,
          password,
        });
        if (data.sucess) {
          toast.success("User Registered Successfully!");
          setIsLoggedin(true);
          getUserData();
          navigate("/");
        } else {
          toast.error(data.message);
        }
      } else {
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
      console.error("Form submission error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Authentication failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen px-4 sm:px-6 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Main Card */}
      <div className="relative bg-purple-900/40 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-md border border-purple-700/30 transform transition-all duration-500 hover:scale-[1.02]">
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-800/30 to-transparent rounded-3xl"></div>
        <div className="relative z-10">
          {/* Header with icon */}
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-3 rounded-2xl shadow-lg transform transition-transform hover:rotate-12 cursor-pointer duration-300">
              <User className="w-7 h-7 text-white" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white text-center mb-1 tracking-tight">
            {state === "Sign Up" ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-center text-purple-300 text-sm mb-6">
            {state === "Sign Up"
              ? "Join us today and get started"
              : "Sign in to continue your journey"}
          </p>

          <form onSubmit={onSumbitHandler} className="space-y-4">
            {state === "Sign Up" && (
              <div className="group">
                <div className="relative flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-purple-800/30 backdrop-blur-sm border border-purple-600/30 transition-all duration-300 focus-within:bg-purple-800/50 focus-within:border-purple-500/50 focus-within:shadow-lg">
                  <User className="w-5 h-5 text-purple-300 group-focus-within:text-white transition-colors" />
                  <input
                    className="bg-transparent outline-none flex-1 text-white placeholder:text-purple-300"
                    type="text"
                    placeholder="Full Name"
                    required
                    onChange={(e) => setName(e.target.value)}
                    value={name}
                  />
                </div>
              </div>
            )}

            <div className="group">
              <div className="relative flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-purple-800/30 backdrop-blur-sm border border-purple-600/30 transition-all duration-300 focus-within:bg-purple-800/50 focus-within:border-purple-500/50 focus-within:shadow-lg">
                <Mail className="w-5 h-5 text-purple-300 group-focus-within:text-white transition-colors" />
                <input
                  className="bg-transparent outline-none flex-1 text-white placeholder:text-purple-300"
                  type="email"
                  placeholder="Email Address"
                  required
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                />
              </div>
            </div>

            <div className="group">
              <div className="relative flex items-center gap-3 w-full px-4 py-3 rounded-2xl bg-purple-800/30 backdrop-blur-sm border border-purple-600/30 transition-all duration-300 focus-within:bg-purple-800/50 focus-within:border-purple-500/50 focus-within:shadow-lg">
                <Lock className="w-5 h-5 text-purple-300 group-focus-within:text-white transition-colors" />
                <input
                  className="bg-transparent outline-none flex-1 text-white placeholder:text-purple-300"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  required
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-purple-300 hover:text-white cursor-pointer transition-colors "
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {state !== "Sign Up" && (
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  className="text-purple-300 hover:text-white cursor-pointer text-sm font-medium transition-colors hover:underline"
                  onClick={() => navigate("/resetPassword")}
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-800 text-white font-semibold shadow-lg hover:shadow-xl cursor-pointer transform transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                state
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-purple-700/50"></div>
              </div>
              <div className="relative px-4 bg-transparent">
                <span className="text-purple-400 text-sm font-medium">OR</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full py-3 rounded-2xl bg-white/90 backdrop-blur-sm border border-purple-200/50 text-purple-900 font-semibold shadow-lg hover:bg-white cursor-pointer transform transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            {state === "Sign Up" ? (
              <p className="text-purple-300 text-sm">
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-white font-semibold hover:underline cursor-pointer transition-all"
                  onClick={() => setState("Login")}
                >
                  Login here
                </button>
              </p>
            ) : (
              <p className="text-purple-300 text-sm">
                Don't have an account?{" "}
                <button
                  type="button"
                  className="text-white font-semibold hover:underline cursor-pointer transition-all"
                  onClick={() => setState("Sign Up")}
                >
                  Sign Up
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;