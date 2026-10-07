import { useState, useMemo } from 'react';
import {
  CalendarRange,
  Clock,
  Video,
  User,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  AlertCircle,
  Briefcase,
  Building2,
  Sparkles,
  ExternalLink,
  Bell,
} from 'lucide-react';
import { Interview, InterviewStatus, InterviewType } from '../types.ts';
import { InterviewHoverTooltip } from './InterviewHoverTooltip.tsx';

interface WeeklyTimelineViewProps {
  interviews: Interview[];
  todayStr: string;
  onOpenScheduleModal: (appId?: number, date?: string) => void;
  onEditInterview: (interview: Interview) => void;
  onDeleteInterview: (id: number) => void;
  onStatusChange: (id: number, status: InterviewStatus) => void;
  formatDisplayDate: (dateStr: string) => string;
  formatTime: (timeStr: string) => string;
  getStatusBadge: (status: InterviewStatus) => string;
  getRoundBadge: (round: string) => string;
  getTypeIcon: (type: InterviewType) => React.ReactNode;
}

interface DayGroup {
  dateStr: string;
  dayName: string;
  dayShort: string;
  dayNumber: number;
  formatted: string;
  countdown: string;
  isToday: boolean;
  isPast: boolean;
  interviews: Interview[];
}

interface WeekGroup {
  weekKey: string; // Monday YYYY-MM-DD
  mondayStr: string;
  sundayStr: string;
  monday: Date;
  sunday: Date;
  diffWeeks: number;
  label: string;
  rangeFormatted: string;
  isCurrentWeek: boolean;
  isPastWeek: boolean;
  isUpcomingWeek: boolean;
  interviews: Interview[];
  days: DayGroup[];
}

