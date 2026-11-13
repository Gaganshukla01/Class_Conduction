import { useContext } from "react";
import Home from "./pages/Home";
import { Route, Routes, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import EmailVerify from "./pages/EmailVerify";
import AdminDashboard from "./pages/AdminPannel";
import StudentDashboard from "./pages/StudentSection";
import CodeEditor from "./pages/PlayGround";
import CourseDetails from "./components/CourseDetails";
import SeeHowItWorks from "./pages/SeeHowItWork";
import { AppContent } from "./context/Context";
import ContactUs from "./pages/ContactUs";
import ContactInquiriesAdmin from "./components/ContactResultForm";
import ProjectShowcase from "./pages/StudentProject";
import FunZone from "./pages/FunZone";
import PendingApproval from "./pages/PendingApproval";
import { dashboardPath, isApproved } from "./utils/roles";

const ALL_ROLES = ["admin", "manager", "teacher", "student"];

// where a signed-in person belongs: their dashboard, or the "in review" page until an admin approves them
const homeFor = (userData) => (!userData ? "/" : isApproved(userData) ? dashboardPath(userData.userType) : "/pending");

const Splash = () => (
  <div className="min-h-[60vh] flex items-center justify-center text-gray-300" role="status">
    <div className="flex items-center gap-3"><span className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /> Loading...</div>
  </div>
);

const ProtectedRoute = ({ children, allowedUserTypes, userData, isLoggedIn, isDataLoading }) => {
  if (isDataLoading) return <Splash />; // do not bounce to /login while we are still checking the session
  if (!isLoggedIn || !userData) return <Navigate to="/login" replace />;
  if (!isApproved(userData)) return <Navigate to="/pending" replace />;
  if (allowedUserTypes && !allowedUserTypes.includes(userData.userType)) return <Navigate to={homeFor(userData)} replace />;
  return children;
};

const PublicRoute = ({ children, isLoggedIn, userData }) => {
  if (isLoggedIn && userData) return <Navigate to={homeFor(userData)} replace />;
  return children;
};

function App() {
  const { isLoggedIn, userData, isDataLoading } = useContext(AppContent);
  const guard = (allowed, element) => (
    <ProtectedRoute allowedUserTypes={allowed} userData={userData} isLoggedIn={isLoggedIn} isDataLoading={isDataLoading}>
      {element}
    </ProtectedRoute>
  );

  return (
    <div id="main-flow">
      <Routes>
        {/* Public routes - accessible to everyone */}
        <Route path="/" element={<Home />} />
        <Route path="/seehowitworks" element={<SeeHowItWorks />} />
        <Route path="/projectview" element={<ProjectShowcase />} />
        <Route path="/funzone" element={<FunZone />} />

        <Route path="/login" element={<PublicRoute isLoggedIn={isLoggedIn} userData={userData}><Login /></PublicRoute>} />
        <Route path="/resetPassword" element={<PublicRoute isLoggedIn={isLoggedIn} userData={userData}><ResetPassword /></PublicRoute>} />
        <Route path="/emailVerify" element={<EmailVerify />} />
        <Route path="/pending" element={<PendingApproval />} />

        {/* Staff dashboards: admin + manager share /admin, teachers have /teacher (same panel, fewer tabs) */}
        <Route path="/admin" element={guard(["admin", "manager"], <AdminDashboard />)} />
        <Route path="/teacher" element={guard(["teacher"], <AdminDashboard />)} />
        <Route path="/admin/commoneditor" element={<Navigate to="/admin?tab=chat" replace />} />

        {/* Student-only routes */}
        <Route path="/studentdash" element={guard(["student"], <StudentDashboard />)} />
        <Route path="/studentchatview" element={<Navigate to="/studentdash?tab=chat" replace />} />

        <Route path="/playground" element={guard(ALL_ROLES, <CodeEditor />)} />
        <Route path="/contactus" element={guard(ALL_ROLES, <ContactUs />)} />
        <Route path="/coursedetails" element={guard(ALL_ROLES, <CourseDetails />)} />
        <Route path="/contactdetails" element={guard(["admin", "manager"], <ContactInquiriesAdmin />)} />

        {/* Catch-all route - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
