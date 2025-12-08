
import React, { useState, useEffect, useMemo, useRef } from 'react';
// Fix: Import Client type
import { Track, User, FeedEntry, View, TrackLifecycle, TrackPriority, UserRole, Client } from '../types';
import Icon from './Icon';
import EntryItem from './FeedItem';
import NewEntryModal from './NewPostModal';

// Reusable Card component for this page
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-white p-6 rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);

// Prop type for the main component
interface TrackFeedsPageProps {
  tracks: Track[];
  users: User[];
  // Fix: Add clients to props
  clients: Client[];
  feedEntries: FeedEntry[];
  entryTags: string[];
  trackId: number;
  onSelectTrack: (id: number) => void;
  onNavigate: (view: View) => void;
  onShowAddTrackModal: () => void;
  onEditTrack: (track: Track) => void;
  onUpdateTrack: (track: Track) => void;
  onReviewTrack: (id: number) => void;
  onDeleteTrack: (track: Track) => void;
  onAddEntry: (entry: Omit<FeedEntry, 'id'>) => void;
  onAddEntryTag: (tag: string) => void;
  onAddComment: (entryId: number, content: string) => void;
}

const TrackFeedsPage: React.FC<TrackFeedsPageProps> = ({ tracks, users, clients, feedEntries, entryTags, trackId, onSelectTrack, onNavigate, onShowAddTrackModal, onEditTrack, onUpdateTrack, onReviewTrack, onDeleteTrack, onAddEntry, onAddEntryTag, onAddComment }) => {
  const track = tracks.find(p => p.id === trackId);
  
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
  const [triggerFileUpload, setTriggerFileUpload] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [entrySearchTerm, setEntrySearchTerm] = useState('');
  const [pinnedTracks, setPinnedTracks] = useState<number[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [menuDirection, setMenuDirection] = useState<'down' | 'up'>('down');
  
  const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isManageCollaboratorsOpen, setIsManageCollaboratorsOpen] = useState(false);
  const ownerDropdownRef = useRef<HTMLDivElement>(null);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
      if (ownerDropdownRef.current && !ownerDropdownRef.current.contains(event.target as Node)) {
        setIsOwnerDropdownOpen(false);
      }
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target as Node)) {
        setIsPriorityDropdownOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!track) {
    return (
        <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-gray-700">Track Not Found</h1>
            <p className="text-gray-500 mt-2">The selected track could not be found. It may have been deleted.</p>
        </div>
    );
  }

  // Fix: Use clients prop instead of global constant and simplify logic.
  const client = useMemo(() => {
    return clients.find(c => c.id === track.clientId);
  }, [track.clientId, clients]);

  const owner = users.find(u => u.id === track.ownerId);
  const currentUser = users[0]; // Assume current user is the first in the filtered list
  
  const trackFeedEntries = useMemo(() => {
    return feedEntries
      .filter(p => p.trackId === trackId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [feedEntries, trackId]);

  const availableTags = useMemo(() => {
    const tags = new Set(trackFeedEntries.map(e => e.type));
    return Array.from(tags).sort();
  }, [trackFeedEntries]);

  const entries = useMemo(() => {
    let filtered = trackFeedEntries;

    if (entrySearchTerm.trim()) {
        filtered = filtered.filter(entry =>
            entry.content.toLowerCase().includes(entrySearchTerm.toLowerCase())
        );
    }

    if (selectedTags.length > 0) {
        filtered = filtered.filter(entry => selectedTags.includes(entry.type));
    }
    
    return filtered;
  }, [trackFeedEntries, selectedTags, entrySearchTerm]);
  
  const collaborators = useMemo(() => {
    return users.filter(user => track.collaboratorIds.includes(user.id))
                .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [track.collaboratorIds, users]);

  const MAX_VISIBLE_MEMBERS = 10;
  const visibleMembers = collaborators.slice(0, MAX_VISIBLE_MEMBERS);
  const hiddenMembersCount = collaborators.length - visibleMembers.length;

  const handleOwnerChange = (newOwnerId: number) => {
    if (track) {
        onUpdateTrack({ ...track, ownerId: newOwnerId });
    }
    setIsOwnerDropdownOpen(false);
  };

  const handlePriorityChange = (newPriority: TrackPriority) => {
      if (track) {
          onUpdateTrack({ ...track, priority: newPriority });
      }
      setIsPriorityDropdownOpen(false);
  };

  const handleToggleCollaborator = (userId: number) => {
      if (track) {
          const newCollaboratorIds = track.collaboratorIds.includes(userId)
              ? track.collaboratorIds.filter(id => id !== userId)
              : [...track.collaboratorIds, userId];
          onUpdateTrack({ ...track, collaboratorIds: newCollaboratorIds });
      }
  };

  const potentialOwners = users.filter(u => u.role === UserRole.ADMIN || u.role === UserRole.MANAGER);
  const priorities: TrackPriority[] = ['High', 'Medium', 'Low'];

  const handlePinToggle = (trackIdToToggle: number) => {
    setPinnedTracks(prev =>
      prev.includes(trackIdToToggle)
        ? prev.filter(id => id !== trackIdToToggle)
        : [...prev, trackIdToToggle]
    );
  };

  const filteredTracks = useMemo(() => {
    return tracks
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        const aIsPinned = pinnedTracks.includes(a.id);
        const bIsPinned = pinnedTracks.includes(b.id);
        if (aIsPinned && !bIsPinned) return -1;
        if (!aIsPinned && bIsPinned) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [searchTerm, pinnedTracks, tracks]);

  const handleCloseNewEntryModal = () => {
    setIsNewEntryModalOpen(false);
    setTriggerFileUpload(false);
  };

  const handleNewEntryWithUpload = () => {
    setTriggerFileUpload(true);
    setIsNewEntryModalOpen(true);
  };

  const handleEntrySubmit = (entryData: { content: string; type: string; visibleToUserIds: number[], attachments: { name: string, url: string, type: string }[], chips: string[] }) => {
    const newEntry: Omit<FeedEntry, 'id'> = {
      authorId: currentUser.id,
      timestamp: new Date().toISOString(),
      type: entryData.type,
      content: entryData.content,
      trackId: trackId,
      visibleToUserIds: entryData.visibleToUserIds.length > 0 ? entryData.visibleToUserIds : undefined,
      attachments: entryData.attachments.length > 0 ? entryData.attachments : undefined,
      chips: entryData.chips,
      reactions: {},
      comments: [],
    };
    
    onAddEntry(newEntry);
    handleCloseNewEntryModal();
  };
  
  const formatDate = (dateString?: string) => {
      if (!dateString) return 'N/A';
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

  const getLifecycleColor = (lifecycle: TrackLifecycle) => {
    switch (lifecycle) {
      case TrackLifecycle.OPEN: return 'bg-sky-100 text-sky-800';
      case TrackLifecycle.CLOSED: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getPriorityColor = (priority: TrackPriority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Medium':
        return 'bg-amber-100 text-amber-800';
      case 'Low':
        return 'bg-sky-100 text-sky-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTrackMenuToggle = (e: React.MouseEvent<HTMLButtonElement>, trackId: number) => {
    e.stopPropagation();
    if (openMenuId === trackId) {
        setOpenMenuId(null);
        return;
    }

    if (navRef.current) {
        const navRect = navRef.current.getBoundingClientRect();
        const buttonRect = e.currentTarget.getBoundingClientRect();
        
        const spaceBelow = navRect.bottom - buttonRect.bottom;
        const spaceAbove = buttonRect.top - navRect.top;
        const menuHeight = 100; // Approx height for 3 items
        
        if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
            setMenuDirection('up');
        } else {
            setMenuDirection('down');
        }
    }
    
    setOpenMenuId(trackId);
  };
  
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => {
        if (prev.includes(tag)) {
            return prev.filter(t => t !== tag);
        } else {
            return [...prev, tag];
        }
    });
  };

  const showProgress = [TrackLifecycle.OPEN, TrackLifecycle.CLOSED].includes(track.lifecycle);
  const showTimeline = [TrackLifecycle.OPEN, TrackLifecycle.CLOSED].includes(track.lifecycle);

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Sidebar */}
      <aside className="lg:col-span-3 lg:sticky lg:top-24">
        <Card className="h-[calc(100vh-8rem)] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-gray-800">Tracks</h3>
            <button onClick={onShowAddTrackModal} className="flex items-center justify-center px-3 py-1.5 rounded-md bg-primary-light text-primary hover:bg-primary hover:text-white transition-colors text-xs font-bold">
                <Icon name="plus" className="w-4 h-4 mr-1.5" />
                Add Track
            </button>
          </div>
          <div className="relative mb-4">
            <input 
              type="text"
              placeholder="Search tracks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-focus focus:border-primary"
            />
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          <nav ref={navRef} className="space-y-2 flex-grow overflow-y-auto -mr-3 pr-1">
            {filteredTracks.map((p) => {
                const isPinned = pinnedTracks.includes(p.id);
                return (
                  <div key={p.id} className="flex items-center group pr-2">
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); onSelectTrack(p.id); }}
                      className={`flex-grow flex items-center p-3 rounded-md transition-colors text-sm font-medium min-w-0 ${p.id === trackId ? 'bg-primary-light text-primary' : 'text-gray-600 hover:bg-gray-100'}`}
                      title={p.name}
                    >
                      <Icon name="projects" className="w-5 h-5 mr-3 flex-shrink-0" />
                      <span className="truncate">{p.name}</span>
                    </a>
                     <div className={`flex items-center shrink-0 ml-1 transition-opacity ${isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}>
                        <button
                            onClick={(e) => { e.stopPropagation(); handlePinToggle(p.id); }}
                            className="p-1 rounded-full"
                            aria-label={isPinned ? `Unpin ${p.name}` : `Pin ${p.name}`}
                        >
                            {isPinned ? (
                                <Icon name="pin" className="w-5 h-5 text-primary" fill="currentColor" strokeWidth={0}/>
                            ) : (
                                <Icon name="pin" className="w-5 h-5 text-gray-400 hover:text-primary" />
                            )}
                        </button>
                        <div className="relative" ref={openMenuId === p.id ? menuRef : null}>
                            <button
                                onClick={(e) => handleTrackMenuToggle(e, p.id)}
                                className="p-1 rounded-full text-gray-400 hover:text-primary"
                                aria-label="More options"
                            >
                                <Icon name="dots-vertical" className="w-5 h-5" />
                            </button>
                            {openMenuId === p.id && (
                                <div className={`absolute right-0 w-32 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20 ${menuDirection === 'up' ? 'origin-bottom-right bottom-full mb-1' : 'origin-top-right top-full mt-1'}`}>
                                    <div className="py-1" role="menu" aria-orientation="vertical">
                                        <a href="#" onClick={(e) => { e.preventDefault(); onReviewTrack(p.id); setOpenMenuId(null); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Views</a>
                                        <a href="#" onClick={(e) => { e.preventDefault(); onEditTrack(p); setOpenMenuId(null); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">Edit</a>
                                        <a href="#" onClick={(e) => { e.preventDefault(); onDeleteTrack(p); setOpenMenuId(null); }} className="block px-4 py-2 text-sm text-red-700 hover:bg-red-50" role="menuitem">Delete</a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                  </div>
                )
            })}
          </nav>
        </Card>
      </aside>

      {/* Center Feed Section */}
      <main className="lg:col-span-6 space-y-6">
        {/* New Entry Card */}
        <Card>
            <div 
                className="flex items-center space-x-4"
            >
                {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-10 h-10 rounded-full" />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">{currentUser.initials}</div>
                )}
                <div 
                    onClick={() => setIsNewEntryModalOpen(true)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full px-4 py-2.5 cursor-pointer"
                >
                    <span className="text-gray-500">What’s new on {track.name}?</span>
                </div>
                <button 
                    onClick={handleNewEntryWithUpload}
                    className="p-2 rounded-full bg-primary-light text-primary hover:bg-primary hover:text-white transition-colors"
                    aria-label="Create new entry"
                >
                    <Icon name="plus" className="w-6 h-6" strokeWidth={2} />
                </button>
            </div>
          </Card>


        {/* Feeds */}
        <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800 px-1">Track Entries</h3>
              <div className="flex items-center gap-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search entries..."
                        value={entrySearchTerm}
                        onChange={(e) => setEntrySearchTerm(e.target.value)}
                        className="w-64 pl-10 pr-4 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-primary-focus focus:border-primary transition-all"
                    />
                    <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                <div className="relative" ref={filterRef}>
                    <button
                    onClick={() => setIsFilterOpen(prev => !prev)}
                    className="flex items-center space-x-2 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50"
                    >
                    <Icon name="settings" className="w-4 h-4" />
                    <span>Filter by Tag</span>
                    {selectedTags.length > 0 && (
                        <span className="bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{selectedTags.length}</span>
                    )}
                    </button>
                    {isFilterOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                        <div className="py-1">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Filter by Type</div>
                        {availableTags.map(tag => (
                            <label key={tag} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary-focus"
                                checked={selectedTags.includes(tag)}
                                onChange={() => handleTagToggle(tag)}
                            />
                            <span className="ml-3">{tag}</span>
                            </label>
                        ))}
                        {selectedTags.length > 0 && (
                            <>
                                <div className="border-t border-gray-200 my-1"></div>
                                <button 
                                    onClick={() => setSelectedTags([])}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                    Clear Filters
                                </button>
                            </>
                        )}
                        </div>
                    </div>
                    )}
                </div>
              </div>
            </div>
            {entries.length > 0 ? (
                entries.map(entry => <EntryItem key={entry.id} entry={entry} onAddComment={onAddComment} users={users} tracks={tracks} />)
            ) : (
                <Card>
                    <p className="text-center text-gray-500">No entries match the selected filters.</p>
                </Card>
            )}
        </div>
      </main>

      {/* Right Section */}
      <aside className="lg:col-span-3 lg:sticky lg:top-24">
        <Card className="h-[calc(100vh-8rem)] flex flex-col">
          {/* Header */}
          <div className='flex-shrink-0'>
            <h2 className="text-2xl font-bold text-gray-900 truncate">{track.name}</h2>
            {client && (
              <p className="text-sm text-gray-500 mt-1">
                Client / Stakeholder: <span className="font-medium text-gray-700">{client.name}</span>
              </p>
            )}
            <div className="flex items-center space-x-2 mt-4">
              <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getLifecycleColor(track.lifecycle)}`}>
                  {track.lifecycle}
              </span>
              <div className="relative" ref={priorityDropdownRef}>
                  <button onClick={() => setIsPriorityDropdownOpen(prev => !prev)} className="w-full text-left">
                      <span className={`inline-flex items-center justify-between px-2.5 py-1 rounded-full text-xs font-semibold ${getPriorityColor(track.priority)} transition-colors hover:opacity-90`}>
                          {track.priority} Priority
                          <Icon name="chevron-down" className={`w-3 h-3 ml-2 transition-transform ${isPriorityDropdownOpen ? 'rotate-180' : ''}`} />
                      </span>
                  </button>
                  {isPriorityDropdownOpen && (
                      <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          <ul>
                              {priorities.map(p => (
                                  <li key={p} onClick={() => handlePriorityChange(p)} className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                                      {p}
                                  </li>
                              ))}
                          </ul>
                      </div>
                  )}
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-200 my-5 flex-shrink-0"></div>
          
          {/* Scrollable Content */}
          <div className="space-y-5 flex-grow overflow-y-auto -mr-3 pr-3">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
              <p className="text-sm text-gray-600">{track.description}</p>
            </div>

            {showProgress && (
            <div>
              <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-800">Progress</span>
                  <span className="text-sm font-medium text-gray-700">{track.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${track.progress}%` }}></div>
              </div>
            </div>
            )}
            
            {showTimeline && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Timeline</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                      <p className="text-gray-500">Start Date</p>
                      <p className="font-medium text-gray-700">{formatDate(track.startDate)}</p>
                  </div>
                  <div>
                      <p className="text-gray-500">End Date</p>
                      <p className="font-medium text-gray-700">{formatDate(track.endDate)}</p>
                  </div>
              </div>
            </div>
            )}
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Track Owner</h3>
              <div className="relative" ref={ownerDropdownRef}>
                  <button onClick={() => setIsOwnerDropdownOpen(prev => !prev)} className="w-full text-left p-2 rounded-md hover:bg-gray-100 transition-colors flex items-center space-x-3">
                      {owner ? (
                        <>
                          {owner.avatarUrl ? (
                          <img src={owner.avatarUrl} alt={owner.name} className="w-9 h-9 rounded-full" />
                          ) : (
                          <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">{owner.initials}</div>
                          )}
                          <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-800 truncate">{owner.name}</p>
                              <p className="text-xs text-gray-500 truncate">{owner.role}</p>
                          </div>
                        </>
                      ) : (
                          <p className="text-sm text-gray-500">N/A</p>
                      )}
                      <Icon name="chevron-down" className={`w-4 h-4 text-gray-500 ml-auto flex-shrink-0 transition-transform ${isOwnerDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOwnerDropdownOpen && (
                      <div className="absolute top-full mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          <ul>
                              {potentialOwners.map(m => (
                                  <li key={m.id} onClick={() => handleOwnerChange(m.id)} className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center space-x-3">
                                      {m.avatarUrl ? <img src={m.avatarUrl} alt={m.name} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">{m.initials}</div>}
                                      <span>{m.name}</span>
                                  </li>
                              ))}
                          </ul>
                      </div>
                  )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Collaborators</h3>
                <div className="flex flex-wrap gap-2">
                  {visibleMembers.map(member => (
                    <div key={member.id} className="flex items-center space-x-2 bg-gray-100 rounded-full py-1 px-3" title={member.name}>
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt={member.name} className="w-5 h-5 rounded-full" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[10px]">{member.initials}</div>
                      )}
                      <span className="text-xs font-medium text-gray-700 truncate">{member.name.split(' ')[0]}</span>
                    </div>
                  ))}
                  {hiddenMembersCount > 0 && (
                    <button 
                      onClick={() => setIsManageCollaboratorsOpen(true)}
                      className="flex items-center justify-center bg-primary-light text-primary rounded-full py-1 px-3 text-xs font-bold hover:bg-primary hover:text-white transition-colors"
                    >
                      + View All
                    </button>
                  )}
                </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="border-t border-gray-200 mt-5 pt-5 flex-shrink-0">
            <button
                onClick={() => setIsManageCollaboratorsOpen(true)}
                className="w-full flex items-center justify-center px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-hover transition-colors font-semibold text-sm shadow-sm"
            >
                <Icon name="users" className="w-5 h-5 mr-2" />
                Manage Collaborators ({track.collaboratorIds.length})
            </button>
          </div>
        </Card>
      </aside>
    </div>
    {isNewEntryModalOpen && <NewEntryModal 
        track={track} 
        entryTags={entryTags} 
        onAddTag={onAddEntryTag} 
        onClose={handleCloseNewEntryModal} 
        onSave={handleEntrySubmit} 
        triggerUpload={triggerFileUpload}
    />}
    {isManageCollaboratorsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4 transition-opacity" onClick={() => setIsManageCollaboratorsOpen(false)}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">Manage Collaborators</h3>
                    <button onClick={() => setIsManageCollaboratorsOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full">
                        <Icon name="close" className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    <ul className="space-y-1">
                        {users.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })).map(user => {
                            const isAssigned = track.collaboratorIds.includes(user.id);
                            return (
                                <li key={user.id} onClick={() => handleToggleCollaborator(user.id)} className="px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 cursor-pointer flex items-center justify-between rounded-md">
                                    <div className="flex items-center space-x-3">
                                        {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">{user.initials}</div>}
                                        <span className="font-medium">{user.name}</span>
                                    </div>
                                    {isAssigned && <Icon name="task" className="w-5 h-5 text-green-500" />}
                                </li>
                            );
                        })}
                    </ul>
                </div>
                <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end">
                    <button onClick={() => setIsManageCollaboratorsOpen(false)} className="px-5 py-2 bg-primary border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-hover">
                        Done
                    </button>
                </div>
            </div>
        </div>
    )}
    </>
  );
};

export default TrackFeedsPage;
