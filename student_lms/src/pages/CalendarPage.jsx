import { useState, useEffect, useMemo } from 'react';
import Calendar from 'react-calendar';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays, Clock, MapPin, User, CheckCircle2, AlertCircle,
  BookOpen, ClipboardList, Bell, Sparkles, ChevronRight, Filter,
  Calendar as CalendarIcon, ArrowRight, RefreshCw, Flame
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import api from '../utils/api';
import './CalendarPage.css';

const DAY_MAP_EN = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

const DAY_MAP_INDO = {
  0: 'Minggu',
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
};

function toLocalDateStr(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatEnglishDate(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'meeting' | 'worksheet' | 'event'

  const selectedDateStr = useMemo(() => toLocalDateStr(selectedDate), [selectedDate]);
  const todayStr = useMemo(() => toLocalDateStr(new Date()), []);

  // Fetch real data synchronized with database
  const loadCalendar = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get('/api/student-portal/calendar').catch(async () => {
        const sched = await api.get('/api/student-portal/schedule');
        return {
          classInfo: sched?.classInfo,
          scheduleSlots: sched?.slots || [],
          events: [],
          meetings: [],
          worksheets: [],
          calendarEvents: [],
        };
      });
      setCalendarData(data);
    } catch (err) {
      console.warn('Failed to load calendar data:', err.message);
      setError('Failed to synchronize calendar schedule from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar();
  }, []);

  const classInfo = calendarData?.classInfo;
  const teacherName = classInfo?.teacher?.name || 'Teacher';
  const schoolName = classInfo?.teacher?.school || '';
  const events = useMemo(() => calendarData?.events || [], [calendarData]);
  const scheduleSlots = useMemo(() => calendarData?.scheduleSlots || [], [calendarData]);

  // Map of events keyed by date for fast tile rendering
  const eventsByDate = useMemo(() => {
    const map = new Map();
    events.forEach((ev) => {
      if (!ev.date) return;
      const dStr = ev.date.split('T')[0];
      if (!map.has(dStr)) map.set(dStr, []);
      map.get(dStr).push(ev);
    });
    return map;
  }, [events]);

  // Compute all items for the currently selected date
  const selectedDayItems = useMemo(() => {
    const list = [];
    const dateEvents = eventsByDate.get(selectedDateStr) || [];

    // 1. Direct events from database (Meetings, Worksheets, School Events)
    dateEvents.forEach((ev) => {
      if (filterType === 'all' || ev.type === filterType) {
        list.push(ev);
      }
    });

    // 2. Weekly recurring class slots for this day of the week
    const dayNameEn = DAY_MAP_EN[selectedDate.getDay()];
    const dayNameIndo = DAY_MAP_INDO[selectedDate.getDay()];
    const matchingSlots = scheduleSlots.filter(
      (s) =>
        s.day?.toLowerCase() === dayNameEn?.toLowerCase() ||
        s.day?.toLowerCase() === dayNameIndo?.toLowerCase()
    );

    matchingSlots.forEach((slot) => {
      const hasSpecificMeeting = dateEvents.some((e) => e.type === 'meeting');
      if (filterType === 'all' || filterType === 'meeting') {
        list.push({
          id: `slot-${slot.id}-${selectedDateStr}`,
          type: 'schedule',
          category: 'Weekly Class Session',
          title: `Class Session: ${slot.subject || classInfo?.subject || 'Computer Science & AI'}`,
          time: slot.time || `${slot.startTime} - ${slot.endTime}`,
          room: slot.room || classInfo?.room || 'Computer Lab',
          teacher: slot.teacherName || teacherName,
          subject: slot.subject || classInfo?.subject,
          status: hasSpecificMeeting ? 'active' : 'scheduled',
          color: '#6366f1',
        });
      }
    });

    return list;
  }, [selectedDate, selectedDateStr, eventsByDate, scheduleSlots, classInfo, teacherName, filterType]);

  // Upcoming items across the entire calendar
  const upcomingItems = useMemo(() => {
    return events
      .filter((e) => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [events, todayStr]);

  // Render tile content dots in react-calendar
  const renderTileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const dStr = toLocalDateStr(date);
    const dayEvents = eventsByDate.get(dStr) || [];

    const dayNameEn = DAY_MAP_EN[date.getDay()];
    const dayNameIndo = DAY_MAP_INDO[date.getDay()];
    const hasWeeklySlot = scheduleSlots.some(
      (s) =>
        s.day?.toLowerCase() === dayNameEn?.toLowerCase() ||
        s.day?.toLowerCase() === dayNameIndo?.toLowerCase()
    );

    if (dayEvents.length === 0 && !hasWeeklySlot) return null;

    return (
      <div className="flex items-center justify-center gap-1 mt-1">
        {dayEvents.slice(0, 3).map((ev, idx) => (
          <span
            key={idx}
            className="w-1.5 h-1.5 rounded-full event-dot shrink-0"
            style={{ backgroundColor: ev.color || '#6366f1' }}
            title={ev.title}
          />
        ))}
        {dayEvents.length === 0 && hasWeeklySlot && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-indigo-500/70 event-dot shrink-0"
            title="Scheduled Class Session"
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <PageHeader
        title="Calendar"
        subtitle="Integrated class schedule, assignment deadlines & academic events"
        icon={CalendarDays}
      >
        <button
          onClick={loadCalendar}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition hover:opacity-80 disabled:opacity-50 cursor-pointer"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)' }}
          title="Resynchronize with database"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
          <span>Sync Database</span>
        </button>
      </PageHeader>

      {/* Class Banner Info */}
      {classInfo && (
        <div
          className="rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 font-bold shrink-0">
              <CalendarIcon className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>
                  {classInfo.name} — {classInfo.subject}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  Grade {classInfo.grade}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Instructor: <strong className="text-indigo-400 font-semibold">{teacherName}</strong>
                {schoolName && <span> • {schoolName}</span>}
                {classInfo.room && <span> • Room: <strong>{classInfo.room}</strong></span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition cursor-pointer"
            >
              Today
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: React Calendar (Left) & Selected Day Agenda (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: React Calendar */}
        <div
          className="lg:col-span-7 rounded-3xl p-5 sm:p-6 shadow-sm"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div>
              <h3 className="text-base font-black flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <CalendarDays className="w-4 h-4 text-indigo-500" /> Academic Calendar
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Click a date to view session and assignment details
              </p>
            </div>

            {/* Event Legend */}
            <div className="hidden sm:flex items-center gap-3 text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500" /> Class Session
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Due Date
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-500" /> Event
              </span>
            </div>
          </div>

          {/* Simple React Calendar Component */}
          <div className="overflow-x-auto py-1">
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              locale="en-US"
              className="lms-calendar"
              tileContent={renderTileContent}
            />
          </div>

          {/* Quick Stats Bar */}
          <div
            className="mt-6 pt-4 border-t grid grid-cols-3 gap-2 text-center"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <p className="text-xs font-bold text-indigo-500">{calendarData?.meetings?.length || 0}</p>
              <p className="text-[10px] text-slate-400 font-medium">Syllabus Sessions</p>
            </div>
            <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <p className="text-xs font-bold text-amber-500">{calendarData?.worksheets?.length || 0}</p>
              <p className="text-[10px] text-slate-400 font-medium">Worksheets</p>
            </div>
            <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
              <p className="text-xs font-bold text-cyan-500">{calendarData?.calendarEvents?.length || 0}</p>
              <p className="text-[10px] text-slate-400 font-medium">School Events</p>
            </div>
          </div>
        </div>

        {/* Right Column: Selected Day Details */}
        <div
          className="lg:col-span-5 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          {/* Header of Right Panel */}
          <div className="border-b pb-3.5" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Selected Agenda
              </span>
              {selectedDateStr === todayStr && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Today
                </span>
              )}
            </div>
            <h3 className="text-lg font-extrabold mt-1" style={{ color: 'var(--text-primary)' }}>
              {formatEnglishDate(selectedDate)}
            </h3>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 cursor-pointer ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/30'
              }`}
            >
              All ({selectedDayItems.length})
            </button>
            <button
              onClick={() => setFilterType('meeting')}
              className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 cursor-pointer ${
                filterType === 'meeting'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/30'
              }`}
            >
              Sessions
            </button>
            <button
              onClick={() => setFilterType('worksheet')}
              className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 cursor-pointer ${
                filterType === 'worksheet'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/30'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setFilterType('event')}
              className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 cursor-pointer ${
                filterType === 'event'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/30'
              }`}
            >
              Events
            </button>
          </div>

          {/* Items List for Selected Day */}
          <div className="space-y-3 min-h-[220px]">
            {loading ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Synchronizing schedule...</p>
              </div>
            ) : selectedDayItems.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2.5 rounded-2xl border border-dashed" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <CalendarDays className="w-10 h-10 mx-auto text-slate-400 opacity-40" />
                <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  No Events Scheduled
                </h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  There are no scheduled in-person sessions or assignment due dates on this date. Perfect time for self-paced review.
                </p>
                <button
                  onClick={() => navigate('/materials')}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-400 transition cursor-pointer"
                >
                  Open Study Modules <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              selectedDayItems.map((item, idx) => (
                <motion.div
                  key={item.id || idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl border transition hover:shadow-xs space-y-2.5"
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: item.color || '#6366f1' }}
                    >
                      {item.category || (item.type === 'meeting' ? 'Class Session' : item.type === 'worksheet' ? 'Task' : 'Event')}
                    </span>

                    {item.statusLabel ? (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'graded' || item.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : item.status === 'submitted'
                          ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {item.statusLabel}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Scheduled
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    {item.title}
                  </h4>

                  {item.topic && (
                    <p className="text-xs text-slate-400 line-clamp-2">
                      Topic: <span className="font-medium text-slate-300">{item.topic}</span>
                    </p>
                  )}

                  <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    {item.time && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{item.time}</span>
                      </span>
                    )}
                    {item.room && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span>{item.room}</span>
                      </span>
                    )}
                    {item.teacher && (
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{item.teacher}</span>
                      </span>
                    )}
                  </div>

                  {/* Action Link */}
                  {item.type === 'worksheet' ? (
                    <div className="pt-1">
                      <button
                        onClick={() => navigate('/worksheets')}
                        className="w-full py-1.5 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <ClipboardList className="w-3.5 h-3.5" />
                        <span>Open Worksheet</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                      </button>
                    </div>
                  ) : item.type === 'meeting' && (
                    <div className="pt-1">
                      <button
                        onClick={() => navigate('/materials')}
                        className="w-full py-1.5 px-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 border border-indigo-500/20 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>View Syllabus Module</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                      </button>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>

          {/* Upcoming Highlights Card */}
          {upcomingItems.length > 0 && (
            <div
              className="p-4 rounded-2xl border space-y-2.5"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" /> Upcoming Agenda
              </h4>
              <div className="space-y-1.5">
                {upcomingItems.map((up, uIdx) => (
                  <div
                    key={up.id || uIdx}
                    onClick={() => {
                      if (up.date) {
                        const parts = up.date.split('-');
                        if (parts.length === 3) {
                          setSelectedDate(new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
                        }
                      }
                    }}
                    className="p-2 rounded-xl flex items-center justify-between text-xs cursor-pointer hover:bg-slate-800/40 transition"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: up.color || '#6366f1' }}
                      />
                      <span className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {up.title}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 shrink-0">
                      {up.date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
