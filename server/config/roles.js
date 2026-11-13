// Roles and what they may do. One place to change if the rules change.
//
//   admin    - everything, including approving new accounts and changing roles
//   manager  - runs the institute: creates schedules/courses, records payments, sees every student,
//              but cannot approve accounts or change roles
//   teacher  - teaches: sees ONLY their own students (those enrolled in classes they teach); can create
//              extra / substitute classes, mark attendance, assign homework & questions, upload
//              notes/resources and record payments for their students; CANNOT create schedules
//   student  - learner
export const ROLES = ["admin", "manager", "teacher", "student"];
export const STAFF_ROLES = ["admin", "manager", "teacher"];
export const TEACHING_ROLES = ["admin", "teacher"]; // may be the instructor of a class
export const SIGNUP_ROLES = ["student", "teacher", "manager"]; // what a new user may ask for (admin gives the final role)

export const ROLE_LABEL = { admin: "Admin", manager: "Manager", teacher: "Teacher", student: "Student" };

// What a chat badge says. An admin is also a teacher, so students just see "Teacher".
export const CHAT_LABEL = { admin: "Teacher", teacher: "Teacher", manager: "Manager" };

export const isStaffRole = (role) => STAFF_ROLES.includes(role);
export const isTeachingRole = (role) => TEACHING_ROLES.includes(role);
export const isUnscopedRole = (role) => role === "admin" || role === "manager"; // sees every student

// Accounts created before approvals existed have no accountStatus: they are approved.
export const accountStatusOf = (user) => user?.accountStatus || "approved";
export const isApproved = (user) => accountStatusOf(user) === "approved";

export const dashboardPath = (role) => (role === "student" ? "/studentdash" : role === "teacher" ? "/teacher" : "/admin");
