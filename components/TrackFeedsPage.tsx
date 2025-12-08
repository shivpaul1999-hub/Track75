
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Track, User, FeedEntry, View, TrackLifecycle, TrackPriority, Client, EntryType, Organization } from '../types';
import Icon from './Icon';
import EntryItem from './FeedItem';
import NewEntryModal from './NewPostModal';
import PlanningTimelineView from './PlanningTimelineView';
import TasksKanbanView from './TasksKanbanView';
import CommunicationFeedView from './CommunicationFeedView';
import NotesView from './NotesView';
import ReferencesView from './ReferencesView';
import IssuesApprovalsView from './IssuesApprovalsView';
import CalendarView from './CalendarView';
import EditTrackModal from './EditTrackModal';
import AddTrackModal from './AddTrackModal';
import DeleteTrackConfirmationModal from './DeleteTrackConfirmationModal';

// API Imports
import { getTracks, updateTrack, deleteTrack } from '../api/tracksApi';
import { getFeedEntries, createFeedEntry, updateFeedEntry } from '../api/feedApi';
import { getUsers } from '../api/usersApi';
import { getClients } from '../api/clientsApi';
import { getOrganizations } from '../api/organizationsApi';

// Reusable Card component for this page
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-white p-6 rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);

const getTemplateFromDescription = (description: string): string => {
    const match = description?.match(/^\[Template: (.*?)\]/);
    return match ? match[1] : 'General';
};

const getTemplateStyle = (template: string): { bg: string; text: string; border: string } => {
    const normalized = template.toLowerCase();
    
    if (normalized.includes('creative')) return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    if (normalized.includes('project management')) return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    if (normalized.includes('crm') || normalized.includes('relationship')) return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
    if (normalized.includes('health')) return { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' };
    
    return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
};

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
        case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'Low': return 'bg-green-100 text-green-800 border-green-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const VIEW_CATEGORY_TYPES: Record<string, EntryType[]> = {
  'Planning & Tracking': [EntryType.OPPORTUNITY, EntryType.ROADMAP_UPDATE, EntryType.META_DATA_TRACK_INFO, EntryType.DEPLOYMENT_RELEASE],
  'Tasks': [EntryType.TASK, EntryType.PRIORITY_TASK, EntryType.CHECKLIST_TODO],
  'Communication': [EntryType.COMMENT, EntryType.CLIENT_UPDATE, EntryType.ANNOUNCEMENT],
  'Notes': [EntryType.MEETING_NOTES, EntryType.QUICK_NOTE, EntryType.IDEA_BRAINSTORM],
  'References': [EntryType.FILES, EntryType.URL_LINK, EntryType.IMAGE, EntryType.VIDEO],
  'Issues & Approvals': [EntryType.BUG_ISSUE, EntryType.APPROVAL_SIGNOFF]
};

interface TrackFeedsPageProps {
  trackId: number;
  currentUser: User;
  onNavigate: (view: View, id?: number) => void;
}

