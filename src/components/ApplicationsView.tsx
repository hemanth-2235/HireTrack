import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Building2,
  MapPin,
  Calendar,
  ExternalLink,
  DollarSign,
  MoreVertical,
  Edit2,
  Trash2,
  Clock,
  LayoutGrid,
  List,
  ChevronDown,
  User,
  Mail,
} from 'lucide-react';
import { JobApplication, ApplicationStatus, JobType } from '../types.ts';

interface ApplicationsViewProps {
  applications: JobApplication[];
  loading: boolean;
  onOpenAddModal: () => void;
  onSelectApplication: (id: number) => void;
  onEditApplication: (app: JobApplication) => void;
  onDeleteApplication: (id: number) => void;
  onStatusChange: (id: number, status: ApplicationStatus) => void;
  onScheduleInterview: (appId: number) => void;
}

export function ApplicationsView({
  applications,
  loading,
  onOpenAddModal,
  onSelectApplication,
  onEditApplication,
  onDeleteApplication,
  onStatusChange,
  onScheduleInterview,
}: ApplicationsViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [jobTypeFilter, setJobTypeFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);

  // Filter applications client-side for rapid interactive feel
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchSearch =
        !search.trim() ||
        app.companyName.toLowerCase().includes(search.toLowerCase()) ||
        app.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
        (app.location && app.location.toLowerCase().includes(search.toLowerCase())) ||
        (app.notes && app.notes.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = statusFilter === 'All' || app.status === statusFilter;
      const matchJobType = jobTypeFilter === 'All' || app.jobType === jobTypeFilter;

      return matchSearch && matchStatus && matchJobType;
    });
  }, [applications, search, statusFilter, jobTypeFilter]);

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

  const statusOptions: ApplicationStatus[] = [
    'Applied',
    'Shortlisted',
    'Interview',
    'Offer',
    'Rejected',
    'Withdrawn',
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Job Applications
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track, search, and update recruitment pipeline statuses across all target companies.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            id="btn-app-add-new"
            onClick={onOpenAddModal}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Application</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar (Section 10) */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              id="input-search-applications"
              type="text"
              placeholder="Search by company, job title, location, or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white outline-none"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            <select
              id="select-filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white outline-none"
            >
              <option value="All">All Statuses ({applications.length})</option>
              {statusOptions.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            <select
              id="select-filter-jobtype"
              value={jobTypeFilter}
              onChange={(e) => setJobTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white outline-none"
            >
              <option value="All">All Job Types</option>
              <option value="Full Time">Full Time</option>
              <option value="Part Time">Part Time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
              <option value="Remote">Remote</option>
            </select>

            {(search || statusFilter !== 'All' || jobTypeFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('All');
                  setJobTypeFilter('All');
                }}
                className="text-xs text-rose-500 hover:underline px-2"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Pill Buttons */}
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setStatusFilter('All')}
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
              statusFilter === 'All'
                ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900'
                : 'bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            }`}
          >
            All ({applications.length})
          </button>
          {statusOptions.map((st) => {
            const count = applications.filter((a) => a.status === st).length;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                {st} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/40">
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Role & Location</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Applied Date</th>
                  <th className="py-3 px-4">Salary</th>
                  <th className="py-3 px-4">Status & Pipeline</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredApps.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => onSelectApplication(app.id)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-xs">
                          {app.companyName.charAt(0)}
                        </div>
                        <div>
                          <span className="block font-bold">{app.companyName}</span>
                          {app.jobUrl && (
                            <a
                              href={app.jobUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[10px] text-blue-500 hover:underline inline-flex items-center space-x-0.5"
                            >
                              <span>Posting</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {app.jobTitle}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{app.location || 'Remote'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-medium">
                        {app.jobType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {app.applicationDate}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-emerald-600 dark:text-emerald-400">
                      {app.salary || '—'}
                    </td>

                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      {/* Status Dropdown to easily update status */}
                      <select
                        value={app.status}
                        onChange={(e) => onStatusChange(app.id, e.target.value as ApplicationStatus)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${getStatusBadge(
                          app.status
                        )}`}
                      >
                        {statusOptions.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => onScheduleInterview(app.id)}
                          title="Schedule Interview Round"
                          className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditApplication(app)}
                          title="Edit Application"
                          className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteApplication(app.id)}
                          title="Delete Application"
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredApps.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      {applications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <p className="text-slate-500 dark:text-slate-400">
                            No job applications recorded yet. Start logging your job applications to track your recruitment journey.
                          </p>
                          <button
                            onClick={onOpenAddModal}
                            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add First Application</span>
                          </button>
                        </div>
                      ) : (
                        'No applications match your filter criteria.'
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              onClick={() => onSelectApplication(app.id)}
              className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-all flex flex-col justify-between space-y-4 cursor-pointer group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-sm">
                      {app.companyName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {app.companyName}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {app.jobTitle}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                      app.status
                    )}`}
                  >
                    {app.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{app.location || 'Remote'}</span>
                    <span>•</span>
                    <span>{app.jobType}</span>
                  </div>

                  {app.salary && (
                    <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{app.salary}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Applied on {app.applicationDate}</span>
                  </div>
                </div>

                {app.notes && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg line-clamp-2 italic">
                    &quot;{app.notes}&quot;
                  </p>
                )}
              </div>

              {/* Card Footer Controls */}
              <div
                className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <select
                  value={app.status}
                  onChange={(e) => onStatusChange(app.id, e.target.value as ApplicationStatus)}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border outline-none cursor-pointer ${getStatusBadge(
                    app.status
                  )}`}
                >
                  {statusOptions.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onScheduleInterview(app.id)}
                    className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-800"
                    title="Schedule Interview"
                  >
                    <Clock className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onEditApplication(app)}
                    className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800"
                    title="Edit Application"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteApplication(app.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800"
                    title="Delete Application"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredApps.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              {applications.length === 0 ? (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <p className="text-slate-500 dark:text-slate-400">
                    No job applications recorded yet. Start logging your job applications to track your recruitment journey.
                  </p>
                  <button
                    onClick={onOpenAddModal}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add First Application</span>
                  </button>
                </div>
              ) : (
                'No applications match your filter criteria.'
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
