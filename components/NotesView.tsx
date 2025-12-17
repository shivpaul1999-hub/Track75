
import React, { useState, useMemo, useEffect } from 'react';
import { FeedEntry, User, EntryType } from '../types';
import Icon from './Icon';

const NoteCard: React.FC<{
  entry: FeedEntry;
  isStarred: boolean;
  onStarToggle: () => void;
  onSelect: () => void;
  users: User[];
}> = ({ entry, isStarred, onStarToggle, onSelect, users }) => {
  const author = users.find(u => u.id === entry.authorId);
  if (!author) return null;
  
  const [title, ...summaryParts] = entry.content.split('\n');
  const summary = summaryParts.join('\n').trim();
  
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary" onClick={onSelect}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{entry.type}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onStarToggle(); }}
          className="p-1 text-gray-400 hover:text-amber-500"
          aria-label={isStarred ? "Unstar note" : "Star note"}
        >
          <Icon name="pin" className={`w-5 h-5 transition-colors ${isStarred ? 'text-amber-500 fill-amber-500' : ''}`} />
        </button>
      </div>
      <div className="flex-grow">
        <h3 className="font-bold text-gray-800 mb-1 line-clamp-2">{title}</h3>
        {summary && <p className="text-sm text-gray-600 line-clamp-3">{summary}</p>}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center">
          {author.avatarUrl ? (
            <img src={author.avatarUrl} alt={author.name} className="w-5 h-5 rounded-full mr-2" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[10px] mr-2">{author.initials}</div>
          )}
          <span>{author.name}</span>
        </div>
        <span>{formatDate(entry.timestamp)}</span>
      </div>
    </div>
  );
};

const DetailPanel: React.FC<{ entry: FeedEntry, onClose: () => void, users: User[] }> = ({ entry, onClose, users }) => {
  const [isVisible, setIsVisible] = useState(false);
  const author = users.find(u => u.id === entry.authorId);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!author) {
      onClose();
    }
  }, [author, onClose]);

  if (!author) {
    return null;
  }

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${isVisible ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'}`} 
        onClick={handleClose}
      />
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-5 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <h3 className="text-lg font-bold text-gray-800">{entry.type}</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full">
            <Icon name="close" className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow">
          <div className="flex items-center space-x-3 mb-4">
             {author.avatarUrl ? (
                <img src={author.avatarUrl} alt={author.name} className="w-9 h-9 rounded-full" />
             ) : (
                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">{author.initials}</div>
             )}
             <div>
                <p className="font-semibold text-sm text-gray-800">{author.name}</p>
                <p className="text-xs text-gray-500">{formatDate(entry.timestamp)}</p>
             </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{entry.content.split('\n')[0]}</h1>
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
            {entry.content}
          </div>
        </div>
      </div>
    </>
  );
};

interface NotesViewProps {
  entries: FeedEntry[];
  users: User[];
}

const NotesView: React.FC<NotesViewProps> = ({ entries, users }) => {
  const [starredEntryIds, setStarredEntryIds] = useState<number[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('All Notes');
  const [selectedEntry, setSelectedEntry] = useState<FeedEntry | null>(null);

  const noteTypes = [EntryType.MEETING_NOTES, EntryType.QUICK_NOTE, EntryType.IDEA_BRAINSTORM];
  const filters = ['All Notes', ...noteTypes];

  const filteredAndSortedEntries = useMemo(() => {
    const filtered = entries.filter(entry =>
      activeFilter === 'All Notes' || entry.type === activeFilter
    );

    return filtered.sort((a, b) => {
      const aIsStarred = starredEntryIds.includes(a.id);
      const bIsStarred = starredEntryIds.includes(b.id);
      if (aIsStarred && !bIsStarred) return -1;
      if (!bIsStarred && aIsStarred) return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [entries, activeFilter, starredEntryIds]);

  const handleStarToggle = (entryId: number) => {
    setStarredEntryIds(prev =>
      prev.includes(entryId) ? prev.filter(id => id !== entryId) : [...prev, entryId]
    );
  };

  if (entries.length === 0) {
    return <div className="text-center py-12"><p className="text-gray-500">No notes available.</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center rounded-md border border-gray-300 p-0.5 w-full sm:w-auto">
        {filters.map(filter => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors flex-1 sm:flex-auto ${isActive ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <span className="capitalize">{filter}</span>
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredAndSortedEntries.map(entry => (
          <NoteCard
            key={entry.id}
            entry={entry}
            isStarred={starredEntryIds.includes(entry.id)}
            onStarToggle={() => handleStarToggle(entry.id)}
            onSelect={() => setSelectedEntry(entry)}
            users={users}
          />
        ))}
      </div>
      {selectedEntry && (
        <DetailPanel entry={selectedEntry} onClose={() => setSelectedEntry(null)} users={users} />
      )}
    </div>
  );
};

export default NotesView;
