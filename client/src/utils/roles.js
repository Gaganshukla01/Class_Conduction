// Roles on the client (the server enforces them - this only decides what to SHOW).
export const STAFF = ["admin", "manager", "teacher"];
export const isStaff = (role) => STAFF.includes(role);
export const ROLE_LABEL = { admin: "Admin", manager: "Manager", teacher: "Teacher", student: "Student" };
// An admin is also a teacher, so chat badges just say "Teacher".
export const CHAT_LABEL = { admin: "Teacher", teacher: "Teacher", manager: "Manager" };
export const dashboardPath = (role) => (role === "student" ? "/studentdash" : role === "teacher" ? "/teacher" : "/admin");

// accounts created before approvals existed have no status: they are approved
export const statusOf = (user) => user?.accountStatus || "approved";
export const isApproved = (user) => statusOf(user) === "approved";

// what each role may open in the staff dashboard
export const canManageSchedule = (role) => role === "admin" || role === "manager"; // create schedules / courses
export const canApproveAccounts = (role) => role === "admin";
