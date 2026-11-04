const BASE_URL = "/api";

function getToken() {
  try {
    return localStorage.getItem("lms_token");
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  try {
    if (token) localStorage.setItem("lms_token", token);
    else localStorage.removeItem("lms_token");
  } catch {}
}

function toQuery(params, defaultKey = null) {
  if (!params) return "";
  if (typeof params === "string") {
    return `?${defaultKey || "classId"}=${encodeURIComponent(params)}`;
  }
  const q = new URLSearchParams(params).toString();
  return q ? `?${q}` : "";
}

async function request(endpoint, options = {}) {
  const { method = "GET", body } = options;
  const headers = {};
  if (typeof FormData === "undefined" || !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const config = { method, headers };
  if (body) config.body = (typeof FormData !== "undefined" && body instanceof FormData) ? body : JSON.stringify(body);
  let res;
  try {
    res = await fetch(`${BASE_URL}${endpoint}`, config);
  } catch (err) {
    throw new Error(`Network error: unable to reach server. Is the backend running? (${err.message})`);
  }
  if (res.status === 401) {
    setAuthToken(null);
  }
  let text;
  try {
    text = await res.text();
  } catch {
    throw new Error(`Failed to read server response (${res.status})`);
  }
  if (!text) {
    throw new Error(`Empty response from server (${res.status})`);
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from server (${res.status}): ${text.slice(0, 100)}`);
  }
  if (!res.ok) throw new Error(data.message || `API Error: ${res.status}`);
  return data.data !== undefined ? data.data : data;
}

export const api = {
  // Auth
  login: (credentials) => request("/auth/login", { method: "POST", body: credentials }),
  me: () => request("/auth/me"),
  users: () => request("/auth/users"),
  createUser: (data) => request("/auth/users", { method: "POST", body: data }),
  updateUser: (id, data) => request(`/auth/users/${id}`, { method: "PUT", body: data }),
  deleteUser: (id) => request(`/auth/users/${id}`, { method: "DELETE" }),

  // Teacher Profile & All Teachers
  teacher: () => request("/teacher"),
  teachers: () => request("/teacher/all"),
  updateTeacher: (data) => request("/teacher", { method: "PUT", body: data }),

  // Academic Years
  academicYears: () => request("/academic-years"),
  academicYearActive: () => request("/academic-years/active"),
  academicYear: (id) => request(`/academic-years/${id}`),

  // Semesters
  semesters: (academicYearId) => request(`/semesters${toQuery(academicYearId, "academicYearId")}`),
  semesterActive: () => request("/semesters/active"),
  semester: (id) => request(`/semesters/${id}`),
  createSemester: (data) => request("/semesters", { method: "POST", body: data }),
  updateSemester: (id, data) => request(`/semesters/${id}`, { method: "PUT", body: data }),
  deleteSemester: (id) => request(`/semesters/${id}`, { method: "DELETE" }),
  activateSemester: (id) => request(`/semesters/${id}/activate`, { method: "PUT" }),

  // Classes
  classes: (semesterId) => request(`/classes${toQuery(semesterId, "semesterId")}`),
  class: (id) => request(`/classes/${id}`),
  createClass: (data) => request("/classes", { method: "POST", body: data }),
  updateClass: (id, data) => request(`/classes/${id}`, { method: "PUT", body: data }),
  deleteClass: (id) => request(`/classes/${id}`, { method: "DELETE" }),
  resetClassRoster: (id, data = {}) => request(`/classes/${id}/reset-roster`, { method: "POST", body: data }),

  // Students
  students: (classId) => request(`/students${toQuery(classId, "classId")}`),
  student: (id) => request(`/students/${id}`),
  createStudent: (data) => request("/students", { method: "POST", body: data }),
  updateStudent: (id, data) => request(`/students/${id}`, { method: "PUT", body: data }),
  deleteStudent: (id) => request(`/students/${id}`, { method: "DELETE" }),
  bulkStudents: (data) => request("/students/bulk", { method: "POST", body: data }),
  promoteStudents: (data) => request("/students/promote", { method: "POST", body: data }),
  importStudentsToClass: (data) => request("/students/import-to-class", { method: "POST", body: data }),
  promotionCandidates: (classId) => request(`/students/promotion-candidates/${classId}`),
  studentHistory: (id) => request(`/students/${id}/history`),

  // Meetings
  meetings: (params) => request(`/meetings${toQuery(params, "classId")}`),
  meeting: (id) => request(`/meetings/${id}`),
  createMeeting: (data) => request("/meetings", { method: "POST", body: data }),

  // Worksheets
  worksheets: (params) => request(`/worksheets${toQuery(params, "classId")}`),
  worksheet: (id) => request(`/worksheets/${id}`),
  createWorksheet: (data) => request("/worksheets", { method: "POST", body: data }),
  updateWorksheet: (id, data) => request(`/worksheets/${id}`, { method: "PUT", body: data }),
  deleteWorksheet: (id) => request(`/worksheets/${id}`, { method: "DELETE" }),
  uploadWorksheetFile: (formData) => request("/worksheets/upload", { method: "POST", body: formData }),

  // Submissions & Scores
  submissions: (params) => request(`/submissions${toQuery(params, "worksheetId")}`),
  submission: (id) => request(`/submissions/${id}`),
  createSubmission: (data) => request("/submissions", { method: "POST", body: data }),
  updateSubmission: (id, data) => request(`/submissions/${id}`, { method: "PUT", body: data }),
  scores: (params) => request(`/scores${toQuery(params, "studentId")}`),
  createScore: (data) => request("/scores", { method: "POST", body: data }),
  updateScore: (id, data) => request(`/scores/${id}`, { method: "PUT", body: data }),
  deleteScore: (id) => request(`/scores/${id}`, { method: "DELETE" }),
  bulkScores: (data) => request("/scores/bulk", { method: "POST", body: data }),

  // Attendance
  attendance: (params) => request(`/attendance${toQuery(params, "classId")}`),
  attendanceSummary: (meetingId) => request(`/attendance/summary/${meetingId}`),
  attendanceMatrix: (classId) => request(`/attendance/matrix/${classId}`),
  markAllPresent: (data) => request("/attendance/mark-all-present", { method: "POST", body: data }),
  generateAttendancePin: (meetingId) => request(`/attendance/pin/${meetingId}`, { method: "POST" }),
  createAttendance: (data) => request("/attendance", { method: "POST", body: data }),
  updateAttendance: (id, data) => request(`/attendance/${id}`, { method: "PUT", body: data }),
  deleteAttendance: (id) => request(`/attendance/${id}`, { method: "DELETE" }),
  bulkAttendance: (data) => request("/attendance/bulk", { method: "POST", body: data }),
  resetAttendance: (classId) => request(`/attendance/reset/${classId}`, { method: "POST" }),

  // Activities & Calendar
  activities: (params) => request(`/activities${toQuery(params, "teacherId")}`),
  activitiesRecent: () => request("/activities/recent"),
  activityStats: () => request("/activities/stats"),
  calendarEvents: (params) => request(`/calendar-events${toQuery(params)}`),

  // Analytics
  analytics: {
    attendanceTrend: () => request("/analytics/attendance-trend"),
    worksheetTrend: () => request("/analytics/worksheet-trend"),
    averageScoreTrend: () => request("/analytics/average-score-trend"),
    classComparison: () => request("/analytics/class-comparison"),
    semesterProgress: () => request("/analytics/semester-progress"),
    learningTargets: () => request("/analytics/learning-targets"),
  },

  // Journals
  journals: (classId) => request(`/journals${toQuery(classId, "classId")}`),
  journal: (id) => request(`/journals/${id}`),

  // Learning Materials
  materials: (classId) => request(`/materials${toQuery(classId, "classId")}`),
  material: (id) => request(`/materials/${id}`),
  createMaterial: (data) => request("/materials", { method: "POST", body: data }),
  updateMaterial: (id, data) => request(`/materials/${id}`, { method: "PUT", body: data }),
  deleteMaterial: (id) => request(`/materials/${id}`, { method: "DELETE" }),
  bulkMaterials: (data) => request("/materials/bulk", { method: "POST", body: data }),
  deployMaterial: (data) => request("/materials/deploy", { method: "POST", body: data }),
  cloneCurriculum: (data) => request("/materials/clone-curriculum", { method: "POST", body: data }),
  applyTemplateCurriculum: (data) => request("/materials/template-curriculum", { method: "POST", body: data }),
  curriculumTemplates: () => request("/materials/curriculum-templates"),
  uploadMaterialFile: (formData) => request("/materials/upload", { method: "POST", body: formData }),

  // Schedule Slots
  scheduleSlots: (classId) => request(`/schedule-slots${toQuery(classId, "classId")}`),
  scheduleSlot: (id) => request(`/schedule-slots/${id}`),
  createScheduleSlot: (data) => request("/schedule-slots", { method: "POST", body: data }),
  updateScheduleSlot: (id, data) => request(`/schedule-slots/${id}`, { method: "PUT", body: data }),
  deleteScheduleSlot: (id) => request(`/schedule-slots/${id}`, { method: "DELETE" }),
  setWeeklySchedule: (data) => request("/schedule-slots/weekly", { method: "POST", body: data }),
  bulkScheduleSlots: (data) => request("/schedule-slots/bulk", { method: "POST", body: data }),
  distributeMaterials: (classId) => request("/schedule-slots/distribute", { method: "POST", body: { classId } }),
};
