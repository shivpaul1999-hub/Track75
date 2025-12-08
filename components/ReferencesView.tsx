
import React, { useState, useMemo } from 'react';
import { FeedEntry, EntryType, User } from '../types';
import Icon from './Icon';
import ImageGalleryModal from './ImageGalleryModal';

interface ReferencesViewProps {
  entries: FeedEntry[];
  users: User[];
}

const LinkItem: React.FC<{ entry: FeedEntry; users: User[] }> = ({ entry, users }) => {
  const [copied, setCopied] = useState(false);

  const parsed = useMemo(() => {
    const urlMatch = entry.content.match(/(https?:\/\/[^\s]+)/);
    if (!urlMatch) return null;

    const url = urlMatch[0];
    const text = entry.content.replace(url, '').replace(/:$/, '').trim();
    const domain = new URL(url).hostname;
    const author = users.find(u => u.id === entry.authorId);

    return { url, text, domain, author };
  }, [entry.content, entry.authorId, users]);

  if (!parsed) return null;

  const { url, text, domain, author } = parsed;

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
      <img
        src={`https://www.google.com/s2/favicons?sz=32&domain=${domain}`}
        alt="favicon"
        className="w-8 h-8 mr-4 flex-shrink-0"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
        }}
      />
      <div className="w-8 h-8 mr-4 flex-shrink-0 hidden items-center justify-center text-gray-400 bg-gray-100 rounded">
        <Icon name="url-link" className="w-5 h-5" />
      </div>
      <div className="flex-grow min-w-0">
        <p className="font-semibold text-gray-800 text-sm truncate" title={text || domain}>
          {text || domain}
        </p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:underline truncate block">
          {url}
        </a>
        {author && <p className="text-xs text-gray-400 mt-1">Added by {author.name}</p>}
      </div>
      <div className="flex items-center space-x-1 sm:space-x-2 ml-4 flex-shrink-0">
        <a href={url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors" title="Open link">
          <Icon name="url-link" className="w-5 h-5" />
        </a>
        <button onClick={handleCopy} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors" title="Copy link">
          {copied ? <Icon name="task" className="w-5 h-5 text-green-500" /> : <Icon name="copy" className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};

const getFileIcon = (mimeType: string, name: string) => {
    const lowerMime = mimeType.toLowerCase();
    const lowerName = name.toLowerCase();
    if (lowerMime.includes('pdf')) return 'document-text';
    if (lowerMime.includes('spreadsheet') || lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) return 'document-text';
    if (lowerMime.includes('presentation') || lowerName.endsWith('.pptx')) return 'document-text';
    if (lowerMime.includes('word') || lowerName.endsWith('.docx')) return 'document-text';
    if (lowerMime.includes('zip') || lowerMime.includes('archive')) return 'files';
    if (lowerMime.includes('text')) return 'document-text';
    return 'files';
};

const DocumentItem: React.FC<{ file: { name: string; url: string; type: string; authorName: string; } }> = ({ file }) => (
    <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
        <div className="w-10 h-10 mr-4 flex-shrink-0 flex items-center justify-center text-gray-400 bg-gray-100 rounded-lg">
            <Icon name={getFileIcon(file.type, file.name)} className="w-6 h-6" />
        </div>
        <div className="flex-grow min-w-0">
            <a href={file.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-800 text-sm hover:underline truncate block" title={file.name}>
                {file.name}
            </a>
            <p className="text-xs text-gray-500 mt-1">Added by {file.authorName}</p>
        </div>
        <a href={file.url} download={file.name} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors ml-4 flex-shrink-0" title="Download">
            <Icon name="download" className="w-5 h-5" />
        </a>
    </div>
);

const ReferencesView: React.FC<ReferencesViewProps> = ({ entries, users }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);

  const galleryItems = useMemo(() => {
    const items: { url: string; name: string; author: string; date: string; type: 'image' | 'video'; mimeType: string; }[] = [];
    const seenUrls = new Set<string>();

    entries.forEach((entry) => {
      if ((entry.type === EntryType.IMAGE || entry.type === EntryType.VIDEO) && entry.attachments) {
        entry.attachments.forEach((att) => {
          const lowerType = att.type.toLowerCase();
          const lowerName = att.name.toLowerCase();
          const extension = lowerName.split('.').pop() || '';
          
          const isImage = lowerType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension);
          const isVideo = lowerType.startsWith('video/') || ['mp4', 'webm', 'ogg'].includes(extension);

          const finalType = (entry.type === EntryType.VIDEO || isVideo) ? 'video' : 'image';

          if (!seenUrls.has(att.url)) {
            const author = users.find((u) => u.id === entry.authorId);
            const formatDate = (dateString: string) =>
              new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            items.push({
              url: att.url,
              name: att.name,
              author: author?.name || 'Unknown User',
              date: formatDate(entry.timestamp),
              type: finalType,
              mimeType: att.type,
            });
            seenUrls.add(att.url);
          }
        });
      }
    });

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, users]);

  const documentFiles = useMemo(() => {
    const documents: { name: string; url: string; type: string; authorName: string; }[] = [];
    const seenUrls = new Set<string>();

    entries.forEach((entry) => {
      if (entry.type === EntryType.FILES && entry.attachments) {
        entry.attachments.forEach((att) => {
          const lowerType = att.type.toLowerCase();
          const lowerName = att.name.toLowerCase();
          const extension = lowerName.split('.').pop() || '';
          
          const isImage = lowerType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension);
          const isVideo = lowerType.startsWith('video/') || ['mp4', 'webm', 'ogg'].includes(extension);

          if (!isImage && !isVideo && !seenUrls.has(att.url)) {
            const author = users.find((u) => u.id === entry.authorId);
            documents.push({
              name: att.name,
              url: att.url,
              type: att.type,
              authorName: author?.name || 'Unknown User',
            });
            seenUrls.add(att.url);
          }
        });
      }
    });

    return documents;
  }, [entries, users]);

  const linkEntries = useMemo(() => entries.filter((e) => e.type === EntryType.URL_LINK), [entries]);

  const handleGalleryItemClick = (index: number) => {
    setSelectedItemIndex(index);
    setIsLightboxOpen(true);
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No references available.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">Gallery</h3>
        {galleryItems.length > 0 ? (
          <div className="flex space-x-4 p-2 bg-gray-50 rounded-lg border overflow-x-auto auto-hide-scrollbar">
            {galleryItems.map((item, index) => (
              <div
                key={index}
                className="relative h-28 w-40 object-cover rounded-md flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity bg-black"
                onClick={() => handleGalleryItemClick(index)}
              >
                {item.type === 'image' ? (
                  <img
                    src={item.url}
                    alt={item.name}
                    className="h-full w-full object-cover rounded-md"
                  />
                ) : (
                  <>
                    <video
                      src={item.url}
                      className="h-full w-full object-cover rounded-md"
                      muted
                      playsInline
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-md">
                      <Icon name="video-camera" className="w-8 h-8 text-white/80" />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border">
            <p className="text-gray-500 text-sm">No images or videos found in this project's references.</p>
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">Documents &amp; Files</h3>
        {documentFiles.length > 0 ? (
          <div className="space-y-3">
            {documentFiles.map((file, index) => <DocumentItem key={index} file={file} />)}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border">
            <p className="text-gray-500 text-sm">No documents found in this project's references.</p>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">Links</h3>
        {linkEntries.length > 0 ? (
          <div className="space-y-3">{linkEntries.map((entry) => <LinkItem key={entry.id} entry={entry} users={users} />)}</div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border">
            <p className="text-gray-500 text-sm">No links found in this project's references.</p>
          </div>
        )}
      </div>

      {isLightboxOpen &&
        <ImageGalleryModal
            items={galleryItems}
            initialIndex={selectedItemIndex}
            onExit={() => setIsLightboxOpen(false)}
        />
      }
    </div>
  );
};

export default ReferencesView;
