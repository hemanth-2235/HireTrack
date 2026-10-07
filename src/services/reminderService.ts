import { Interview } from '../types.ts';

export interface ReminderNotification {
  id: string;
  interviewId: number;
  companyName: string;
  jobRole: string;
  interviewDate: string; // YYYY-MM-DD
  interviewTime: string; // HH:MM
  round: string;
  meetingLink?: string | null;
  interviewer?: string | null;
  interviewType: string;
  daysRemaining: number; // 1 for 1-day before, 0 for today
  statusText: string; // e.g. "Tomorrow" or "Today"
  formattedDate: string;
  formattedTime: string;
  read: boolean;
  dismissed: boolean;
}

const STORAGE_KEY_DISMISSED = 'hiretrack_dismissed_reminders';
const STORAGE_KEY_SETTINGS = 'hiretrack_reminder_settings';

export interface ReminderSettings {
  oneDayNotice: boolean;
  sameDayNotice: boolean;
  soundEnabled: boolean;
  browserNotifications: boolean;
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  oneDayNotice: true,
  sameDayNotice: true,
  soundEnabled: false,
  browserNotifications: false,
};

export class ReminderService {
  /**
   * Helper to format a time string into 12-hour AM/PM format
   */
  public static formatTime(timeStr?: string): string {
    if (!timeStr) return '';
    const [hStr, mStr] = timeStr.split(':');
    const h = parseInt(hStr, 10);
    if (isNaN(h)) return timeStr;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${mStr || '00'} ${ampm}`;
  }

  /**
   * Helper to format YYYY-MM-DD date
   */
  public static formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Calculates the integer difference in days between today and interviewDate
   */
  public static getDayDifference(targetDateStr: string, referenceDate: Date = new Date()): number {
    if (!targetDateStr) return 999;
    const [tY, tM, tD] = targetDateStr.split('-').map(Number);
    const target = new Date(tY, tM - 1, tD);
    const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
    const diffTime = target.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Returns list of dismissed reminder IDs from localStorage
   */
  public static getDismissedIds(): string[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DISMISSED);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Marks a reminder as dismissed
   */
  public static dismissReminder(id: string): void {
    try {
      const dismissed = this.getDismissedIds();
      if (!dismissed.includes(id)) {
        dismissed.push(id);
        localStorage.setItem(STORAGE_KEY_DISMISSED, JSON.stringify(dismissed));
      }
    } catch (e) {
      console.error('Error saving dismissed reminder:', e);
    }
  }

  /**
   * Clears dismissed reminders (e.g. for testing or reset)
   */
  public static resetDismissed(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_DISMISSED);
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Retrieves user reminder settings
   */
  public static getSettings(): ReminderSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return stored ? { ...DEFAULT_REMINDER_SETTINGS, ...JSON.parse(stored) } : DEFAULT_REMINDER_SETTINGS;
    } catch {
      return DEFAULT_REMINDER_SETTINGS;
    }
  }

  /**
   * Saves user reminder settings
   */
  public static saveSettings(settings: ReminderSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving reminder settings:', e);
    }
  }

  /**
   * Evaluates interviews and yields active reminders, especially 1-day before notices
   */
  public static evaluateReminders(
    interviews: Interview[],
    referenceDate: Date = new Date()
  ): {
    oneDayReminders: ReminderNotification[];
    todayReminders: ReminderNotification[];
    allActiveReminders: ReminderNotification[];
    hasUndismissedOneDayAlert: boolean;
  } {
    const dismissedIds = new Set(this.getDismissedIds());
    const settings = this.getSettings();

    const oneDayReminders: ReminderNotification[] = [];
    const todayReminders: ReminderNotification[] = [];

    interviews.forEach((iv) => {
      // Only scheduled interviews trigger reminders
      if (iv.status !== 'Scheduled') return;

      const diffDays = this.getDayDifference(iv.interviewDate, referenceDate);

      // Check if 1 day before (Tomorrow)
      if (diffDays === 1 && settings.oneDayNotice) {
        const id = `reminder-1day-${iv.id}-${iv.interviewDate}`;
        const isDismissed = dismissedIds.has(id);
        oneDayReminders.push({
          id,
          interviewId: iv.id,
          companyName: iv.companyName,
          jobRole: iv.jobRole,
          interviewDate: iv.interviewDate,
          interviewTime: iv.interviewTime,
          round: iv.round,
          meetingLink: iv.meetingLink,
          interviewer: iv.interviewer,
          interviewType: iv.interviewType,
          daysRemaining: 1,
          statusText: 'Tomorrow (1 Day Before)',
          formattedDate: this.formatDate(iv.interviewDate),
          formattedTime: this.formatTime(iv.interviewTime),
          read: false,
          dismissed: isDismissed,
        });
      }

      // Check if Today
      if (diffDays === 0 && settings.sameDayNotice) {
        const id = `reminder-today-${iv.id}-${iv.interviewDate}`;
        const isDismissed = dismissedIds.has(id);
        todayReminders.push({
          id,
          interviewId: iv.id,
          companyName: iv.companyName,
          jobRole: iv.jobRole,
          interviewDate: iv.interviewDate,
          interviewTime: iv.interviewTime,
          round: iv.round,
          meetingLink: iv.meetingLink,
          interviewer: iv.interviewer,
          interviewType: iv.interviewType,
          daysRemaining: 0,
          statusText: 'Today',
          formattedDate: this.formatDate(iv.interviewDate),
          formattedTime: this.formatTime(iv.interviewTime),
          read: false,
          dismissed: isDismissed,
        });
      }
    });

    const allActiveReminders = [...oneDayReminders, ...todayReminders].sort((a, b) => {
      // Today first, then tomorrow; then sorted by time
      if (a.daysRemaining !== b.daysRemaining) return a.daysRemaining - b.daysRemaining;
      return a.interviewTime.localeCompare(b.interviewTime);
    });

    const hasUndismissedOneDayAlert = oneDayReminders.some((r) => !r.dismissed);

    return {
      oneDayReminders,
      todayReminders,
      allActiveReminders,
      hasUndismissedOneDayAlert,
    };
  }

  /**
   * Request browser notification permission if user wants native desktop alerts
   */
  public static async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Triggers a native system notification if permitted
   */
  public static triggerNativeNotification(reminder: ReminderNotification): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      const title = reminder.daysRemaining === 1
        ? `⏰ 1-Day Reminder: Interview with ${reminder.companyName} Tomorrow!`
        : `🚨 Interview Today with ${reminder.companyName}!`;
      const body = `${reminder.round} Round for ${reminder.jobRole} at ${reminder.formattedTime} (${reminder.formattedDate}).`;
      
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: reminder.id,
      });
    } catch (e) {
      console.warn('Native notification failed:', e);
    }
  }
}
