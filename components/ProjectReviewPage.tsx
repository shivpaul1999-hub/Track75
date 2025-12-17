
import React, { useState, useMemo } from 'react';
import { Track, FeedEntry, View, EntryType, User } from '../types';
import Icon from './Icon';
import PlanningTimelineView from './PlanningTimelineView';
import TasksKanbanView from './TasksKanbanView';
import CommunicationFeedView from './CommunicationFeedView';
import NotesView from './NotesView';
import ReferencesView from './ReferencesView';
import IssuesApprovalsView from './IssuesApprovalsView';

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`bg-white p-6 rounded-lg border border-gray-200 shadow-sm ${className}`}>
        {children}
    </div>
);

const tabCategoryNames = [
  'Planning & Tracking',
  'Tasks',
  'Communication',
  'Notes',
  'References',
  'Issues & Approvals'
] as const;

type TabCategory = typeof tabCategoryNames[number];

const tabCategories: Record<TabCategory, EntryType[]> = {
  'Planning & Tracking': [EntryType.OPPORTUNITY, EntryType.ROADMAP_UPDATE, EntryType.META_DATA_TRACK_INFO, EntryType.DEPLOYMENT_RELEASE],
  'Tasks': [EntryType.TASK, EntryType.PRIORITY_TASK, EntryType.CHECKLIST_TODO],
  'Communication': [EntryType.COMMENT, EntryType.CLIENT_UPDATE, EntryType.ANNOUNCEMENT],
  'Notes': [EntryType.MEETING_NOTES, EntryType.QUICK_NOTE, EntryType.IDEA_BRAINSTORM],
  'References': [EntryType.FILES, EntryType.URL_LINK],
  'Issues & Approvals': [EntryType.BUG_ISSUE, EntryType.APPROVAL_SIGNOFF]
};

const TABS = [...tabCategoryNames, 'Custom Feeds'] as const;
type TabName = typeof TABS[number];


interface TrackReviewPageProps {
  trackId: number;
  tracks: Track[];
  feedEntries: FeedEntry[];
  onNavigate: (view: View) => void;
  onSelectTrack: (id: number) => void;
  onUpdateEntry: (entry: FeedEntry) => void;
  users: User[];
}

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

const EntryContentItem: React.FC<{ entry: FeedEntry }> = ({ entry }) => {
    const attachments = useMemo(() => {
        const allAttachments = [...(entry.attachments || [])];
        if (entry.documentUrl && !allAttachments.some(att => att.url === entry.documentUrl)) {
            allAttachments.unshift({
                name: entry.documentUrl.split('/').pop()?.replace(/-/g, ' ') || 'Document',
                url: entry.documentUrl,
                type: 'application/pdf'
            });
        }
        return allAttachments;
    }, [entry.attachments, entry.documentUrl]);

    if (attachments.length === 0) {
      return <p className="text-sm text-gray-600">{entry.content}</p>;
    }

    return (
      <div>
        <p className="text-sm text-gray-600 mb-2">{entry.content}</p>
        <div className="flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <a href={file.url} key={index} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors group text-xs">
              <Icon name="files" className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
              <span className="text-primary font-medium truncate group-hover:underline">{file.name}</span>
            </a>
          ))}
        </div>
      </div>
    );
};

const TrackReviewPage: React.FC<TrackReviewPageProps> = ({ trackId, tracks, feedEntries, onNavigate, onSelectTrack, onUpdateEntry, users }) => {
  const [activeTab, setActiveTab] = useState<TabName>('Planning & Tracking');

  const track = useMemo(() => tracks.find(p => p.id === trackId), [trackId, tracks]);

  const entriesForCategory = (category: TabCategory): FeedEntry[] => {
      const types = tabCategories[category];
      return feedEntries
          .filter(e => e.trackId === trackId && types.includes(e.type as EntryType))
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Planning & Tracking':
        return <PlanningTimelineView entries={entriesForCategory('Planning & Tracking')} users={users} />;
      case 'Tasks':
        return <TasksKanbanView entries={entriesForCategory('Tasks')} onUpdateEntry={onUpdateEntry} users={users} />;
      case 'Communication':
        return <CommunicationFeedView entries={entriesForCategory('Communication')} users={users} />;
      case 'Notes':
        return <NotesView entries={entriesForCategory('Notes')} users={users} />;
      case 'References':
        return <ReferencesView entries={entriesForCategory('References')} users={users} />;
      case 'Issues & Approvals':
        return <IssuesApprovalsView entries={entriesForCategory('Issues & Approvals')} />;
      case 'Custom Feeds':
        return <Card><p>Custom Feeds view not implemented yet.</p></Card>;
      default:
        return null;
    }
  };

  if (!track) {
    return (
      <Card>
        <h1 className="text-2xl font-bold">Track not found</h1>
        <button onClick={() => onNavigate('TRACKS')} className="mt-4 text-primary hover:underline">
          &larr; Back to all tracks
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <button onClick={() => onSelectTrack(track.id)} className="flex items-center text-sm text-gray-600 hover:text-primary font-medium mb-2">
            <Icon name="chevron-left" className="w-5 h-5 mr-1" />
            Back to {track.name}
        </button>
        <h1 className="text-3xl font-bold text-gray-900">{track.name}: Views</h1>
        <p className="text-gray-600 mt-1">Analyze track data through different lenses.</p>
      </div>
      
      <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
              {TABS.map(tab => (
                  <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === tab
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                      {tab}
                  </button>
              ))}
          </nav>
      </div>

      <div className="animate-fade-in min-h-[50vh]">
        {renderContent()}
      </div>
    </div>
  );
};

export default TrackReviewPage;
