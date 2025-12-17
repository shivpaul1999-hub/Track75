import React, { useState, useMemo, useEffect } from 'react';
import { Track, User, TrackLifecycle, FeedEntry, View, ShareEntry, AccessLevel } from '../types';
import Icon from './Icon';
import AddTrackModal from './AddTrackModal';
import ShareTrackModal from './ShareTrackModal';
import { getTracks, updateTrack, createTrack } from '../api/tracksApi';
import { getFeedEntries, createFeedEntry } from '../api/feedApi';
import { getUsers } from '../api/usersApi';
import { getTemplates, TemplateConfig } from '../api/metaApi';
import { useToast } from './ToastContext';

interface KanbanPageProps {
    currentUser: User;
    onNavigate: (view: View, id?: number) => void;
}

const getTemplateFromDescription = (description: string): string => {
    const match = description.match(/^\[Template: (.*?)\]/);
    return match ? match[1] : 'General';
};

// Removed static getTemplateStyle and getTemplateHoverClass functions as they are replaced by dynamic colors

const getPriorityBadgeStyle = (priority: string) => {
    return 'bg-[#F9FAFB] text-black';
}

const getStatusBadgeStyle = (status: string) => {
    switch (status) {
        case TrackLifecycle.OPEN: return 'bg-blue-100 text-blue-800';
        case TrackLifecycle.CLOSED: return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const TrackCard: React.FC<{
    track: Track;
    users: User[];
    currentUser: User;
    feedEntries: FeedEntry[];
    onSelectTrack: () => void;
    isPinned: boolean;
    onTogglePin?: (id: number) => void;
    isShared?: boolean;
    templateConfig?: TemplateConfig;
    onShare?: () => void;
}> = ({ track, users, currentUser, feedEntries, onSelectTrack, isPinned, onTogglePin, isShared = false, templateConfig, onShare }) => {
    const template = track.template || getTemplateFromDescription(track.description);

    const team = useMemo(() => users.filter(user => track.collaboratorIds.includes(user.id)), [users, track.collaboratorIds]);
    const visibleMembers = team.slice(0, 3);
    const hiddenMembersCount = team.length - visibleMembers.length;

    const trackEntries = useMemo(() => feedEntries.filter(e => e.trackId === track.id), [feedEntries, track.id]);
    const entryCount = trackEntries.length;

    const lastUpdated = useMemo(() => {
        if (trackEntries.length === 0) return track.startDate;
        const sorted = [...trackEntries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return sorted[0].timestamp;
    }, [trackEntries, track.startDate]);

    const owner = users.find(u => u.id === track.ownerId);

    // Calculate Access Level
    const accessLevel = useMemo(() => {
        if (track.ownerId === currentUser.id) return AccessLevel.EDIT;

        // Check explicit share
        const shareEntry = track.sharedWith?.find(s =>
            (s.type === 'user' && s.id === currentUser.id) ||
            (s.type === 'organization' && s.id === currentUser.organizationId)
        );

        if (shareEntry) return shareEntry.accessLevel;

        // Fallback for collaborators without explicit share entry (legacy/mock)
        if (track.collaboratorIds.includes(currentUser.id)) return AccessLevel.VIEW;

        return AccessLevel.VIEW; // Default restriction? Or none?
    }, [track, currentUser]);

    const isReadOnly = accessLevel === AccessLevel.VIEW;

    // Use dynamic colors or fallbacks
    const colors = templateConfig?.colors || { text: '#374151', bg: '#F3F4F6' };

    // Default styles
    let cardBorderStyle = { borderColor: '#E5E7EB' }; // border-gray-200

    const [isHovered, setIsHovered] = useState(false);

    let currentBgColor = isReadOnly ? '#F9FAFC' : (isHovered ? colors.bg : '#FFFFFF');
    // If read-only, hover is white
    if (isReadOnly && isHovered) currentBgColor = '#FFFFFF';

    if (isShared && !isReadOnly) {
        // Shared but editable
        currentBgColor = isHovered ? colors.bg : '#FFFFFF';
    }

    return (
        <div
            onClick={onSelectTrack}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                backgroundColor: currentBgColor,
                ...cardBorderStyle
            }}
            className={`rounded-xl border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col h-full overflow-hidden group dark:!bg-dark-card dark:!border-dark-elevated`}
        >
            <div
                className={`px-4 py-3 flex justify-between items-center border-b group-hover:bg-opacity-50 transition-colors dark:!bg-dark-elevated dark:!border-white/5`}
                style={{
                    backgroundColor: colors.bg,
                    borderColor: 'rgba(0,0,0,0.05)' // Subtle border
                }}
            >
                <div className="flex items-center gap-2">
                    {!isShared && onTogglePin && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onTogglePin(track.id); }}
                            className={`p-1 rounded-full transition-colors ${isPinned ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                            title={isPinned ? "Unpin track" : "Pin track to top"}
                        >
                            <Icon name="pin" className="w-3.5 h-3.5" fill={isPinned ? "currentColor" : "none"} />
                        </button>
                    )}
                    <span
                        className="text-xs font-bold uppercase tracking-wider dark:!text-white"
                        style={{ color: colors.text }}
                    >
                        {template}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {onShare && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onShare(); }}
                            className="p-1 rounded text-gray-400 hover:text-primary hover:bg-white transition-colors"
                            title="Share"
                        >
                            <Icon name="share" className="w-3.5 h-3.5" />
                        </button>
                    )}
                    {isShared && (
                        <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-600 text-[10px] font-bold uppercase border border-slate-300">
                            Shared
                        </span>
                    )}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusBadgeStyle(track.lifecycle)}`}>
                        {track.lifecycle}
                    </span>
                </div>
            </div>

            <div className="p-5 flex-grow flex flex-col">
                <div className="mb-3 flex items-center space-x-3">
                    {track.avatarUrl ? (
                        <img src={track.avatarUrl} alt={track.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-100" />
                    ) : (
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 border dark:!bg-dark-elevated dark:!text-white dark:!border-dark-elevated"
                            style={{
                                backgroundColor: colors.bg,
                                color: colors.text,
                                borderColor: 'rgba(0,0,0,0.05)'
                            }}
                        >
                            {track.name.substring(0, 2).toUpperCase()}
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 transition-colors line-clamp-1 mb-0.5" title={track.name}>
                            {track.name}
                        </h3>

                        {isShared && (
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    Owner: <span className="font-semibold text-gray-700 dark:text-gray-300">{owner ? owner.name : 'Unknown'}</span>
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mb-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadgeStyle(track.priority)}`}>
                        {track.priority} Priority
                    </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 flex-grow">
                    {track.description.replace(/^\[Template: .*?\]\n?/, '')}
                </p>

                <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-dark-elevated mt-auto min-h-[40px]">
                    {isShared ? (
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Icon name="users" className="w-4 h-4 text-slate-400" />
                            <span>External Org</span>
                        </div>
                    ) : (
                        <div className="flex -space-x-2">
                            {visibleMembers.map(member => (
                                <div key={member.id} title={member.name} className="relative z-0 hover:z-10 transition-all">
                                    {member.avatarUrl ? (
                                        <img src={member.avatarUrl} alt={member.name} className="w-7 h-7 rounded-full border-2 border-white" />
                                    ) : (
                                        <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-[10px] border-2 border-white">{member.initials}</div>
                                    )}
                                </div>
                            ))}
                            {hiddenMembersCount > 0 && (
                                <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] font-bold border-2 border-white">
                                    +{hiddenMembersCount}
                                </div>
                            )}
                        </div>
                    )}
                    <div className="text-right text-xs text-gray-400">
                        <div className="font-medium">{entryCount} entries</div>
                        <div className="mt-0.5">Updated {formatRelativeTime(lastUpdated)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const KanbanPage: React.FC<KanbanPageProps> = ({ currentUser, onNavigate }) => {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [feedEntries, setFeedEntries] = useState<FeedEntry[]>([]);
    const [templatesData, setTemplatesData] = useState<TemplateConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [pinnedTrackIds, setPinnedTrackIds] = useState<number[]>([]);
    const [isAddTrackModalOpen, setIsAddTrackModalOpen] = useState(false);

    // Sharing State
    const [sharingTrackId, setSharingTrackId] = useState<number | null>(null);

    const [activeTab, setActiveTab] = useState<'my' | 'shared_with_me' | 'shared_by_me'>('my');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<string>('All');
    const [selectedLifecycle, setSelectedLifecycle] = useState<string>('All');

    const { showToast } = useToast();

    // Load pinned tracks and passed filter
    useEffect(() => {
        const storedPins = localStorage.getItem('pinnedTrackIds');
        if (storedPins) {
            setPinnedTrackIds(JSON.parse(storedPins));
        }

        const passedFilter = sessionStorage.getItem('kanbanTemplateFilter');
        if (passedFilter) {
            setSelectedTemplate(passedFilter);
            sessionStorage.removeItem('kanbanTemplateFilter');
        }
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [allTracks, allUsers, allEntries, allTemplates] = await Promise.all([
                getTracks(),
                getUsers(),
                getFeedEntries(),
                getTemplates()
            ]);
            setTracks(allTracks);
            setUsers(allUsers);
            setFeedEntries(allEntries);
            setTemplatesData(allTemplates);
        } catch (error: any) {
            console.error("Error fetching kanban data", error);
            showToast(error.message || "Failed to load kanban data", 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleTogglePin = (id: number) => {
        setPinnedTrackIds(prev => {
            const newPins = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id];
            localStorage.setItem('pinnedTrackIds', JSON.stringify(newPins));
            return newPins;
        });
    };

    const handleSaveShare = async (sharedWith: ShareEntry[]) => {
        if (!sharingTrackId) return;
        try {
            await updateTrack(sharingTrackId, { sharedWith });

            // Optimistically update local state
            setTracks(prev => prev.map(t =>
                t.id === sharingTrackId ? { ...t, sharedWith } : t
            ));

            showToast('Track shared successfully', 'success');
        } catch (error: any) {
            console.error("Failed to share track", error);
            showToast('Failed to share track', 'error');
        }
    };

    const handleSaveNewTrack = async (newTrackData: any, entryData: any) => {
        try {
            const trackToCreate = {
                ...newTrackData,
                organizationId: currentUser.organizationId,
                progress: 0,
                collaboratorIds: newTrackData.ownerId ? [newTrackData.ownerId] : []
            };

            const createdTrack = await createTrack(trackToCreate);

            if (entryData) {
                await createFeedEntry({
                    ...entryData,
                    trackId: createdTrack.id,
                    authorId: currentUser.id,
                    timestamp: new Date().toISOString(),
                    reactions: {},
                    comments: []
                });
            }

            showToast('Successfully Created Track', 'success');
            setIsAddTrackModalOpen(false);
            onNavigate('TRACK_DETAIL', createdTrack.id);
        } catch (error: any) {
            console.error("Failed to create track", error);
            showToast(error.message || "Failed to create track", 'error');
        }
    };

    const templates = useMemo(() => {
        const allTemplates = tracks.map(t => t.template || getTemplateFromDescription(t.description));
        return Array.from(new Set(allTemplates)).sort();
    }, [tracks]);

    const { myTracks, sharedWithMe, sharedByMe } = useMemo(() => {
        const my = tracks.filter(t => t.ownerId === currentUser.id); // Strictly tracks I own

        // Shared With Me: Not my org (legacy logic) OR strictly shared with me via new sharing logic
        const sharedWith = tracks.filter(t => {
            const explicitlyShared = t.sharedWith?.some(s =>
                (s.type === 'user' && s.id === currentUser.id) ||
                (s.type === 'organization' && s.id === currentUser.organizationId)
            );

            // Legacy logic: different org ID means shared (for demo/mock purposes usually)
            // But let's refine it: If I don't own it, and it's visible, it's shared with me.
            // In this mock, we fetch ALL tracks. So we filter based on explicit share OR legacy "different org" if that was the intent.
            // Let's stick to: Not Owner AND (Explicitly Shared OR Same Org Collaboration)
            // Actually, "Shared With Me" usually implies *incoming* shares.

            return t.ownerId !== currentUser.id && (explicitlyShared || t.collaboratorIds.includes(currentUser.id));
        });

        const sharedBy = tracks.filter(t => t.ownerId === currentUser.id && (t.sharedWith && t.sharedWith.length > 0));

        return { myTracks: my, sharedWithMe: sharedWith, sharedByMe: sharedBy };
    }, [tracks, currentUser.id, currentUser.organizationId]);

    const displayedTracks = useMemo(() => {
        let sourceTracks: Track[] = [];
        if (activeTab === 'my') sourceTracks = myTracks;
        else if (activeTab === 'shared_with_me') sourceTracks = sharedWithMe;
        else if (activeTab === 'shared_by_me') sourceTracks = sharedByMe;

        const filtered = sourceTracks.filter(track => {
            const matchesSearch = track.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTemplate = selectedTemplate === 'All' || (track.template || getTemplateFromDescription(track.description)) === selectedTemplate;
            const matchesLifecycle = selectedLifecycle === 'All' || track.lifecycle === selectedLifecycle;
            return matchesSearch && matchesTemplate && matchesLifecycle;
        });

        if (activeTab === 'my') {
            return filtered.sort((a, b) => {
                const aIsPinned = pinnedTrackIds.includes(a.id);
                const bIsPinned = pinnedTrackIds.includes(b.id);
                if (aIsPinned && !bIsPinned) return -1;
                if (!aIsPinned && bIsPinned) return 1;
                return a.name.localeCompare(b.name);
            });
        } else {
            return filtered.sort((a, b) => a.name.localeCompare(b.name));
        }
    }, [activeTab, myTracks, sharedWithMe, sharedByMe, searchTerm, selectedTemplate, selectedLifecycle, pinnedTrackIds]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">All Tracks</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your personal and shared tracks in one place.</p>
                </div>
                <button
                    onClick={() => setIsAddTrackModalOpen(true)}
                    className="flex items-center justify-center px-4 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors font-bold shadow-sm text-sm"
                >
                    <Icon name="plus" className="w-5 h-5 mr-2" />
                    Create New Track
                </button>
            </div>

            <div className="border-b border-gray-200 dark:border-dark-elevated">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('my')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                            ${activeTab === 'my'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}
                        `}
                    >
                        My Tracks
                        <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${activeTab === 'my' ? 'bg-primary-light text-primary' : 'bg-gray-100 dark:bg-dark-elevated text-gray-600 dark:text-gray-300'}`}>
                            {myTracks.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('shared_with_me')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                            ${activeTab === 'shared_with_me'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}
                        `}
                    >
                        Shared with Me
                        <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${activeTab === 'shared_with_me' ? 'bg-primary-light text-primary' : 'bg-gray-100 dark:bg-dark-elevated text-gray-600 dark:text-gray-300'}`}>
                            {sharedWithMe.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('shared_by_me')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                            ${activeTab === 'shared_by_me'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}
                        `}
                    >
                        Shared by Me
                        <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${activeTab === 'shared_by_me' ? 'bg-primary-light text-primary' : 'bg-gray-100 dark:bg-dark-elevated text-gray-600 dark:text-gray-300'}`}>
                            {sharedByMe.length}
                        </span>
                    </button>
                </nav>
            </div>

            <div className="bg-white dark:bg-dark-elevated p-4 rounded-xl border border-gray-200 dark:border-dark-elevated shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-72">
                    <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-300" />
                    <input
                        type="text"
                        placeholder={`Search...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-elevated dark:bg-dark-card rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow text-gray-900 dark:text-white"
                    />
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <select
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="px-3 py-2 bg-gray-50 dark:bg-dark-card border border-gray-300 dark:border-dark-elevated rounded-lg text-sm text-gray-700 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                    >
                        <option value="All">All Templates</option>
                        {templates.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select
                        value={selectedLifecycle}
                        onChange={(e) => setSelectedLifecycle(e.target.value)}
                        className="px-3 py-2 bg-gray-50 dark:bg-dark-card border border-gray-300 dark:border-dark-elevated rounded-lg text-sm text-gray-700 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                    >
                        <option value="All">All Statuses</option>
                        {Object.values(TrackLifecycle).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {displayedTracks.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-elevated border-dashed">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-dark-elevated mb-4">
                        <Icon name="search" className="w-8 h-8 text-gray-400 dark:text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No tracks found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {activeTab === 'my'
                            ? "You haven't created any tracks matching these filters."
                            : activeTab === 'shared_with_me'
                                ? "No tracks have been shared with you."
                                : "You haven't shared any tracks yet."}
                    </p>
                    <button onClick={() => { setSearchTerm(''); setSelectedTemplate('All'); setSelectedLifecycle('All'); }} className="mt-4 text-primary font-medium hover:underline">Clear all filters</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayedTracks.map(track => {
                        const templateName = track.template || getTemplateFromDescription(track.description);
                        const config = templatesData.find(t => t.name === templateName);
                        // Is Owner?
                        const isOwner = track.ownerId === currentUser.id;

                        return (
                            <TrackCard
                                key={track.id}
                                track={track}
                                users={users}
                                currentUser={currentUser}
                                feedEntries={feedEntries}
                                onSelectTrack={() => onNavigate('TRACK_DETAIL', track.id)}
                                isPinned={activeTab === 'my' && pinnedTrackIds.includes(track.id)}
                                onTogglePin={activeTab === 'my' ? handleTogglePin : undefined}
                                isShared={!isOwner}
                                templateConfig={config}
                                onShare={isOwner ? () => setSharingTrackId(track.id) : undefined}
                            />
                        );
                    })}
                </div>
            )}

            {isAddTrackModalOpen && (
                <AddTrackModal
                    users={users}
                    owners={users}
                    entryTags={[]}
                    onAddTag={() => { }}
                    onClose={() => setIsAddTrackModalOpen(false)}
                    onSave={handleSaveNewTrack}
                />
            )}

            {sharingTrackId !== null && (
                <ShareTrackModal
                    onClose={() => setSharingTrackId(null)}
                    onShare={handleSaveShare}
                    currentSharedWith={tracks.find(t => t.id === sharingTrackId)?.sharedWith || []}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
};

export default KanbanPage;
