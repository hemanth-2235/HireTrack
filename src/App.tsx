import { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { ApplicationsView } from './components/ApplicationsView.tsx';
import { InterviewsView } from './components/InterviewsView.tsx';
import { AnalyticsView } from './components/AnalyticsView.tsx';
import { ApplicationModal } from './components/ApplicationModal.tsx';
import { InterviewModal } from './components/InterviewModal.tsx';
import { ApplicationDetailModal } from './components/ApplicationDetailModal.tsx';
import { ApiService } from './services/api.ts';
import { ReminderService, ReminderNotification } from './services/reminderService.ts';
import { JobApplication, Interview, AnalyticsOverview, ApplicationStatus, InterviewStatus } from './types.ts';
import {
  Briefcase,
  Layers,
  Sparkles,
  UserCircle2,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Database,
} from 'lucide-react';

function HireTrackMain() {
  const { user, loading: authLoading, isDemo, loginWithGoogle, loginDemo, error: authError } = useAuth();

  const [currentTab, setCurrentTab] = useState<'dashboard' | 'applications' | 'interviews' | 'analytics'>('dashboard');
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);

  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [scheduleDefaultAppId, setScheduleDefaultAppId] = useState<number | undefined>(undefined);
  const [scheduleDefaultDate, setScheduleDefaultDate] = useState<string | undefined>(undefined);

  const [detailAppId, setDetailAppId] = useState<number | null>(null);

  // Target date for deep navigation to specific interview date in InterviewsView
  const [targetInterviewDate, setTargetInterviewDate] = useState<string | undefined>(undefined);

  // Dismissed reminders state tracker to trigger reactive updates
  const [dismissedReminderIds, setDismissedReminderIds] = useState<string[]>(() =>
    ReminderService.getDismissedIds()
  );

  // Derive reminders from current scheduled interviews
  const { allActiveReminders, oneDayReminders } = useMemo(() => {
    return ReminderService.evaluateReminders(interviews);
  }, [interviews, dismissedReminderIds]);

  // Periodic check / alert for desktop push if permitted
  useEffect(() => {
    const settings = ReminderService.getSettings();
    if (settings.browserNotifications) {
      oneDayReminders.forEach((r) => {
        if (!r.dismissed) {
          ReminderService.triggerNativeNotification(r);
        }
      });
    }
  }, [oneDayReminders]);

  const handleDismissReminder = (id: string) => {
    ReminderService.dismissReminder(id);
    setDismissedReminderIds(ReminderService.getDismissedIds());
  };

  const handleNavigateToInterviewDate = (dateStr?: string) => {
    if (dateStr) {
      setTargetInterviewDate(dateStr);
    }
    setCurrentTab('interviews');
  };

  // Load all user data
  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setDataLoading(true);
      setErrorMessage(null);

      const [appsData, interviewsData, analyticsData] = await Promise.all([
        ApiService.getApplications(),
        ApiService.getInterviews(),
        ApiService.getAnalyticsOverview(),
      ]);

      setApplications(appsData);
      setInterviews(interviewsData);
      setAnalytics(analyticsData);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setErrorMessage(err.message || 'Failed to sync with PostgreSQL database');
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Handle Application Submit (Create or Update)
  const handleApplicationSubmit = async (data: Partial<JobApplication>) => {
    if (editingApp) {
      await ApiService.updateApplication(editingApp.id, data);
    } else {
      await ApiService.createApplication(data);
    }
    await loadData();
    setEditingApp(null);
  };

  // Handle Application Status Change
  const handleAppStatusChange = async (id: number, status: ApplicationStatus) => {
    try {
      // Optimistic update
      setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
      await ApiService.updateApplicationStatus(id, status);
      const updatedAnalytics = await ApiService.getAnalyticsOverview();
      setAnalytics(updatedAnalytics);
    } catch (err) {
      console.error('Error updating status:', err);
      await loadData();
    }
  };

  // Handle Application Delete
  const handleAppDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this job application?')) return;
    try {
      await ApiService.deleteApplication(id);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete application');
    }
  };

  // Handle Interview Submit
  const handleInterviewSubmit = async (data: Partial<Interview>) => {
    if (editingInterview) {
      await ApiService.updateInterview(editingInterview.id, data);
    } else {
      await ApiService.createInterview(data);
    }
    await loadData();
    setEditingInterview(null);
  };

  // Handle Interview Status Change
  const handleInterviewStatusChange = async (id: number, status: InterviewStatus) => {
    try {
      setInterviews((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
      await ApiService.updateInterview(id, { status });
      const updatedAnalytics = await ApiService.getAnalyticsOverview();
      setAnalytics(updatedAnalytics);
    } catch (err) {
      console.error('Error updating interview status:', err);
      await loadData();
    }
  };

  // Handle Interview Delete
  const handleInterviewDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this interview record?')) return;
    try {
      await ApiService.deleteInterview(id);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete interview');
    }
  };

  // Clear all data
  const handleClearAllData = async () => {
    if (!confirm('Are you sure you want to clear all your applications and interviews?')) return;
    try {
      setDataLoading(true);
      await ApiService.clearAllData();
      await loadData();
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to clear data');
    } finally {
      setDataLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-mono text-slate-400">Connecting to HireTrack Cloud SQL Database...</p>
      </div>
    );
  }

  // Not signed in View
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Navbar
          currentTab="dashboard"
          onSelectTab={() => {}}
          onOpenAddModal={() => {}}
          onOpenScheduleModal={() => {}}
        />

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-slate-900 rounded-3xl border border-slate-800 p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/30">
              <Briefcase className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
                <Database className="w-3.5 h-3.5" />
                <span>PostgreSQL Cloud SQL Engine</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                Welcome to HireTrack
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                A clean, real-time Job Application Management System. Track your actual job applications, interview schedules, recruiter contacts, and performance analytics.
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-red-950/50 border border-red-800 rounded-xl text-xs text-red-400">
                {authError}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                id="btn-auth-google"
                onClick={loginWithGoogle}
                className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <UserCircle2 className="w-4 h-4" />
                <span>Sign In with Google (Firebase Auth)</span>
              </button>

              <button
                id="btn-guest-demo"
                onClick={loginDemo}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Continue as Guest (Clean Workspace)</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-center space-x-4">
              <span className="flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>JWT Secure Sessions</span>
              </span>
              <span>•</span>
              <span>Drizzle ORM</span>
              <span>•</span>
              <span>Express Backend</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col font-sans transition-colors">
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAddModal={() => {
          setEditingApp(null);
          setIsAppModalOpen(true);
        }}
        onOpenScheduleModal={() => {
          setEditingInterview(null);
          setScheduleDefaultAppId(undefined);
          setIsInterviewModalOpen(true);
        }}
        reminders={allActiveReminders}
        onDismissReminder={handleDismissReminder}
        onNavigateToInterviewDate={handleNavigateToInterviewDate}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Alert if any */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl flex items-center justify-between text-xs text-red-600 dark:text-red-400 shadow-sm">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs font-bold hover:underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Views */}
        {currentTab === 'dashboard' && (
          <DashboardView
            applications={applications}
            interviews={interviews}
            analytics={analytics}
            loading={dataLoading}
            onSelectApplication={(id) => setDetailAppId(id)}
            onOpenAddModal={() => {
              setEditingApp(null);
              setIsAppModalOpen(true);
            }}
            onOpenScheduleModal={(appId) => {
              setEditingInterview(null);
              setScheduleDefaultAppId(appId);
              setIsInterviewModalOpen(true);
            }}
            onStatusChange={handleAppStatusChange}
            onNavigateTab={setCurrentTab}
            reminders={allActiveReminders}
            onDismissReminder={handleDismissReminder}
            onNavigateToInterviewDate={handleNavigateToInterviewDate}
          />
        )}

        {currentTab === 'applications' && (
          <ApplicationsView
            applications={applications}
            loading={dataLoading}
            onOpenAddModal={() => {
              setEditingApp(null);
              setIsAppModalOpen(true);
            }}
            onSelectApplication={(id) => setDetailAppId(id)}
            onEditApplication={(app) => {
              setEditingApp(app);
              setIsAppModalOpen(true);
            }}
            onDeleteApplication={handleAppDelete}
            onStatusChange={handleAppStatusChange}
            onScheduleInterview={(appId) => {
              setEditingInterview(null);
              setScheduleDefaultAppId(appId);
              setIsInterviewModalOpen(true);
            }}
          />
        )}

        {currentTab === 'interviews' && (
          <InterviewsView
            interviews={interviews}
            applications={applications}
            loading={dataLoading}
            onOpenScheduleModal={(appId, date) => {
              setEditingInterview(null);
              setScheduleDefaultAppId(appId);
              setScheduleDefaultDate(date);
              setIsInterviewModalOpen(true);
            }}
            onEditInterview={(iv) => {
              setEditingInterview(iv);
              setScheduleDefaultDate(iv.interviewDate);
              setIsInterviewModalOpen(true);
            }}
            onDeleteInterview={handleInterviewDelete}
            onStatusChange={handleInterviewStatusChange}
            initialSelectedDate={targetInterviewDate}
            reminders={allActiveReminders}
            onDismissReminder={handleDismissReminder}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView
            analytics={analytics}
            applications={applications}
            loading={dataLoading}
          />
        )}
      </main>

      {/* Modals */}
      <ApplicationModal
        isOpen={isAppModalOpen}
        onClose={() => {
          setIsAppModalOpen(false);
          setEditingApp(null);
        }}
        onSubmit={handleApplicationSubmit}
        initialData={editingApp}
      />

      <InterviewModal
        isOpen={isInterviewModalOpen}
        onClose={() => {
          setIsInterviewModalOpen(false);
          setEditingInterview(null);
          setScheduleDefaultAppId(undefined);
          setScheduleDefaultDate(undefined);
        }}
        onSubmit={handleInterviewSubmit}
        applications={applications}
        initialData={editingInterview}
        defaultApplicationId={scheduleDefaultAppId}
        defaultDate={scheduleDefaultDate}
      />

      <ApplicationDetailModal
        applicationId={detailAppId}
        isOpen={detailAppId !== null}
        onClose={() => setDetailAppId(null)}
        onEdit={(app) => {
          setEditingApp(app);
          setIsAppModalOpen(true);
        }}
        onDelete={handleAppDelete}
        onScheduleInterview={(appId) => {
          setEditingInterview(null);
          setScheduleDefaultAppId(appId);
          setIsInterviewModalOpen(true);
        }}
        onStatusChange={handleAppStatusChange}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HireTrackMain />
    </AuthProvider>
  );
}
