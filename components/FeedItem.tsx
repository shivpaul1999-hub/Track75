
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FeedEntry, User, Track, Reaction } from '../types';
import Icon from './Icon';
import CommentModal from './CommentModal';
import ImageGalleryModal from './ImageGalleryModal';

interface EntryItemProps {
  entry: FeedEntry;
  onAddComment?: (entryId: number, content: string) => void;
  users: User[];
  tracks: Track[];
}

const EntryTypeDetails: { [key: string]: { color: string; icon: string } } = {
  // Project Management
  'Opportunity': { color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', icon: 'opportunity' },
  'Task': { color: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300', icon: 'task' },
  'Comment': { color: 'bg-gray-100 text-gray-800 dark:bg-dark-elevated dark:text-gray-400', icon: 'comment' },
  'Files': { color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300', icon: 'files' },
  'Roadmap Update': { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300', icon: 'roadmap' },

  'Meta Data / Track Info': { color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300', icon: 'settings' },
  'Meeting Notes': { color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300', icon: 'meeting-notes' },
  'Quick Note': { color: 'bg-gray-100 text-gray-800 dark:bg-dark-elevated dark:text-gray-400', icon: 'quick-note' },
  'URL / Link': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: 'url-link' },
  'Bug / Issue': { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: 'bug-issue' },
  'Idea / Brainstorm': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: 'idea-brainstorm' },
  'Announcement': { color: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300', icon: 'announcement' },
  'Deployment / Release': { color: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300', icon: 'deployment-release' },
  'Approval / Sign-off': { color: 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300', icon: 'approval-signoff' },
  'Priority Task': { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', icon: 'priority-task' },
  'Checklist / To-Do': { color: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300', icon: 'checklist-todo' },

  // CRM
  'Lead Identified': { color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300', icon: 'opportunity' },
  'Proposal Sent': { color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300', icon: 'document-text' },
  'Negotiation': { color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300', icon: 'comment' },
  'Contract Signed': { color: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300', icon: 'approval-signoff' },
  'Rejected / Closed': { color: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300', icon: 'close' },
  'Status Report': { color: 'bg-gray-100 text-gray-800 dark:bg-dark-elevated dark:text-gray-400', icon: 'document-text' },
  'Progress Summary': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: 'roadmap' },
  'Change Request': { color: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300', icon: 'task' },
  'Feedback Received': { color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300', icon: 'comment' },
  'Reminder': { color: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300', icon: 'task' },
  'Idea Draft': { color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: 'quick-note' },
  'Follow-up': { color: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300', icon: 'reply' },

  // Health
  'Meal': { color: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300', icon: 'task' },
  'Workout': { color: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300', icon: 'opportunity' },
  'Medication': { color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300', icon: 'task' },
  'Mood': { color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300', icon: 'idea-brainstorm' },

  // Creative
  'Writing': { color: 'bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-300', icon: 'document-text' },
  'Painting': { color: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300', icon: 'photo' },
  'Music': { color: 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300', icon: 'task' },
  'Design': { color: 'bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-900/20 dark:text-fuchsia-300', icon: 'photo' },
  'New Feature Idea': { color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300', icon: 'idea-brainstorm' },
  'Improvement Suggestion': { color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300', icon: 'quick-note' },
  'Design Concept': { color: 'bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300', icon: 'photo' },
  'Process Optimization': { color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300', icon: 'settings' },

  // Universal / Media
  'Image': { color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300', icon: 'photo' },
  'Video': { color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300', icon: 'video-camera' }
};

const defaultEntryDetails = { color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300', icon: 'comment' };

// Helper function for rendering image grid
const renderImageGrid = (images: { url: string; name: string }[], onImageClick: (index: number) => void) => {
  const count = images.length;
  if (count === 0) return null;

  const imageClasses = "w-full h-full object-cover cursor-pointer transition-transform duration-300 hover:scale-105";

  const ImageWrapper: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className, onClick }) => (
    <div className={`relative overflow-hidden ${className || ''}`} onClick={onClick}>
      {children}
    </div>
  );

  if (count === 1) {
    return (
      <ImageWrapper className="aspect-[16/9]" onClick={() => onImageClick(0)}>
        <img src={images[0].url} alt={images[0].name} className={imageClasses} />
      </ImageWrapper>
    );
  }
  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 aspect-[16/9]">
        <ImageWrapper onClick={() => onImageClick(0)}><img src={images[0].url} alt={images[0].name} className={imageClasses} /></ImageWrapper>
        <ImageWrapper onClick={() => onImageClick(1)}><img src={images[1].url} alt={images[1].name} className={imageClasses} /></ImageWrapper>
      </div>
    );
  }
  if (count === 3) {
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-1 aspect-[16/9]">
        <ImageWrapper className="row-span-2" onClick={() => onImageClick(0)}><img src={images[0].url} alt={images[0].name} className={imageClasses} /></ImageWrapper>
        <ImageWrapper className="row-span-1" onClick={() => onImageClick(1)}><img src={images[1].url} alt={images[1].name} className={imageClasses} /></ImageWrapper>
        <ImageWrapper className="row-span-1" onClick={() => onImageClick(2)}><img src={images[2].url} alt={images[2].name} className={imageClasses} /></ImageWrapper>
      </div>
    );
  }

  // For 4 or more, use a 2x2 grid
  const visibleImages = images.slice(0, 4);
  const remainingCount = count - 4;
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-1 aspect-square">
      {visibleImages.map((img, i) => (
        <ImageWrapper key={i} onClick={() => onImageClick(i)}>
          <img src={img.url} alt={img.name} className={imageClasses} />
          {i === 3 && remainingCount > 0 && (
            <>
              <div className="absolute inset-0 bg-black/60 transition-opacity hover:bg-black/40"></div>
              <div className="absolute inset-0 flex items-center justify-center text-white text-3xl font-bold">
                +{remainingCount}
              </div>
            </>
          )}
        </ImageWrapper>
      ))}
    </div>
  );
};


const EntryItem: React.FC<EntryItemProps> = ({ entry, onAddComment, users, tracks }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentUserId = users.length > 0 ? users[0].id : 1;

  const [reactions, setReactions] = useState<Reaction>(entry.reactions || {});
  const [showReactionPopup, setShowReactionPopup] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const reactionButtonRef = useRef<HTMLDivElement>(null);

  const author = users?.find(u => u.id === entry.authorId);
  if (!author) {
    return null;
  }
  const track = (entry.trackId && tracks) ? tracks.find(p => p.id === entry.trackId) : undefined;

  const entryDetails = EntryTypeDetails[entry.type] || defaultEntryDetails;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (reactionButtonRef.current && !reactionButtonRef.current.contains(event.target as Node)) {
        setShowReactionPopup(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  const handleReaction = (emoji: string) => {
    setReactions(currentReactions => {
      const newReactions = { ...currentReactions };
      const userList = newReactions[emoji] || [];

      if (userList.includes(currentUserId)) {
        newReactions[emoji] = userList.filter(id => id !== currentUserId);
        if (newReactions[emoji].length === 0) {
          delete newReactions[emoji];
        }
      } else {
        newReactions[emoji] = [...userList, currentUserId];
      }
      return newReactions;
    });
    setShowReactionPopup(false);
  };

  const handleShare = () => {
    const entryUrl = `${window.location.href.split('#')[0]}#entry-${entry.id}`;
    navigator.clipboard.writeText(entryUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleImageClick = (index: number) => {
    setGalleryInitialIndex(index);
    setIsGalleryOpen(true);
  };

  const contentToShow = isExpanded || entry.content.length < 150 ? entry.content : `${entry.content.substring(0, 150)}...`;

  const totalReactions = Object.values(reactions).reduce((sum: number, users) => sum + (users as number[]).length, 0);
  const reactionEmojis = ['👍', '❤️', '🎉', '💡', '🤔'];

  const allAttachments = useMemo(() => {
    const attachments = [...(entry.attachments || [])];
    if (entry.documentUrl && !attachments.some(att => att.url === entry.documentUrl)) {
      attachments.unshift({
        name: entry.documentUrl.split('/').pop()?.replace(/-/g, ' ') || 'Document',
        url: entry.documentUrl,
        type: 'application/pdf'
      });
    }
    return attachments;
  }, [entry.attachments, entry.documentUrl]);

  const galleryItems = useMemo(() => {
    return allAttachments
      .filter(a => a.type.startsWith('image/'))
      .map(attachment => ({
        url: attachment.url,
        name: attachment.name,
        author: author.name,
        date: formatDate(entry.timestamp),
        type: 'image' as const,
      }));
  }, [allAttachments, author, entry.timestamp]);

  const sortedComments = useMemo(() => {
    if (!entry.comments) return [];
    return [...entry.comments].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [entry.comments]);

  const COMMENT_PREVIEW_COUNT = 2;
  const visibleComments = sortedComments.slice(-COMMENT_PREVIEW_COUNT);

  const FILE_TYPE_CHIPS = ['Documents', 'Video', 'Images', 'Reports', 'Design Assets', 'Code / Technical Files', 'Miscellaneous'];
  const fileTypeChip = useMemo(() => entry.chips?.find(chip => FILE_TYPE_CHIPS.includes(chip)), [entry.chips]);

  const renderFileContent = () => {
    const isMediaEntry = ['Files', 'Image', 'Video'].includes(entry.type);
    if (!isMediaEntry && !fileTypeChip) return null;

    const typeToUse = fileTypeChip || (entry.type === 'Files' ? 'Miscellaneous' : entry.type);

    if (typeToUse === 'Images' || entry.type === 'Image') {
      const imageAttachments = allAttachments.filter(a => a.type.startsWith('image/'));
      if (imageAttachments.length === 0) return null;
      return (
        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-dark-elevated mt-4">
          {renderImageGrid(imageAttachments, handleImageClick)}
        </div>
      );
    }

    if (typeToUse === 'Video' || entry.type === 'Video') {
      const videoAttachment = allAttachments.find(a => a.type.startsWith('video/'));
      if (!videoAttachment) return null;
      return (
        <div className="mt-4 rounded-lg overflow-hidden border border-gray-200 dark:border-dark-elevated">
          <video
            key={videoAttachment.url}
            src={videoAttachment.url}
            controls
            className="w-full aspect-video bg-black"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    const fileAttachments = allAttachments.filter(a => !a.type.startsWith('image/') && !a.type.startsWith('video/'));
    const safeAttachments = (typeToUse === 'Miscellaneous' || typeToUse === 'Files') ? allAttachments : fileAttachments;

    if (safeAttachments.length === 0) return null;
    return (
      <div className="mt-4 border-t border-gray-100 dark:border-dark-elevated pt-3 space-y-2">
        {safeAttachments.map((file, index) => (
          <a href={file.url} key={index} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 bg-gray-50 dark:bg-dark-elevated rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
            <Icon name="files" className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" />
            <span className="text-sm text-primary font-medium truncate group-hover:underline">{file.name}</span>
          </a>
        ))}
      </div>
    );
  };


  return (
    <>
      <div className="bg-white dark:bg-dark-card p-5 rounded-lg border border-gray-200 dark:border-dark-elevated shadow-sm transition-shadow hover:shadow-md flex flex-col">
        <div className="flex items-start space-x-4">
          {author.avatarUrl ? (
            <img src={author.avatarUrl} alt={author.name} className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">{author.initials}</div>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{author.name}</span>
              <span>created a</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${entryDetails.color}`}>
                <Icon name={entryDetails.icon} className="w-4 h-4 mr-1.5" />
                {entry.type}
              </span>
              {track && <span>in</span>}
              {track && <span className="font-semibold text-primary cursor-pointer hover:underline">{track.name}</span>}
              <span className="flex-shrink-0 ml-auto">{formatDate(entry.timestamp)}</span>
            </div>

            <div className="mt-3 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              <p>{contentToShow}</p>
              {entry.content.length > 150 && (
                <button onClick={() => setIsExpanded(!isExpanded)} className="text-primary font-semibold mt-2 text-sm">
                  {isExpanded ? 'Show Less' : 'Show More'}
                </button>
              )}
            </div>

            {entry.chips && entry.chips.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {entry.chips.map(chip => (
                  <span key={chip} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-dark-elevated text-gray-800 dark:text-gray-300">
                    {chip}
                  </span>
                ))}
              </div>
            )}

            {renderFileContent()}
          </div>
        </div>

        {!!totalReactions && (
          <div className="flex items-center mt-3 pt-3 border-t border-gray-100 dark:border-dark-elevated text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-dark-elevated rounded-full pr-2">
              {(Object.entries(reactions) as [string, number[]][]).sort(([, a], [, b]) => b.length - a.length).slice(0, 3).map(([emoji]) => (
                <span key={emoji} className="text-lg p-0.5">{emoji}</span>
              ))}
              <span className="ml-1 text-xs font-semibold">{totalReactions}</span>
            </div>
          </div>
        )}

        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-dark-elevated flex justify-around items-center">
          <div ref={reactionButtonRef} className="relative flex-1">
            <button
              onClick={() => setShowReactionPopup(!showReactionPopup)}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary font-semibold py-2 px-3 rounded-md transition-colors w-full justify-center"
            >
              <Icon name="like" className="w-5 h-5" />
              <span>Like</span>
            </button>
            {showReactionPopup && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-dark-popup p-2 rounded-full shadow-lg border border-gray-200 dark:border-dark-elevated flex items-center gap-2 z-10">
                {reactionEmojis.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="text-2xl hover:scale-125 transition-transform"
                    aria-label={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1">
            <button
              onClick={() => onAddComment && setIsCommentModalOpen(true)}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary font-semibold py-2 px-3 rounded-md transition-colors w-full justify-center"
            >
              <Icon name="comment" className="w-5 h-5" />
              <span>Comment</span>
              {entry.comments && !!entry.comments.length && (
                <span className="text-xs font-bold ml-1 text-gray-500 dark:text-gray-400">({entry.comments.length})</span>
              )}
            </button>
          </div>

          <div className="relative flex-1">
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-primary font-semibold py-2 px-3 rounded-md transition-colors w-full justify-center"
            >
              <Icon name="share" className="w-5 h-5" />
              <span>Share</span>
            </button>
            {copied && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs font-semibold py-1 px-3 rounded-md">
                Link Copied!
              </div>
            )}
          </div>
        </div>

        {visibleComments.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-dark-elevated space-y-3">
            {sortedComments.length > COMMENT_PREVIEW_COUNT && (
              <button
                onClick={() => onAddComment && setIsCommentModalOpen(true)}
                className="text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-primary px-3"
              >
                View all {sortedComments.length} comments
              </button>
            )}
            {visibleComments.map(comment => {
              const commentAuthor = users.find(u => u.id === comment.authorId);
              if (!commentAuthor) return null;
              return (
                <div key={comment.id} className="flex items-start space-x-3 text-sm px-3">
                  {commentAuthor.avatarUrl ? (
                    <img src={commentAuthor.avatarUrl} alt={commentAuthor.name} className="w-8 h-8 rounded-full mt-1" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-1">{commentAuthor.initials}</div>
                  )}
                  <div className="flex-1 bg-gray-50 dark:bg-dark-elevated rounded-lg px-3 py-2">
                    <span className="font-semibold text-gray-800 dark:text-white">{commentAuthor.name}</span>
                    <p className="text-gray-600 dark:text-gray-300">{comment.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
      {isCommentModalOpen && onAddComment && (
        <CommentModal entry={entry} onClose={() => setIsCommentModalOpen(false)} onAddComment={onAddComment} users={users} tracks={tracks} />
      )}
      {isGalleryOpen && galleryItems.length > 0 && (
        <ImageGalleryModal
          items={galleryItems}
          initialIndex={galleryInitialIndex}
          onExit={() => setIsGalleryOpen(false)}
        />
      )}
    </>
  );
};

export default EntryItem;