const TrackFeedsPage: React.FC<TrackFeedsPageProps> = ({ trackId, currentUser, onNavigate }) => {
  const [track, setTrack] = useState<Track | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [feedEntries, setFeedEntries] = useState<FeedEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeView, setActiveView] = useState('Feed');
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
  const [isAddTrackModalOpen, setIsAddTrackModalOpen] = useState(false);
  const [triggerFileUpload, setTriggerFileUpload] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isManageCollaboratorsOpen, setIsManageCollaboratorsOpen] = useState(false);

  // Modals for Actions
  const [trackToEdit, setTrackToEdit] = useState<Track | null>(null);
  const [trackToDelete, setTrackToDelete] = useState<Track | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [entrySearchTerm, setEntrySearchTerm] = useState('');
  const [pinnedTrackIds, setPinnedTrackIds] = useState<number[]>([]);
  
  // UI state
  const activeTrackRef = useRef<HTMLDivElement>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [openMenuTrackId, setOpenMenuTrackId] = useState<number | null>(null);
  
  // Right Sidebar Dropdowns
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter Dropdown
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Simple fixed positioning for menu to avoid clipping
  const [menuPosition, setMenuPosition] = useState<{top: number, left: number} | null>(null);

  // Calculate template derived state safely before conditional returns
  const currentTemplate = track ? (track.template || getTemplateFromDescription(track.description)) : 'General';
  const isPM = currentTemplate.toLowerCase().includes('project management');

  // useMemo hook must be called unconditionally
  const activeViews = useMemo(() => {
      const views = ['Feed', 'Calendar'];
      if (isPM) {
          views.push('Planning & Tracking', 'Tasks', 'Communication', 'Notes', 'Issues & Approvals');
      }
      views.push('References');
      return views;
  }, [isPM]);

  useEffect(() => {
      const storedPins = localStorage.getItem('pinnedTrackIds');
      if (storedPins) setPinnedTrackIds(JSON.parse(storedPins));
  }, []);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (openMenuTrackId !== null && menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setOpenMenuTrackId(null);
        }
        if (isStatusDropdownOpen && statusRef.current && !statusRef.current.contains(event.target as Node)) {
            setIsStatusDropdownOpen(false);
        }
        if (isPriorityDropdownOpen && priorityRef.current && !priorityRef.current.contains(event.target as Node)) {
            setIsPriorityDropdownOpen(false);
        }
        if (isFilterOpen && filterRef.current && !filterRef.current.contains(event.target as Node)) {
            setIsFilterOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuTrackId, isStatusDropdownOpen, isPriorityDropdownOpen, isFilterOpen]);

  const fetchData = async () => {
      try {
          const [allTracks, allEntries, allUsers, allClients, allOrgs] = await Promise.all([
              getTracks(),
              getFeedEntries(),
              getUsers(),
              getClients(),
              getOrganizations()
          ]);
          setTracks(allTracks);
          const currentTrack = allTracks.find(t => t.id === trackId) || null;
          setTrack(currentTrack);
          setFeedEntries(allEntries);
          setUsers(allUsers);
          setClients(allClients);
          setOrganizations(allOrgs);
      } catch (e) {
          console.error("Error loading track data", e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchData();
  }, [trackId]);

  useEffect(() => {
    if (activeTrackRef.current) {
        activeTrackRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [trackId, tracks]);

  const handleUpdateTrack = async (updatedTrack: Track) => {
      try {
          const result = await updateTrack(updatedTrack.id, updatedTrack);
          setTrack(prev => (prev && prev.id === result.id ? result : prev));
          setTracks(prev => prev.map(t => t.id === result.id ? result : t));
          setTrackToEdit(null);
      } catch (error) {
          console.error("Failed to update track", error);
      }
  };

  const handleToggleCollaborator = (userId: number) => {
      if (track) {
          const newCollaboratorIds = track.collaboratorIds.includes(userId)
              ? track.collaboratorIds.filter(id => id !== userId)
              : [...track.collaboratorIds, userId];
          handleUpdateTrack({ ...track, collaboratorIds: newCollaboratorIds });
      }
  };

  const handleDeleteConfirm = async () => {
      if (!trackToDelete) return;
      try {
          await deleteTrack(trackToDelete.id);
          setTrackToDelete(null);
          if (trackId === trackToDelete.id) {
              onNavigate('DASHBOARD');
          } else {
              fetchData();
          }
      } catch (error) {
          console.error("Failed to delete track", error);
      }
  };

  const handleAddEntry = async (entryData: any) => {
      try {
          const newEntry = {
              ...entryData,
              trackId: trackId,
              authorId: currentUser.id,
              timestamp: new Date().toISOString(),
              reactions: {},
              comments: []
          };
          const created = await createFeedEntry(newEntry);
          setFeedEntries(prev => [created, ...prev]);
          setIsNewEntryModalOpen(false);
          setTriggerFileUpload(false);
      } catch (error) {
          console.error("Failed to add entry", error);
      }
  };

  const handleUpdateEntry = async (entry: FeedEntry) => {
      try {
          const updated = await updateFeedEntry(entry.id, entry);
          setFeedEntries(prev => prev.map(e => e.id === entry.id ? updated : e));
      } catch (error) {
          console.error("Failed to update entry", error);
      }
  };

  const handleAddComment = async (entryId: number, content: string) => {
      const entry = feedEntries.find(e => e.id === entryId);
      if (!entry) return;
      const newComment = {
          id: Date.now(),
          authorId: currentUser.id,
          timestamp: new Date().toISOString(),
          content,
          replies: []
      };
      const updatedEntry = { ...entry, comments: [...(entry.comments || []), newComment] };
      await handleUpdateEntry(updatedEntry);
  };

  const handleTogglePin = (id: number) => {
      setPinnedTrackIds(prev => {
          const newPins = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
          localStorage.setItem('pinnedTrackIds', JSON.stringify(newPins));
          return newPins;
      });
  };

  const handleMenuOpen = (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
      setOpenMenuTrackId(openMenuTrackId === id ? null : id);
  }

  const handleTagToggle = (tag: string) => {
      setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  // --- CONDITIONAL RENDERS (Early Returns) ---
  // Hooks MUST be called before these returns.
  
  if (loading) return <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>;
  if (!track) return <div className="text-center py-20">Track not found.</div>;

  // Filter entries for current track
  const trackEntries = feedEntries
    .filter(e => e.trackId === trackId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const displayedEntries = trackEntries.filter(e => {
      const matchesSearch = entrySearchTerm ? e.content.toLowerCase().includes(entrySearchTerm.toLowerCase()) : true;
      const matchesTag = selectedTags.length > 0 ? selectedTags.includes(e.type) : true;
      return matchesSearch && matchesTag;
  });

  const getEntriesForView = (view: string) => {
      const types = VIEW_CATEGORY_TYPES[view];
      if (!types) return [];
      return trackEntries.filter(e => types.includes(e.type as EntryType));
  };

  const availableTags = Array.from(new Set(trackEntries.map(e => e.type))).sort();

  // Sidebar logic
  const sidebarTracks = tracks
    .filter(t => isSidebarCollapsed ? pinnedTrackIds.includes(t.id) : (searchTerm ? t.name.toLowerCase().includes(searchTerm.toLowerCase()) : true))
    .sort((a, b) => {
        const aPinned = pinnedTrackIds.includes(a.id);
        const bPinned = pinnedTrackIds.includes(b.id);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return a.name.localeCompare(b.name);
    });

  const templateStyles = getTemplateStyle(currentTemplate);
  const trackClient = clients.find(c => c.id === track.clientId);
  const trackOwner = users.find(u => u.id === track.ownerId);

  return (
    <>
    <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Sidebar */}
        <aside className={`lg:sticky lg:top-24 transition-all duration-300 flex-shrink-0 ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-72'} w-full`}>
            <Card className={`h-[calc(100vh-8rem)] flex flex-col ${isSidebarCollapsed ? 'items-center px-2' : ''}`}>
                <div className={`flex items-center mb-4 ${isSidebarCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'}`}>
                    {!isSidebarCollapsed && <h3 className="font-bold text-lg text-gray-800">Tracks</h3>}
                    <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 rounded-md hover:bg-gray-100 text-gray-500">
                        <Icon name={isSidebarCollapsed ? "chevron-right" : "menu"} className="w-5 h-5" />
                    </button>
                </div>
                
                {!isSidebarCollapsed && (
                    <button onClick={() => setIsAddTrackModalOpen(true)} className="flex items-center justify-center px-3 py-1.5 rounded-md bg-primary-light text-primary hover:bg-primary hover:text-white transition-colors text-xs font-bold mb-4 w-full">
                        <Icon name="plus" className="w-4 h-4 mr-1.5" />
                        Create New Track
                    </button>
                )}

                <div className={`relative mb-4 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
                    {!isSidebarCollapsed ? (
                        <>
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary focus:border-primary"
                            />
                            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </>
                    ) : (
                        <button onClick={() => setIsSidebarCollapsed(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-primary"><Icon name="search" className="w-5 h-5" /></button>
                    )}
                </div>

                <nav className="space-y-1 flex-grow overflow-y-auto custom-scrollbar w-full pr-1">
                    {sidebarTracks.map(t => (
                        <div key={t.id} ref={t.id === trackId ? activeTrackRef : null} className={`flex items-center justify-between group relative px-2 py-1 rounded-md hover:bg-gray-50 transition-colors ${t.id === trackId ? 'bg-primary-light hover:bg-primary-light' : ''}`}>
                            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('TRACK_DETAIL', t.id); }} className={`flex items-center flex-grow min-w-0 py-1.5 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${getTemplateStyle(t.template || 'General').bg} ${getTemplateStyle(t.template || 'General').text} ${isSidebarCollapsed ? '' : 'mr-2'}`}>
                                    {t.name.substring(0, 2).toUpperCase()}
                                </div>
                                {!isSidebarCollapsed && (
                                    <span className={`truncate text-sm font-medium ${t.id === trackId ? 'text-primary' : 'text-gray-600'}`}>{t.name}</span>
                                )}
                            </a>
                            
                            {!isSidebarCollapsed && (
                                <div className="flex items-center flex-shrink-0 ml-1 gap-1">
                                    {/* Quick Actions Trigger */}
                                    <button 
                                        onClick={(e) => handleMenuOpen(e, t.id)}
                                        className={`p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-opacity ${openMenuTrackId === t.id ? 'opacity-100 bg-gray-200' : 'opacity-0 group-hover:opacity-100'}`}
                                    >
                                        <Icon name="dots-vertical" className="w-4 h-4" />
                                    </button>

                                    {/* Bookmark */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleTogglePin(t.id); }} 
                                        className={`p-1 rounded-full transition-all ${pinnedTrackIds.includes(t.id) ? 'text-primary opacity-100' : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:text-gray-500 hover:bg-gray-100'}`}
                                        title={pinnedTrackIds.includes(t.id) ? "Unpin" : "Pin"}
                                    >
                                        <Icon name="pin" className="w-3.5 h-3.5" fill={pinnedTrackIds.includes(t.id) ? "currentColor" : "none"} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </nav>
            </Card>
        </aside>

        {/* Global Menu Portal (Simulated) */}
        {openMenuTrackId !== null && menuPosition && (
            <div 
                ref={menuRef}
                style={{ top: menuPosition.top + 5, left: menuPosition.left }}
                className="fixed w-36 bg-white rounded-lg shadow-xl border border-gray-100 z-[9999] py-1 overflow-hidden animate-scale-in origin-top-left"
            >
                <button 
                    onClick={(e) => { e.stopPropagation(); setTrackToEdit(tracks.find(t => t.id === openMenuTrackId) || null); setOpenMenuTrackId(null); }}
                    className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center transition-colors"
                >
                    <Icon name="settings" className="w-3.5 h-3.5 mr-2 text-gray-400" /> Edit Track
                </button>
                <button 
                    onClick={(e) => { e.stopPropagation(); setTrackToDelete(tracks.find(t => t.id === openMenuTrackId) || null); setOpenMenuTrackId(null); }}
                    className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center transition-colors"
                >
                    <Icon name="trash" className="w-3.5 h-3.5 mr-2" /> Delete Track
                </button>
            </div>
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0 space-y-6 w-full">
            {/* New Post / Status Card */}
            <Card className="!p-4">
                <div className="flex items-center gap-4">
                    {currentUser.avatarUrl ? (
                        <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg border-2 border-white shadow-sm">
                            {currentUser.initials}
                        </div>
                    )}
                    <div 
                        onClick={() => setIsNewEntryModalOpen(true)}
                        className="flex-grow bg-gray-100 hover:bg-gray-200 transition-colors rounded-full px-5 py-3 cursor-pointer text-gray-500 text-sm font-medium"
                    >
                        What's new on {track.name}?
                    </div>
                    <button 
                        onClick={() => setIsNewEntryModalOpen(true)}
                        className="flex-shrink-0 p-3 bg-white border border-gray-200 text-primary hover:bg-gray-50 rounded-full transition-all shadow-sm"
                    >
                        <Icon name="plus" className="w-6 h-6" strokeWidth={2.5} />
                    </button>
                </div>
            </Card>

            {/* View Tabs */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex space-x-2 overflow-x-auto pb-2 custom-scrollbar w-full sm:w-auto">
                    {activeViews.map(view => (
                        <button key={view} onClick={() => setActiveView(view)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border ${activeView === view ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'}`}>
                            {view}
                        </button>
                    ))}
                    <button className="p-2 rounded-full hover:bg-gray-100 text-gray-400 border border-transparent hover:border-gray-200 transition-colors" title="Customize Views">
                        <Icon name="plus" className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* View Content */}
            {activeView === 'Feed' && (
                <div className="space-y-4">
                    {/* Search & Filter Row */}
                    <div className="flex justify-end items-center gap-3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search entries..."
                                value={entrySearchTerm}
                                onChange={(e) => setEntrySearchTerm(e.target.value)}
                                className="w-96 pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-primary-focus focus:border-primary transition-all shadow-sm"
                            />
                            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                        <div className="relative" ref={filterRef}>
                            <button 
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium border flex items-center shadow-sm transition-colors ${isFilterOpen ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                                <Icon name="settings" className="w-4 h-4 mr-2 text-gray-500" /> 
                                Filter
                                {selectedTags.length > 0 && (
                                    <span className="ml-2 bg-primary text-white text-xs font-bold rounded-full px-1.5 py-0.5">{selectedTags.length}</span>
                                )}
                            </button>
                            {isFilterOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-20 py-1 max-h-64 overflow-y-auto animate-scale-in origin-top-right">
                                    <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Entry Types</div>
                                    {availableTags.length > 0 ? availableTags.map(tag => (
                                        <label key={tag} className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedTags.includes(tag)}
                                                onChange={() => handleTagToggle(tag)}
                                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded mr-3"
                                            />
                                            {tag}
                                        </label>
                                    )) : (
                                        <div className="px-4 py-2 text-sm text-gray-500">No tags available</div>
                                    )}
                                    {selectedTags.length > 0 && (
                                        <div className="border-t border-gray-100 mt-1 pt-1">
                                            <button 
                                                onClick={() => setSelectedTags([])}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                Clear Filters
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {displayedEntries.map(entry => (
                        <EntryItem key={entry.id} entry={entry} users={users} tracks={[track]} onAddComment={handleAddComment} />
                    ))}
                    {displayedEntries.length === 0 && <Card><p className="text-center text-gray-500">No entries found.</p></Card>}
                </div>
            )}
            {activeView === 'Calendar' && <CalendarView entries={trackEntries} onAddEntry={() => setIsNewEntryModalOpen(true)} users={users} />}
            {activeView === 'Planning & Tracking' && <PlanningTimelineView entries={getEntriesForView('Planning & Tracking')} users={users} />}
            {activeView === 'Tasks' && <TasksKanbanView entries={getEntriesForView('Tasks')} onUpdateEntry={handleUpdateEntry} users={users} />}
            {activeView === 'Communication' && <CommunicationFeedView entries={getEntriesForView('Communication')} users={users} />}
            {activeView === 'Notes' && <NotesView entries={getEntriesForView('Notes')} users={users} />}
            {activeView === 'References' && <ReferencesView entries={getEntriesForView('References')} users={users} />}
            {activeView === 'Issues & Approvals' && <IssuesApprovalsView entries={getEntriesForView('Issues & Approvals')} />}
        </main>

        {/* Right Sidebar - Info */}
        <aside className="lg:w-80 lg:sticky lg:top-24 flex-shrink-0 w-full hidden xl:block">
            <Card className="h-[calc(100vh-8rem)] flex flex-col overflow-hidden !p-0">
                {/* Header Bar with Template Name */}
                <div className={`px-4 py-3 border-b border-gray-200 ${templateStyles.bg} transition-colors`}>
                    <span className={`text-xs font-bold uppercase tracking-wider ${templateStyles.text}`}>{currentTemplate}</span>
                </div>

                <div className="p-4 border-b border-gray-100 flex-shrink-0">
                    <div className="flex items-start gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 ${templateStyles.bg} ${templateStyles.text} ${track.avatarUrl ? 'p-0 overflow-hidden' : ''}`}>
                            {track.avatarUrl ? <img src={track.avatarUrl} className="w-full h-full object-cover" /> : track.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg font-bold text-gray-900 leading-tight mb-0.5">{track.name}</h1>
                            {trackClient && <p className="text-xs text-gray-500 font-medium">{trackClient.name}</p>}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {/* Status Dropdown */}
                        <div className="relative flex-1" ref={statusRef}>
                            <button 
                                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide border transition-colors ${track.lifecycle === TrackLifecycle.OPEN ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                            >
                                {track.lifecycle}
                                <Icon name="chevron-down" className="w-3 h-3 ml-1 opacity-70"/>
                            </button>
                            {isStatusDropdownOpen && (
                                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 py-1 overflow-hidden">
                                    {Object.values(TrackLifecycle).map(status => (
                                        <button key={status} onClick={() => { handleUpdateTrack({...track, lifecycle: status}); setIsStatusDropdownOpen(false); }} className="w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-gray-50 text-gray-700">{status}</button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Priority Dropdown */}
                        <div className="relative flex-1" ref={priorityRef}>
                            <button 
                                onClick={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide border transition-colors ${getPriorityColor(track.priority)}`}
                            >
                                {track.priority}
                                <Icon name="chevron-down" className="w-3 h-3 ml-1 opacity-70"/>
                            </button>
                            {isPriorityDropdownOpen && (
                                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-20 py-1 overflow-hidden">
                                    {(['Low', 'Medium', 'High', 'Critical'] as TrackPriority[]).map(p => (
                                        <button key={p} onClick={() => { handleUpdateTrack({...track, priority: p}); setIsPriorityDropdownOpen(false); }} className="w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-gray-50 text-gray-700">{p}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 space-y-6 overflow-y-auto">
                    <div>
                        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-2 mb-2">Overview</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{track.description.replace(/^\[Template: .*?\]\n?/, '')}</p>
                    </div>
                    
                    <div>
                        <div className="flex justify-between items-end mb-1">
                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Progress</h3>
                            <span className="text-sm font-bold text-primary">{track.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                            <div className="bg-primary h-2 rounded-full" style={{ width: `${track.progress || 0}%` }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 font-medium">
                            <span>Start: {track.startDate ? new Date(track.startDate).toLocaleDateString() : 'N/A'}</span>
                            <span>End: {track.endDate ? new Date(track.endDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wide border-b border-gray-100 pb-2 mb-3">Collaborator</h3>
                        <div className="flex items-center gap-3">
                            {trackOwner && (
                                <div className="flex items-center gap-2 bg-gray-50 p-1.5 pr-3 rounded-full border border-gray-100">
                                    {trackOwner.avatarUrl ? (
                                        <img src={trackOwner.avatarUrl} className="w-6 h-6 rounded-full" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">{trackOwner.initials}</div>
                                    )}
                                    <span className="text-xs font-medium text-gray-700">{trackOwner.name}</span>
                                    <Icon name="crown" className="w-3 h-3 text-amber-500" />
                                </div>
                            )}
                            <button 
                                onClick={() => setIsManageCollaboratorsOpen(true)}
                                className="w-8 h-8 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors"
                            >
                                <Icon name="plus" className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </Card>
        </aside>

        {/* Modals */}
        {isNewEntryModalOpen && (
            <NewEntryModal 
                track={track} 
                entryTags={[]} 
                onAddTag={() => {}}
                onClose={() => setIsNewEntryModalOpen(false)}
                onSave={handleAddEntry}
                triggerUpload={triggerFileUpload}
            />
        )}
        
        {/* Modals for Sidebar Actions */}
        {trackToEdit && (
            <EditTrackModal 
                track={trackToEdit} 
                onClose={() => setTrackToEdit(null)} 
                onSave={handleUpdateTrack} 
            />
        )}
        
        {trackToDelete && (
            <DeleteTrackConfirmationModal 
                track={trackToDelete} 
                onCancel={() => setTrackToDelete(null)} 
                onConfirm={handleDeleteConfirm} 
            />
        )}

        {isAddTrackModalOpen && (
            <AddTrackModal 
                users={users} 
                owners={users}
                entryTags={[]}
                onAddTag={() => {}}
                onClose={() => setIsAddTrackModalOpen(false)} 
                onSave={async (newTrackData, entryData) => {
                    try {
                        const { createTrack } = await import('../api/tracksApi');
                        const createdTrack = await createTrack({ 
                            ...newTrackData, 
                            organizationId: currentUser.organizationId,
                            progress: 0,
                            collaboratorIds: newTrackData.ownerId ? [newTrackData.ownerId] : []
                        });
                        
                        if (entryData) {
                            const { createFeedEntry } = await import('../api/feedApi');
                            await createFeedEntry({
                                ...entryData,
                                trackId: createdTrack.id,
                                authorId: currentUser.id,
                                timestamp: new Date().toISOString(),
                                reactions: {},
                                comments: []
                            });
                        }
                        
                        setIsAddTrackModalOpen(false);
                        onNavigate('TRACK_DETAIL', createdTrack.id);
                    } catch (e) { console.error(e); }
                }}
            />
        )}

        {isManageCollaboratorsOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex justify-center items-center p-4" onClick={() => setIsManageCollaboratorsOpen(false)}>
                <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-800">Manage Collaborators</h3>
                        <button onClick={() => setIsManageCollaboratorsOpen(false)} className="text-gray-400 hover:text-gray-600"><Icon name="close" className="w-5 h-5" /></button>
                    </div>
                    <div className="max-h-80 overflow-y-auto p-2">
                        {users.map(u => {
                            const isSelected = track.collaboratorIds.includes(u.id);
                            return (
                                <div key={u.id} onClick={() => handleToggleCollaborator(u.id)} className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-primary-light' : 'hover:bg-gray-50'}`}>
                                    {u.avatarUrl ? (
                                        <img src={u.avatarUrl} className="w-8 h-8 rounded-full mr-3" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold mr-3">{u.initials}</div>
                                    )}
                                    <div className="flex-1">
                                        <p className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-gray-700'}`}>{u.name}</p>
                                        <p className="text-xs text-gray-500">{u.role}</p>
                                    </div>
                                    {isSelected && <Icon name="task" className="w-4 h-4 text-primary" />} 
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        )}
    </div>
    </>
  );
};

export default TrackFeedsPage;
