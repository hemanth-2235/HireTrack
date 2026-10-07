import { Briefcase, BarChart3, Calendar, Layers, Database, LogOut, Sparkles, Plus, UserCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { ReminderNotificationCenter } from './ReminderNotificationCenter.tsx';
import { ReminderNotification } from '../services/reminderService.ts';

interface NavbarProps {
  currentTab: 'dashboard' | 'applications' | 'interviews' | 'analytics';
  onSelectTab: (tab: 'dashboard' | 'applications' | 'interviews' | 'analytics') => void;
  onOpenAddModal: () => void;
  onOpenScheduleModal: () => void;
  reminders?: ReminderNotification[];
  onDismissReminder?: (id: string) => void;
  onNavigateToInterviewDate?: (dateStr?: string) => void;
}

export function Navbar({
  currentTab,
  onSelectTab,
  onOpenAddModal,
  onOpenScheduleModal,
  reminders = [],
  onDismissReminder = () => {},
  onNavigateToInterviewDate = () => {},
}: NavbarProps) {
  const { user, isDemo, logout, loginWithGoogle, loginDemo } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Main Title */}
          <div className="flex items-center space-x-8">
            <div
              id="brand-logo-hiretrack"
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center space-x-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 group-hover:bg-blue-500 transition-colors">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                    HireTrack
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    PostgreSQL
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 hidden sm:inline leading-none">
                  Job Application Management
                </span>
              </div>
            </div>

            {/* Navigation tabs */}
            {user && (
              <nav className="hidden md:flex items-center space-x-1">
                <button
                  id="nav-tab-dashboard"
                  onClick={() => onSelectTab('dashboard')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentTab === 'dashboard'
                      ? 'bg-slate-800 text-blue-400 font-semibold shadow-inner'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>

                <button
                  id="nav-tab-applications"
                  onClick={() => onSelectTab('applications')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentTab === 'applications'
                      ? 'bg-slate-800 text-blue-400 font-semibold shadow-inner'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Applications</span>
                </button>

                <button
                  id="nav-tab-interviews"
                  onClick={() => onSelectTab('interviews')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentTab === 'interviews'
                      ? 'bg-slate-800 text-blue-400 font-semibold shadow-inner'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Interviews</span>
                </button>

                <button
                  id="nav-tab-analytics"
                  onClick={() => onSelectTab('analytics')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentTab === 'analytics'
                      ? 'bg-slate-800 text-blue-400 font-semibold shadow-inner'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                </button>
              </nav>
            )}
          </div>

          {/* Right Action & User Controls */}
          <div className="flex items-center space-x-3">
            {user ? (
              <>
                {/* Reminders notification bell for 1-day advance and upcoming notices */}
                <ReminderNotificationCenter
                  reminders={reminders}
                  onDismiss={onDismissReminder}
                  onNavigateToInterviews={(targetDate) => {
                    onSelectTab('interviews');
                    if (targetDate) onNavigateToInterviewDate(targetDate);
                  }}
                />

                <button
                  id="header-btn-add-application"
                  onClick={onOpenAddModal}
                  className="hidden sm:flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Application</span>
                </button>

                <div className="flex items-center pl-2 border-l border-slate-800 space-x-2">
                  <div className="flex flex-col text-right hidden sm:flex">
                    <span className="text-xs font-medium text-slate-200 truncate max-w-[150px]">
                      {user.name || user.email}
                    </span>
                    <span className="text-[10px] text-emerald-400 flex items-center justify-end space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>{isDemo ? 'Guest Mode' : 'Cloud SQL'}</span>
                    </span>
                  </div>

                  <button
                    id="btn-logout"
                    onClick={logout}
                    title="Sign Out"
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  id="btn-login-demo"
                  onClick={loginDemo}
                  className="flex items-center space-x-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-lg transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Continue as Guest</span>
                </button>
                <button
                  id="btn-login-google"
                  onClick={loginWithGoogle}
                  className="flex items-center space-x-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium px-3.5 py-2 rounded-lg transition-all shadow-sm"
                >
                  <UserCircle2 className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        {user && (
          <div className="flex md:hidden border-t border-slate-800/80 py-2 justify-around">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`text-xs px-2.5 py-1.5 rounded-md flex items-center space-x-1 ${
                currentTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => onSelectTab('applications')}
              className={`text-xs px-2.5 py-1.5 rounded-md flex items-center space-x-1 ${
                currentTab === 'applications' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Apps</span>
            </button>
            <button
              onClick={() => onSelectTab('interviews')}
              className={`text-xs px-2.5 py-1.5 rounded-md flex items-center space-x-1 ${
                currentTab === 'interviews' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Interviews</span>
            </button>
            <button
              onClick={() => onSelectTab('analytics')}
              className={`text-xs px-2.5 py-1.5 rounded-md flex items-center space-x-1 ${
                currentTab === 'analytics' ? 'bg-blue-600 text-white' : 'text-slate-400'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
