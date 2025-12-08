
import React, { useMemo, useState, useEffect } from 'react';
import { Track, FeedEntry, View, TrackLifecycle, User } from '../types';
import Icon from './Icon';
import AddTrackModal from './AddTrackModal';
import { getTracks } from '../api/tracksApi';
import { getFeedEntries } from '../api/feedApi';
import { getUsers } from '../api/usersApi';

interface DashboardPageProps {
  currentUser: User;
  onNavigate: (view: View, id?: number) => void;
}

const SummaryCard: React.FC<{ title: string, count: number, icon: string, color: string, onClick: () => void }> = ({ title, count, icon, color, onClick }) => (
    <div onClick={onClick} className={`p-6 rounded-lg border flex items-center space-x-4 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${color} h-full`}>
        <div className="bg-white/30 p-3 rounded-full">
            <Icon name={icon} className="w-7 h-7 text-white" />
        </div>
        <div>
            <p className="text-3xl font-bold text-white">{count}</p>
            <p className="font-semibold text-white/90">{title}</p>
        </div>
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
    if (normalized.includes('health') || normalized.includes('wellness')) return { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' };
    return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
};

const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return `${Math.round(days / 7)}w ago`;
};

const DashboardPage: React.FC<DashboardPageProps> = ({ currentUser, onNavigate }) => {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [feedEntries, setFeedEntries] = useState<FeedEntry[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddTrackModalOpen, setIsAddTrackModalOpen] = useState(false);
    const [pinnedTrackIds, setPinnedTrackIds] = useState<number[]>([]);
    // Template filter is now primarily for the "All" button locally, as specific cards navigate away
    const [templateFilter, setTemplateFilter] = useState<string>('All');

    // Load pinned tracks from local storage
    useEffect(() => {
        const storedPins = localStorage.getItem('pinnedTrackIds');
        if (storedPins) {
            setPinnedTrackIds(JSON.parse(storedPins));
        }
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [fetchedTracks, fetchedEntries, fetchedUsers] = await Promise.all([
                getTracks(),
                getFeedEntries(),
                getUsers()
            ]);
            setTracks(fetchedTracks);
            setFeedEntries(fetchedEntries);
            setUsers(fetchedUsers);
        } catch (error) {
            console.error("Error fetching dashboard data", error);
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

    // Derived State
    const myTracks = useMemo(() => tracks.filter(t => t.organizationId === currentUser.organizationId), [tracks, currentUser]);
    const myTrackIds = useMemo(() => new Set(myTracks.map(t => t.id)), [myTracks]);

    const trackSummary = useMemo(() => {
        const open = myTracks.filter(t => t.lifecycle === TrackLifecycle.OPEN).length;
        const total = myTracks.length;
        return { open, total };
    }, [myTracks]);

    const recentActivity = useMemo(() => {
        return [...feedEntries]
            .filter(e => e.trackId && myTrackIds.has(e.trackId))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10);
    }, [feedEntries, myTrackIds]);

    const displayTracks = useMemo(() => {
        let filtered = myTracks;
        if (templateFilter !== 'All') {
            filtered = filtered.filter(t => (t.template || getTemplateFromDescription(t.description)) === templateFilter);
        }

        return filtered.sort((a, b) => {
            const aPinned = pinnedTrackIds.includes(a.id);
            const bPinned = pinnedTrackIds.includes(b.id);
            if (aPinned && !bPinned) return -1;
            if (!aPinned && bPinned) return 1;
            return a.name.localeCompare(b.name);
        }).slice(0, 10);
    }, [myTracks, pinnedTrackIds, templateFilter]);

    const templateStats = useMemo(() => {
        const stats: Record<string, number> = {};
        myTracks.forEach(t => {
            const tmpl = t.template || getTemplateFromDescription(t.description);
            stats[tmpl] = (stats[tmpl] || 0) + 1;
        });
        return Object.entries(stats).sort((a, b) => b[1] - a[1]);
    }, [myTracks]);

    const handleTemplateClick = (template: string) => {
        sessionStorage.setItem('kanbanTemplateFilter', template);
        onNavigate('KANBAN');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setIsAddTrackModalOpen(true)}
                        className="flex items-center justify-center px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-hover transition-colors font-semibold shadow-sm text-sm"
                    >
                        <Icon name="plus" className="w-5 h-5 mr-2" />
                        Create New Track
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SummaryCard title="My Open Tracks" count={trackSummary.open} icon="deployment-release" color="bg-gradient-to-br from-primary to-sky-500" onClick={() => onNavigate('KANBAN')} />
                <SummaryCard title="My Total Tracks" count={trackSummary.total} icon="tracks" color="bg-gradient-to-br from-indigo-600 to-purple-500" onClick={() => onNavigate('KANBAN')} />
                
                <div className="bg-gradient-to-br from-emerald-50 to-white rounded-lg border border-emerald-100 p-4 shadow-sm flex flex-col justify-center items-center transition-all hover:shadow-md text-center">
                    <Icon name="task" className="w-10 h-10 text-emerald-500 mb-2" />
                    <p className="text-3xl font-bold text-gray-800">{recentActivity.length}</p>
                    <p className="text-sm font-medium text-emerald-700">Recent Activities</p>
                </div>
            </div>

            <div className="w-full overflow-x-auto pb-2 -mx-1 px-1 custom-scrollbar">
                <div className="flex space-x-4">
                    <button
                        onClick={() => setTemplateFilter('All')}
                        className={`flex-shrink-0 flex items-center px-4 py-3 rounded-lg border transition-colors min-w-[120px] ${templateFilter === 'All' ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-200'}`}
                    >
                        <span className="text-sm font-bold text-gray-700">All</span>
                    </button>
                    {templateStats.map(([template, count]) => {
                        const style = getTemplateStyle(template);
                        return (
                            <button
                                key={template}
                                onClick={() => handleTemplateClick(template)}
                                className={`flex-shrink-0 flex items-center px-4 py-3 rounded-lg border ${style.border} ${style.bg} hover:shadow-sm transition-all min-w-[180px] hover:scale-[1.02]`}
                            >
                                <div className="flex-grow text-left">
                                    <span className={`block text-sm font-bold ${style.text}`}>{template}</span>
                                    <span className="text-xs text-gray-500 font-medium">{count} tracks</span>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                <div className="flex flex-col space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        My Tracks
                    </h2>
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex-grow">
                        {displayTracks.length > 0 ? (
                            <div className="divide-y divide-gray-200">
                                {displayTracks.map(track => {
                                    const template = track.template || getTemplateFromDescription(track.description);
                                    const style = getTemplateStyle(template);
                                    const isPinned = pinnedTrackIds.includes(track.id);
                                    return (
                                        <div 
                                            key={track.id} 
                                            onClick={() => onNavigate('TRACK_DETAIL', track.id)}
                                            className="p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-between group relative"
                                        >
                                            <div className="flex items-center space-x-3 overflow-hidden flex-grow">
                                                {track.avatarUrl ? (
                                                    <img src={track.avatarUrl} alt={track.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                                ) : (
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                                                        <span className={`font-bold text-xs ${style.text}`}>{track.name.substring(0, 2).toUpperCase()}</span>
                                                    </div>
                                                )}
                                                <div className="min-w-0 flex-grow">
                                                    <div className="flex items-center">
                                                        <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-primary transition-colors mr-2">{track.name}</h3>
                                                        {isPinned && <Icon name="pin" className="w-3 h-3 text-primary flex-shrink-0" fill="currentColor" />}
                                                    </div>
                                                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                        <span className={`inline-block w-2 h-2 rounded-full ${track.lifecycle === TrackLifecycle.OPEN ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                        <span>{track.lifecycle}</span>
                                                        <span>&bull;</span>
                                                        <span className="truncate max-w-[150px]">{template}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center space-x-1 pl-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleTogglePin(track.id); }}
                                                    className={`p-2 rounded-full transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 ${isPinned ? 'text-primary opacity-100' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-600'}`}
                                                    title={isPinned ? "Unpin track" : "Pin track"}
                                                >
                                                    <Icon name="pin" className="w-4 h-4" fill={isPinned ? "currentColor" : "none"} />
                                                </button>
                                                <Icon name="chevron-right" className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors flex-shrink-0" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                No tracks found. Create one to get started.
                            </div>
                        )}
                        <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
                            <button onClick={() => onNavigate('KANBAN')} className="text-sm font-semibold text-primary hover:underline">
                                View All Tracks &rarr;
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col space-y-4">
                    <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex-grow">
                        <ul className="divide-y divide-gray-200">
                            {recentActivity.map(entry => {
                                const author = users.find(u => u.id === entry.authorId);
                                const track = tracks.find(p => p.id === entry.trackId);
                                if (!author || !track) return null;

                                return (
                                    <li key={entry.id} className="p-4 flex items-start space-x-3 hover:bg-gray-50 transition-colors">
                                        <div className="flex-shrink-0 mt-1">
                                            {author.avatarUrl ? (
                                                <img src={author.avatarUrl} alt={author.name} className="w-8 h-8 rounded-full" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">{author.initials}</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-900">
                                                <span className="font-semibold">{author.name}</span>
                                                <span className="text-gray-600"> posted in </span>
                                                <span className="font-semibold text-primary cursor-pointer hover:underline" onClick={() => onNavigate('TRACK_DETAIL', track.id)}>{track.name}</span>
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate">{entry.content}</p>
                                        </div>
                                        <time className="text-xs text-gray-400 whitespace-nowrap">{formatRelativeTime(entry.timestamp)}</time>
                                    </li>
                                );
                            })}
                            {recentActivity.length === 0 && (
                                <li className="p-8 text-center text-gray-500">No recent activity.</li>
                            )}
                        </ul>
                        <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
                             <button onClick={() => onNavigate('FEED')} className="text-sm font-semibold text-primary hover:underline">
                                View Full Feed &rarr;
                            </button>
                        </div>
                    </div>
                </div>

            </div>
            {isAddTrackModalOpen && (
                <AddTrackModal 
                    users={users} 
                    owners={users.filter(u => u.role === 'Admin' || u.role === 'Manager')}
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
        </div>
    );
};

export default DashboardPage;
