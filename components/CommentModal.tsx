
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FeedEntry, Comment, User, EntryType, Track } from '../types';
import Icon from './Icon';
import EntryItem from './FeedItem';

interface CommentModalProps {
    entry: FeedEntry;
    onClose: () => void;
    onAddComment: (entryId: number, content: string) => void;
    users: User[];
    tracks: Track[];
}

const formatRelativeTime = (dateString: string) => {
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

const CommentItem: React.FC<{ comment: Comment, onReply: (id: number) => void, users: User[] }> = ({ comment, onReply, users }) => {
    const author = users.find(u => u.id === comment.authorId);
    if (!author) return null;

    return (
        <div className="flex items-start space-x-3">
            {author.avatarUrl ? (
                <img src={author.avatarUrl} alt={author.name} className="w-9 h-9 rounded-full" />
            ) : (
                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">{author.initials}</div>
            )}
            <div className="flex-1">
                <div className="bg-gray-100 dark:bg-dark-elevated rounded-xl p-3">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-gray-800 dark:text-white">{author.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{formatRelativeTime(comment.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{comment.content}</p>
                </div>
                <button onClick={() => onReply(comment.id)} className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-primary mt-1 ml-2 flex items-center gap-1">
                    <Icon name="reply" className="w-3 h-3" /> Reply
                </button>
            </div>
        </div>
    );
};


const CommentModal: React.FC<CommentModalProps> = ({ entry, onClose, onAddComment, users, tracks }) => {
    const [newComment, setNewComment] = useState('');
    const [sortOrder, setSortOrder] = useState<'Newest' | 'Oldest'>('Newest');
    const [replyingTo, setReplyingTo] = useState<number | null>(null);
    const currentUser = users[0]; // Assuming current user is first in array
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    const handleAddComment = () => {
        if (!newComment.trim()) return;

        onAddComment(entry.id, newComment.trim());
        setNewComment('');
    };

    const sortedComments = useMemo(() => {
        const comments = entry.comments || [];
        const sorted = [...comments].sort((a, b) => {
            const dateA = new Date(a.timestamp).getTime();
            const dateB = new Date(b.timestamp).getTime();
            return sortOrder === 'Newest' ? dateB - dateA : dateA - dateB;
        });
        return sorted;
    }, [entry.comments, sortOrder]);

    if (!currentUser) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-dark-popup rounded-xl shadow-2xl w-full max-w-3xl h-full max-h-[90vh] flex flex-col animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b border-gray-200 dark:border-dark-elevated flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Thread</h2>
                    <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-full">
                        <Icon name="close" className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto">
                    <div className="p-4 sm:p-6">
                        <EntryItem entry={entry} users={users} tracks={tracks} />
                    </div>

                    <div className="px-6">
                        <hr className="border-gray-200 dark:border-dark-elevated" />
                    </div>

                    <div className="p-4 sm:p-6 space-y-4">
                        <div className="flex justify-end items-center">
                            <select
                                value={sortOrder}
                                onChange={e => setSortOrder(e.target.value as 'Newest' | 'Oldest')}
                                className="text-sm font-medium text-gray-600 dark:text-gray-300 border-none bg-gray-100 dark:bg-dark-elevated rounded-md py-1 pl-2 pr-8 focus:ring-0"
                            >
                                <option>Newest</option>
                                <option>Oldest</option>
                            </select>
                        </div>

                        <div className="space-y-4">
                            {sortedComments.map(comment => (
                                <div key={comment.id}>
                                    <CommentItem comment={comment} onReply={(id) => { setReplyingTo(id); inputRef.current?.focus(); }} users={users} />
                                    {comment.replies && comment.replies.length > 0 && (
                                        <div className="ml-8 mt-3 space-y-3 border-l-2 border-gray-200 dark:border-dark-elevated pl-4">
                                            {comment.replies.map(reply => (
                                                <CommentItem key={reply.id} comment={reply} onReply={(id) => { setReplyingTo(id); inputRef.current?.focus(); }} users={users} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {(!entry.comments || entry.comments.length === 0) && <p className="text-center text-gray-500 dark:text-gray-400 py-4">No comments yet. Be the first to comment!</p>}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-dark-elevated border-t border-gray-200 dark:border-dark-elevated flex-shrink-0">
                    <div className="flex items-start space-x-3">
                        {currentUser.avatarUrl ? (
                            <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-9 h-9 rounded-full" />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">{currentUser.initials}</div>
                        )}
                        <div className="flex-1 relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && handleAddComment()}
                                placeholder="Write a comment..."
                                className="w-full pl-4 pr-12 py-2 border border-gray-300 dark:border-dark-elevated dark:bg-dark-card rounded-full focus:ring-2 focus:ring-primary-focus focus:border-primary transition dark:text-white"
                            />
                            <button
                                onClick={handleAddComment}
                                disabled={!newComment.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary text-white hover:bg-primary-hover disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                                aria-label="Send comment"
                            >
                                <Icon name="send" className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommentModal;
