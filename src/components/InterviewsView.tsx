import { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  User,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Building2,
  Briefcase,
  Phone,
  Users,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarRange,
  LayoutGrid,
  Sparkles,
  ArrowRight,
  Info,
  Bell,
} from 'lucide-react';
import { Interview, JobApplication, InterviewStatus, InterviewType } from '../types.ts';
import { WeeklyTimelineView } from './WeeklyTimelineView.tsx';
import { InterviewHoverTooltip } from './InterviewHoverTooltip.tsx';
import { ReminderNotification } from '../services/reminderService.ts';
import { ReminderAlertBanner } from './ReminderAlertBanner.tsx';

interface InterviewsViewProps {
  interviews: Interview[];
  applications: JobApplication[];
  loading: boolean;
  onOpenScheduleModal: (appId?: number, date?: string) => void;
  onEditInterview: (interview: Interview) => void;
  onDeleteInterview: (id: number) => void;
  onStatusChange: (id: number, status: InterviewStatus) => void;
  initialSelectedDate?: string;
  reminders?: ReminderNotification[];
  onDismissReminder?: (id: string) => void;
}

export function InterviewsView({
  interviews,
  applications,
  loading,
  onOpenScheduleModal,
  onEditInterview,
  onDeleteInterview,
  onStatusChange,
  initialSelectedDate,
  reminders = [],
  onDismissReminder = () => {},
}: InterviewsViewProps) {
  const [viewMode, setViewMode] = useState<'timeline' | 'cards' | 'calendar'>('timeline');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Today reference in local YYYY-MM-DD
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`;
  }, [today]);

  // Calendar month state: initialize to current year & month
  const [currentYear, setCurrentYear] = useState<number>(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => today.getMonth()); // 0-indexed (0 = Jan)

  // Selected date for day agenda view (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(() => initialSelectedDate || todayStr);

  useEffect(() => {
    if (initialSelectedDate) {
      setSelectedDate(initialSelectedDate);
      const [y, m] = initialSelectedDate.split('-').map(Number);
      if (y && m) {
        setCurrentYear(y);
        setCurrentMonth(m - 1);
      }
    }
  }, [initialSelectedDate]);

  // Filter interviews
  const filteredInterviews = useMemo(() => {
    return interviews.filter((iv) => {
      const matchType = filterType === 'All' || iv.interviewType === filterType;
      const matchStatus = filterStatus === 'All' || iv.status === filterStatus;
      return matchType && matchStatus;
    });
  }, [interviews, filterType, filterStatus]);

  // Upcoming interviews (Scheduled & date >= today)
  const upcomingInterviews = useMemo(() => {
    return filteredInterviews
      .filter((iv) => iv.status === 'Scheduled' && iv.interviewDate >= todayStr)
      .sort((a, b) => `${a.interviewDate} ${a.interviewTime}`.localeCompare(`${b.interviewDate} ${b.interviewTime}`));
  }, [filteredInterviews, todayStr]);

  // Past / Completed interviews
  const pastOrDoneInterviews = useMemo(() => {
    return filteredInterviews
      .filter((iv) => iv.status !== 'Scheduled' || iv.interviewDate < todayStr)
      .sort((a, b) => `${b.interviewDate} ${b.interviewTime}`.localeCompare(`${a.interviewDate} ${a.interviewTime}`));
  }, [filteredInterviews, todayStr]);

  // Map of interviews by date string (YYYY-MM-DD)
  const interviewsByDate = useMemo(() => {
    const map = new Map<string, Interview[]>();
    filteredInterviews.forEach((iv) => {
      const list = map.get(iv.interviewDate) || [];
      list.push(iv);
      map.set(iv.interviewDate, list);
    });
    // Sort each day's interviews by time
    map.forEach((list) => {
      list.sort((a, b) => a.interviewTime.localeCompare(b.interviewTime));
    });
    return map;
  }, [filteredInterviews]);

  // Interviews for the currently selected date
  const selectedDayInterviews = useMemo(() => {
    return interviewsByDate.get(selectedDate) || [];
  }, [interviewsByDate, selectedDate]);

  // Interviews scheduled in the active calendar month
  const currentMonthInterviewsCount = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    return filteredInterviews.filter((iv) => iv.interviewDate.startsWith(monthPrefix)).length;
  }, [filteredInterviews, currentYear, currentMonth]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(todayStr);
  };

  // Calendar Grid generation
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const cells: Array<{
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      interviews: Interview[];
    }> = [];

    // Preceding month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        interviews: interviewsByDate.get(dateStr) || [],
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        interviews: interviewsByDate.get(dateStr) || [],
      });
    }

    // Next month leading days to complete grid (multiples of 7: 35 or 42)
    const remainder = cells.length % 7;
    if (remainder !== 0) {
      const nextDaysCount = 7 - remainder;
      const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      for (let d = 1; d <= nextDaysCount; d++) {
        const dateStr = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({
          dayNumber: d,
          dateStr,
          isCurrentMonth: false,
          isToday: dateStr === todayStr,
          isSelected: dateStr === selectedDate,
          interviews: interviewsByDate.get(dateStr) || [],
        });
      }
    }

    return cells;
  }, [currentYear, currentMonth, todayStr, selectedDate, interviewsByDate]);

  // Helper formatting functions
  const monthName = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }, [currentYear, currentMonth]);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const [hStr, mStr] = timeStr.split(':');
    const h = parseInt(hStr, 10);
    if (isNaN(h)) return timeStr;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${mStr || '00'} ${ampm}`;
  };

  const getRelativeCountdown = (dateStr: string) => {
    const [tY, tM, tD] = dateStr.split('-').map(Number);
    const target = new Date(tY, tM - 1, tD);
    const current = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffTime = target.getTime() - current.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1) return `In ${diffDays} days`;
    if (diffDays === -1) return 'Yesterday';
    return `${Math.abs(diffDays)} days ago`;
  };

  const getStatusBadge = (status: InterviewStatus) => {
    switch (status) {
      case 'Scheduled':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Passed':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800';
    }
  };

  const getRoundBadge = (round: string) => {
    switch (round) {
      case 'Technical':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'Managerial':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Final':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
  };

  const getTypeIcon = (type: InterviewType) => {
    switch (type) {
      case 'Online':
        return <Video className="w-3 h-3 text-blue-500" />;
      case 'Phone':
        return <Phone className="w-3 h-3 text-emerald-500" />;
      case 'In-person':
        return <Users className="w-3 h-3 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <span>Interview Schedules & Timeline</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold">
              {upcomingInterviews.length} upcoming
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Interactive calendar and schedule logs to plan your interview preparation and track recruitment rounds.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* View Mode Toggle: Timeline, List, Calendar */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              id="btn-view-timeline"
              onClick={() => setViewMode('timeline')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Weekly Timeline</span>
            </button>
            <button
              id="btn-view-cards"
              onClick={() => setViewMode('cards')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              id="btn-view-calendar"
              onClick={() => setViewMode('calendar')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>

          <button
            id="btn-schedule-interview-view"
            onClick={() => onOpenScheduleModal(undefined, selectedDate)}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Interview</span>
          </button>
        </div>
      </div>

      {/* 1-Day & Urgent Interview Reminder Banner */}
      {reminders && reminders.length > 0 && (
        <ReminderAlertBanner
          reminders={reminders}
          onDismiss={onDismissReminder}
          onNavigateToInterviews={(targetDate) => {
            if (targetDate) {
              setSelectedDate(targetDate);
              const [y, m] = targetDate.split('-').map(Number);
              if (y && m) {
                setCurrentYear(y);
                setCurrentMonth(m - 1);
              }
            }
          }}
        />
      )}

      {/* Filter Row */}
      <div className="flex flex-wrap gap-2.5 items-center justify-between bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex flex-wrap gap-2.5 items-center">
          <span className="text-slate-500 font-medium">Filter by:</span>

          <select
            id="select-filter-type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white outline-none"
          >
            <option value="All">All Types</option>
            <option value="Online">Online</option>
            <option value="Phone">Phone</option>
            <option value="In-person">In-person</option>
          </select>

          <select
            id="select-filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Passed">Passed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {(filterType !== 'All' || filterStatus !== 'All') && (
            <button
              id="btn-reset-filters"
              onClick={() => {
                setFilterType('All');
                setFilterStatus('All');
              }}
              className="text-rose-500 hover:underline px-2"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Legend */}
        <div className="hidden md:flex items-center space-x-3 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Online</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Phone</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>In-Person</span>
          </span>
        </div>
      </div>

      {/* Chronological Mini Timeline: Immediate Upcoming Interviews (shown in Calendar and Cards view) */}
      {viewMode !== 'timeline' && upcomingInterviews.length > 0 && (
        <div className="bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-transparent dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-transparent p-4 rounded-2xl border border-blue-200/60 dark:border-blue-900/40">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Timeline: Nearest Upcoming Rounds</span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Click any round to view on calendar
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {upcomingInterviews.slice(0, 4).map((iv) => {
              const countdown = getRelativeCountdown(iv.interviewDate);
              const isSelected = iv.interviewDate === selectedDate;
              return (
                <InterviewHoverTooltip
                  key={iv.id}
                  interview={iv}
                  formatTime={formatTime}
                  formatDisplayDate={formatDisplayDate}
                  getTypeIcon={getTypeIcon}
                >
                  <button
                    id={`timeline-card-${iv.id}`}
                    onClick={() => {
                      const [y, m] = iv.interviewDate.split('-').map(Number);
                      setCurrentYear(y);
                      setCurrentMonth(m - 1);
                      setSelectedDate(iv.interviewDate);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20 scale-[1.01]'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {countdown}
                      </span>
                      <span className="text-[11px] opacity-80 flex items-center space-x-1">
                        {getTypeIcon(iv.interviewType)}
                        <span>{formatTime(iv.interviewTime)}</span>
                      </span>
                    </div>

                    <h4 className="font-bold text-xs truncate">{iv.companyName}</h4>
                    <p
                      className={`text-[11px] truncate mt-0.5 ${
                        isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {iv.jobRole} • {iv.round} Round
                    </p>
                  </button>
                </InterviewHoverTooltip>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Area: Weekly Timeline View vs Calendar View vs Cards View */}
      {viewMode === 'timeline' ? (
        <WeeklyTimelineView
          interviews={filteredInterviews}
          todayStr={todayStr}
          onOpenScheduleModal={onOpenScheduleModal}
          onEditInterview={onEditInterview}
          onDeleteInterview={onDeleteInterview}
          onStatusChange={onStatusChange}
          formatDisplayDate={formatDisplayDate}
          formatTime={formatTime}
          getStatusBadge={getStatusBadge}
          getRoundBadge={getRoundBadge}
          getTypeIcon={getTypeIcon}
        />
      ) : viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calendar Grid (8 cols on lg) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
            {/* Calendar Controls Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    {monthName}
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {currentMonthInterviewsCount}{' '}
                    {currentMonthInterviewsCount === 1 ? 'interview' : 'interviews'} scheduled this month
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  id="btn-calendar-today"
                  onClick={handleToday}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  Today
                </button>
                <button
                  id="btn-calendar-prev"
                  onClick={handlePrevMonth}
                  aria-label="Previous Month"
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  id="btn-calendar-next"
                  onClick={handleNextMonth}
                  aria-label="Next Month"
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-center py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar Days 7-Column Grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/80 bg-slate-100/50 dark:bg-slate-900">
              {calendarCells.map((cell) => {
                const hasInterviews = cell.interviews.length > 0;
                return (
                  <div
                    key={cell.dateStr}
                    id={`cal-cell-${cell.dateStr}`}
                    onClick={() => setSelectedDate(cell.dateStr)}
                    className={`min-h-[92px] sm:min-h-[105px] p-1.5 sm:p-2 cursor-pointer transition-all flex flex-col justify-between group relative ${
                      cell.isCurrentMonth
                        ? 'bg-white dark:bg-slate-900 hover:bg-blue-50/40 dark:hover:bg-blue-950/20'
                        : 'bg-slate-50/50 dark:bg-slate-950/50 text-slate-400 dark:text-slate-600'
                    } ${
                      cell.isSelected
                        ? 'ring-2 ring-blue-500 dark:ring-blue-400 z-10 bg-blue-50/30 dark:bg-blue-950/30'
                        : ''
                    }`}
                  >
                    {/* Day Number Header */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
                          cell.isToday
                            ? 'bg-blue-600 text-white shadow-sm'
                            : cell.isSelected
                            ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                            : cell.isCurrentMonth
                            ? 'text-slate-700 dark:text-slate-300'
                            : 'text-slate-400 dark:text-slate-600'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {/* Quick schedule trigger on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenScheduleModal(undefined, cell.dateStr);
                        }}
                        title={`Schedule interview on ${cell.dateStr}`}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-0.5 rounded transition-opacity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Interview Event Pills inside Day Cell */}
                    <div className="space-y-1 flex-1 overflow-hidden">
                      {cell.interviews.slice(0, 2).map((iv) => {
                        const isScheduled = iv.status === 'Scheduled';
                        const isTomorrow = isScheduled && getRelativeCountdown(cell.dateStr) === 'Tomorrow';
                        return (
                          <InterviewHoverTooltip
                            key={iv.id}
                            interview={iv}
                            formatTime={formatTime}
                            formatDisplayDate={formatDisplayDate}
                            getTypeIcon={getTypeIcon}
                          >
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDate(cell.dateStr);
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] truncate font-semibold border flex items-center space-x-1 shadow-2xs transition-transform hover:scale-[1.02] cursor-pointer ${
                                isTomorrow
                                  ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700 ring-1 ring-amber-400/50'
                                  : isScheduled
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {isTomorrow && <Bell className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 flex-shrink-0 animate-pulse" />}
                              <span className="flex-shrink-0">{getTypeIcon(iv.interviewType)}</span>
                              <span className="truncate font-medium">{formatTime(iv.interviewTime)}</span>
                              <span className="truncate font-bold">{iv.companyName}</span>
                            </div>
                          </InterviewHoverTooltip>
                        );
                      })}

                      {cell.interviews.length > 2 && (
                        <div className="text-[9px] text-blue-600 dark:text-blue-400 font-bold px-1">
                          +{cell.interviews.length - 2} more
                        </div>
                      )}
                    </div>

                    {/* Subtle dot indicator when interviews exist */}
                    {hasInterviews && (
                      <div className="flex justify-center space-x-0.5 pt-1">
                        {cell.interviews.map((iv) => (
                          <span
                            key={iv.id}
                            className={`w-1 h-1 rounded-full ${
                              iv.status === 'Scheduled' ? 'bg-amber-500' : 'bg-blue-400'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day Agenda Panel (4 cols on lg) */}
          <div className="lg:col-span-4 flex flex-col space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between h-full">
              <div className="space-y-4">
                {/* Agenda Header */}
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Day Schedule
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {formatDisplayDate(selectedDate)}
                    </h3>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                      selectedDate === todayStr
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {getRelativeCountdown(selectedDate)}
                  </span>
                </div>

                {/* List of interviews on selected date */}
                {selectedDayInterviews.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDayInterviews.map((iv) => (
                      <div
                        key={iv.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3 relative group"
                      >
                        {/* Company & Status row */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-1.5 mb-1">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getRoundBadge(
                                  iv.round
                                )}`}
                              >
                                {iv.round} Round
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium flex items-center space-x-1">
                                {getTypeIcon(iv.interviewType)}
                                <span>{iv.interviewType}</span>
                              </span>
                            </div>
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {iv.companyName}
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                              {iv.jobRole}
                            </p>
                          </div>

                          <select
                            id={`status-select-${iv.id}`}
                            value={iv.status}
                            onChange={(e) => onStatusChange(iv.id, e.target.value as InterviewStatus)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-md border outline-none cursor-pointer ${getStatusBadge(
                              iv.status
                            )}`}
                          >
                            <option value="Scheduled">Scheduled</option>
                            <option value="Completed">Completed</option>
                            <option value="Passed">Passed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>

                        {/* Time & Interviewer */}
                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5">
                          <div className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200">
                            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>{formatTime(iv.interviewTime)}</span>
                          </div>

                          {iv.interviewer && (
                            <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 text-[11px]">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span>Interviewer: {iv.interviewer}</span>
                            </div>
                          )}
                        </div>

                        {/* Prep Notes */}
                        {iv.notes && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                            <span className="font-semibold block text-[9px] uppercase tracking-wider text-slate-400 mb-0.5">
                              Preparation Notes
                            </span>
                            <p className="italic">{iv.notes}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                          {iv.meetingLink ? (
                            <a
                              href={iv.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-2.5 py-1.5 rounded-lg shadow-sm transition-all"
                            >
                              <Video className="w-3.5 h-3.5" />
                              <span>Join Meeting</span>
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400">No meeting link</span>
                          )}

                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => onEditInterview(iv)}
                              className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                              title="Edit Interview"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteInterview(iv.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                              title="Delete Interview"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                      <CalendarDays className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        No interviews on this date
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        You can schedule a new interview round for {formatDisplayDate(selectedDate)}.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Action: Schedule on this day */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  id="btn-schedule-on-selected-date"
                  onClick={() => onOpenScheduleModal(undefined, selectedDate)}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Schedule for {formatDisplayDate(selectedDate)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Cards View (Existing card grid view) */
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Upcoming Interviews ({upcomingInterviews.length})
            </h2>
          </div>

          {upcomingInterviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingInterviews.map((iv) => (
                <div
                  key={iv.id}
                  className="p-5 bg-white dark:bg-slate-900 rounded-2xl border-2 border-amber-200/80 dark:border-amber-900/40 shadow-sm flex flex-col justify-between space-y-4 relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-1.5 mb-1">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getRoundBadge(
                              iv.round
                            )}`}
                          >
                            {iv.round} Round
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium flex items-center space-x-1">
                            {getTypeIcon(iv.interviewType)}
                            <span>{iv.interviewType}</span>
                          </span>
                        </div>
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                          {iv.companyName}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                          {iv.jobRole}
                        </p>
                      </div>

                      <select
                        value={iv.status}
                        onChange={(e) => onStatusChange(iv.id, e.target.value as InterviewStatus)}
                        className={`text-[11px] font-bold px-2 py-1 rounded-md border outline-none cursor-pointer ${getStatusBadge(
                          iv.status
                        )}`}
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="Completed">Completed</option>
                        <option value="Passed">Passed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="p-3 bg-amber-50/50 dark:bg-slate-800/60 rounded-xl border border-amber-100 dark:border-slate-800 text-xs space-y-1.5">
                      <div className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200">
                        <CalendarIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>
                          {formatDisplayDate(iv.interviewDate)} at {formatTime(iv.interviewTime)}
                        </span>
                      </div>

                      {iv.interviewer && (
                        <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>With: {iv.interviewer}</span>
                        </div>
                      )}
                    </div>

                    {iv.notes && (
                      <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
                        <span className="font-semibold block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                          Prep Notes
                        </span>
                        <p className="italic">{iv.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Footer Controls */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    {iv.meetingLink ? (
                      <a
                        href={iv.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg shadow-sm transition-all"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Meeting</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400">No meeting link</span>
                    )}

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onEditInterview(iv)}
                        className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                        title="Edit Interview"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteInterview(iv.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                        title="Delete Interview"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No upcoming scheduled interviews. Schedule one when you hear back from recruiters!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Section 2: Completed / Past Interviews (shown in Cards & Calendar views) */}
      {viewMode !== 'timeline' && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Past & Completed Rounds ({pastOrDoneInterviews.length})
            </h2>
          </div>

          {pastOrDoneInterviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastOrDoneInterviews.map((iv) => (
                <div
                  key={iv.id}
                  className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3 opacity-90 hover:opacity-100 transition-opacity"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getRoundBadge(
                            iv.round
                          )}`}
                        >
                          {iv.round} Round
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                          {iv.companyName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{iv.jobRole}</p>
                      </div>

                      <select
                        value={iv.status}
                        onChange={(e) => onStatusChange(iv.id, e.target.value as InterviewStatus)}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md border outline-none cursor-pointer ${getStatusBadge(
                          iv.status
                        )}`}
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="Completed">Completed</option>
                        <option value="Passed">Passed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {formatDisplayDate(iv.interviewDate)} at {formatTime(iv.interviewTime)}
                        </span>
                      </div>
                      {iv.interviewer && (
                        <div className="flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{iv.interviewer}</span>
                        </div>
                      )}
                    </div>

                    {iv.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg italic">
                        {iv.notes}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-1">
                    <button
                      onClick={() => onEditInterview(iv)}
                      className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg"
                      title="Edit Interview"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteInterview(iv.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg"
                      title="Delete Interview"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No past interview records yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
