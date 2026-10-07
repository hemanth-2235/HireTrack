import React, { useState, useRef, useEffect } from 'react';
import { Building2, Briefcase, Video, Clock, User, Calendar, ExternalLink, ShieldCheck, Bell } from 'lucide-react';
import { Interview, InterviewType } from '../types.ts';

interface InterviewHoverTooltipProps {
  interview: Interview;
  formatTime: (timeStr: string) => string;
  formatDisplayDate?: (dateStr: string) => string;
  getTypeIcon?: (type: InterviewType) => React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'auto';
  className?: string;
}

export function InterviewHoverTooltip({
  interview,
  formatTime,
  formatDisplayDate,
  getTypeIcon,
  children,
  position = 'auto',
  className = '',
}: InterviewHoverTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placement: 'top' | 'bottom' }>({
    top: 0,
    left: 0,
    placement: 'top',
  });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateTooltipPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 280;
    const tooltipHeight = 170;

    let placement: 'top' | 'bottom' = 'top';
    if (position === 'auto') {
      // If not enough room on top, show on bottom
      if (rect.top < tooltipHeight + 12) {
        placement = 'bottom';
      } else {
        placement = 'top';
      }
    } else {
      placement = position;
    }

    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    // Keep within viewport horizontal bounds
    if (left < 10) left = 10;
    if (left + tooltipWidth > window.innerWidth - 10) {
      left = window.innerWidth - tooltipWidth - 10;
    }

    const top = placement === 'top' ? rect.top - 8 : rect.bottom + 8;

    setCoords({ top, left, placement });
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      updateTooltipPosition();
      setIsVisible(true);
    }, 120); // Responsive debounce
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-block w-full ${className}`}
    >
      {children}

      {isVisible && (
        <div
          style={{
            position: 'fixed',
            top: coords.placement === 'top' ? undefined : coords.top,
            bottom: coords.placement === 'top' ? window.innerHeight - coords.top : undefined,
            left: coords.left,
            zIndex: 9999,
            width: '280px',
          }}
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setIsVisible(true);
          }}
          onMouseLeave={handleMouseLeave}
          className="pointer-events-auto bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white p-3.5 rounded-xl border border-slate-700/80 shadow-2xl shadow-slate-950/60 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header: Company Name & Round */}
          {(() => {
            if (interview.status !== 'Scheduled' || !interview.interviewDate) return null;
            const [y, m, d] = interview.interviewDate.split('-').map(Number);
            const target = new Date(y, m - 1, d);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
              return (
                <div className="mb-2 px-2 py-1 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-extrabold flex items-center space-x-1.5 animate-pulse">
                  <Bell className="w-3 h-3 text-amber-400" />
                  <span>1-Day Reminder: Scheduled for Tomorrow!</span>
                </div>
              );
            }
            if (diffDays === 0) {
              return (
                <div className="mb-2 px-2 py-1 rounded bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[10px] font-extrabold flex items-center space-x-1.5 animate-pulse">
                  <Bell className="w-3 h-3 text-rose-400" />
                  <span>Interview Reminder: Happening Today!</span>
                </div>
              );
            }
            return null;
          })()}

          {/* Header: Company Name & Round */}
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center space-x-1.5 text-blue-400">
                <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                <h4 className="font-extrabold text-xs text-white truncate">{interview.companyName}</h4>
              </div>
              <div className="flex items-center space-x-1 text-slate-300 text-[11px] truncate">
                <Briefcase className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <span className="truncate">{interview.jobRole}</span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 flex-shrink-0">
              {interview.round}
            </span>
          </div>

          {/* Body Info: Date, Time, Type & Interviewer */}
          <div className="py-2 space-y-1.5 text-[11px] text-slate-300">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span className="text-slate-200 font-semibold">{formatTime(interview.interviewTime)}</span>
              </span>
              {formatDisplayDate && (
                <span className="flex items-center space-x-1 text-slate-400">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDisplayDate(interview.interviewDate)}</span>
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2 text-slate-300">
              <span className="inline-flex items-center space-x-1 bg-slate-800/80 px-1.5 py-0.5 rounded text-[10px] text-slate-300 border border-slate-700/60">
                {getTypeIcon ? getTypeIcon(interview.interviewType) : null}
                <span>{interview.interviewType}</span>
              </span>
              <span className="inline-flex items-center space-x-1 bg-slate-800/80 px-1.5 py-0.5 rounded text-[10px] text-slate-300 border border-slate-700/60">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>{interview.status}</span>
              </span>
            </div>

            {interview.interviewer && (
              <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] pt-0.5">
                <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <span className="truncate">Interviewer: {interview.interviewer}</span>
              </div>
            )}
          </div>

          {/* Meeting Link Footer */}
          <div className="pt-2 border-t border-slate-800/90 flex items-center justify-between">
            {interview.meetingLink ? (
              <a
                href={interview.meetingLink}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg shadow-sm transition-all w-full justify-center"
              >
                <Video className="w-3.5 h-3.5" />
                <span className="truncate">Join Meeting Link</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            ) : (
              <div className="flex items-center space-x-1 text-[11px] text-slate-400 italic">
                <Video className="w-3 h-3 opacity-50" />
                <span>No video meeting link provided</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
