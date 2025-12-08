
import React, { useState, useMemo, useEffect } from 'react';
import { Track, User, TrackLifecycle, FeedEntry, View } from '../types';
import Icon from './Icon';
import AddTrackModal from './AddTrackModal';
import { getTracks, updateTrack, createTrack } from '../api/tracksApi';
import { getFeedEntries, createFeedEntry } from '../api/feedApi';
import { getUsers } from '../api/usersApi';

interface KanbanPageProps {
    currentUser: User;
    onNavigate: (view: View, id?: number) => void;
}

const getTemplateFromDescription = (description: string): string => {
    const match = description.match(/^\[Template: (.*?)\]/);
    return match ? match[1] : 'General';
};

const getTemplateStyle = (template: string): { bg: string; text: string; border: string } => {
    const normalized = template.toLowerCase();
    if (normalized.includes('creative')) return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    if (normalized.includes('project management')) return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    if (normalized.includes('crm') || normalized.includes('relationship')) return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
    if (normalized.includes('health') || normalized.includes('wellness')) return { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' };
    return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
};

const getTemplateHoverClass = (template: string): string => {
    const normalized = template.toLowerCase();
    if (normalized.includes('creative')) return 'hover:bg-[#FAF5FF]';
    if (normalized.includes('project management')) return 'hover:bg-[#F0F6FF]';
    if (normalized.includes('crm')) return 'hover:bg-[#F0FDF4]';
    if (normalized.includes('health')) return 'hover:bg-[#F0FDFA]';
    return 'hover:bg-[#F9FAFB]';
}

const getPriorityBadgeStyle = (priority: string) => {
    return 'bg-[#F9FAFB] text-black';
}

const getStatusBadgeStyle = (status: string) => {
     switch(status) {
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
    feedEntries: FeedEntry[];
    onSelectTrack: () => void;
    isPinned: boolean;
    onTogglePin?: (id: number) => void;
    isShared?: boolean;
}> = ({ track, users, feedEntries, onSelectTrack, isPinned, onTogglePin, isShared = false }) => {
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

    const isReadOnly = isShared && track.id !== 1001;

    let styles = getTemplateStyle(template);
    let cardBgClass = "bg-white";
    let cardBorderClass = "border-gray-200";
    let hoverClass = getTemplateHoverClass(template);
    let headerBgClass = styles.bg;
    let headerBorderClass = styles.border;
    let headerTextClass = styles.text;
    let avatarBgClass = styles.bg;
    let avatarTextClass = styles.text;
    let avatarBorderClass = styles.border;

    if (isReadOnly) {
        cardBgClass = "bg-[#F9FAFC]";
        cardBorderClass = "border-slate-200";
        hoverClass = "hover:bg-white";
        headerBgClass = "bg-[#F4F8FA]";
        headerBorderClass = "border-slate-200";
        headerTextClass = "text-slate-600";
        avatarBgClass = "bg-[#F4F8FA]";
        avatarTextClass = "text-slate-600";
        avatarBorderClass = "border-slate-200";
    } else if (isShared) {
        cardBgClass = "bg-white"; 
    }

    return (
        <div 
            onClick={onSelectTrack}
            className={`rounded-xl border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col h-full overflow-hidden group 
                ${cardBgClass} ${cardBorderClass} ${hoverClass}
            `}
        >
            <div className={`px-4 py-3 flex justify-between items-center border-b ${headerBorderClass} ${headerBgClass} group-hover:bg-opacity-50 transition-colors`}>
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
                    <span className={`text-xs font-bold uppercase tracking-wider ${headerTextClass}`}>
                        {template}
                    </span>
                </div>
                <div className="flex items-center gap-2">
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
                        <img src={track.avatarUrl} alt={track.name} className={`w-10 h-10 rounded-full object-cover flex-shrink-0 border ${avatarBorderClass}`} />
                    ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 border ${avatarBgClass} ${avatarTextClass} ${avatarBorderClass}`}>
                            {track.name.substring(0, 2).toUpperCase()}
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-lg text-gray-900 transition-colors line-clamp-1 mb-0.5" title={track.name}>
                            {track.name}
                        </h3>
                        {!isShared && track.clientName && (
                            <p className="text-sm text-gray-500 font-medium truncate">{track.clientName}</p>
                        )}
                        {isShared && (
                             <div className="flex flex-col">
                                <span className="text-xs text-gray-500 truncate">
                                    Owner: <span className="font-semibold text-gray-700">{owner ? owner.name : 'Unknown'}</span>
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

                <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-grow">
                    {track.description.replace(/^\[Template: .*?\]\n?/, '')}
                </p>

                <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-auto min-h-[40px]">
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
    const [loading, setLoading] = useState(true);
    const [pinnedTrackIds, setPinnedTrackIds] = useState<number[]>([]);
    const [isAddTrackModalOpen, setIsAddTrackModalOpen] = useState(false);

    const [activeTab, setActiveTab] = useState<'my' | 'shared'>('my');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState<string>('All');
    const [selectedLifecycle, setSelectedLifecycle] = useState<string>('All');

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
            const [allTracks, allUsers, allEntries] = await Promise.all([
                getTracks(),
                getUsers(),
                getFeedEntries()
            ]);
            setTracks(allTracks);
            setUsers(allUsers);
            setFeedEntries(allEntries);
        } catch (error) {
            console.error("Error fetching kanban data", error);
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
            
            setIsAddTrackModalOpen(false);
            onNavigate('TRACK_DETAIL', createdTrack.id);
        } catch (error) {
            console.error("Failed to create track", error);
        }
    };

    const templates = useMemo(() => {
        const allTemplates = tracks.map(t => t.template || getTemplateFromDescription(t.description));
        return Array.from(new Set(allTemplates)).sort();
    }, [tracks]);

    const { myTracks, sharedTracks } = useMemo(() => {
        const my = tracks.filter(t => t.organizationId === currentUser.organizationId);
        const shared = tracks.filter(t => t.organizationId !== currentUser.organizationId);
        return { myTracks: my, sharedTracks: shared };
    }, [tracks, currentUser.organizationId]);

    const displayedTracks = useMemo(() => {
        const sourceTracks = activeTab === 'my' ? myTracks : sharedTracks;

        const filtered = sourceTracks.filter(track => {
            const matchesSearch = track.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  (track.clientName && track.clientName.toLowerCase().includes(searchTerm.toLowerCase()));
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
    }, [activeTab, myTracks, sharedTracks, searchTerm, selectedTemplate, selectedLifecycle, pinnedTrackIds]);

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
                    <h1 className="text-3xl font-bold text-gray-900">All Tracks</h1>
                    <p className="text-gray-500 mt-1">Manage your personal and shared tracks in one place.</p>
                </div>
                <button
                    onClick={() => setIsAddTrackModalOpen(true)}
                    className="flex items-center justify-center px-4 py-2.5 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors font-bold shadow-sm text-sm"
                >
                    <Icon name="plus" className="w-5 h-5 mr-2" />
                    Create New Track
                </button>
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('my')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                            ${activeTab === 'my'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        My Tracks
                        <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${activeTab === 'my' ? 'bg-primary-light text-primary' : 'bg-gray-100 text-gray-600'}`}>
                            {myTracks.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('shared')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                            ${activeTab === 'shared'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        Shared with Me
                        <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${activeTab === 'shared' ? 'bg-primary-light text-primary' : 'bg-gray-100 text-gray-600'}`}>
                            {sharedTracks.length}
                        </span>
                    </button>
                </nav>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-72">
                    <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder={`Search ${activeTab === 'my' ? 'my tracks' : 'shared tracks'}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
                    />
                </div>
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <select 
                        value={selectedTemplate}
                        onChange={(e) => setSelectedTemplate(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                    >
                        <option value="All">All Templates</option>
                        {templates.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select 
                        value={selectedLifecycle}
                        onChange={(e) => setSelectedLifecycle(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                    >
                        <option value="All">All Statuses</option>
                        {Object.values(TrackLifecycle).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {displayedTracks.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                        <Icon name="search" className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No tracks found</h3>
                    <p className="text-gray-500 mt-1">
                        {activeTab === 'my' 
                            ? "You haven't created any tracks matching these filters." 
                            : "No shared tracks match these filters."}
                    </p>
                    <button onClick={() => {setSearchTerm(''); setSelectedTemplate('All'); setSelectedLifecycle('All');}} className="mt-4 text-primary font-medium hover:underline">Clear all filters</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {displayedTracks.map(track => (
                        <TrackCard 
                            key={track.id} 
                            track={track} 
                            users={users} 
                            feedEntries={feedEntries}
                            onSelectTrack={() => onNavigate('TRACK_DETAIL', track.id)} 
                            isPinned={activeTab === 'my' && pinnedTrackIds.includes(track.id)}
                            onTogglePin={activeTab === 'my' ? handleTogglePin : undefined}
                            isShared={activeTab === 'shared'}
                        />
                    ))}
                </div>
            )}
            
            {isAddTrackModalOpen && (
                <AddTrackModal
                    users={users}
                    owners={users} 
                    entryTags={[]}
                    onAddTag={() => {}}
                    onClose={() => setIsAddTrackModalOpen(false)}
                    onSave={handleSaveNewTrack}
                />
            )}
        </div>
    );
};

export default KanbanPage;
