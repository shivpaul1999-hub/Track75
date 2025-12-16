import React, { useState, useMemo } from 'react';
import { FeedEntry, EntryType, User } from '../types';
import Icon from './Icon';
import MetaDataPanel from './MetaDataPanel';

interface PlanningTimelineViewProps {
  entries: FeedEntry[];
  users: User[];
}

const EntryTypeDetails: { [key: string]: { color: string; icon: string, darkColor: string, borderColor: string } } = {
  [EntryType.OPPORTUNITY]: { color: 'bg-amber-100 text-amber-800', icon: 'opportunity', darkColor: 'bg-amber-500', borderColor: 'border-amber-200' },
  [EntryType.ROADMAP_UPDATE]: { color: 'bg-purple-100 text-purple-800', icon: 'roadmap', darkColor: 'bg-purple-500', borderColor: 'border-purple-200' },
  [EntryType.META_DATA_TRACK_INFO]: { color: 'bg-slate-100 text-slate-800', icon: 'settings', darkColor: 'bg-slate-500', borderColor: 'border-slate-200' },
  [EntryType.DEPLOYMENT_RELEASE]: { color: 'bg-teal-100 text-teal-800', icon: 'deployment-release', darkColor: 'bg-teal-500', borderColor: 'border-teal-200' },
};
const defaultEntryDetails = { color: 'bg-gray-100 text-gray-800', icon: 'comment', darkColor: 'bg-gray-500', borderColor: 'border-gray-200' };

const availableFilters = Object.keys(EntryTypeDetails);

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const TimelineItem: React.FC<{ entry: FeedEntry; isExpanded: boolean; onToggle: () => void; users: User[]; onOpenMeta: () => void; }> = ({ entry, isExpanded, onToggle, users, onOpenMeta }) => {
  const author = users?.find(u => u.id === entry.authorId);
  const entryDetails = EntryTypeDetails[entry.type] || defaultEntryDetails;

  const isMeta = entry.type === EntryType.META_DATA_TRACK_INFO;

  return (
    <div className="relative pl-8 sm:pl-10 py-2 group">
      {/* Timeline Line */}
      <div className="absolute left-[19px] sm:left-[23px] top-0 bottom-0 w-px bg-gray-200 dark:bg-dark-elevated group-last:bottom-auto group-last:h-6"></div>

      {/* Timeline Dot */}
      <div className={`absolute left-[10px] sm:left-[14px] top-6 w-5 h-5 rounded-full border-4 border-white dark:border-dark-card ${entryDetails.darkColor} z-10 shadow-sm`}></div>

      {/* Date Label */}
      <div className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 pl-2">
        {formatDate(entry.timestamp)}
      </div>

      <div
        className={`bg-white dark:bg-dark-card rounded-lg border shadow-sm transition-all duration-200 hover:shadow-md ml-2 ${isExpanded ? 'ring-1 ring-primary border-primary' : 'border-gray-200 dark:border-dark-elevated'}`}
      >
        <div
          className="p-4 cursor-pointer"
          onClick={isMeta ? onOpenMeta : onToggle}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${entryDetails.color} flex-shrink-0`}>
                <Icon name={entryDetails.icon} className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-gray-800 dark:text-white text-sm">{entry.type}</span>
                  {entry.chips && entry.chips.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-dark-elevated text-gray-600 dark:text-gray-400 font-medium">
                      {entry.chips[0]}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1 font-medium">{entry.content.split('\n')[0]}</p>
              </div>
            </div>
            {!isMeta && (
              <Icon name="chevron-down" className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            )}
            {isMeta && (
              <Icon name="external-link" className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>

        {isExpanded && !isMeta && (
          <div className="px-4 pb-4 pt-0 text-sm">
            <div className="pt-3 border-t border-gray-100 dark:border-dark-elevated space-y-3">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-dark-elevated p-3 rounded-md">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Owner</h4>
                  <div className="flex items-center mt-1">
                    {author && author.avatarUrl && <img src={author.avatarUrl} className="w-4 h-4 rounded-full mr-1.5" />}
                    <span className="text-gray-700 dark:text-gray-200 font-medium">{author?.name || 'Unknown'}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</h4>
                  <span className="text-gray-700 dark:text-gray-200 font-medium mt-1 block">{entry.chips?.join(', ') || 'Pending'}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Details</h4>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{entry.content}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PlanningTimelineView: React.FC<PlanningTimelineViewProps> = ({ entries, users }) => {
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedMetaEntry, setSelectedMetaEntry] = useState<FeedEntry | null>(null);

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

  // Sort entries by date (newest first)
  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [filteredEntries]);

  if (entries.length === 0) {
    return <div className="text-center py-20 bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-elevated"><p className="text-gray-500 dark:text-gray-400">No planning data available.</p></div>;
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        <div className="mb-6 flex flex-wrap items-center gap-2 sticky top-0 bg-white dark:bg-dark-bg z-10 py-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">Filters:</span>
          <button
            onClick={() => setActiveFilters([])}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 border ${activeFilters.length === 0
              ? 'bg-gray-800 text-white border-gray-800 dark:bg-white dark:text-black'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 dark:bg-dark-card dark:text-gray-300 dark:border-dark-elevated'
              }`}
          >
            All
          </button>
          {availableFilters.map(filter => {
            const isSelected = activeFilters.includes(filter);
            return (
              <button
                key={filter}
                onClick={() => handleFilterToggle(filter)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 border ${isSelected
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary dark:bg-dark-card dark:text-gray-300 dark:border-dark-elevated'
                  }`}
              >
                {filter}
              </button>
            )
          })}
        </div>

        <div className="relative">
          {sortedEntries.length > 0 ? (
            sortedEntries.map(entry => (
              <TimelineItem
                key={entry.id}
                entry={entry}
                isExpanded={expandedItemId === entry.id}
                onToggle={() => setExpandedItemId(prev => prev === entry.id ? null : entry.id)}
                users={users}
                onOpenMeta={() => setSelectedMetaEntry(entry)}
              />
            ))
          ) : (
            <div className="text-center py-12 text-gray-500 italic">No items found matching criteria.</div>
          )}
        </div>
      </div>

      {/* Meta Data Side Panel */}
      {(selectedMetaEntry) && (
        <div className="w-80 flex-shrink-0 bg-white dark:bg-dark-card border-l border-gray-200 dark:border-dark-elevated h-[calc(100vh-200px)] sticky top-24 overflow-y-auto hidden lg:block p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 dark:text-white">Meta Data Details</h3>
            <button onClick={() => setSelectedMetaEntry(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>
          <MetaDataPanel entry={selectedMetaEntry} users={users} />
        </div>
      )}

      {/* Mobile Modal for Meta Data */}
      {selectedMetaEntry && (
        <div className="lg:hidden fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-xl p-4 shadow-xl max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 dark:text-white">Meta Data Details</h3>
              <button onClick={() => setSelectedMetaEntry(null)} className="p-1 rounded-full bg-gray-100 dark:bg-dark-elevated text-gray-500">
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>
            <MetaDataPanel entry={selectedMetaEntry} users={users} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanningTimelineView;
