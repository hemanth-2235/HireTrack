import { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Calendar,
  Clock,
  Video,
  X,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Settings2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ReminderNotification, ReminderService, ReminderSettings } from '../services/reminderService.ts';

interface ReminderNotificationCenterProps {
  reminders: ReminderNotification[];
  onDismiss: (id: string) => void;
  onNavigateToInterviews: (targetDate?: string) => void;
  onRefresh?: () => void;
}

export function ReminderNotificationCenter({
  reminders,
  onDismiss,
  onNavigateToInterviews,
}: ReminderNotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ReminderSettings>(ReminderService.getSettings());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter for un-dismissed items to display in badge count
  const unreadCount = reminders.filter((r) => !r.dismissed).length;
  const tomorrowCount = reminders.filter((r) => r.daysRemaining === 1 && !r.dismissed).length;

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSettings(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const handleUpdateSetting = (key: keyof ReminderSettings, val: boolean) => {
    const updated = { ...settings, [key]: val };
    setSettings(updated);
    ReminderService.saveSettings(updated);
  };

  const handleRequestBrowserPermission = async () => {
    const granted = await ReminderService.requestNotificationPermission();
    handleUpdateSetting('browserNotifications', granted);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        id="btn-reminder-bell"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all flex items-center justify-center ${
          isOpen
            ? 'bg-amber-500/20 text-amber-400 ring-2 ring-amber-500/40'
            : unreadCount > 0
            ? 'text-amber-400 hover:bg-slate-800'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
        }`}
        title={
          tomorrowCount > 0
            ? `${tomorrowCount} interview(s) coming up tomorrow (1-day reminder)!`
            : unreadCount > 0
            ? `${unreadCount} upcoming interview reminder(s)`
            : 'Interview Reminders'
        }
      >
        <Bell className={`w-5 h-5 ${tomorrowCount > 0 ? 'animate-bounce text-amber-400' : ''}`} />

        {/* Badge Indicator */}
        {unreadCount > 0 && (
          <span
            id="badge-reminder-count"
            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-md ring-2 ring-slate-900"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div
          id="popover-reminders"
          className="absolute right-0 mt-2.5 w-84 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden text-slate-800 dark:text-slate-100 divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black tracking-tight flex items-center space-x-1.5">
                  <span>Interview Reminders</span>
                  {tomorrowCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-extrabold border border-amber-300 dark:border-amber-800">
                      {tomorrowCount} Tomorrow
                    </span>
                  )}
                </h3>
                <p className="text-[10px] text-slate-400">1-Day & Same-Day Intimations</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                id="btn-reminder-settings-toggle"
                onClick={handleToggleSettings}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Reminder Preferences"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Optional Preferences Drawer */}
          {showSettings && (
            <div className="p-3.5 bg-blue-50/60 dark:bg-slate-800/60 text-xs space-y-2 border-b border-blue-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-200">1-Day Advance Notice</span>
                <input
                  type="checkbox"
                  id="chk-1day-notice"
                  checked={settings.oneDayNotice}
                  onChange={(e) => handleUpdateSetting('oneDayNotice', e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Same-Day Alerts</span>
                <input
                  type="checkbox"
                  id="chk-sameday-notice"
                  checked={settings.sameDayNotice}
                  onChange={(e) => handleUpdateSetting('sameDayNotice', e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Browser Push Alerts</span>
                <button
                  type="button"
                  id="btn-req-browser-notif"
                  onClick={handleRequestBrowserPermission}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 hover:bg-blue-500 text-white"
                >
                  {settings.browserNotifications ? 'Enabled ✓' : 'Enable'}
                </button>
              </div>
            </div>
          )}

          {/* List of Reminders */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {reminders.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  No upcoming interviews pending
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  When you schedule an interview, HireTrack automatically alerts you 1 day in advance!
                </p>
              </div>
            ) : (
              reminders.map((reminder) => {
                const isTomorrow = reminder.daysRemaining === 1;
                const isToday = reminder.daysRemaining === 0;

                return (
                  <div
                    key={reminder.id}
                    id={`reminder-item-${reminder.id}`}
                    className={`p-3.5 transition-colors relative group ${
                      reminder.dismissed
                        ? 'bg-slate-50/50 dark:bg-slate-900/40 opacity-75'
                        : isTomorrow
                        ? 'bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                        : 'bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                    }`}
                  >
                    {/* Top Row badge and dismiss */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            isTomorrow
                              ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                              : isToday
                              ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-700 animate-pulse'
                              : 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700'
                          }`}
                        >
                          {isTomorrow ? '⏰ 1 Day Before (Tomorrow)' : '🚨 Today'}
                        </span>

                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          {reminder.round} Round
                        </span>
                      </div>

                      {!reminder.dismissed && (
                        <button
                          id={`btn-dismiss-${reminder.id}`}
                          onClick={() => onDismiss(reminder.id)}
                          className="text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                          title="Dismiss this reminder"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>

                    {/* Company & Role */}
                    <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                      {reminder.companyName}
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                      {reminder.jobRole}
                    </p>

                    {/* Time & Date Strip */}
                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/80">
                      <div className="flex items-center space-x-2">
                        <span className="flex items-center space-x-1 font-semibold">
                          <Calendar className="w-3 h-3 text-blue-500" />
                          <span>{reminder.formattedDate}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1 font-semibold text-slate-900 dark:text-white">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>{reminder.formattedTime}</span>
                        </span>
                      </div>

                      {reminder.meetingLink && (
                        <a
                          href={reminder.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Video className="w-3 h-3" />
                          <span>Join</span>
                        </a>
                      )}
                    </div>

                    {/* Bottom CTA to jump to interview schedule */}
                    <div className="mt-2 pt-1 flex justify-end">
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          onNavigateToInterviews(reminder.interviewDate);
                        }}
                        className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center space-x-0.5"
                      >
                        <span>View in Calendar</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {reminders.length > 0 && (
            <div className="p-2.5 bg-slate-50/80 dark:bg-slate-950/80 text-center">
              <button
                id="btn-view-all-interviews-from-reminders"
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToInterviews();
                }}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center space-x-1"
              >
                <span>Open Full Interview Schedule</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
