import { useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Award,
  XCircle,
  TrendingUp,
  Calendar,
  ArrowRight,
  Plus,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Building2,
  MapPin,
  Bell,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { JobApplication, Interview, AnalyticsOverview, ApplicationStatus } from '../types.ts';
import { ReminderNotification } from '../services/reminderService.ts';
import { ReminderAlertBanner } from './ReminderAlertBanner.tsx';

interface DashboardViewProps {
  applications: JobApplication[];
  interviews: Interview[];
  analytics: AnalyticsOverview | null;
  loading: boolean;
  onSelectApplication: (id: number) => void;
  onOpenAddModal: () => void;
  onOpenScheduleModal: (appId?: number) => void;
  onStatusChange: (id: number, status: ApplicationStatus) => void;
  onNavigateTab: (tab: 'applications' | 'interviews' | 'analytics') => void;
  reminders?: ReminderNotification[];
  onDismissReminder?: (id: string) => void;
  onNavigateToInterviewDate?: (dateStr?: string) => void;
}

export function DashboardView({
  applications,
  interviews,
  analytics,
  loading,
  onSelectApplication,
  onOpenAddModal,
  onOpenScheduleModal,
  onStatusChange,
  onNavigateTab,
  reminders = [],
  onDismissReminder = () => {},
  onNavigateToInterviewDate = () => {},
}: DashboardViewProps) {
  const [statusMenuOpenId, setStatusMenuOpenId] = useState<number | null>(null);

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'Applied':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Shortlisted':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Interview':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Offer':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Rejected':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      case 'Withdrawn':
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const upcomingInterviews = interviews.filter((i) => i.status === 'Scheduled').slice(0, 3);
  const recentApplications = applications.slice(0, 6);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-bold tracking-widest text-blue-400 bg-blue-950/80 px-2.5 py-1 rounded-full border border-blue-800">
              Overview Dashboard
            </span>
            <span className="text-xs text-slate-300">Live PostgreSQL Sync</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Job Search Command Center
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Track applications, upcoming interviews, recruiter follow-ups, and conversion metrics in one centralized platform.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="btn-dash-add-app"
            onClick={onOpenAddModal}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-102 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Add Application</span>
          </button>
          <button
            id="btn-dash-schedule-interview"
            onClick={() => onOpenScheduleModal()}
            className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition-all hover:scale-102 active:scale-98"
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Schedule Interview</span>
          </button>
        </div>
      </div>

      {/* 1-Day Before & Immediate Interview Reminders */}
      {reminders && reminders.length > 0 && (
        <ReminderAlertBanner
          reminders={reminders}
          onDismiss={onDismissReminder}
          onNavigateToInterviews={(targetDate) => {
            onNavigateTab('interviews');
            if (targetDate) onNavigateToInterviewDate(targetDate);
          }}
        />
      )}

      {/* Blueprint Primary Stats Row (Matching Section 6) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">Total Applications</span>
            <Briefcase className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {analytics?.totalApplications ?? applications.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">All recorded entries</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">Applied</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
            {analytics?.appliedCount ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Awaiting response</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-500 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">Shortlisted</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
            {analytics?.shortlistedCount ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Under review</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">Interviews</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
            {analytics?.interviewCount ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">In discussion</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">Offers</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {analytics?.offerCount ?? 0}
          </div>
          <div className="text-[10px] text-emerald-500 mt-1 font-medium">Offers received</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-rose-500 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold">Rejected</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
            {analytics?.rejectedCount ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Archived outcomes</div>
        </div>
      </div>

      {/* Conversion KPIs & Upcoming Interviews Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KPI: Conversion Rates (Section 13) */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Conversion Metrics</span>
            </h3>
            <button
              onClick={() => onNavigateTab('analytics')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
            >
              <span>View details</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Interview Conversion Rate */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Interview Conversion Rate
                </span>
                <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
                  {analytics?.interviewConversionRate ?? 0}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, analytics?.interviewConversionRate ?? 0)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                Interviews ÷ Total Applications × 100
              </p>
            </div>

            {/* Offer Conversion Rate */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Offer Conversion Rate
                </span>
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                  {analytics?.offerConversionRate ?? 0}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, analytics?.offerConversionRate ?? 0)}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                Offers ÷ Total Applications × 100
              </p>
            </div>
          </div>
        </div>

        {/* Upcoming Interviews Widget */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>Upcoming Interviews ({upcomingInterviews.length})</span>
            </h3>
            <button
              onClick={() => onNavigateTab('interviews')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
            >
              <span>Manage all</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {upcomingInterviews.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {upcomingInterviews.map((iv) => (
                <div
                  key={iv.id}
                  className="p-3.5 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-slate-800/80 dark:to-slate-800/40 rounded-xl border border-amber-200/60 dark:border-slate-700 flex flex-col justify-between space-y-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
                        {iv.round} Round
                      </span>
                      <span className="text-[11px] text-slate-400">{iv.interviewType}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {iv.companyName}
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                      {iv.jobRole}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-amber-100 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>
                      {iv.interviewDate} @ {iv.interviewTime}
                    </span>
                    {iv.meetingLink && (
                      <a
                        href={iv.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
              <Calendar className="w-6 h-6 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No upcoming interviews scheduled. Click below to add an upcoming round.
              </p>
              <button
                onClick={() => onOpenScheduleModal()}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                + Schedule Interview
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Application Overview Charts (Section 6 & 14) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Bar Chart */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Applications by Status
            </h3>
            <span className="text-[11px] text-slate-400">Current Funnel</span>
          </div>

          <div className="h-64 w-full">
            {analytics?.statusDistribution && analytics.statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.statusDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {analytics.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No application data recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Recruitment Funnel */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Application Funnel Progression
            </h3>
            <span className="text-[11px] text-slate-400">Conversion Steps</span>
          </div>

          <div className="space-y-3 pt-2">
            {analytics?.funnelData?.map((step, idx) => (
              <div key={step.stage} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-300">{step.stage}</span>
                  <span className="text-slate-900 dark:text-white font-bold">
                    {step.count} ({step.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      idx === 0
                        ? 'bg-blue-600'
                        : idx === 1
                        ? 'bg-purple-600'
                        : idx === 2
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${step.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Applications Table (Matching Section 6 Blueprint) */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Applications
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quick view of recent job submissions and statuses
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('applications')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
          >
            <span>View All ({applications.length})</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Company</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3 hidden sm:table-cell">Location</th>
                <th className="py-2.5 px-3 hidden md:table-cell">Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {recentApplications.map((app) => (
                <tr
                  key={app.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  onClick={() => onSelectApplication(app.id)}
                >
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold text-[10px]">
                      {app.companyName.charAt(0)}
                    </div>
                    <span>{app.companyName}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">
                    {app.jobTitle}
                  </td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400 hidden sm:table-cell">
                    {app.location || 'Remote'}
                  </td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400 hidden md:table-cell">
                    {app.applicationDate}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                        app.status
                      )}`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onSelectApplication(app.id)}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
              {recentApplications.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <p className="text-slate-500 dark:text-slate-400">
                        No job applications recorded yet. Start tracking your applications below.
                      </p>
                      <button
                        onClick={onOpenAddModal}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Your First Application</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
