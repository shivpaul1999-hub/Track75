
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Track, User, FeedEntry, View, TrackLifecycle, TrackPriority, EntryType, Organization } from '../types';
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
import ShareTrackModal from './ShareTrackModal';
import { useToast } from './ToastContext';

// API Imports
import { getTracks, updateTrack, deleteTrack } from '../api/tracksApi';
import { getFeedEntries, createFeedEntry, updateFeedEntry } from '../api/feedApi';
import { getUsers } from '../api/usersApi';

import { getOrganizations } from '../api/organizationsApi';
import { getTemplates, TemplateConfig } from '../api/metaApi';

// Reusable Card component for this page
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`bg-white dark:bg-dark-card p-6 rounded-lg border border-gray-200 dark:border-dark-elevated shadow-sm ${className}`}>
        {children}
    </div>
);

const getTemplateFromDescription = (description: string): string => {
    const match = description?.match(/^\[Template: (.*?)\]/);
    return match ? match[1] : 'General';
};

// Removed getTemplateStyle as we are moving to dynamic colors


const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'Critical': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-900/50';
        case 'High': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-900/50';
        case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-900/50';
        case 'Low': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-900/50';
        default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-dark-elevated dark:text-gray-300 dark:border-gray-600';
    }
};

const VIEW_CATEGORY_TYPES: Record<string, EntryType[]> = {
    'Planning & Tracking': [EntryType.OPPORTUNITY, EntryType.ROADMAP_UPDATE, EntryType.META_DATA_TRACK_INFO, EntryType.DEPLOYMENT_RELEASE],
    'Tasks': [EntryType.TASK, EntryType.PRIORITY_TASK, EntryType.CHECKLIST_TODO],
    'Communication': [EntryType.COMMENT, EntryType.ANNOUNCEMENT],
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

    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [templatesData, setTemplatesData] = useState<TemplateConfig[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeView, setActiveView] = useState('Feed');
    const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
    const [isAddTrackModalOpen, setIsAddTrackModalOpen] = useState(false);
    const [triggerFileUpload, setTriggerFileUpload] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);


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
    const [menuPosition, setMenuPosition] = useState<{ top: number, left: number } | null>(null);

    const { showToast } = useToast();

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
            const [allTracks, allEntries, allUsers, allOrgs, allTemplates] = await Promise.all([
                getTracks(),
                getFeedEntries(),
                getUsers(),
                getOrganizations(),
                getTemplates()
            ]);
            setTracks(allTracks);
            const currentTrack = allTracks.find(t => t.id === trackId) || null;
            setTrack(currentTrack);
            setFeedEntries(allEntries);
            setUsers(allUsers);
            setOrganizations(allOrgs);
            setTemplatesData(allTemplates);
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
            showToast('Successfully Updated Track', 'success');
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
            showToast('Successfully Deleted Track', 'success');
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
            showToast('Successfully Created Entry', 'success');
        } catch (error) {
            console.error("Failed to add entry", error);
        }
    };

    const handleUpdateEntry = async (entry: FeedEntry) => {
        try {
            const updated = await updateFeedEntry(entry.id, entry);
            setFeedEntries(prev => prev.map(e => e.id === entry.id ? updated : e));
            showToast('Successfully Updated Entry', 'success');
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

    // --- CONDITIONAL CONTENT (Derived State Safe Guards) ---

    // Safely calculate derived state even if track is null
    const getTrackTemplateConfig = (t: Track | null) => {
        if (!t) return { colors: { text: '#374151', bg: '#F3F4F6' } };
        const templateName = t.template || getTemplateFromDescription(t.description || '');
        return templatesData.find(temp => temp.name === templateName) || { colors: { text: '#374151', bg: '#F3F4F6' } };
    };

    // Filter entries for current track
    const trackEntries = feedEntries
        .filter(e => e.trackId === trackId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Only apply search and tag filters to the 'Feed' view
    const feedViewEntries = trackEntries.filter(e => {
        const matchesSearch = entrySearchTerm ? e.content.toLowerCase().includes(entrySearchTerm.toLowerCase()) : true;
        const matchesTag = selectedTags.length > 0 ? selectedTags.includes(e.type) : true;
        return matchesSearch && matchesTag;
    });

    const getEntriesForView = (view: string) => {
        const types = VIEW_CATEGORY_TYPES[view];
        if (!types) return [];

        // precise logic: 
        // Feed view -> uses feedViewEntries (filtered by search/tags) via render logic below, 
        // OR we can just return it here if 'Feed' was passed, but 'Feed' isn't usually passed here in the current code structure for the main feed list.
        // However, other views (Notes, References, etc.) should use raw trackEntries filtered by their specific Types.

        return trackEntries.filter(e => types.includes(e.type as EntryType));
    };

    const availableTags: string[] = Array.from(new Set<string>(trackEntries.map(e => e.type))).sort();

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

    const activeTemplateConfig = getTrackTemplateConfig(track);
    const trackOwner = track ? users.find(u => u.id === track.ownerId) : null;

    // Ensure trackId matches reliably
    const targetTrackId = Number(trackId);

    // If loading, we still render the layout but with loading states
    // If track not found, we render layout with error in main content

    return (
        <>
            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Left Sidebar */}
                <aside className={`lg:sticky lg:top-24 transition-all duration-300 flex-shrink-0 ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-72'} w-full`}>
                    <Card className={`h-[calc(100vh-8rem)] flex flex-col ${isSidebarCollapsed ? 'items-center px-2' : ''}`}>
                        <div className={`flex items-center mb-4 ${isSidebarCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'}`}>
                            {!isSidebarCollapsed && <h3 className="font-bold text-lg text-gray-800 dark:text-white">Tracks</h3>}
                            <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-dark-elevated text-gray-500 dark:text-gray-400">
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
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-elevated rounded-md text-sm focus:ring-primary focus:border-primary bg-white dark:bg-dark-elevated text-gray-900 dark:text-white placeholder-gray-400"
                                    />
                                    <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                </>
                            ) : (
                                <button onClick={() => setIsSidebarCollapsed(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-elevated text-gray-400 hover:text-primary"><Icon name="search" className="w-5 h-5" /></button>
                            )}
                        </div>

                        <nav className="space-y-1 flex-grow overflow-y-auto custom-scrollbar w-full pr-1">
                            {sidebarTracks.map(t => (
                                <div key={t.id} ref={t.id === trackId ? activeTrackRef : null} className={`flex items-center justify-between group relative px-2 py-1 rounded-md hover:bg-gray-50 dark:hover:bg-dark-elevated transition-colors ${t.id === trackId ? 'bg-primary-light dark:bg-primary/20 hover:bg-primary-light dark:hover:bg-primary/20' : ''}`}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('TRACK_DETAIL', t.id); }} className={`flex items-center flex-grow min-w-0 py-1.5 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                                        <div
                                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${isSidebarCollapsed ? '' : 'mr-2'}`}
                                            style={{
                                                backgroundColor: getTrackTemplateConfig(t).colors.bg,
                                                color: getTrackTemplateConfig(t).colors.text
                                            }}
                                        >
                                            {t.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        {!isSidebarCollapsed && (
                                            <span className={`truncate text-sm font-medium ${t.id === trackId ? 'text-primary' : 'text-gray-600 dark:text-gray-400'}`}>{t.name}</span>
                                        )}
                                    </a>

                                    {!isSidebarCollapsed && (
                                        <div className="flex items-center flex-shrink-0 ml-1 gap-1">
                                            {/* Quick Actions Trigger */}
                                            <button
                                                onClick={(e) => handleMenuOpen(e, t.id)}
                                                className={`p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-elevated transition-colors ${openMenuTrackId === t.id ? 'bg-gray-200 dark:bg-dark-elevated opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                            >
                                                <Icon name="dots-vertical" className="w-4 h-4" />
                                            </button>

                                            {/* Bookmark */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleTogglePin(t.id); }}
                                                className={`p-1 rounded-full transition-all ${pinnedTrackIds.includes(t.id) ? 'text-primary opacity-100' : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-elevated'}`}
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
                        className="fixed w-36 bg-white dark:bg-dark-popup rounded-lg shadow-xl border border-gray-100 dark:border-dark-elevated z-[9999] py-1 overflow-hidden animate-scale-in origin-top-left"
                    >
                        {/* Check ownership before showing sensitive actions */}
                        {tracks.find(t => t.id === openMenuTrackId)?.ownerId === currentUser.id && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setTrackToEdit(tracks.find(t => t.id === openMenuTrackId) || null); setOpenMenuTrackId(null); }}
                                    className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-elevated flex items-center transition-colors"
                                >
                                    <Icon name="settings" className="w-3.5 h-3.5 mr-2 text-gray-400" /> Edit Track
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setTrackToDelete(tracks.find(t => t.id === openMenuTrackId) || null); setOpenMenuTrackId(null); }}
                                    className="w-full text-left px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center transition-colors"
                                >
                                    <Icon name="trash" className="w-3.5 h-3.5 mr-2" /> Delete Track
                                </button>
                            </>
                        )}
                        {tracks.find(t => t.id === openMenuTrackId)?.ownerId !== currentUser.id && (
                            <div className="px-4 py-2 text-xs text-gray-400 italic">No actions available</div>
                        )}
                    </div>
                )}

                {/* Main Content */}
                <main className="flex-1 min-w-0 space-y-6 w-full">
                    {loading ? (
                        <div className="flex justify-center h-64 items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                        </div>
                    ) : !track ? (
                        <div className="text-center py-20 bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-elevated">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Track not found</h3>
                            <p className="mt-2 text-gray-500 dark:text-gray-400">The requested track could not be found or has been deleted.</p>
                        </div>
                    ) : (
                        <>
                            {/* ... (Existing Main Content Logic - New Entry Button) ... */}
                            {/* Only show 'What's new' if user has edit access */}
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
                                        className="flex-grow bg-gray-100 dark:bg-dark-elevated hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors rounded-full px-5 py-3 cursor-pointer text-gray-500 dark:text-gray-400 text-sm font-medium"
                                    >
                                        What's new on {track.name}?
                                    </div>
                                    <button
                                        onClick={() => setIsNewEntryModalOpen(true)}
                                        className="flex-shrink-0 p-3 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-elevated text-primary hover:bg-gray-50 dark:hover:bg-dark-elevated rounded-full transition-all shadow-sm"
                                    >
                                        <Icon name="plus" className="w-6 h-6" strokeWidth={2.5} />
                                    </button>
                                </div>
                            </Card>

                            {/* Search & Filter Header (Only for Feed tab) */}
                            {activeView === 'Feed' && (
                                <div className="flex justify-end pb-2 px-1">
                                    <div className="hidden sm:flex items-center space-x-2">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Search entries..."
                                                value={entrySearchTerm}
                                                onChange={(e) => setEntrySearchTerm(e.target.value)}
                                                className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-dark-elevated border border-gray-200 dark:border-dark-elevated rounded-full focus:ring-1 focus:ring-primary focus:border-primary w-48 transition-all"
                                            />
                                            <Icon name="search" className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                            {entrySearchTerm && (
                                                <button
                                                    onClick={() => setEntrySearchTerm('')}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    <Icon name="x" className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative" ref={filterRef}>
                                            <button
                                                className={`px-3 py-1.5 rounded-full border border-gray-200 dark:border-dark-elevated transition-colors flex items-center gap-2 ${selectedTags.length > 0 ? 'bg-primary-light text-primary border-primary' : 'bg-white dark:bg-dark-card text-gray-500 hover:bg-gray-50'}`}
                                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                                title="Filter by Type"
                                            >
                                                <Icon name="filter" className="w-3.5 h-3.5" />
                                                <span className="text-xs font-semibold">Filter by Type</span>
                                                {selectedTags.length > 0 && (
                                                    <span className="bg-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                                                        {selectedTags.length}
                                                    </span>
                                                )}
                                            </button>

                                            {isFilterOpen && (
                                                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-dark-popup border border-gray-200 dark:border-dark-elevated rounded-lg shadow-xl z-30 py-2 animate-scale-in origin-top-right">
                                                    <div className="px-3 py-2 border-b border-gray-100 dark:border-dark-elevated mb-1 flex justify-between items-center">
                                                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Entry Types</h4>
                                                        {selectedTags.length > 0 && (
                                                            <button
                                                                onClick={() => setSelectedTags([])}
                                                                className="text-[10px] text-primary hover:underline font-medium"
                                                            >
                                                                Clear All
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                        {availableTags.length > 0 ? (
                                                            availableTags.map(tag => (
                                                                <div
                                                                    key={tag}
                                                                    onClick={() => handleTagToggle(tag)}
                                                                    className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-dark-elevated cursor-pointer flex items-center gap-3 transition-colors"
                                                                >
                                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedTags.includes(tag) ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-elevated'}`}>
                                                                        {selectedTags.includes(tag) && <Icon name="check" className="w-3 h-3 text-white" />}
                                                                    </div>
                                                                    <span className={`text-sm ${selectedTags.includes(tag) ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                                                                        {tag.replace(/_/g, ' ')}
                                                                    </span>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="px-3 py-2 text-xs text-gray-400 italic text-center">No types available</div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* View Tabs */}
                            <div className="border-b border-gray-200 dark:border-dark-elevated pb-0 mb-6">
                                <nav className="-mb-px flex space-x-6 overflow-x-auto custom-scrollbar">
                                    {activeViews.map((view) => (
                                        <button
                                            key={view}
                                            onClick={() => setActiveView(view)}
                                            className={`
                                        whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors
                                        ${activeView === view
                                                    ? 'border-primary text-primary'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
                                    `}
                                        >
                                            {view}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            {/* View Content */}
                            <div className="min-h-[400px]">
                                {activeView === 'Feed' && (
                                    <div className="space-y-6">
                                        {feedViewEntries.length === 0 ? (
                                            <div className="text-center py-12 bg-white dark:bg-dark-card rounded-lg border border-dashed border-gray-300 dark:border-dark-elevated">
                                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-dark-elevated mb-4">
                                                    <Icon name="chat" className="w-6 h-6 text-gray-400" />
                                                </div>
                                                <h3 className="text-sm font-medium text-gray-900 dark:text-white">No entries found</h3>
                                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your filters or search terms.</p>
                                            </div>
                                        ) : (
                                            feedViewEntries.map(entry => (
                                                <EntryItem
                                                    key={entry.id}
                                                    entry={entry}
                                                    currentUser={currentUser}
                                                    users={users}
                                                    tracks={tracks}
                                                    onUpdate={handleUpdateEntry}
                                                    onAddComment={handleAddComment}
                                                    onDelete={async (id) => {
                                                        try {
                                                            const { deleteFeedEntry } = await import('../api/feedApi');
                                                            await deleteFeedEntry(id);
                                                            setFeedEntries(prev => prev.filter(e => e.id !== id));
                                                            showToast('Entry deleted', 'success');
                                                        } catch (e) {
                                                            console.error(e);
                                                            showToast('Failed to delete entry', 'error');
                                                        }
                                                    }}
                                                />
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeView === 'Calendar' && (
                                    <CalendarView
                                        entries={trackEntries}
                                        onDateSelect={() => { }}
                                        onAddEntry={() => {
                                            setIsNewEntryModalOpen(true);
                                        }}
                                    />
                                )}

                                {/* Domain Specific Views */}
                                {activeView === 'Planning & Tracking' && (
                                    <PlanningTimelineView entries={getEntriesForView('Planning & Tracking')} />
                                )}
                                {activeView === 'Tasks' && (
                                    <TasksKanbanView entries={getEntriesForView('Tasks')} users={users} onUpdateEntry={handleUpdateEntry} />
                                )}
                                {activeView === 'Communication' && (
                                    <CommunicationFeedView entries={getEntriesForView('Communication')} users={users} />
                                )}
                                {activeView === 'Notes' && (
                                    <NotesView entries={getEntriesForView('Notes')} users={users} />
                                )}
                                {activeView === 'References' && (
                                    <ReferencesView entries={getEntriesForView('References')} />
                                )}
                                {activeView === 'Issues & Approvals' && (
                                    <IssuesApprovalsView entries={getEntriesForView('Issues & Approvals')} />
                                )}
                            </div>
                        </>
                    )}
                </main>

                {/* Right Sidebar - Info */}
                <aside className="lg:w-80 lg:sticky lg:top-24 flex-shrink-0 w-full hidden xl:block">
                    {loading ? (
                        <Card className="h-[calc(100vh-8rem)] p-4 animate-pulse">
                            <div className="h-4 bg-gray-200 dark:bg-dark-elevated rounded w-1/3 mb-4"></div>
                            <div className="space-y-3">
                                <div className="h-2 bg-gray-200 dark:bg-dark-elevated rounded w-full"></div>
                                <div className="h-2 bg-gray-200 dark:bg-dark-elevated rounded w-5/6"></div>
                                <div className="h-2 bg-gray-200 dark:bg-dark-elevated rounded w-4/6"></div>
                            </div>
                        </Card>
                    ) : !track ? (
                        <Card className="h-[calc(100vh-8rem)] flex items-center justify-center !p-0">
                            <div className="text-center p-6 text-gray-400">
                                <p className="text-xs">No track details</p>
                            </div>
                        </Card>
                    ) : (
                        <Card className="h-[calc(100vh-8rem)] flex flex-col overflow-hidden !p-0">
                            <div
                                className="px-4 py-3 flex justify-between items-center border-b border-gray-100 dark:border-dark-elevated transition-colors flex-shrink-0"
                                style={{ backgroundColor: activeTemplateConfig.colors.bg }}
                            >
                                <span
                                    className="text-xs font-bold uppercase tracking-wider"
                                    style={{ color: activeTemplateConfig.colors.text }}
                                >
                                    {currentTemplate}
                                </span>
                            </div>

                            <div className="p-4 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                                {/* Track Header Info */}
                                <div className="flex flex-col items-center pb-4 border-b border-gray-100 dark:border-dark-elevated">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold mb-3 shadow-sm border-2 border-white dark:border-dark-card ring-1 ring-primary/20">
                                        {track.avatarUrl ? (
                                            <img src={track.avatarUrl} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            track.name.substring(0, 2).toUpperCase()
                                        )}
                                    </div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white text-center leading-tight mb-1">{track.name}</h2>
                                    {trackOwner && (
                                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                                            <span className="mr-1">owned by</span>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">{trackOwner.name}</span>
                                        </div>
                                    )}

                                    {/* Status & Priority Dropdowns */}
                                    <div className="flex items-center space-x-2 mt-1">
                                        {/* Status */}
                                        <div className="relative" ref={statusRef}>
                                            <button
                                                onClick={() => {
                                                    if (currentUser.id === track.ownerId || track.collaboratorIds.includes(currentUser.id)) {
                                                        setIsStatusDropdownOpen(!isStatusDropdownOpen);
                                                    }
                                                }}
                                                className={`px-2 py-1 rounded text-xs font-bold border transition-colors flex items-center space-x-1 ${track.lifecycle === TrackLifecycle.OPEN ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                                                disabled={!(currentUser.id === track.ownerId || track.collaboratorIds.includes(currentUser.id))}
                                            >
                                                <span>{track.lifecycle}</span>
                                                {(currentUser.id === track.ownerId || track.collaboratorIds.includes(currentUser.id)) && <Icon name="chevron-down" className="w-3 h-3" />}
                                            </button>
                                            {isStatusDropdownOpen && (
                                                <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-dark-popup border border-gray-200 dark:border-dark-elevated rounded-md shadow-lg z-20 py-1">
                                                    {Object.values(TrackLifecycle).map(status => (
                                                        <button
                                                            key={status}
                                                            onClick={() => {
                                                                handleUpdateTrack({ ...track, lifecycle: status });
                                                                setIsStatusDropdownOpen(false);
                                                            }}
                                                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-dark-elevated ${track.lifecycle === status ? 'text-primary font-bold' : 'text-gray-700 dark:text-gray-300'}`}
                                                        >
                                                            {status}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Priority */}
                                        <div className="relative" ref={priorityRef}>
                                            <button
                                                onClick={() => {
                                                    if (currentUser.id === track.ownerId || track.collaboratorIds.includes(currentUser.id)) {
                                                        setIsPriorityDropdownOpen(!isPriorityDropdownOpen);
                                                    }
                                                }}
                                                className={`px-2 py-1 rounded text-xs font-bold border transition-colors flex items-center space-x-1 ${getPriorityColor(track.priority)}`}
                                                disabled={!(currentUser.id === track.ownerId || track.collaboratorIds.includes(currentUser.id))}
                                            >
                                                <span>{track.priority}</span>
                                                {(currentUser.id === track.ownerId || track.collaboratorIds.includes(currentUser.id)) && <Icon name="chevron-down" className="w-3 h-3" />}
                                            </button>
                                            {isPriorityDropdownOpen && (
                                                <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-dark-popup border border-gray-200 dark:border-dark-elevated rounded-md shadow-lg z-20 py-1">
                                                    {['Low', 'Medium', 'High', 'Critical'].map(p => (
                                                        <button
                                                            key={p}
                                                            onClick={() => {
                                                                handleUpdateTrack({ ...track, priority: p as TrackPriority });
                                                                setIsPriorityDropdownOpen(false);
                                                            }}
                                                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-dark-elevated ${track.priority === p ? 'text-primary font-bold' : 'text-gray-700 dark:text-gray-300'}`}
                                                        >
                                                            {p}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide border-b border-gray-100 dark:border-dark-elevated pb-2 mb-2">Overview</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{track.description ? track.description.replace(/^\[Template: .*?\]\n?/, '') : ''}</p>
                                </div>

                                <div>
                                    <div className="flex justify-between items-end mb-1">
                                        <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">Progress</h3>
                                        <span className="text-sm font-bold text-primary">{track.progress || 0}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-dark-elevated rounded-full h-2 mb-2">
                                        <div className="bg-primary h-2 rounded-full" style={{ width: `${track.progress || 0}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 font-medium">
                                        <span>Start: {track.startDate ? new Date(track.startDate).toLocaleDateString() : 'N/A'}</span>
                                        <span>End: {track.endDate ? new Date(track.endDate).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide border-b border-gray-100 dark:border-dark-elevated pb-2 mb-3">Collaborators</h3>
                                    <div className="flex items-center -space-x-2 hover:space-x-1 transition-all duration-200">
                                        {/* Owner */}
                                        {trackOwner && (
                                            <div className="relative group z-30 transition-transform duration-200" title={`Owner: ${trackOwner.name}`}>
                                                {trackOwner.avatarUrl ? (
                                                    <img src={trackOwner.avatarUrl} className="w-8 h-8 rounded-full border-2 border-white dark:border-dark-card shadow-sm object-cover" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-primary text-white border-2 border-white dark:border-dark-card flex items-center justify-center text-[10px] font-bold shadow-sm">{trackOwner.initials}</div>
                                                )}
                                                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-dark-card rounded-full p-0.5 border border-gray-100 dark:border-dark-elevated">
                                                    <Icon name="crown" className="w-2.5 h-2.5 text-amber-500" />
                                                </div>
                                            </div>
                                        )}

                                        {/* Shared Users */}
                                        {track.sharedWith?.filter((s: any) => s.type === 'user').map((s: any, index: number) => {
                                            const u = users.find(user => user.id === s.id);
                                            if (!u) return null;
                                            return (
                                                <div key={u.id} className="relative group z-20 hover:z-40 transition-transform duration-200 hover:scale-110" title={`${u.name} (${s.accessLevel})`}>
                                                    {u.avatarUrl ? (
                                                        <img src={u.avatarUrl} className="w-8 h-8 rounded-full border-2 border-white dark:border-dark-card shadow-sm object-cover" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 border-2 border-white dark:border-dark-card flex items-center justify-center text-[10px] font-bold shadow-sm">{u.initials}</div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {/* Add Button */}
                                        {currentUser.id === track.ownerId && (
                                            <button
                                                onClick={() => setIsShareModalOpen(true)}
                                                className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-card flex items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-colors z-10 ml-2"
                                                title="Manage Sharing"
                                            >
                                                <Icon name="plus" className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </aside>

                {/* Modals */}
                {isNewEntryModalOpen && (
                    <NewEntryModal
                        track={track}
                        entryTags={[]}
                        onAddTag={() => { }}
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
                        onAddTag={() => { }}
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
                                showToast('Successfully Created Track', 'success');
                            } catch (e) { console.error(e); }
                        }}
                    />
                )}

                {isShareModalOpen && (
                    <ShareTrackModal
                        onClose={() => setIsShareModalOpen(false)}
                        onShare={async (sharedWith) => {
                            await handleUpdateTrack({ ...track, sharedWith });
                            setIsShareModalOpen(false);
                        }}
                        currentSharedWith={track.sharedWith || []}
                        currentUser={currentUser}
                    />
                )}
            </div>
        </>
    );
};

export default TrackFeedsPage;