export function WeeklyTimelineView({
  interviews,
  todayStr,
  onOpenScheduleModal,
  onEditInterview,
  onDeleteInterview,
  onStatusChange,
  formatDisplayDate,
  formatTime,
  getStatusBadge,
  getRoundBadge,
  getTypeIcon,
}: WeeklyTimelineViewProps) {
  const [scopeFilter, setScopeFilter] = useState<'upcoming' | 'all' | 'past'>('upcoming');
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});

  // Helper to calculate Monday and Sunday for any date string
  const getMondayAndSunday = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d, 12, 0, 0);
    const day = date.getDay(); // 0 = Sun, 1 = Mon ...
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(y, m - 1, d + diffToMon, 12, 0, 0);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 12, 0, 0);

    const toStr = (dt: Date) =>
      `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;

    return { monday, sunday, mondayStr: toStr(monday), sundayStr: toStr(sunday) };
  };

  const currentWeekInfo = useMemo(() => getMondayAndSunday(todayStr), [todayStr]);

  // Relative week label
  const getWeekLabel = (diffWeeks: number) => {
    if (diffWeeks === 0) return 'This Week';
    if (diffWeeks === 1) return 'Next Week';
    if (diffWeeks === 2) return 'In 2 Weeks';
    if (diffWeeks > 2) return `In ${diffWeeks} Weeks`;
    if (diffWeeks === -1) return 'Last Week';
    return `${Math.abs(diffWeeks)} Weeks Ago`;
  };

  // Format week date range: e.g., "Sep 21 – Sep 27, 2026"
  const formatWeekRange = (mon: Date, sun: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monStr = `${months[mon.getMonth()]} ${mon.getDate()}`;
    const sunStr = `${months[sun.getMonth()]} ${sun.getDate()}`;
    if (mon.getFullYear() === sun.getFullYear()) {
      return `${monStr} – ${sunStr}, ${mon.getFullYear()}`;
    }
    return `${monStr}, ${mon.getFullYear()} – ${sunStr}, ${sun.getFullYear()}`;
  };

  // Relative countdown for days
  const getDayCountdown = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const target = new Date(y, m - 1, d, 12, 0, 0).getTime();
    const [ty, tm, td] = todayStr.split('-').map(Number);
    const curr = new Date(ty, tm - 1, td, 12, 0, 0).getTime();
    const diffDays = Math.round((target - curr) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days ago`;
  };

  const dayShortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayFullNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Group all filtered interviews by week
  const allWeeks = useMemo(() => {
    const weekMap = new Map<string, { info: ReturnType<typeof getMondayAndSunday>; interviews: Interview[] }>();

    // Always include current week
    weekMap.set(currentWeekInfo.mondayStr, {
      info: currentWeekInfo,
      interviews: [],
    });

    // Populate interviews into weeks
    interviews.forEach((iv) => {
      const info = getMondayAndSunday(iv.interviewDate);
      const existing = weekMap.get(info.mondayStr);
      if (existing) {
        existing.interviews.push(iv);
      } else {
        weekMap.set(info.mondayStr, {
          info,
          interviews: [iv],
        });
      }
    });

    // Convert map to sorted array of WeekGroup
    const result: WeekGroup[] = [];
    const [currY, currM, currD] = currentWeekInfo.mondayStr.split('-').map(Number);
    const currMonTime = new Date(currY, currM - 1, currD, 12, 0, 0).getTime();

    weekMap.forEach((entry) => {
      const { info, interviews: weekIvs } = entry;
      const [monY, monM, monD] = info.mondayStr.split('-').map(Number);
      const monTime = new Date(monY, monM - 1, monD, 12, 0, 0).getTime();
      const diffWeeks = Math.round((monTime - currMonTime) / (7 * 24 * 60 * 60 * 1000));

      // Sort interviews chronologically
      weekIvs.sort((a, b) =>
        `${a.interviewDate} ${a.interviewTime}`.localeCompare(`${b.interviewDate} ${b.interviewTime}`)
      );

      // Group into days
      const dayMap = new Map<string, Interview[]>();
      weekIvs.forEach((iv) => {
        const list = dayMap.get(iv.interviewDate) || [];
        list.push(iv);
        dayMap.set(iv.interviewDate, list);
      });

      const days: DayGroup[] = [];
      dayMap.forEach((dayIvs, dateStr) => {
        const [dy, dm, dd] = dateStr.split('-').map(Number);
        const dayDate = new Date(dy, dm - 1, dd, 12, 0, 0);
        const dayIdx = dayDate.getDay();
        days.push({
          dateStr,
          dayName: dayFullNames[dayIdx],
          dayShort: dayShortNames[dayIdx],
          dayNumber: dd,
          formatted: formatDisplayDate(dateStr),
          countdown: getDayCountdown(dateStr),
          isToday: dateStr === todayStr,
          isPast: dateStr < todayStr,
          interviews: dayIvs.sort((a, b) => a.interviewTime.localeCompare(b.interviewTime)),
        });
      });

      days.sort((a, b) => a.dateStr.localeCompare(b.dateStr));

      result.push({
        weekKey: info.mondayStr,
        mondayStr: info.mondayStr,
        sundayStr: info.sundayStr,
        monday: info.monday,
        sunday: info.sunday,
        diffWeeks,
        label: getWeekLabel(diffWeeks),
        rangeFormatted: formatWeekRange(info.monday, info.sunday),
        isCurrentWeek: diffWeeks === 0,
        isPastWeek: diffWeeks < 0,
        isUpcomingWeek: diffWeeks >= 0,
        interviews: weekIvs,
        days,
      });
    });

    // Sort weeks chronologically
    result.sort((a, b) => a.mondayStr.localeCompare(b.mondayStr));
    return result;
  }, [interviews, currentWeekInfo, todayStr]);

  // Split into upcoming and past
  const upcomingWeeks = useMemo(() => allWeeks.filter((w) => w.isUpcomingWeek), [allWeeks]);
  const pastWeeks = useMemo(() => allWeeks.filter((w) => w.isPastWeek).reverse(), [allWeeks]);

  // Determine which weeks to display based on scopeFilter
  const displayedWeeks = useMemo(() => {
    if (scopeFilter === 'upcoming') return upcomingWeeks;
    if (scopeFilter === 'past') return pastWeeks;
    return allWeeks;
  }, [scopeFilter, upcomingWeeks, pastWeeks, allWeeks]);

  // Statistics
  const totalUpcomingInterviews = useMemo(() => {
    return upcomingWeeks.reduce((acc, w) => acc + w.interviews.filter((iv) => iv.status === 'Scheduled').length, 0);
  }, [upcomingWeeks]);

  const thisWeekInterviewsCount = useMemo(() => {
    const thisWeek = allWeeks.find((w) => w.isCurrentWeek);
    return thisWeek ? thisWeek.interviews.length : 0;
  }, [allWeeks]);

  const nextWeekInterviewsCount = useMemo(() => {
    const nextWeek = allWeeks.find((w) => w.diffWeeks === 1);
    return nextWeek ? nextWeek.interviews.length : 0;
  }, [allWeeks]);

  const toggleWeekExpand = (weekKey: string) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekKey]: prev[weekKey] === undefined ? false : !prev[weekKey],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Visual Timeline Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50">
            <CalendarRange className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>Weekly Schedule Timeline</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                {displayedWeeks.length} {displayedWeeks.length === 1 ? 'Week' : 'Weeks'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Chronological milestones grouped by week to prepare and organize your upcoming interviews.
            </p>
          </div>
        </div>

        {/* Scope selector tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs self-start md:self-auto">
          <button
            id="btn-timeline-scope-upcoming"
            onClick={() => setScopeFilter('upcoming')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              scopeFilter === 'upcoming'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Upcoming ({upcomingWeeks.length})
          </button>
          <button
            id="btn-timeline-scope-all"
            onClick={() => setScopeFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              scopeFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Weeks ({allWeeks.length})
          </button>
          {pastWeeks.length > 0 && (
            <button
              id="btn-timeline-scope-past"
              onClick={() => setScopeFilter('past')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                scopeFilter === 'past'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Past ({pastWeeks.length})
            </button>
          )}
        </div>
      </div>

      {/* Overview Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-2xl border border-blue-200/70 dark:border-blue-900/50 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-0.5">
              This Week
            </span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">
              {thisWeekInterviewsCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">interviews scheduled</span>
          </div>
          <button
            onClick={() => onOpenScheduleModal(undefined, todayStr)}
            className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xs transition-colors"
            title="Schedule interview for this week"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-0.5">
              Next Week
            </span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">
              {nextWeekInterviewsCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">interviews lined up</span>
          </div>
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-0.5">
              Active Pipeline
            </span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-white">
              {totalUpcomingInterviews}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">total scheduled ahead</span>
          </div>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Week-by-Week Visual Timeline Cards */}
      {displayedWeeks.length > 0 ? (
        <div className="space-y-6">
          {displayedWeeks.map((week) => {
            const isCollapsed = expandedWeeks[week.weekKey] === false;
            const hasInterviews = week.interviews.length > 0;

            // Status counts for this week
            const scheduledCount = week.interviews.filter((i) => i.status === 'Scheduled').length;
            const completedCount = week.interviews.filter((i) => i.status === 'Completed' || i.status === 'Passed').length;

            return (
              <div
                key={week.weekKey}
                id={`week-card-${week.weekKey}`}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  week.isCurrentWeek
                    ? 'bg-white dark:bg-slate-900 border-blue-400/80 dark:border-blue-600/60 shadow-md ring-1 ring-blue-400/20'
                    : week.isPastWeek
                    ? 'bg-slate-50/60 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm'
                }`}
              >
                {/* Week Banner Header */}
                <div
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b ${
                    week.isCurrentWeek
                      ? 'bg-gradient-to-r from-blue-50/80 via-white to-transparent dark:from-blue-950/30 dark:via-slate-900 dark:to-transparent border-blue-100 dark:border-blue-900/40'
                      : 'bg-slate-50/50 dark:bg-slate-900/80 border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleWeekExpand(week.weekKey)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      title={isCollapsed ? 'Expand week' : 'Collapse week'}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center space-x-1.5 ${
                            week.isCurrentWeek
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : week.diffWeeks === 1
                              ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                              : week.isPastWeek
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {week.isCurrentWeek && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          )}
                          <span>{week.label}</span>
                        </span>

                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {week.rangeFormatted}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        <span>
                          {hasInterviews
                            ? `${week.interviews.length} ${
                                week.interviews.length === 1 ? 'interview' : 'interviews'
                              } scheduled`
                            : 'No interviews scheduled'}
                        </span>
                        {scheduledCount > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">
                              {scheduledCount} upcoming
                            </span>
                          </>
                        )}
                        {completedCount > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              {completedCount} completed
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions for this week */}
                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    <button
                      id={`btn-schedule-week-${week.weekKey}`}
                      onClick={() => onOpenScheduleModal(undefined, week.mondayStr)}
                      className="flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Schedule in this week</span>
                    </button>
                  </div>
                </div>

                {/* Week Body (Timeline) */}
                {!isCollapsed && (
                  <div className="p-4 sm:p-6">
                    {hasInterviews ? (
                      <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 dark:border-slate-800 space-y-8 ml-2 sm:ml-4">
                        {week.days.map((day) => {
                          return (
                            <div key={day.dateStr} className="relative group">
                              {/* Day Marker on the Spine */}
                              <div
                                className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                                  day.isToday
                                    ? 'bg-blue-600 border-white text-white shadow-md shadow-blue-500/30'
                                    : day.isPast
                                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
                                    : 'bg-white dark:bg-slate-900 border-amber-500 text-amber-600 shadow-2xs'
                                }`}
                              >
                                {day.isToday ? (
                                  <span className="w-2 h-2 rounded-full bg-white" />
                                ) : (
                                  <span className="w-2 h-2 rounded-full bg-current" />
                                )}
                              </div>

                              {/* Day Header */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <span
                                    className={`text-xs font-extrabold uppercase tracking-wide ${
                                      day.isToday
                                        ? 'text-blue-600 dark:text-blue-400 font-black'
                                        : 'text-slate-800 dark:text-slate-200'
                                    }`}
                                  >
                                    {day.dayName}, {day.formatted}
                                  </span>

                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      day.isToday
                                        ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                        : day.isPast
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                        : 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300'
                                    }`}
                                  >
                                    {day.countdown}
                                  </span>
                                </div>

                                <button
                                  onClick={() => onOpenScheduleModal(undefined, day.dateStr)}
                                  className="text-[11px] text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center space-x-1 transition-colors"
                                  title={`Schedule on ${day.formatted}`}
                                >
                                  <Plus className="w-3 h-3" />
                                  <span className="hidden sm:inline">Add Round</span>
                                </button>
                              </div>

                              {/* Interviews on this day */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {day.interviews.map((iv) => {
                                  const isScheduled = iv.status === 'Scheduled';
                                  const isTomorrow = isScheduled && day.countdown === 'Tomorrow';
                                  return (
                                    <InterviewHoverTooltip
                                      key={iv.id}
                                      interview={iv}
                                      formatTime={formatTime}
                                      formatDisplayDate={formatDisplayDate}
                                      getTypeIcon={getTypeIcon}
                                    >
                                      <div
                                        id={`timeline-iv-${iv.id}`}
                                        className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all relative ${
                                          isTomorrow
                                            ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/70 shadow-sm ring-1 ring-amber-400/30'
                                            : isScheduled
                                            ? 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 shadow-xs'
                                            : 'bg-slate-50/60 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800/80 opacity-90'
                                        }`}
                                      >
                                        {/* Top Row: Time, Type & Status */}
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="space-y-1">
                                            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                                              {isTomorrow && (
                                                <span className="inline-flex items-center space-x-1 text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700 px-2 py-0.5 rounded-md">
                                                  <Bell className="w-2.5 h-2.5" />
                                                  <span>1-Day Notice</span>
                                                </span>
                                              )}

                                              <span className="inline-flex items-center space-x-1 text-xs font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                                <Clock className="w-3 h-3 text-blue-500" />
                                                <span>{formatTime(iv.interviewTime)}</span>
                                              </span>

                                              <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getRoundBadge(
                                                  iv.round
                                                )}`}
                                              >
                                                {iv.round} Round
                                              </span>

                                              <span className="inline-flex items-center space-x-1 text-[11px] text-slate-500 dark:text-slate-400">
                                                {getTypeIcon(iv.interviewType)}
                                                <span>{iv.interviewType}</span>
                                              </span>
                                            </div>

                                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1">
                                              {iv.companyName}
                                            </h4>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                                              {iv.jobRole}
                                            </p>
                                          </div>

                                          {/* Status Dropdown */}
                                          <select
                                            id={`select-status-timeline-${iv.id}`}
                                            value={iv.status}
                                            onChange={(e) =>
                                              onStatusChange(iv.id, e.target.value as InterviewStatus)
                                            }
                                            className={`text-[11px] font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer ${getStatusBadge(
                                              iv.status
                                            )}`}
                                          >
                                            <option value="Scheduled">Scheduled</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Passed">Passed</option>
                                            <option value="Cancelled">Cancelled</option>
                                          </select>
                                        </div>

                                        {/* Interview Details: Interviewer & Prep Notes */}
                                        {(iv.interviewer || iv.notes) && (
                                          <div className="text-xs space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                            {iv.interviewer && (
                                              <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400 text-[11px]">
                                                <User className="w-3 h-3 text-slate-400" />
                                                <span>Interviewer: {iv.interviewer}</span>
                                              </div>
                                            )}

                                            {iv.notes && (
                                              <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg text-[11px] text-slate-600 dark:text-slate-300 italic border border-slate-100 dark:border-slate-800">
                                                <span className="block font-semibold not-italic text-[9px] uppercase tracking-wider text-slate-400 mb-0.5">
                                                  Prep Notes
                                                </span>
                                                {iv.notes}
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* Footer Action Buttons */}
                                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                          {iv.meetingLink ? (
                                            <a
                                              href={iv.meetingLink}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="inline-flex items-center space-x-1.5 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-500 px-2.5 py-1.5 rounded-lg shadow-2xs transition-colors"
                                            >
                                              <Video className="w-3.5 h-3.5" />
                                              <span>Join Meeting</span>
                                            </a>
                                          ) : (
                                            <span className="text-[10px] text-slate-400">
                                              No video link
                                            </span>
                                          )}

                                          <div className="flex items-center space-x-1">
                                            <button
                                              id={`btn-edit-iv-${iv.id}`}
                                              onClick={() => onEditInterview(iv)}
                                              className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                              title="Edit Interview"
                                            >
                                              <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              id={`btn-delete-iv-${iv.id}`}
                                              onClick={() => onDeleteInterview(iv.id)}
                                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                              title="Delete Interview"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </InterviewHoverTooltip>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Empty state for this specific week */
                      <div className="py-6 px-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          No interviews scheduled for {week.label.toLowerCase()} ({week.rangeFormatted}).
                        </p>
                        <button
                          onClick={() => onOpenScheduleModal(undefined, week.mondayStr)}
                          className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Schedule an interview in this week</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty state when no weeks match */
        <div className="p-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <CalendarRange className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No interviews found for this timeline scope
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {scopeFilter === 'past'
                ? 'You do not have any past interview records.'
                : 'Schedule an upcoming interview to view your weekly timeline milestones.'}
            </p>
          </div>
          <button
            onClick={() => onOpenScheduleModal(undefined, todayStr)}
            className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule New Interview</span>
          </button>
        </div>
      )}
    </div>
  );
}
