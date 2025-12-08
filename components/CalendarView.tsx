
import React, { useState, useMemo } from 'react';
import { FeedEntry, EntryType, User } from '../types';
import Icon from './Icon';

interface CalendarViewProps {
  entries: FeedEntry[];
  onAddEntry: () => void;
  users: User[];
}

type ViewMode = 'Day' | 'Week' | 'Month' | 'Year';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getEntryColor = (type: string) => {
    switch (type) {
        case EntryType.TASK: return 'bg-sky-100 text-sky-700 border-sky-200';
        case EntryType.BUG_ISSUE: return 'bg-red-100 text-red-700 border-red-200';
        case EntryType.MEETING_NOTES: return 'bg-cyan-100 text-cyan-700 border-cyan-200';
        case EntryType.IMAGE: return 'bg-pink-100 text-pink-700 border-pink-200';
        case EntryType.VIDEO: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
        case EntryType.FILES: return 'bg-amber-100 text-amber-700 border-amber-200';
        case EntryType.APPROVAL_SIGNOFF: return 'bg-green-100 text-green-700 border-green-200';
        default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

const CalendarView: React.FC<CalendarViewProps> = ({ entries, onAddEntry, users }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('Month');

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const addMonths = (date: Date, amount: number) => {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + amount);
    return newDate;
  };

  const addDays = (date: Date, amount: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + amount);
    return newDate;
  };

  const isSameDate = (d1: Date, d2: Date) => {
      return d1.getFullYear() === d2.getFullYear() &&
             d1.getMonth() === d2.getMonth() &&
             d1.getDate() === d2.getDate();
  };

  const handleNavigate = (dir: number) => {
      if (viewMode === 'Day') setCurrentDate(addDays(currentDate, dir));
      else if (viewMode === 'Week') setCurrentDate(addDays(currentDate, dir * 7));
      else if (viewMode === 'Month') setCurrentDate(addMonths(currentDate, dir));
      else if (viewMode === 'Year') setCurrentDate(new Date(currentDate.getFullYear() + dir, 0, 1));
  };

  const handleToday = () => {
      setCurrentDate(new Date());
  };

  const entriesByDate = useMemo(() => {
      const grouped: Record<string, FeedEntry[]> = {};
      entries.forEach(entry => {
          const dateStr = entry.timestamp.split('T')[0];
          if (!grouped[dateStr]) grouped[dateStr] = [];
          grouped[dateStr].push(entry);
      });
      return grouped;
  }, [entries]);

  const getEntriesForDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return entriesByDate[`${year}-${month}-${day}`] || [];
  };

  const renderMonthView = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = getDaysInMonth(year, month);
      const firstDay = getFirstDayOfMonth(year, month);
      const today = new Date();

      const blanks = Array.from({ length: firstDay }, (_, i) => i);
      const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

      return (
          <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden shadow-sm animate-fade-in">
              {DAYS.map(d => (
                  <div key={d} className="bg-gray-50 py-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {d}
                  </div>
              ))}
              {blanks.map(i => (
                  <div key={`blank-${i}`} className="bg-white h-32 opacity-50"></div>
              ))}
              {days.map(day => {
                  const date = new Date(year, month, day);
                  const dateEntries = getEntriesForDate(date);
                  const isToday = isSameDate(date, today);

                  return (
                      <div 
                        key={day} 
                        className={`bg-white h-32 p-2 hover:bg-blue-50/30 transition-colors cursor-pointer group flex flex-col`}
                        onClick={() => { setCurrentDate(date); setViewMode('Day'); }}
                      >
                          <div className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-primary text-white shadow-md' : 'text-gray-700 group-hover:text-primary'}`}>
                              {day}
                          </div>
                          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                              {dateEntries.slice(0, 3).map(entry => (
                                  <div key={entry.id} className={`text-[10px] px-1.5 py-0.5 rounded border truncate ${getEntryColor(entry.type)}`}>
                                      {entry.content}
                                  </div>
                              ))}
                              {dateEntries.length > 3 && (
                                  <div className="text-[10px] text-gray-400 pl-1 font-medium">
                                      +{dateEntries.length - 3} more
                                  </div>
                              )}
                          </div>
                      </div>
                  );
              })}
          </div>
      );
  };

  const renderWeekView = () => {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      
      const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek, i));
      const today = new Date();

      return (
          <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden shadow-sm h-[600px] animate-fade-in">
              {weekDays.map((date, i) => {
                  const isToday = isSameDate(date, today);
                  const dateEntries = getEntriesForDate(date);

                  return (
                      <div key={i} className="bg-white flex flex-col h-full hover:bg-gray-50/50 transition-colors">
                          <div className={`p-2 border-b border-gray-100 text-center ${isToday ? 'bg-primary/5' : ''}`}>
                              <div className="text-xs text-gray-500 font-medium uppercase mb-1">{DAYS[date.getDay()]}</div>
                              <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-lg font-bold ${isToday ? 'bg-primary text-white' : 'text-gray-800'}`}>
                                  {date.getDate()}
                              </div>
                          </div>
                          <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
                              {dateEntries.map(entry => {
                                  const author = users.find(u => u.id === entry.authorId);
                                  return (
                                    <div 
                                        key={entry.id} 
                                        className={`p-2 rounded-md border text-xs shadow-sm cursor-pointer hover:shadow-md transition-shadow ${getEntryColor(entry.type)} bg-opacity-20 bg-white`}
                                        title={entry.content}
                                    >
                                        <div className="font-bold mb-1 truncate">{entry.type}</div>
                                        <div className="line-clamp-3 text-gray-700 mb-2">{entry.content}</div>
                                        <div className="flex items-center mt-1 pt-1 border-t border-gray-200/50">
                                            {author && (
                                                <div className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center text-[8px] mr-1 overflow-hidden">
                                                    {author.avatarUrl ? <img src={author.avatarUrl} className="w-full h-full object-cover"/> : author.initials}
                                                </div>
                                            )}
                                            <span className="text-[10px] text-gray-500">{new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    </div>
                                  )
                              })}
                              {dateEntries.length === 0 && (
                                  <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                      <button onClick={onAddEntry} className="p-2 rounded-full bg-gray-100 hover:bg-primary hover:text-white text-gray-400 transition-colors">
                                          <Icon name="plus" className="w-4 h-4" />
                                      </button>
                                  </div>
                              )}
                          </div>
                      </div>
                  );
              })}
          </div>
      );
  };

  const renderDayView = () => {
      const dateEntries = getEntriesForDate(currentDate);
      const sortedEntries = [...dateEntries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      return (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm min-h-[500px] p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">
                      {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </h3>
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                      {dateEntries.length} Entries
                  </span>
              </div>
              
              {sortedEntries.length > 0 ? (
                  <div className="relative border-l-2 border-gray-200 ml-3 space-y-8">
                      {sortedEntries.map(entry => {
                          const author = users.find(u => u.id === entry.authorId);
                          const time = new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                          return (
                              <div key={entry.id} className="relative pl-8">
                                  <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm ${getEntryColor(entry.type).split(' ')[0].replace('bg-', 'bg-').replace('100', '500')}`}></div>
                                  
                                  <div className="flex flex-col sm:flex-row sm:items-start gap-4 p-4 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-md transition-all">
                                      <div className="min-w-[80px] pt-1">
                                          <span className="text-sm font-bold text-gray-600">{time}</span>
                                      </div>
                                      <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-2">
                                              <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getEntryColor(entry.type)}`}>
                                                  {entry.type}
                                              </span>
                                              {entry.chips?.map(chip => (
                                                  <span key={chip} className="text-xs bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-500">
                                                      {chip}
                                                  </span>
                                              ))}
                                          </div>
                                          <p className="text-gray-800 mb-3 whitespace-pre-wrap text-sm">{entry.content}</p>
                                          {author && (
                                              <div className="flex items-center text-xs text-gray-500">
                                                  <img src={author.avatarUrl || ''} className="w-5 h-5 rounded-full mr-2 bg-gray-200" alt="" />
                                                  <span>Added by <span className="font-semibold text-gray-700">{author.name}</span></span>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                      <Icon name="calendar" className="w-12 h-12 mb-4 opacity-50" />
                      <p>No entries for this day.</p>
                      <button onClick={onAddEntry} className="mt-4 text-primary font-semibold hover:underline">Add an Entry</button>
                  </div>
              )}
          </div>
      );
  };

  const renderYearView = () => {
      const year = currentDate.getFullYear();
      const months = Array.from({ length: 12 }, (_, i) => i);

      return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in p-2">
              {months.map(monthIndex => {
                  const daysInMonth = getDaysInMonth(year, monthIndex);
                  const firstDay = getFirstDayOfMonth(year, monthIndex);
                  
                  const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
                  const monthEntries = Object.keys(entriesByDate)
                      .filter(k => k.startsWith(monthKey))
                      .reduce((acc, k) => [...acc, ...entriesByDate[k]], [] as FeedEntry[]);
                  
                  const entryCount = monthEntries.length;
                  const activeDays = new Set(monthEntries.map(e => new Date(e.timestamp).getDate()));

                  const isCurrentMonth = new Date().getMonth() === monthIndex && new Date().getFullYear() === year;

                  return (
                      <div 
                        key={monthIndex} 
                        onClick={() => { setCurrentDate(new Date(year, monthIndex, 1)); setViewMode('Month'); }}
                        className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md hover:scale-[1.02] bg-white ${entryCount > 0 ? 'border-primary/30 ring-1 ring-primary/10' : 'border-gray-200'}`}
                      >
                          <div className="flex justify-between items-center mb-3">
                              <h4 className={`font-bold ${isCurrentMonth ? 'text-primary' : 'text-gray-800'}`}>{MONTHS[monthIndex]}</h4>
                              {entryCount > 0 && (
                                  <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                                      {entryCount} posts
                                  </span>
                              )}
                          </div>
                          
                          <div className="grid grid-cols-7 gap-y-1 gap-x-0 text-center">
                              {['S','M','T','W','T','F','S'].map(d => (
                                  <div key={d} className="text-[9px] font-semibold text-gray-400 mb-1">{d}</div>
                              ))}
                              
                              {Array.from({ length: firstDay }).map((_, i) => (
                                  <div key={`empty-${i}`} />
                              ))}

                              {Array.from({ length: daysInMonth }).map((_, i) => {
                                  const day = i + 1;
                                  const hasActivity = activeDays.has(day);
                                  const isToday = isCurrentMonth && new Date().getDate() === day;
                                  
                                  return (
                                      <div key={day} className="flex items-center justify-center h-6 w-6 mx-auto">
                                          <div 
                                            className={`
                                                w-5 h-5 flex items-center justify-center rounded-full text-[10px]
                                                ${isToday ? 'bg-black text-white font-bold' : ''}
                                                ${!isToday && hasActivity ? 'bg-blue-100 text-blue-700 font-semibold' : ''}
                                                ${!isToday && !hasActivity ? 'text-gray-500 hover:bg-gray-100' : ''}
                                            `}
                                          >
                                              {day}
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  )
              })}
          </div>
      )
  };

  const getHeaderText = () => {
      if (viewMode === 'Day') return currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      if (viewMode === 'Year') return currentDate.getFullYear().toString();
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 justify-between items-center">
          <div className="flex items-center space-x-2">
              <button onClick={() => handleNavigate(-1)} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-primary transition-colors">
                  <Icon name="chevron-left" className="w-5 h-5" />
              </button>
              <button onClick={handleToday} className="px-3 py-1 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                  Today
              </button>
              <button onClick={() => handleNavigate(1)} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 hover:text-primary transition-colors">
                  <Icon name="chevron-right" className="w-5 h-5" />
              </button>
              <span className="text-lg font-bold text-gray-900 ml-2 min-w-[150px]">{getHeaderText()}</span>
          </div>

          <div className="bg-gray-100 p-1 rounded-lg flex space-x-1">
              {(['Day', 'Week', 'Month', 'Year'] as ViewMode[]).map((mode) => (
                  <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                          viewMode === mode 
                          ? 'bg-white text-primary shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                      {mode}
                  </button>
              ))}
          </div>
      </div>

      <div key={`${viewMode}-${currentDate.toString()}`}>
          {viewMode === 'Month' && renderMonthView()}
          {viewMode === 'Week' && renderWeekView()}
          {viewMode === 'Day' && renderDayView()}
          {viewMode === 'Year' && renderYearView()}
      </div>
    </div>
  );
};

export default CalendarView;
