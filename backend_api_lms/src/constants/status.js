/**
 * Common entity status enums
 */
const STATUS = {
  USER: {
    ACTIVE: "active",
    INACTIVE: "inactive",
  },
  SEMESTER: {
    ACTIVE: "active",
    UPCOMING: "upcoming",
    COMPLETED: "completed",
  },
  MEETING: {
    PLANNED: "planned",
    UPCOMING: "upcoming",
    ONGOING: "ongoing",
    COMPLETED: "completed",
  },
  WORKSHEET: {
    UPCOMING: "upcoming",
    ACTIVE: "active",
    COMPLETED: "completed",
  },
  SUBMISSION: {
    PENDING: "pending",
    SUBMITTED: "submitted",
    COMPLETED: "completed",
    LATE: "late",
  },
  ATTENDANCE: {
    PRESENT: "present",
    ABSENT: "absent",
    LATE: "late",
    PERMISSION: "permission",
  },
};

module.exports = STATUS;
