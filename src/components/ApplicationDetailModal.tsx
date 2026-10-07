import { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  ExternalLink,
  Mail,
  User,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Video,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { JobApplication, Interview, ApplicationStatus } from '../types.ts';
import { ApiService } from '../services/api.ts';

interface ApplicationDetailModalProps {
  applicationId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (app: JobApplication) => void;
  onDelete: (id: number) => void;
  onScheduleInterview: (appId: number) => void;
  onStatusChange: (id: number, status: ApplicationStatus) => void;
}

export function ApplicationDetailModal({
  applicationId,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onScheduleInterview,
  onStatusChange,
}: ApplicationDetailModalProps) {
  const [appData, setAppData] = useState<(JobApplication & { interviews?: Interview[] }) | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (applicationId && isOpen) {
      setLoading(true);
      ApiService.getApplicationById(applicationId)
        .then((data) => setAppData(data))
        .catch((err) => console.error('Error fetching detail:', err))
        .finally(() => setLoading(false));
    } else {
      setAppData(null);
    }
  }, [applicationId, isOpen]);

  if (!isOpen || !applicationId) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div
        id="modal-application-detail"
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          {loading || !appData ? (
            <div className="py-2 animate-pulse text-sm text-slate-400">Loading details...</div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {appData.jobTitle}
                </h2>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                    appData.status
                  )}`}
                >
                  {appData.status}
                </span>
              </div>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center space-x-2">
                <Building2 className="w-4 h-4" />
                <span>{appData.companyName}</span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-slate-500 dark:text-slate-400 font-normal">{appData.location}</span>
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {appData && (
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 block">Job Type</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{appData.jobType}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 block">Applied Date</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{appData.applicationDate}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 block">Compensation</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {appData.salary || 'Not specified'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 block">Post Link</span>
                {appData.jobUrl ? (
                  <a
                    href={appData.jobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 truncate"
                  >
                    <span>Visit Link</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">None</span>
                )}
              </div>
            </div>

            {/* Application Status Progression Switcher */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Update Pipeline Status
              </label>
              <div className="flex flex-wrap gap-2">
                {(['Applied', 'Shortlisted', 'Interview', 'Offer', 'Rejected', 'Withdrawn'] as ApplicationStatus[]).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => {
                        onStatusChange(appData.id, st);
                        setAppData({ ...appData, status: st });
                      }}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                        appData.status === st
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-blue-400'
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Recruiter & Contact Card */}
            {(appData.recruiterName || appData.recruiterEmail) && (
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 mb-2 flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Recruiter Information</span>
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {appData.recruiterName || 'Recruiter'}
                    </span>
                  </div>
                  {appData.recruiterEmail && (
                    <a
                      href={`mailto:${appData.recruiterEmail}?subject=Application for ${encodeURIComponent(
                        appData.jobTitle
                      )} - Follow up`}
                      className="inline-flex items-center space-x-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{appData.recruiterEmail}</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Notes and Follow-ups */}
            {appData.notes && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Notes & Follow-up Plan
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {appData.notes}
                </p>
              </div>
            )}

            {/* Associated Interviews */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Interview Rounds ({appData.interviews?.length || 0})</span>
                </h3>
                <button
                  onClick={() => onScheduleInterview(appData.id)}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Round</span>
                </button>
              </div>

              {appData.interviews && appData.interviews.length > 0 ? (
                <div className="space-y-2">
                  {appData.interviews.map((iv) => (
                    <div
                      key={iv.id}
                      className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {iv.round} Round ({iv.interviewType})
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-semibold border border-amber-200 dark:border-amber-800">
                            {iv.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-2">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{iv.interviewDate} at {iv.interviewTime}</span>
                          {iv.interviewer && (
                            <>
                              <span>•</span>
                              <span>With {iv.interviewer}</span>
                            </>
                          )}
                        </p>
                      </div>

                      {iv.meetingLink && (
                        <a
                          href={iv.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 text-xs px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-semibold rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors self-start sm:self-auto"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Meeting</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                  No interview rounds scheduled yet. Click &quot;Add Round&quot; to track interviews.
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  onDelete(appData.id);
                  onClose();
                }}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 p-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Application</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    onEdit(appData);
                    onClose();
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
