import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronRight, ChevronLeft } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfDay, addDays } from 'date-fns';

interface DatePickerProps {
  checkIn: string;
  checkOut: string;
  onCheckInChange: (date: string) => void;
  onCheckOutChange: (date: string) => void;
  className?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectingCheckOut, setSelectingCheckOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const checkInDate = checkIn ? new Date(checkIn) : null;
  const checkOutDate = checkOut ? new Date(checkOut) : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectingCheckOut(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateClick = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    
    if (!checkInDate || selectingCheckOut) {
      if (!checkInDate) {
        onCheckInChange(dateString);
        setSelectingCheckOut(true);
      } else {
        if (isBefore(date, checkInDate)) {
          // If selected date is before check-in, make it the new check-in
          onCheckInChange(dateString);
          onCheckOutChange('');
          setSelectingCheckOut(true);
        } else {
          onCheckOutChange(dateString);
          setIsOpen(false);
          setSelectingCheckOut(false);
        }
      }
    } else {
      // Reset and start over
      onCheckInChange(dateString);
      onCheckOutChange('');
      setSelectingCheckOut(true);
    }
  };

  const handleQuickSelect = (days: number) => {
    const today = new Date();
    const checkInDate = format(today, 'yyyy-MM-dd');
    const checkOutDate = format(addDays(today, days), 'yyyy-MM-dd');
    
    onCheckInChange(checkInDate);
    onCheckOutChange(checkOutDate);
    setIsOpen(false);
    setSelectingCheckOut(false);
  };

  const isDateInRange = (date: Date) => {
    if (!checkInDate || !checkOutDate) return false;
    return date > checkInDate && date < checkOutDate;
  };

  const isDateDisabled = (date: Date) => {
    return isBefore(date, startOfDay(new Date()));
  };

  const renderCalendar = (monthOffset: number = 0) => {
    const month = addMonths(currentMonth, monthOffset);
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Add empty cells for days before month start
    const startDay = monthStart.getDay();
    const emptyCells = Array(startDay).fill(null);

    return (
     <div className="flex-1 min-w-0">
        {/* Month Header */}
        <div className="flex items-center justify-between mb-6">
          {monthOffset === 0 && (
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1 xs:p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="h-4 w-4 xs:h-5 xs:w-5 text-gray-600" />
            </button>
          )}
         {monthOffset === 0 && <div className="w-8"></div>}
          <h3 className="text-sm xs:text-base sm:text-lg font-semibold text-gray-900">
            {format(month, 'MMMM yyyy')}
          </h3>
         {monthOffset === 1 && <div className="w-8"></div>}
          {monthOffset === 1 && (
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1 xs:p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronRight className="h-4 w-4 xs:h-5 xs:w-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1 xs:mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
            <div key={day} className="text-center text-xs xs:text-sm font-medium text-gray-500 py-1 xs:py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {emptyCells.map((_, index) => (
            <div key={`empty-${index}`} className="h-10"></div>
          ))}
          {days.map((date) => {
            const isSelected = (checkInDate && isSameDay(date, checkInDate)) || 
                             (checkOutDate && isSameDay(date, checkOutDate));
            const isInRange = isDateInRange(date);
            const isDisabled = isDateDisabled(date);
            const isCurrentMonth = isSameMonth(date, month);
            const isCheckIn = checkInDate && isSameDay(date, checkInDate);
            const isCheckOut = checkOutDate && isSameDay(date, checkOutDate);
            const isTodayDate = isToday(date);

            return (
              <button
                key={date.toISOString()}
                onClick={() => !isDisabled && handleDateClick(date)}
                disabled={isDisabled}
                className={`
                  h-8 w-8 xs:h-10 xs:w-10 text-xs xs:text-sm transition-all duration-200 relative flex items-center justify-center
                  ${isDisabled 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : isCheckIn
                      ? 'bg-blue-600 text-white font-semibold'
                      : isCheckOut
                        ? 'bg-blue-600 text-white font-semibold'
                        : isInRange
                          ? 'bg-blue-50 text-blue-700'
                          : isCurrentMonth
                            ? 'text-gray-900 hover:bg-gray-100'
                            : 'text-gray-400'
                  }
                  ${isTodayDate && !isSelected ? 'font-semibold text-blue-600' : ''}
                `}
              >
                {format(date, 'd')}
                {isTodayDate && !isSelected && (
                  <div className="absolute bottom-0.5 xs:bottom-1 left-1/2 transform -translate-x-1/2 w-0.5 h-0.5 xs:w-1 xs:h-1 bg-blue-600 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Date Input Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Check-in */}
        <div>
          <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2">Check-in</label>
          <button
            onClick={() => {
              setIsOpen(true);
              setSelectingCheckOut(false);
            }}
            className="w-full flex items-center justify-between px-2 xs:px-3 sm:px-4 py-2 xs:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 text-xs xs:text-sm sm:text-base"
          >
            <span className={checkIn ? 'text-gray-900 font-medium' : 'text-gray-500'}>
              {checkIn ? format(new Date(checkIn), window.innerWidth < 375 ? 'MMM dd' : 'MMM dd, yyyy') : 'Select date'}
            </span>
            <Calendar className="h-4 w-4 xs:h-5 xs:w-5 text-gray-400" />
          </button>
        </div>

        {/* Check-out */}
        <div>
          <label className="block text-xs xs:text-sm font-medium text-gray-700 mb-1 xs:mb-2">Check-out</label>
          <button
            onClick={() => {
              setIsOpen(true);
              setSelectingCheckOut(true);
            }}
            className="w-full flex items-center justify-between px-2 xs:px-3 sm:px-4 py-2 xs:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white hover:border-gray-400 text-xs xs:text-sm sm:text-base"
          >
            <span className={checkOut ? 'text-gray-900 font-medium' : 'text-gray-500'}>
              {checkOut ? format(new Date(checkOut), window.innerWidth < 375 ? 'MMM dd' : 'MMM dd, yyyy') : 'Select date'}
            </span>
            <Calendar className="h-4 w-4 xs:h-5 xs:w-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Calendar Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 xs:mt-2 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden w-full sm:w-[680px] max-w-[98vw] xs:max-w-[95vw] sm:max-w-[90vw]">
          {/* Two months side by side */}
          <div className="flex flex-col sm:flex-row sm:space-x-8 p-2 xs:p-4 sm:p-6 sm:min-w-[600px]">
            {renderCalendar(0)}
            <div className="hidden sm:block">
              {renderCalendar(1)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
