import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { CalendarService, Holiday } from '../services/calendarService';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  min,
  max,
  placeholder = 'Vyberte dA?tum',
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);

  // Na?TA?tanie sviatkov pre aktuA?lny rok
  useEffect(() => {
    const loadHolidays = async () => {
      setLoading(true);
      try {
        const year = currentMonth.getFullYear();
        const calendar = await CalendarService.getWorkCalendar(year);
        setHolidays(calendar.holidays);
      } catch (error) {
        console.error('Chyba pri na?TA?tanA? sviatkov:', error);
        setHolidays([]);
      } finally {
        setLoading(false);
      }
    };

    loadHolidays();
  }, [currentMonth.getFullYear()]);

  // Generovanie kalendA?ra pre aktuA?lny mesiac
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Na Slovensku za?TA?na tA?LldeL? pondelkom (1), nie nede?lou (0)
    // getDay() vracia 0=nede?la, 1=pondelok, ..., 6=sobota
    // Pre slovenskA? kalendA?r potrebujeme: 0=pondelok, 1=utorok, ..., 6=nede?la
    let firstDayOfWeek = firstDay.getDay();
    if (firstDayOfWeek === 0) firstDayOfWeek = 7; // Nede?la sa stA?va 7
    firstDayOfWeek = firstDayOfWeek - 1; // Posunieme o 1, aby pondelok bol 0
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDayOfWeek);
    
    const days = [];
    const currentDate = new Date(startDate);
    
    // Generujeme 6 tA?LldL?ov (42 dnA?) pre konzistentnA? layout
    for (let i = 0; i < 42; i++) {
      const dayInfo = CalendarService.getDayInfo(currentDate, holidays);
      
      days.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.toDateString() === new Date().toDateString(),
        isSelected: value === `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`,
        isWeekend: dayInfo.isWeekend,
        isHoliday: dayInfo.isHoliday,
        holidayName: dayInfo.holidayName || undefined,
        isDisabled: Boolean((min && currentDate < new Date(min)) || (max && currentDate > new Date(max)))
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const handleDateSelect = (date: Date) => {
    // PouLlijeme lokA?lny dA?tum namiesto UTC aby sme prediL?li posunu
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    onChange(dateString);
    setIsOpen(false);
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const formatDisplayValue = () => {
    if (!value) return '';
    return new Date(value).toLocaleDateString('sk-SK');
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className={`relative ${className}`}>
      {/* Input field */}
      <div className="relative">
        <input
          type="text"
          value={formatDisplayValue()}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-dark-700 text-gray-900 dark:text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
      </div>

      {/* Calendar dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-md shadow-lg z-50 min-w-[280px]">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-dark-600">
            <button
              onClick={() => handleMonthChange('prev')}
              className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {currentMonth.toLocaleDateString('sk-SK', { month: 'long', year: 'numeric' })}
            </h3>
            
            <button
              onClick={() => handleMonthChange('next')}
              className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Week days header */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-dark-600">
            {['Po', 'Ut', 'St', 'L?t', 'Pi', 'So', 'Ne'].map(day => (
              <div key={day} className="bg-white dark:bg-dark-800 p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-dark-600">
            {calendarDays.map((day, index) => {
              let bgColor = 'bg-white dark:bg-dark-800';
              let textColor = 'text-gray-900 dark:text-white';
              let borderColor = '';
              
              if (day.isSelected) {
                bgColor = 'bg-blue-500';
                textColor = 'text-white';
              } else if (day.isToday) {
                borderColor = 'border-2 border-blue-500';
              }
              
                             if (day.isWeekend) {
                 // ZelenA? pre vA?kendy
                 bgColor = day.isSelected ? 'bg-green-500' : 'bg-green-50 dark:bg-green-900/20';
                 textColor = day.isSelected ? 'text-white' : 'text-green-700 dark:text-green-300';
               } else if (day.isHoliday) {
                 // ?ServenA? pre sviatky (dni pracovnA?ho pokoja okrem vA?kendov)
                 bgColor = day.isSelected ? 'bg-red-500' : 'bg-red-50 dark:bg-red-900/20';
                 textColor = day.isSelected ? 'text-white' : 'text-red-700 dark:text-red-300';
               }
              
              if (day.isDisabled) {
                bgColor = 'bg-gray-100 dark:bg-dark-700';
                textColor = 'text-gray-400 dark:text-gray-500';
              }

              return (
                <button
                  key={index}
                  onClick={() => !day.isDisabled && handleDateSelect(day.date)}
                  disabled={day.isDisabled}
                  className={`
                    ${bgColor} ${textColor} ${borderColor}
                    p-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-dark-700
                    disabled:cursor-not-allowed disabled:opacity-50
                    ${!day.isCurrentMonth ? 'opacity-30' : ''}
                    relative
                  `}
                                     title={day.holidayName ? `PracovnA? vo?lno: ${day.holidayName}` : (day.isWeekend ? 'VA?kend' : undefined)}
                >
                  {day.date.getDate()}

                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="p-3 border-t border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                             <div className="flex items-center space-x-3">
                 <div className="flex items-center space-x-1">
                   <div className="w-3 h-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700"></div>
                   <span>Sviatky</span>
                 </div>
                 <div className="flex items-center space-x-1">
                   <div className="w-3 h-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700"></div>
                   <span>VA?kendy</span>
                 </div>
               </div>
              {loading && (
                <div className="text-blue-600 dark:text-blue-400">
                  Na?TA?tavam...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default DatePicker;

