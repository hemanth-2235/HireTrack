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
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Award,
  Calendar,
  Layers,
  PieChart as PieIcon,
  BarChart2,
  CheckCircle2,
  Lightbulb,
  Building2,
} from 'lucide-react';
import { AnalyticsOverview, JobApplication } from '../types.ts';

interface AnalyticsViewProps {
  analytics: AnalyticsOverview | null;
  applications: JobApplication[];
  loading: boolean;
}

export function AnalyticsView({ analytics, applications, loading }: AnalyticsViewProps) {
  // Aggregate company frequency
  const companyCounts = applications.reduce((acc, app) => {
    acc[app.companyName] = (acc[app.companyName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCompanies = Object.entries(companyCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const statusData = analytics?.statusDistribution || [];
  const monthlyData = analytics?.monthlyDistribution || [];
  const funnelData = analytics?.funnelData || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
          Application Analytics & Performance
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Data-driven insights, conversion rates, and monthly pipeline trajectories calculated via PostgreSQL.
        </p>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Submissions</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {analytics?.totalApplications || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across all tracked job boards</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Interview Conversion</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
            {analytics?.interviewConversionRate ?? 0}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {analytics?.interviewCount ?? 0} interviews / {analytics?.totalApplications || 1} apps
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Offer Conversion</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {analytics?.offerConversionRate ?? 0}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {analytics?.offerCount ?? 0} offers received
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Active In-Pipeline</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
            {(analytics?.appliedCount || 0) +
              (analytics?.shortlistedCount || 0) +
              (analytics?.interviewCount || 0)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Applied + Shortlist + Interview</p>
        </div>
      </div>

      {/* Visual Charts: Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <PieIcon className="w-4 h-4 text-blue-500" />
              <span>Application Status Breakdown</span>
            </h3>
            <span className="text-[11px] text-slate-400">Share of Total</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-xs text-slate-700 dark:text-slate-300">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No status data available</p>
            )}
          </div>
        </div>

        {/* Monthly Application Trend Line / Bar */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-indigo-500" />
              <span>Monthly Application Volume</span>
            </h3>
            <span className="text-[11px] text-slate-400">Submission Velocity</span>
          </div>

          <div className="h-64 w-full">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
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
                  <Bar dataKey="applications" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No monthly data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visual Charts: Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recruitment Funnel Visualizer */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Recruitment Conversion Funnel
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Stages through which applications progress
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {funnelData.map((step, idx) => (
              <div key={step.stage} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-slate-800 dark:text-slate-200">{step.stage}</span>
                  </div>
                  <span className="text-slate-900 dark:text-white font-mono">
                    {step.count} ({step.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden">
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
                    style={{ width: `${Math.max(4, step.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Target Companies & Strategic Insights */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              <span>Target Company Activity</span>
            </h3>
            <span className="text-[11px] text-slate-400">Application count</span>
          </div>

          <div className="space-y-2.5">
            {topCompanies.map((c, i) => (
              <div
                key={c.name}
                className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px]">
                    {i + 1}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{c.name}</span>
                </div>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {c.count} {c.count === 1 ? 'application' : 'applications'}
                </span>
              </div>
            ))}
            {topCompanies.length === 0 && (
              <p className="text-xs text-slate-400 py-4 text-center">No company records yet.</p>
            )}
          </div>

          {/* Actionable Strategy Tip */}
          <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200/80 dark:border-amber-900/40 flex items-start space-x-2.5 text-xs">
            <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-amber-900 dark:text-amber-300">
                Strategic Recommendation:
              </span>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                Aim for an interview conversion rate of at least 15%–20%. Follow up on applications that have been in &quot;Applied&quot; status for over 7 business days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
