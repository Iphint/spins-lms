const { Router } = require('express');
const { requireAuth } = require('../middlewares/auth.middleware');
const authRoutes = require('./auth.routes');
const teacherRoutes = require('./teacher.routes');
const academicYearRoutes = require('./academicYear.routes');
const semesterRoutes = require('./semester.routes');
const classRoutes = require('./class.routes');
const studentRoutes = require('./student.routes');
const meetingRoutes = require('./meeting.routes');
const worksheetRoutes = require('./worksheet.routes');
const submissionRoutes = require('./submission.routes');
const scoreRoutes = require('./score.routes');
const attendanceRoutes = require('./attendance.routes');
const activityRoutes = require('./activity.routes');
const calendarEventRoutes = require('./calendarEvent.routes');
const analyticsRoutes = require('./analytics.routes');
const journalRoutes = require('./journal.routes');
const materialRoutes = require('./material.routes');
const scheduleRoutes = require('./schedule.routes');
const cacheRoutes = require('./cache.routes');
const studentPortalRoutes = require('./studentPortal.routes');

const router = Router();

router.use('/auth', authRoutes);

router.use(requireAuth);

router.use('/teacher', teacherRoutes);
router.use('/academic-years', academicYearRoutes);
router.use('/semesters', semesterRoutes);
router.use('/classes', classRoutes);
router.use('/students', studentRoutes);
router.use('/meetings', meetingRoutes);
router.use('/worksheets', worksheetRoutes);
router.use('/submissions', submissionRoutes);
router.use('/scores', scoreRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/activities', activityRoutes);
router.use('/calendar-events', calendarEventRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/journals', journalRoutes);
router.use('/materials', materialRoutes);
router.use('/schedule-slots', scheduleRoutes);
router.use('/cache', cacheRoutes);
router.use('/student-portal', studentPortalRoutes);

module.exports = router;