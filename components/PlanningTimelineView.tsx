
import React, { useState, useMemo } from 'react';
import { FeedEntry, EntryType, User } from '../types';
import Icon from './Icon';

interface PlanningTimelineViewProps {
  entries: FeedEntry[];
  users: User[];
}

const EntryTypeDetails: { [key: string]: { color: string; icon: string, darkColor: string } } = {
  [EntryType.OPPORTUNITY]: { color: 'bg-amber-100 text-amber-800', icon: 'opportunity', darkColor: 'bg-amber-500' },
  [EntryType.ROADMAP_UPDATE]: { color: 'bg-purple-100 text-purple-800', icon: 'roadmap', darkColor: 'bg-purple-500' },
  [EntryType.META_DATA_TRACK_INFO]: { color: 'bg-slate-100 text-slate-800', icon: 'settings', darkColor: 'bg-slate-500' },
  [EntryType.DEPLOYMENT_RELEASE]: { color: 'bg-teal-100 text-teal-800', icon: 'deployment-release', darkColor: 'bg-teal-500' },
};
const defaultEntryDetails = { color: 'bg-gray-100 text-gray-800', icon: 'comment', darkColor: 'bg-gray-500' };

const availableFilters = Object.keys(EntryTypeDetails);

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();

    let suffix = 'th';
    if (day === 1 || day === 21 || day === 31) suffix = 'st';
    else if (day === 2 || day === 22) suffix = 'nd';
    else if (day === 3 || day === 23) suffix = 'rd';

    return `${day}${suffix} ${month}, ${year}`;
};

const TimelineItem: React.FC<{ entry: FeedEntry; isExpanded: boolean; onToggle: () => void; users: User[] }> = ({ entry, isExpanded, onToggle, users }) => {
  const author = users.find(u => u.id === entry.authorId);
  if (!author) return null;
  const entryDetails = EntryTypeDetails[entry.type] || defaultEntryDetails;

  return (
    <div className="relative pl-8 sm:pl-12 py-4 group">
      <div className="flex sm:items-center items-start flex-row mb-1 sm:mb-0">
        <div className={`flex w-8 h-8 sm:w-10 sm:h-10 absolute left-0 sm:left-0 -translate-x-1/2 rounded-full items-center justify-center text-white ${entryDetails.darkColor}`}>
          <Icon name={entryDetails.icon} className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="text-sm font-medium text-gray-600 sm:w-36">{formatDate(entry.timestamp)}</div>
      </div>

      <div className="mt-2 sm:mt-0 sm:ml-6">
        <div 
          className={`bg-white p-4 rounded-lg border-2 shadow-sm cursor-pointer transition-all duration-300 ${isExpanded ? 'border-primary' : 'border-gray-200 hover:border-gray-300'}`}
          onClick={onToggle}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-gray-800">{entry.type}</p>
              <p className="text-sm text-gray-600">{entry.content.split('\n')[0]}</p>
            </div>
            <Icon name="chevron-down" className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>

          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 animate-fade-in text-sm">
              <div>
                <h4 className="font-semibold text-gray-700 mb-1">Status</h4>
                <div className="flex flex-wrap gap-2">
                  {(entry.chips && entry.chips.length > 0) ? entry.chips.map(chip => (
                    <span key={chip} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{chip}</span>
                  )) : <span className="text-gray-500">N/A</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-1">Owner</h4>
                  <p className="text-gray-600">{author.name}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-1">Date</h4>
                  <p className="text-gray-600">{formatDate(entry.timestamp)}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-1">Notes</h4>
                <p className="text-gray-600 whitespace-pre-wrap">{entry.content}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PlanningTimelineView: React.FC<PlanningTimelineViewProps> = ({ entries, users }) => {
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const handleFilterToggle = (filter: string) => {
    setActiveFilters(prev => {
        if (prev.includes(filter)) {
            return prev.filter(f => f !== filter);
        } else {
            return [...prev, filter];
        }
    });
  };

  const filteredEntries = useMemo(() => {
    if (activeFilters.length === 0) {
        return entries;
    }
    return entries.filter(entry => activeFilters.includes(entry.type));
  }, [entries, activeFilters]);

  if (entries.length === 0) {
    return <div className="text-center py-12"><p className="text-gray-500">No planning & tracking data is available.</p></div>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-gray-700 mr-2">Filter by:</span>
          <button
              onClick={() => setActiveFilters([])}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border-2 ${
                  activeFilters.length === 0
                      ? 'bg-primary border-primary text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
              }`}
          >
              Show All
          </button>
          {availableFilters.map(filter => {
              const isSelected = activeFilters.includes(filter);
              return (
                  <button
                      key={filter}
                      onClick={() => handleFilterToggle(filter)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border-2 ${
                          isSelected
                              ? 'bg-primary border-primary text-white'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
                      }`}
                  >
                      {filter}
                  </button>
              )
          })}
      </div>
      <div className="relative border-l-2 border-gray-200 ml-4 sm:ml-5">
        {filteredEntries.length > 0 ? (
            filteredEntries.map(entry => (
              <TimelineItem
                key={entry.id}
                entry={entry}
                isExpanded={expandedItemId === entry.id}
                onToggle={() => setExpandedItemId(prev => prev === entry.id ? null : entry.id)}
                users={users}
              />
            ))
        ) : (
            <div className="text-center py-12"><p className="text-gray-500">No items match the selected filters.</p></div>
        )}
      </div>
    </div>
  );
};

export default PlanningTimelineView;
