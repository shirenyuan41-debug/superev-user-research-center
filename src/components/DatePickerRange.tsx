import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isWithinInterval,
  isBefore,
  isAfter
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  placeholder?: string;
}

export const DateRangePicker = ({ value, onChange, className, placeholder = '选择日期范围' }: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleDayClick = (day: Date) => {
    if (!value.from || (value.from && value.to)) {
      onChange({ from: day, to: null });
    } else if (value.from && !value.to) {
      if (isBefore(day, value.from)) {
        onChange({ from: day, to: value.from });
      } else {
        onChange({ from: value.from, to: day });
      }
    }
  };

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50 rounded-t-lg">
        <button 
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1 hover:bg-slate-200 rounded-full transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>
        <span className="text-sm font-semibold text-slate-700">
          {format(currentMonth, 'yyyy年 MMMM', { locale: zhCN })}
        </span>
        <button 
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1 hover:bg-slate-200 rounded-full transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map(day => (
          <div key={day} className="text-center text-[10px] font-bold text-slate-400 py-1 uppercase">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    const allDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 overflow-hidden rounded-b-lg">
        {allDays.map((d, i) => {
          const isSelected = (value.from && isSameDay(d, value.from)) || (value.to && isSameDay(d, value.to));
          const isInRange = value.from && value.to && isWithinInterval(d, { start: value.from, end: value.to });
          const isCurrentMonth = isSameMonth(d, monthStart);

          return (
            <div
              key={i}
              className={cn(
                "h-8 flex items-center justify-center text-xs cursor-pointer transition-all",
                !isCurrentMonth ? "text-slate-300 bg-white" : "text-slate-700 bg-white hover:bg-green-50",
                isSelected ? "bg-[#00A854] text-white hover:bg-[#00A854]" : "",
                isInRange ? "bg-green-50 text-[#00A854]" : ""
              )}
              onClick={() => handleDayClick(d)}
            >
              {format(d, 'd')}
            </div>
          );
        })}
      </div>
    );
  };

  const getDisplayText = () => {
    if (value.from && value.to) {
      return `${format(value.from, 'yyyy-MM-dd')} ~ ${format(value.to, 'yyyy-MM-dd')}`;
    }
    if (value.from) {
      return `${format(value.from, 'yyyy-MM-dd')} ~ ...`;
    }
    return placeholder;
  };

  return (
    <div className={cn("relative group", className)}>
      <div 
        className={cn(
          "w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-sm flex items-center justify-between cursor-pointer transition-all hover:border-[#00A854]",
          isOpen ? "ring-2 ring-[#00A854] border-transparent" : ""
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className="w-4 h-4 text-slate-400" />
          <span className={cn(!value.from ? "text-slate-400" : "text-slate-700 font-medium")}>
            {getDisplayText()}
          </span>
        </div>
        <div className="flex items-center">
          {value.from ? (
            <button 
              className="p-1 opacity-0 group-hover:opacity-100 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-500 rounded-full text-slate-400 transition-all ml-1"
              onClick={(e) => {
                e.stopPropagation();
                onChange({ from: null, to: null });
              }}
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <div className="w-5" />
          )}
        </div>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-xl z-50 w-64 animate-in fade-in zoom-in duration-200">
            {renderHeader()}
            <div className="p-2">
              {renderDays()}
              {renderCells()}
            </div>
            <div className="p-2 border-t border-slate-100 flex justify-end gap-2">
              <button 
                className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700"
                onClick={() => {
                  onChange({ from: null, to: null });
                  setIsOpen(false);
                }}
              >
                清空
              </button>
              <button 
                className="px-3 py-1 text-xs bg-[#00A854] text-white rounded hover:bg-[#009048]"
                onClick={() => setIsOpen(false)}
              >
                确定
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
