import { Calendar, Clock, Video, Bell, X, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';
import { ReminderNotification } from '../services/reminderService.ts';

interface ReminderAlertBannerProps {
  reminders: ReminderNotification[];
  onDismiss: (id: string) => void;
  onNavigateToInterviews: (targetDate?: string) => void;
}

export function ReminderAlertBanner({
  reminders,
  onDismiss,
  onNavigateToInterviews,
}: ReminderAlertBannerProps) {
  // Show active (undismissed) reminders: prioritize tomorrow (1 day before) and today
  const activeReminders = reminders.filter((r) => !r.dismissed);

  if (activeReminders.length === 0) return null;

  // We can show up to 2 top banners
  const featured = activeReminders.slice(0, 2);

  return (
    <div className="mb-6 space-y-2.5">
      {featured.map((reminder) => {
        const isTomorrow = reminder.daysRemaining === 1;
        const isToday = reminder.daysRemaining === 0;

        return (
          <div
            key={reminder.id}
            id={`alert-banner-${reminder.id}`}
            className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md transition-all animate-in slide-in-from-top-2 duration-200 ${
              isTomorrow
                ? 'bg-gradient-to-r from-amber-500/10 via-amber-50 dark:via-amber-950/40 to-white dark:to-slate-900 border-amber-300 dark:border-amber-700/60 text-amber-950 dark:text-amber-100'
                : 'bg-gradient-to-r from-rose-500/10 via-rose-50 dark:via-rose-950/40 to-white dark:to-slate-900 border-rose-300 dark:border-rose-700/60 text-rose-950 dark:text-rose-100'
            }`}
          >
            {/* Left Info */}
            <div className="flex items-center space-x-3.5 flex-1">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                  isTomorrow
                    ? 'bg-amber-500 text-white'
                    : 'bg-rose-500 text-white animate-pulse'
                }`}
              >
                <Bell className="w-5 h-5" />
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center space-x-2 flex-wrap">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isTomorrow
                        ? 'bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                        : 'bg-rose-100 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700'
                    }`}
                  >
                    {isTomorrow ? '⏰ 1-Day Reminder: Tomorrow' : '🚨 Urgent: Scheduled Today'}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {reminder.round} Round
                  </span>
                </div>

                <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                  Upcoming Interview: <span className="text-blue-600 dark:text-blue-400">{reminder.companyName}</span> for <span className="font-semibold">{reminder.jobRole}</span>
                </h3>

                <div className="flex items-center space-x-3 text-xs text-slate-600 dark:text-slate-300 pt-0.5 flex-wrap">
                  <span className="inline-flex items-center space-x-1 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    <span>{reminder.formattedDate}</span>
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center space-x-1 font-bold text-slate-900 dark:text-white">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>{reminder.formattedTime}</span>
                  </span>
                  {reminder.interviewer && (
                    <>
                      <span>•</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        Interviewer: {reminder.interviewer}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Action buttons */}
            <div className="flex items-center space-x-2 self-end md:self-center w-full md:w-auto justify-end">
              {reminder.meetingLink && (
                <a
                  href={reminder.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-all"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Join Meeting</span>
                </a>
              )}

              <button
                id={`btn-alert-view-calendar-${reminder.id}`}
                onClick={() => onNavigateToInterviews(reminder.interviewDate)}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all shadow-2xs"
              >
                <span>View Timeline</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                id={`btn-alert-dismiss-${reminder.id}`}
                onClick={() => onDismiss(reminder.id)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                title="Dismiss reminder notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
