
import React, { useState, useMemo, useEffect } from 'react';
import { Track, FeedEntry, User, View } from '../types';
import EntryItem from './FeedItem';
import Icon from './Icon';
import { useToast } from './ToastContext';
import { getTracks } from '../api/tracksApi';
import { getFeedEntries, updateFeedEntry } from '../api/feedApi';
import { getUsers } from '../api/usersApi';
import { getTemplates, TemplateConfig } from '../api/metaApi';

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-elevated shadow-sm ${className}`}>
        {children}
    </div>
);

interface GlobalFeedPageProps {
    currentUser: User;
    onNavigate: (view: View, id?: number) => void;
}

const GlobalFeedPage: React.FC<GlobalFeedPageProps> = ({ currentUser, onNavigate }) => {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [feedEntries, setFeedEntries] = useState<FeedEntry[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [templates, setTemplates] = useState<TemplateConfig[]>([]);

    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [trackFilter, setTrackFilter] = useState<number | 'All'>('All');
    const [sortOrder, setSortOrder] = useState<'Newest First' | 'Oldest First'>('Newest First');
    const [tagSearchTerm, setTagSearchTerm] = useState('');
    const [isTagsExpanded, setIsTagsExpanded] = useState(true);

    const { showToast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [allTracks, allEntries, allUsers, allTemplates] = await Promise.all([
                    getTracks(),
                    getFeedEntries(),
                    getUsers(),
                    getTemplates()
                ]);
                setTracks(allTracks);
                setFeedEntries(allEntries);
                setUsers(allUsers);
                setTemplates(allTemplates);
            } catch (error: any) {
                console.error("Error loading feed data", error);
                showToast(error.message || "Failed to load feed data", 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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
        // Optimistic update
        setFeedEntries(prev => prev.map(e => e.id === entryId ? updatedEntry : e));
        try {
            await updateFeedEntry(entryId, updatedEntry);
        } catch (error) {
            console.error("Failed to add comment", error);
        }
    };

    // Filter tracks relevant to the current user's organization
    const relevantTracks = useMemo(() => {
        return tracks.filter(t => t.organizationId === currentUser.organizationId);
    }, [tracks, currentUser.organizationId]);

    const relevantTrackIds = useMemo(() => new Set(relevantTracks.map(t => t.id)), [relevantTracks]);

    const entryTags = useMemo(() => {
        const tags = new Set<string>();
        feedEntries.forEach(e => {
            if (e.trackId && relevantTrackIds.has(e.trackId)) {
                tags.add(e.type);
            }
        });
        return Array.from(tags);
    }, [feedEntries, relevantTrackIds]);

    const availableTags = useMemo(() => {
        const tagsSet = new Set<string>();

        const tracksToConsider = trackFilter === 'All'
            ? relevantTracks
            : relevantTracks.filter(t => t.id === trackFilter);

        tracksToConsider.forEach(track => {
            const templateName = track.template || 'Custom Template';
            const templateConfig = templates.find(t => t.name === templateName);
            const templateTags = templateConfig ? templateConfig.tags : [];
            templateTags.forEach(tag => tagsSet.add(tag));

            if (track.customTags) {
                track.customTags.forEach(tag => tagsSet.add(tag));
            }
        });

        // Add tags from actual entries if they aren't in the template config
        entryTags.forEach(t => tagsSet.add(t));

        return Array.from(tagsSet).sort((a, b) => a.localeCompare(b));
    }, [trackFilter, relevantTracks, entryTags]);

    const displayedTags = useMemo(() => {
        if (!tagSearchTerm) return availableTags;
        return availableTags.filter(tag => tag.toLowerCase().includes(tagSearchTerm.toLowerCase()));
    }, [availableTags, tagSearchTerm]);

    const sortedTracks = useMemo(() =>
        [...relevantTracks].sort((a, b) => a.name.localeCompare(b.name)),
        [relevantTracks]);

    const handleTagClick = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const resetFilters = () => {
        setTrackFilter('All');
        setSelectedTags([]);
        setTagSearchTerm('');
    };

    const filteredEntries = useMemo(() => {
        return feedEntries
            .filter(entry => {
                // Must belong to a relevant track (in the organization)
                if (!entry.trackId || !relevantTrackIds.has(entry.trackId)) return false;

                const typeMatch = selectedTags.length === 0 ||
                    selectedTags.includes(entry.type) ||
                    (entry.chips && entry.chips.some(chip => selectedTags.includes(chip)));
                const trackMatch = trackFilter === 'All' || entry.trackId === trackFilter;
                return typeMatch && trackMatch;
            })
            .sort((a, b) => {
                const dateA = new Date(a.timestamp).getTime();
                const dateB = new Date(b.timestamp).getTime();
                if (sortOrder === 'Newest First') {
                    return dateB - dateA;
                } else {
                    return dateA - dateB;
                }
            });
    }, [selectedTags, trackFilter, sortOrder, feedEntries, relevantTrackIds]);

    const isFilterActive = trackFilter !== 'All' || selectedTags.length > 0;

    if (loading) return <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <aside className="lg:col-span-3 lg:sticky lg:top-24">
                <Card className="flex flex-col overflow-hidden border-none shadow-md">
                    <div className="p-4 border-b border-gray-100 dark:border-dark-elevated bg-gray-50/80 dark:bg-dark-elevated flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 dark:text-white flex items-center text-sm">
                            <Icon name="settings" className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                            Filters
                        </h3>
                        {isFilterActive && (
                            <button
                                onClick={resetFilters}
                                className="text-xs font-semibold text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors flex items-center bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md"
                            >
                                Reset
                            </button>
                        )}
                    </div>

                    <div className="p-5 space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto custom-scrollbar bg-white dark:bg-dark-card">
                        <div>
                            <label htmlFor="track-filter" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                Project / Track
                            </label>
                            <div className="relative group">
                                <select
                                    id="track-filter"
                                    value={trackFilter}
                                    onChange={(e) => {
                                        setTrackFilter(e.target.value === 'All' ? 'All' : Number(e.target.value));
                                        setSelectedTags([]);
                                    }}
                                    className="w-full appearance-none bg-gray-50 dark:bg-dark-elevated border border-gray-200 dark:border-gray-600 rounded-lg py-2.5 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer font-medium text-gray-700 dark:text-white hover:bg-white dark:hover:bg-dark-card"
                                >
                                    <option value="All">All Tracks</option>
                                    {sortedTracks.map((track: Track) => (
                                        <option key={track.id} value={track.id}>
                                            {track.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 group-hover:text-primary transition-colors">
                                    <Icon name="chevron-down" className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="sort-order" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                Sort Activity
                            </label>
                            <div className="relative group">
                                <select
                                    id="sort-order"
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as 'Newest First' | 'Oldest First')}
                                    className="w-full appearance-none bg-gray-50 dark:bg-dark-elevated border border-gray-200 dark:border-gray-600 rounded-lg py-2.5 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer font-medium text-gray-700 dark:text-white hover:bg-white dark:hover:bg-dark-card"
                                >
                                    <option>Newest First</option>
                                    <option>Oldest First</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 group-hover:text-primary transition-colors">
                                    <Icon name="chevron-down" className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 dark:border-dark-elevated pt-5">
                            <div
                                className="flex justify-between items-center mb-3 cursor-pointer group select-none"
                                onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                            >
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer group-hover:text-gray-600 transition-colors">
                                    Filter by Tags
                                </label>
                                <div className="flex items-center">
                                    {selectedTags.length > 0 && (
                                        <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-2">
                                            {selectedTags.length}
                                        </span>
                                    )}
                                    <Icon
                                        name="chevron-down"
                                        className={`w-4 h-4 text-gray-300 transition-transform duration-300 ${isTagsExpanded ? 'rotate-180' : ''}`}
                                    />
                                </div>
                            </div>

                            {isTagsExpanded && (
                                <div className="animate-fade-in space-y-3">
                                    <div className="relative">
                                        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={tagSearchTerm}
                                            onChange={(e) => setTagSearchTerm(e.target.value)}
                                            placeholder="Search tags..."
                                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-elevated text-gray-900 dark:text-white focus:ring-1 focus:ring-primary focus:border-primary transition-colors placeholder-gray-400"
                                        />
                                    </div>

                                    <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar content-start pt-1">
                                        {displayedTags.length > 0 ? (
                                            displayedTags.map(tag => {
                                                const isSelected = selectedTags.includes(tag);
                                                return (
                                                    <button
                                                        key={tag}
                                                        onClick={() => handleTagClick(tag)}
                                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${isSelected
                                                            ? 'bg-primary border-primary text-white shadow-md'
                                                            : 'bg-white dark:bg-dark-elevated border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-primary/30 hover:text-primary dark:hover:text-primary hover:bg-primary-light/10 dark:hover:bg-primary/20'
                                                            }`}
                                                    >
                                                        {tag}
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <div className="w-full text-center py-4">
                                                <p className="text-xs text-gray-400 italic">No relevant tags found.</p>
                                            </div>
                                        )}
                                    </div>

                                    {selectedTags.length > 0 && (
                                        <button
                                            onClick={() => setSelectedTags([])}
                                            className="mt-2 text-xs text-gray-400 hover:text-red-500 underline w-full text-center transition-colors"
                                        >
                                            Clear tags
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </aside>

            <main className="lg:col-span-9 space-y-4">
                {isFilterActive && (
                    <div className="flex flex-wrap items-center gap-2 mb-2 animate-fade-in">
                        <span className="text-sm text-gray-500 dark:text-gray-400 mr-1 font-medium">Active filters:</span>
                        {trackFilter !== 'All' && (
                            <span className="bg-white dark:bg-dark-elevated text-gray-800 dark:text-white border border-gray-200 dark:border-dark-elevated px-3 py-1 rounded-full text-xs font-semibold flex items-center shadow-sm group hover:border-blue-200 dark:hover:border-blue-700 transition-colors">
                                <span className="text-gray-400 mr-1.5 font-normal">Track:</span>
                                {tracks.find(t => t.id === trackFilter)?.name}
                                <button onClick={() => { setTrackFilter('All'); setSelectedTags([]); }} className="ml-2 text-gray-400 hover:text-red-500 transition-colors"><Icon name="close" className="w-3 h-3" /></button>
                            </span>
                        )}
                        {selectedTags.map(tag => (
                            <span key={tag} className="bg-primary-light text-primary border border-blue-100 px-3 py-1 rounded-full text-xs font-semibold flex items-center shadow-sm hover:bg-blue-100 transition-colors">
                                {tag}
                                <button onClick={() => handleTagClick(tag)} className="ml-2 text-blue-400 hover:text-blue-700 transition-colors"><Icon name="close" className="w-3 h-3" /></button>
                            </span>
                        ))}
                        <button onClick={resetFilters} className="text-xs text-gray-400 hover:text-gray-700 underline ml-2 transition-colors">Clear All</button>
                    </div>
                )}

                {filteredEntries.length > 0 ? (
                    filteredEntries.map(entry => <EntryItem key={entry.id} entry={entry} onAddComment={handleAddComment} users={users} tracks={tracks} />)
                ) : (
                    <Card>
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="bg-gray-50 dark:bg-dark-elevated p-4 rounded-full mb-4 border border-gray-100 dark:border-dark-elevated">
                                <Icon name="search" className="w-8 h-8 text-gray-300 dark:text-gray-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">No entries found</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xs mx-auto text-sm leading-relaxed">
                                We couldn't find any entries matching your current filters. Try selecting a different track or clearing your tags.
                            </p>
                            <button
                                onClick={resetFilters}
                                className="mt-6 px-5 py-2 bg-white dark:bg-dark-elevated border border-gray-300 dark:border-dark-elevated text-gray-700 dark:text-white font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-dark-card text-sm transition-colors shadow-sm"
                            >
                                Clear all filters
                            </button>
                        </div>
                    </Card>
                )}
            </main>
        </div>
    );
};

export default GlobalFeedPage;
