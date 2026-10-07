import { getApplications } from './applications.ts';
import { getInterviews } from './interviews.ts';
import { AnalyticsOverview, ApplicationStatus } from '../types.ts';

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  Applied: '#3b82f6', // blue
  Shortlisted: '#8b5cf6', // purple
  Interview: '#f59e0b', // amber
  Offer: '#10b981', // emerald green
  Rejected: '#ef4444', // red
  Withdrawn: '#6b7280', // gray
};

export async function getAnalytics(userId: string): Promise<AnalyticsOverview> {
  const apps = await getApplications(userId);
  const userInterviews = await getInterviews(userId);

  const totalApplications = apps.length;

  // Applications this month
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const applicationsThisMonth = apps.filter((app) => app.applicationDate.startsWith(currentYearMonth)).length;

  // Counts by status
  let appliedCount = 0;
  let shortlistedCount = 0;
  let interviewCount = 0;
  let offerCount = 0;
  let rejectedCount = 0;
  let withdrawnCount = 0;

  const companyCounts: Record<string, number> = {};
  const monthCounts: Record<string, number> = {};

  for (const app of apps) {
    if (app.status === 'Applied') appliedCount++;
    else if (app.status === 'Shortlisted') shortlistedCount++;
    else if (app.status === 'Interview') interviewCount++;
    else if (app.status === 'Offer') offerCount++;
    else if (app.status === 'Rejected') rejectedCount++;
    else if (app.status === 'Withdrawn') withdrawnCount++;

    // Company
    const comp = app.companyName.trim();
    companyCounts[comp] = (companyCounts[comp] || 0) + 1;

    // Month (e.g. 2026-09 -> Sep 2026 or month name)
    if (app.applicationDate) {
      const ym = app.applicationDate.slice(0, 7);
      monthCounts[ym] = (monthCounts[ym] || 0) + 1;
    }
  }

  // Interview metrics
  const totalInterviews = userInterviews.length;
  const completedInterviews = userInterviews.filter((i) => i.status === 'Completed' || i.status === 'Passed').length;
  const upcomingInterviews = userInterviews.filter((i) => i.status === 'Scheduled').length;

  // Conversion metrics as defined in blueprint:
  // Interview conversion rate = (Interviews / Total Applications) * 100
  // Offer conversion rate = (Offers / Total Applications) * 100
  // Note: apps that reached interview status or have recorded interviews
  const applicationsWithInterviewStage = apps.filter(
    (a) => a.status === 'Interview' || a.status === 'Offer'
  ).length;
  const interviewConversionRate = totalApplications > 0
    ? Math.round((Math.max(interviewCount + offerCount, totalInterviews > 0 ? 1 : 0) / totalApplications) * 100)
    : 0;

  const offerConversionRate = totalApplications > 0
    ? Math.round((offerCount / totalApplications) * 100)
    : 0;

  const statusDistribution = (['Applied', 'Shortlisted', 'Interview', 'Offer', 'Rejected', 'Withdrawn'] as ApplicationStatus[]).map(
    (status) => ({
      status,
      count:
        status === 'Applied'
          ? appliedCount
          : status === 'Shortlisted'
          ? shortlistedCount
          : status === 'Interview'
          ? interviewCount
          : status === 'Offer'
          ? offerCount
          : status === 'Rejected'
          ? rejectedCount
          : withdrawnCount,
      color: STATUS_COLORS[status],
    })
  );

  // Sort monthly distribution
  const sortedMonths = Object.keys(monthCounts).sort();
  const monthlyDistribution = sortedMonths.map((ym) => {
    const [y, m] = ym.split('-');
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, 1);
    const monthName = dateObj.toLocaleString('en-US', { month: 'short' });
    return {
      month: `${monthName} ${y.slice(2)}`,
      count: monthCounts[ym],
    };
  });

  // Top companies
  const topCompanies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([company, count]) => ({ company, count }));

  // Application Funnel: Applications -> Shortlisted -> Interviews -> Offers
  const shortlistedOrHigher = shortlistedCount + interviewCount + offerCount;
  const interviewsOrHigher = interviewCount + offerCount;
  const offersCountTotal = offerCount;

  const funnelData = [
    {
      stage: 'Total Applications',
      count: totalApplications,
      percentage: 100,
    },
    {
      stage: 'Shortlisted & Above',
      count: shortlistedOrHigher,
      percentage: totalApplications > 0 ? Math.round((shortlistedOrHigher / totalApplications) * 100) : 0,
    },
    {
      stage: 'Interviews & Above',
      count: interviewsOrHigher,
      percentage: totalApplications > 0 ? Math.round((interviewsOrHigher / totalApplications) * 100) : 0,
    },
    {
      stage: 'Offers Received',
      count: offersCountTotal,
      percentage: totalApplications > 0 ? Math.round((offersCountTotal / totalApplications) * 100) : 0,
    },
  ];

  return {
    totalApplications,
    applicationsThisMonth,
    appliedCount,
    shortlistedCount,
    interviewCount,
    offerCount,
    rejectedCount,
    withdrawnCount,
    totalInterviews,
    upcomingInterviews,
    completedInterviews,
    interviewConversionRate,
    offerConversionRate,
    statusDistribution,
    monthlyDistribution,
    topCompanies,
    funnelData,
  };
}
