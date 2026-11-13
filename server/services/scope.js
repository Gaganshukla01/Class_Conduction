import classSchedule from "../model/classesScheduleDetails.js";
import ExtraClass from "../model/extraClassModel.js";
import { isUnscopedRole } from "../config/roles.js";

// Which students may this staff member see / act on?
//   admin, manager -> everyone (returns null = "no restriction")
//   teacher        -> only students enrolled in classes they teach, or in extra/substitute classes
//                     they teach or created
export async function studentScope(user) {
  if (isUnscopedRole(user?.userType)) return null;
  const me = String(user?._id ?? user?.id);
  const [classes, extras] = await Promise.all([
    classSchedule.find({ instructorId: me }).select("studentsEnrolled").lean(),
    ExtraClass.find({ $or: [{ instructorId: me }, { createdBy: me }] }).select("studentsEnrolled").lean(),
  ]);
  const ids = new Set();
  [...classes, ...extras].forEach((c) => (c.studentsEnrolled || []).forEach((s) => ids.add(String(s))));
  return [...ids];
}

// true when `studentId` is inside the scope (null scope = everyone)
export const inScope = (scope, studentId) => scope === null || scope.includes(String(studentId));

// Mongo filter that limits scheduled classes to the ones this user may see
export const classFilterFor = (user) => (isUnscopedRole(user?.userType) ? {} : { instructorId: String(user?._id ?? user?.id) });

export const teachesClass = (user, cls) => isUnscopedRole(user?.userType) || String(cls?.instructorId) === String(user?._id ?? user?.id);
