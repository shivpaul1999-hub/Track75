
import React, { useState, useMemo } from 'react';
import { FeedEntry, User, EntryType } from '../types';
import Icon from './Icon';

// --- CONFIGURATION ---
// Strict strict filtering as requested
const ALLOWED_NOTE_TYPES = [
  EntryType.MEETING_NOTES,
  EntryType.QUICK_NOTE,
  EntryType.IDEA_BRAINSTORM
];

const NOTE_TYPE_COLORS: Record<string, string> = {
  [EntryType.MEETING_NOTES]: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  [EntryType.QUICK_NOTE]: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
  [EntryType.IDEA_BRAINSTORM]: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
};

// --- HELPER COMPONENTS ---

const NoteDetailModal: React.FC<{ entry: FeedEntry; onClose: () => void; user?: User }> = ({ entry, onClose, user }) => {
  // Prevent body scroll when modal is open
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const [title, ...bodyParts] = entry.content.split('\n');
  const body = bodyParts.join('\n').trim();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" role="dialog">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 z-10">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${NOTE_TYPE_COLORS[entry.type] || 'bg-gray-100 text-gray-600'}`}>
              {entry.type}
            </span>
            <span className="text-sm text-gray-400 dark:text-gray-500">
              {new Date(entry.timestamp).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-dashed-border"
          >
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 sm:p-10 bg-white dark:bg-gray-900">
          <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
              {title || 'Untitled Note'}
            </h1>

            {/* Author Block */}
            {user && (
              <div className="flex items-center gap-3 pb-6 border-b border-gray-100 dark:border-gray-800">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} className="w-8 h-8 rounded-full object-cover" alt={user.name} />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{user.initials}</div>
                )}
                <div className="text-sm">
                  <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                </div>
              </div>
            )}

            <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 font-sans leading-relaxed whitespace-pre-wrap">
              {body || <span className="text-gray-400 italic">No additional content</span>}
            </div>
          </div>
        </div>

        {/* Footer Actions (Optional) */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

interface NoteCardProps {
  entry: FeedEntry;
  user?: User;
  isPinned: boolean;
  onTogglePin: () => void;
  onClick: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ entry, user, isPinned, onTogglePin, onClick }) => {
  const [title, ...bodyParts] = entry.content.split('\n');
  const preview = bodyParts.join(' ').substring(0, 150) + (entry.content.length > 150 ? '...' : '');

  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1 overflow-hidden"
    >
      {/* Top Decoration Line */}
      <div className={`absolute top-0 left-0 w-full h-1 ${NOTE_TYPE_COLORS[entry.type]?.split(' ')[0].replace('bg-', 'bg-') || 'bg-gray-200'}`} />

      <div className="flex justify-between items-start mb-3 mt-1">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${NOTE_TYPE_COLORS[entry.type] || 'bg-gray-100 border-gray-200 text-gray-500'}`}>
          {entry.type}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
          className={`p-1.5 rounded-full transition-all duration-200 ${isPinned ? 'text-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
        >
          <Icon name="pin" className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
        </button>
      </div>

      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 leading-tight group-hover:text-primary transition-colors line-clamp-2">
        {title}
      </h3>

      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 line-clamp-3">
        {preview || <span className="italic opacity-50">No preview available</span>}
      </p>

      <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} className="w-5 h-5 rounded-full object-cover" alt={user.initials} />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[9px] font-bold text-gray-500">{user.initials}</div>
              )}
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate max-w-[100px]">{user.name}</span>
            </>
          ) : (
            <span className="text-xs text-gray-400">Unknown</span>
          )}
        </div>
        <span className="text-xs text-gray-400 font-mono">
          {new Date(entry.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

interface NotesViewProps {
  entries: FeedEntry[];
  users: User[];
}

const NotesView: React.FC<NotesViewProps> = ({ entries, users }) => {
  const [selectedEntry, setSelectedEntry] = useState<FeedEntry | null>(null);
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);
  const [filterType, setFilterType] = useState<string>('All');

  // Load pins
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('track75_pinned_notes');
      if (saved) setPinnedIds(JSON.parse(saved));
    } catch (e) { console.error('Failed to load pinned notes', e); }
  }, []);

  const handleTogglePin = (id: number) => {
    const newPins = pinnedIds.includes(id) ? pinnedIds.filter(p => p !== id) : [...pinnedIds, id];
    setPinnedIds(newPins);
    localStorage.setItem('track75_pinned_notes', JSON.stringify(newPins));
  };

  // Filter Logic
  const filteredEntries = useMemo(() => {
    return entries
      .filter(e => ALLOWED_NOTE_TYPES.includes(e.type as EntryType)) // Strict Type Filter
      .filter(e => filterType === 'All' || e.type === filterType)    // UI Filter
      .sort((a, b) => {
        // Sort by Pin, then Date
        const aPin = pinnedIds.includes(a.id);
        const bPin = pinnedIds.includes(b.id);
        if (aPin && !bPin) return -1;
        if (!aPin && bPin) return 1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  }, [entries, pinnedIds, filterType]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach(e => {
      if (ALLOWED_NOTE_TYPES.includes(e.type as EntryType)) {
        counts[e.type] = (counts[e.type] || 0) + 1;
      }
    });
    return counts;
  }, [entries]);

  if (entries.length === 0 && filteredEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-dark-elevated/30 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
        <div className="w-16 h-16 bg-white dark:bg-dark-card rounded-full shadow-sm flex items-center justify-center mb-4">
          <Icon name="edit" className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">No notes yet</h3>
        <p className="text-sm text-gray-500 max-w-xs text-center mt-2">Create a new entry with 'Meeting Notes', 'Quick Note', or 'Idea' to see it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative min-h-[500px]">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="book" className="w-5 h-5 text-gray-400" />
            Notebook
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filteredEntries.length} notes found
          </p>
        </div>

        <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto custom-scrollbar max-w-full">
          <button
            onClick={() => setFilterType('All')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-all ${filterType === 'All' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
          >
            All Notes
          </button>
          {ALLOWED_NOTE_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-all flex items-center gap-1.5 ${filterType === type ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${NOTE_TYPE_COLORS[type]?.split(' ')[0] || 'bg-gray-300'}`} />
              {type}
              <span className="opacity-50 text-[10px] ml-0.5">({stats[type] || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid Layout */}
      {filteredEntries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {filteredEntries.map(entry => (
            <NoteCard
              key={entry.id}
              entry={entry}
              user={users.find(u => u.id === entry.authorId)}
              isPinned={pinnedIds.includes(entry.id)}
              onTogglePin={() => handleTogglePin(entry.id)}
              onClick={() => setSelectedEntry(entry)}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-gray-400 text-sm">No notes match the selected filter.</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedEntry && (
        <NoteDetailModal
          entry={selectedEntry}
          user={users.find(u => u.id === selectedEntry.authorId)}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  );
};

export default NotesView;
