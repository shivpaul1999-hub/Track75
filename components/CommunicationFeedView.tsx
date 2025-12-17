
import React, { useState, useMemo } from 'react';
import { FeedEntry, User, EntryType, Comment } from '../types';
import Icon from './Icon';

interface CommunicationFeedViewProps {
    entries: FeedEntry[];
    users: User[];
}

const formatDateDivider = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === yesterday.getTime()) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
};

const EntryTypeDetails: { [key: string]: { color: string; icon: string } } = {
    [EntryType.COMMENT]: { color: 'text-gray-600 dark:text-gray-400', icon: 'comment' },

    [EntryType.ANNOUNCEMENT]: { color: 'text-pink-600 dark:text-pink-400', icon: 'announcement' },
};

const EntryItem: React.FC<{
    entry: FeedEntry;
    isPinned: boolean;
    onPinToggle: (id: number) => void;
    isExpanded: boolean;
    onExpandToggle: (id: number) => void;
    users: User[];
}> = ({ entry, isPinned, onPinToggle, isExpanded, onExpandToggle, users }) => {
    const author = users.find(u => u.id === entry.authorId);
    if (!author) return null;

    const entryDate = new Date(entry.timestamp);
    const entryDetails = EntryTypeDetails[entry.type as EntryType];

    const attachments = useMemo(() => {
        const all = [...(entry.attachments || [])];
        if (entry.documentUrl && !all.some(att => att.url === entry.documentUrl)) {
            all.unshift({
                name: entry.documentUrl.split('/').pop()?.replace(/-/g, ' ') || 'Document',
                url: entry.documentUrl,
                type: 'application/pdf'
            });
        }
        return all;
    }, [entry.attachments, entry.documentUrl]);

    return (
        <div className="flex items-start space-x-4 py-4">
            {author.avatarUrl ? (
                <img src={author.avatarUrl} alt={author.name} className="w-10 h-10 rounded-full mt-1" />
            ) : (
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0 mt-1">{author.initials}</div>
            )}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                    <div className="flex-grow min-w-0">
                        <div className="flex items-center flex-wrap">
                            <span className="font-semibold text-gray-800 dark:text-white mr-2">{author.name}</span>
                            {entryDetails && (
                                <span className={`inline-flex items-center text-xs font-semibold ${entryDetails.color}`}>
                                    <Icon name={entryDetails.icon} className="w-4 h-4 mr-1" />
                                    {entry.type}
                                </span>
                            )}
                            <span className="text-sm text-gray-500 dark:text-gray-500 ml-2">&middot; {entryDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                        </div>
                    </div>
                    <button onClick={() => onPinToggle(entry.id)} className="p-2 rounded-full text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-elevated hover:text-primary flex-shrink-0">
                        <Icon name="pin" className={`w-5 h-5 transition-colors ${isPinned ? 'text-primary fill-primary' : ''}`} />
                    </button>
                </div>
                <div className="mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    <p>{entry.content}</p>
                </div>

                {(entry.comments && entry.comments.length > 0 || attachments.length > 0) && (
                    <div className="mt-2">
                        <button onClick={() => onExpandToggle(entry.id)} className="text-sm font-semibold text-primary hover:underline">
                            {isExpanded ? 'Hide details' : `View ${entry.comments?.length || 0} replies & ${attachments.length} attachments`}
                        </button>
                    </div>
                )}

                {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-dark-elevated space-y-3 animate-fade-in">
                        {/* Attachments */}
                        {attachments.length > 0 && (
                            <div className="space-y-2">
                                {attachments.map((file, index) => (
                                    <a href={file.url} key={index} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 bg-gray-50 dark:bg-dark-elevated rounded-md hover:bg-gray-100 dark:hover:bg-dark-card transition-colors group">
                                        <Icon name="files" className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3 flex-shrink-0" />
                                        <span className="text-sm text-primary font-medium truncate group-hover:underline">{file.name}</span>
                                    </a>
                                ))}
                            </div>
                        )}
                        {/* Replies */}
                        {entry.comments && entry.comments.map(comment => {
                            const commentAuthor = users.find(u => u.id === comment.authorId);
                            if (!commentAuthor) return null;
                            return (
                                <div key={comment.id} className="flex items-start space-x-3 text-sm">
                                    {commentAuthor.avatarUrl ? (
                                        <img src={commentAuthor.avatarUrl} alt={commentAuthor.name} className="w-8 h-8 rounded-full mt-1" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-1">{commentAuthor.initials}</div>
                                    )}
                                    <div className="flex-1 bg-gray-50 dark:bg-dark-elevated rounded-lg px-3 py-2">
                                        <span className="font-semibold text-gray-800 dark:text-white">{commentAuthor.name}</span>
                                        <p className="text-gray-600 dark:text-gray-400">{comment.content}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};


const CommunicationFeedView: React.FC<CommunicationFeedViewProps> = ({ entries, users }) => {
    const [pinnedEntryIds, setPinnedEntryIds] = useState<number[]>([]);
    const [authorFilter, setAuthorFilter] = useState<number | 'all'>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [expandedEntryId, setExpandedEntryId] = useState<number | null>(null);

    const communicationTypes = [EntryType.COMMENT, EntryType.ANNOUNCEMENT];

    const authors = useMemo(() => {
        const authorIds = new Set(entries.map(p => p.authorId));
        return users.filter(u => authorIds.has(u.id)).sort((a, b) => a.name.localeCompare(b.name));
    }, [entries, users]);

    const filteredEntries = useMemo(() => {
        return entries.filter(entry => {
            const authorMatch = authorFilter === 'all' || entry.authorId === authorFilter;
            const typeMatch = typeFilter === 'all' || entry.type === typeFilter;
            return authorMatch && typeMatch;
        });
    }, [entries, authorFilter, typeFilter]);

    const { pinnedEntries, regularEntries } = useMemo(() => {
        const pinned = [];
        const regular = [];
        for (const entry of filteredEntries) {
            if (pinnedEntryIds.includes(entry.id)) {
                pinned.push(entry);
            } else {
                regular.push(entry);
            }
        }
        return { pinnedEntries: pinned, regularEntries: regular };
    }, [filteredEntries, pinnedEntryIds]);

    const groupedEntries = useMemo(() => {
        return regularEntries.reduce((acc, entry) => {
            const dateKey = entry.timestamp.split('T')[0];
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(entry);
            return acc;
        }, {} as Record<string, FeedEntry[]>);
    }, [regularEntries]);

    const sortedDateKeys = useMemo(() => Object.keys(groupedEntries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()), [groupedEntries]);

    const handlePinToggle = (entryId: number) => {
        setPinnedEntryIds(prev => prev.includes(entryId) ? prev.filter(id => id !== entryId) : [...prev, entryId]);
    };

    const handleExpandToggle = (entryId: number) => {
        setExpandedEntryId(prev => prev === entryId ? null : entryId);
    };

    return (
        <div className="bg-white dark:bg-dark-card p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-dark-elevated shadow-sm">
            <div className="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-dark-elevated">
                <div className="flex-grow sm:flex-grow-0">
                    <label htmlFor="author-filter" className="sr-only">Filter by user</label>
                    <select
                        id="author-filter"
                        value={authorFilter}
                        onChange={(e) => setAuthorFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="w-full sm:w-48 appearance-none bg-white dark:bg-dark-elevated border border-gray-300 dark:border-dark-elevated rounded-md py-2 pl-3 pr-10 text-sm focus:ring-1 focus:ring-primary focus:border-primary text-gray-900 dark:text-white"
                    >
                        <option value="all">All Users</option>
                        {authors.map(author => <option key={author.id} value={author.id}>{author.name}</option>)}
                    </select>
                </div>
                <div className="flex items-center rounded-md border border-gray-300 dark:border-dark-elevated p-0.5">
                    {(['all', ...communicationTypes] as const).map(type => {
                        const isActive = typeFilter === type;
                        return (
                            <button
                                key={type}
                                onClick={() => setTypeFilter(type)}
                                className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${isActive ? 'bg-primary text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-elevated'}`}
                            >
                                <span className="capitalize">{type}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {pinnedEntries.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-2">Pinned</h3>
                    <div className="divide-y divide-gray-200 dark:divide-dark-elevated">
                        {pinnedEntries.map(entry => (
                            <EntryItem
                                key={entry.id}
                                entry={entry}
                                isPinned={true}
                                onPinToggle={handlePinToggle}
                                isExpanded={expandedEntryId === entry.id}
                                onExpandToggle={handleExpandToggle}
                                users={users}
                            />
                        ))}
                    </div>
                </div>
            )}

            {sortedDateKeys.length > 0 ? (
                sortedDateKeys.map(dateKey => (
                    <div key={dateKey}>
                        <div className="sticky top-16 bg-white/80 dark:bg-dark-card/80 backdrop-blur-sm py-2 z-10">
                            <div className="relative">
                                <hr className="absolute top-1/2 -translate-y-1/2 w-full border-t border-gray-200 dark:border-dark-elevated" />
                                <div className="relative flex justify-center">
                                    <span className="bg-white dark:bg-dark-card px-3 text-sm font-semibold text-gray-500 dark:text-gray-400">{formatDateDivider(dateKey)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-200 dark:divide-dark-elevated">
                            {groupedEntries[dateKey].map(entry => (
                                <EntryItem
                                    key={entry.id}
                                    entry={entry}
                                    isPinned={false}
                                    onPinToggle={handlePinToggle}
                                    isExpanded={expandedEntryId === entry.id}
                                    onExpandToggle={handleExpandToggle}
                                    users={users}
                                />
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">No communications match the current filters.</p>
                </div>
            )}
        </div>
    );
};

export default CommunicationFeedView;
