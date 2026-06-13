import React from 'react';
import { Calendar, CheckCircle2, XCircle } from 'lucide-react';

interface CalendarViewProps {
  availableDates: string[]; // List of available dates (YYYY-MM-DD)
  onToggleDate?: (date: string) => void; // Provided for owner-role to toggle dates
  onSelectDate?: (date: string) => void; // Provided for company-role to choose a booking date
  selectedDate?: string; // Current selected booking date
  readOnly?: boolean; // If true, disable toggling/clicking outside selection
}

export default function CalendarView({
  availableDates,
  onToggleDate,
  onSelectDate,
  selectedDate,
  readOnly = false,
}: CalendarViewProps) {
  // We represent June 2026 for realistic matching with current metadata time (2026-06-13)
  const YEAR = 2026;
  const MONTH = 6;
  const MONTH_NAME = 'June';
  const DAYS_IN_MONTH = 30;

  // Generate ISO format strings for June days
  const daysArray = Array.from({ length: DAYS_IN_MONTH }, (_, i) => {
    const dayNum = i + 1;
    const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
    return {
      num: dayNum,
      iso: `${YEAR}-0${MONTH}-${dayStr}`,
    };
  });

  // Highlight days of week starting structure (June 1, 2026 was a Monday)
  // Monday = 1, Tuesday = 2, ..., Sunday = 7.
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleDayClick = (dayIso: string, isAvailable: boolean) => {
    if (readOnly) {
      if (onSelectDate && isAvailable) {
        onSelectDate(dayIso);
      }
    } else {
      if (onToggleDate) {
        onToggleDate(dayIso);
      }
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider font-display">
          <Calendar className="w-4 h-4 text-blue-600" /> {MONTH_NAME} {YEAR} Scheduler
        </h4>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-blue-100 border border-blue-300 rounded block" />
            <span className="text-slate-600">Available</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-slate-150 border border-slate-250 rounded block" />
            <span className="text-slate-600">Unavailable</span>
          </div>
          {selectedDate && (
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-rose-600 rounded block" />
              <span className="text-rose-600 font-semibold">Your Pick</span>
            </div>
          )}
        </div>
      </div>

      {readOnly ? (
        <p className="text-[11px] text-slate-500 mb-3">
          Select any highlighted <span className="text-blue-600 font-semibold">blue date</span> on this truck's plan to proceed with reservation.
        </p>
      ) : (
        <p className="text-[11px] text-slate-500 mb-3">
          Owner Mode: Click calendar grid blocks to toggle driver duty sessions on/off.
        </p>
      )}

      {/* Weekdays Row */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[10px] uppercase font-bold text-slate-400">
        {weekdays.map(w => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      {/* June Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysArray.map(day => {
          const isAvailable = availableDates.includes(day.iso);
          const isSelected = selectedDate === day.iso;

          // Compute style classes based on states
          const getBtnClasses = () => {
            if (isSelected) {
              return 'bg-rose-600 hover:bg-rose-700 text-white font-bold ring-2 ring-offset-1 ring-rose-500';
            }
            if (isAvailable) {
              return 'bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold border border-blue-200';
            }
            return 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100';
          };

          return (
            <button
              key={day.iso}
              id={`cal-day-${day.iso}`}
              type="button"
              disabled={readOnly && !isAvailable && !isSelected}
              onClick={() => handleDayClick(day.iso, isAvailable)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all relative ${getBtnClasses()}`}
            >
              <span>{day.num}</span>
              {/* Micro dot indicator */}
              {isAvailable && !isSelected && (
                <span className="absolute bottom-0.5 w-1 h-1 bg-blue-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
