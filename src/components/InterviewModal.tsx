import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Video, User, Link as LinkIcon, Building2, Briefcase, FileText, CheckCircle2, Bell } from 'lucide-react';
import { Interview, JobApplication, InterviewType, InterviewRound, InterviewStatus } from '../types.ts';

interface InterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Interview>) => Promise<void>;
  applications: JobApplication[];
  initialData?: Interview | null;
  defaultApplicationId?: number;
  defaultDate?: string;
}

export function InterviewModal({
  isOpen,
  onClose,
  onSubmit,
  applications,
  initialData,
  defaultApplicationId,
  defaultDate,
}: InterviewModalProps) {
  const [selectedAppId, setSelectedAppId] = useState<number | ''>('');
  const [companyName, setCompanyName] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [interviewDate, setInterviewDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [interviewTime, setInterviewTime] = useState('14:00');
  const [interviewType, setInterviewType] = useState<InterviewType>('Online');
  const [round, setRound] = useState<InterviewRound>('Technical');
  const [interviewer, setInterviewer] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<InterviewStatus>('Scheduled');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setSelectedAppId(initialData.applicationId);
      setCompanyName(initialData.companyName || '');
      setJobRole(initialData.jobRole || '');
      setInterviewDate(initialData.interviewDate || defaultDate || new Date().toISOString().split('T')[0]);
      setInterviewTime(initialData.interviewTime || '14:00');
      setInterviewType(initialData.interviewType || 'Online');
      setRound(initialData.round || 'Technical');
      setInterviewer(initialData.interviewer || '');
      setMeetingLink(initialData.meetingLink || '');
      setNotes(initialData.notes || '');
      setStatus(initialData.status || 'Scheduled');
    } else {
      const defaultId = defaultApplicationId || (applications.length > 0 ? applications[0].id : '');
      setSelectedAppId(defaultId);
      const app = applications.find((a) => a.id === defaultId);
      setCompanyName(app ? app.companyName : '');
      setJobRole(app ? app.jobTitle : '');
      setInterviewDate(defaultDate || new Date().toISOString().split('T')[0]);
      setInterviewTime('14:00');
      setInterviewType('Online');
      setRound('Technical');
      setInterviewer('');
      setMeetingLink('');
      setNotes('');
      setStatus('Scheduled');
    }
    setError(null);
  }, [initialData, defaultApplicationId, defaultDate, applications, isOpen]);

  const handleAppChange = (appIdStr: string) => {
    const id = parseInt(appIdStr, 10);
    setSelectedAppId(id);
    const matched = applications.find((a) => a.id === id);
    if (matched) {
      setCompanyName(matched.companyName);
      setJobRole(matched.jobTitle);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId || !companyName.trim() || !jobRole.trim() || !interviewDate || !interviewTime) {
      setError('Please select an application and fill in company, role, date, and time.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit({
        applicationId: typeof selectedAppId === 'number' ? selectedAppId : parseInt(selectedAppId, 10),
        companyName: companyName.trim(),
        jobRole: jobRole.trim(),
        interviewDate,
        interviewTime,
        interviewType,
        round,
        interviewer: interviewer.trim() || null,
        meetingLink: meetingLink.trim() || null,
        notes: notes.trim() || null,
        status,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule interview');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div
        id="modal-interview-container"
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {initialData ? 'Edit Interview Details' : 'Schedule Interview Round'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage interview schedule, rounds, interviewers, and meeting links.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Linked Application */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Associated Job Application <span className="text-rose-500">*</span>
            </label>
            <select
              id="select-interview-application"
              value={selectedAppId}
              onChange={(e) => handleAppChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500 dark:text-white outline-none"
            >
              <option value="" disabled>Select an Application...</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.companyName} — {app.jobTitle} ({app.status})
                </option>
              ))}
            </select>
          </div>

          {/* Company & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  id="input-interview-company"
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Role / Position
              </label>
              <div className="relative">
                <Briefcase className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  id="input-interview-role"
                  type="text"
                  required
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Date, Time, Type, Round */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-interview-date"
                type="date"
                required
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white outline-none"
              />
              <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center space-x-1 mt-0.5">
                <Bell className="w-2.5 h-2.5" />
                <span>1-day advance intimation alert</span>
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Time <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-interview-time"
                type="time"
                required
                value={interviewTime}
                onChange={(e) => setInterviewTime(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Interview Type
              </label>
              <select
                id="select-interview-type"
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value as InterviewType)}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white outline-none"
              >
                <option value="Online">Online</option>
                <option value="Phone">Phone</option>
                <option value="In-person">In-person</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Round
              </label>
              <select
                id="select-interview-round"
                value={round}
                onChange={(e) => setRound(e.target.value as InterviewRound)}
                className="w-full px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white outline-none"
              >
                <option value="HR">HR</option>
                <option value="Technical">Technical</option>
                <option value="Managerial">Managerial</option>
                <option value="Final">Final</option>
              </select>
            </div>
          </div>

          {/* Interviewer & Meeting Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Interviewer(s)
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  id="input-interview-interviewer"
                  type="text"
                  placeholder="e.g. John (Tech Lead), Sarah (HR)"
                  value={interviewer}
                  onChange={(e) => setInterviewer(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Meeting Link
              </label>
              <div className="relative">
                <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  id="input-interview-link"
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white outline-none"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Interview Status
            </label>
            <select
              id="select-interview-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as InterviewStatus)}
              className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white outline-none"
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Passed">Passed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Interview Notes & Preparation
            </label>
            <textarea
              id="textarea-interview-notes"
              rows={3}
              placeholder="e.g. Prepared SQL joins, Python pandas scenarios, and questions for interviewer about company architecture."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg dark:text-white outline-none resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-interview-submit"
              type="submit"
              disabled={submitting}
              className="flex items-center space-x-1.5 px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : initialData ? 'Update Interview' : 'Save Interview'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
