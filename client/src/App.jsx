import { use, useContext, useEffect, useState } from "react";
import Home from "./pages/Home";
import { Route, Routes, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import "./App.css";
import ResetPassword from "./pages/ResetPassword";
import EmailVerify from "./pages/EmailVerify";
import AdminDashboard from "./pages/AdminPannel";
import StudentDashboard from "./pages/StudentSection";
import CodeEditor from "./pages/PlayGround";
import { ToastContainer } from "react-toastify";
import CourseDetails from "./components/CourseDetails";
import SeeHowItWorks from "./pages/SeeHowItWork";
import { AppContent } from "./context/Context";


const ProtectedRoute = ({
  children,
  allowedUserTypes,
  userType,
  isLoggedIn,
}) => {
  // If user is logged in but userType is undefined, redirect to login
  if (!isLoggedIn || userType === undefined) {
    return <Navigate to="/login" replace />;
  }

  if (allowedUserTypes && !allowedUserTypes.includes(userType)) {
    if (userType === "admin") {
      return <Navigate to="/admin" replace />;
    } else if (userType === "student") {
      return <Navigate to="/studentdash" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

const PublicRoute = ({ children, isLoggedIn, userType }) => {
  if (isLoggedIn && userType) {
    if (userType === "admin") {
      return <Navigate to="/admin" replace />;
    } else if (userType === "student") {
      return <Navigate to="/studentdash" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const { isLoggedIn, userData } = useContext(AppContent);
  const [userType, setUserType] = useState(undefined);

  useEffect(() => {
    if (userData && userData.userType) {
      setUserType(userData.userType);
    } else {
      setUserType(undefined);
    }
  }, [userData, isLoggedIn]);

  return (
    <>
      <ToastContainer />

      <div id="main-flow">
        <Routes>
          {/* Public routes - accessible to everyone */}
          <Route path="/" element={<Home />} />
          <Route path="/seehowitworks" element={<SeeHowItWorks />} />

          <Route
            path="/login"
            element={
              <PublicRoute isLoggedIn={isLoggedIn} userType={userType}>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/resetPassword"
            element={
              <PublicRoute isLoggedIn={isLoggedIn} userType={userType}>
                <ResetPassword />
              </PublicRoute>
          }

          <Route path="/emailVerify" element={<EmailVerify />} />
         
          {/* Admin-only routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute
                allowedUserTypes={["admin"]}
                userType={userType}
                isLoggedIn={isLoggedIn}
              >
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Student-only routes */}
          <Route
            path="/studentdash"
            element={
              <ProtectedRoute
                allowedUserTypes={["student"]}
                userType={userType}
                isLoggedIn={isLoggedIn}
              >
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/playground"
            element={
              <ProtectedRoute
                allowedUserTypes={["admin", "student"]}
                userType={userType}
                isLoggedIn={isLoggedIn}
              >
                <CodeEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coursedetails"
            element={
              <ProtectedRoute
                allowedUserTypes={["admin", "student"]}
                userType={userType}
                isLoggedIn={isLoggedIn}
              >
                <CourseDetails />
              </ProtectedRoute>
            }
          />

          {/* Catch-all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
