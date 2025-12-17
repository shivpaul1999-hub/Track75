import React, { useState, useMemo } from 'react';
import { FeedEntry, EntryType, User } from '../types';
import Icon from './Icon';
import ImageGalleryModal from './ImageGalleryModal';

interface ReferencesViewProps {
  entries: FeedEntry[];
  users: User[];
}

const ReferencesView: React.FC<ReferencesViewProps> = ({ entries, users }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'All' | 'Images' | 'Documents' | 'Links'>('All');

  // --- Data Processing ---

  const galleryItems = useMemo(() => {
    const items: { url: string; name: string; author: string; date: string; type: 'image' | 'video'; mimeType: string; }[] = [];
    const seenUrls = new Set<string>();

    entries.forEach((entry) => {
      if ((entry.type === EntryType.IMAGE || entry.type === EntryType.VIDEO) && entry.attachments) {
        entry.attachments.forEach((att) => {
          if (!seenUrls.has(att.url)) {
            const author = users?.find((u) => u.id === entry.authorId);
            items.push({
              url: att.url,
              name: att.name,
              author: author?.name || 'Unknown User',
              date: new Date(entry.timestamp).toLocaleDateString(),
              type: (entry.type === EntryType.VIDEO || att.type.startsWith('video/')) ? 'video' : 'image',
              mimeType: att.type,
            });
            seenUrls.add(att.url);
          }
        });
      }
    });
    return items;
  }, [entries, users]);

  const documentFiles = useMemo(() => {
    const documents: { name: string; url: string; type: string; authorName: string; date: string }[] = [];
    const seenUrls = new Set<string>();

    entries.forEach((entry) => {
      if (entry.type === EntryType.FILES && entry.attachments) {
        entry.attachments.forEach((att) => {
          if (!seenUrls.has(att.url)) {
            const author = users?.find((u) => u.id === entry.authorId);
            documents.push({
              name: att.name,
              url: att.url,
              type: att.type,
              authorName: author?.name || 'Unknown User',
              date: new Date(entry.timestamp).toLocaleDateString()
            });
            seenUrls.add(att.url);
          }
        });
      }
    });
    return documents;
  }, [entries, users]);

  const linkEntries = useMemo(() => {
    return entries
      .filter((e) => e.type === EntryType.URL_LINK)
      .map(entry => {
        const urlMatch = entry.content.match(/(https?:\/\/[^\s]+)/);
        const url = urlMatch ? urlMatch[0] : '';
        const text = entry.content.replace(url, '').replace(/:$/, '').trim();
        const domain = url ? new URL(url).hostname : '';
        const author = users?.find(u => u.id === entry.authorId);
        return { ...entry, url, text, domain, author };
      })
      .filter(e => e.url);
  }, [entries, users]);

  // --- Helpers ---

  const handleGalleryItemClick = (index: number) => {
    setSelectedItemIndex(index);
    setIsLightboxOpen(true);
  };

  const getFileIcon = (mimeType: string, name: string) => {
    // Simplified icon logic
    if (name.endsWith('.pdf')) return 'document-text';
    if (name.endsWith('.xls') || name.endsWith('.xlsx')) return 'document-text';
    return 'files';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Ideally show a toast here, but for now we rely on UI feedback
  };

  // --- Rendering ---

  if (entries.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-elevated">
        <Icon name="files" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">No references available.</p>
      </div>
    );
  }

  const showImages = activeTab === 'All' || activeTab === 'Images';
  const showDocs = activeTab === 'All' || activeTab === 'Documents';
  const showLinks = activeTab === 'All' || activeTab === 'Links';

  return (
    <div className="space-y-8">
      {/* Filtering Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-dark-elevated pb-1">
        {['All', 'Images', 'Documents', 'Links'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab
                ? 'text-primary border-b-2 border-primary bg-primary/5 dark:bg-primary/10'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Gallery Section */}
      {showImages && galleryItems.length > 0 && (
        <div className="animate-fade-in">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4 flex items-center">
            <Icon name="photo" className="w-4 h-4 mr-2" /> Images & Videos ({galleryItems.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryItems.map((item, index) => (
              <div key={index} className="group relative aspect-square bg-gray-100 dark:bg-dark-elevated rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-dark-elevated hover:shadow-md transition-all">
                {item.type === 'image' ? (
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <video src={item.url} className="w-full h-full object-cover" muted />
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                  <button
                    onClick={() => handleGalleryItemClick(index)}
                    className="p-2 bg-white/90 rounded-full text-gray-800 hover:text-primary hover:bg-white transition-colors transform hover:scale-110"
                    title="View"
                  >
                    <Icon name="eye" className="w-4 h-4" />
                  </button>
                  <a
                    href={item.url}
                    download={item.name}
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 bg-white/90 rounded-full text-gray-800 hover:text-primary hover:bg-white transition-colors transform hover:scale-110"
                    title="Download"
                  >
                    <Icon name="download" className="w-4 h-4" />
                  </a>
                </div>

                {/* Type Badge */}
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-[10px] uppercase font-bold backdrop-blur-sm">
                  {item.type}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Section */}
      {showDocs && documentFiles.length > 0 && (
        <div className="animate-fade-in">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4 flex items-center">
            <Icon name="files" className="w-4 h-4 mr-2" /> Documents ({documentFiles.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documentFiles.map((file, index) => (
              <div key={index} className="flex flex-col p-4 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-elevated rounded-xl hover:border-primary/50 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Icon name={getFileIcon(file.type, file.name)} className="w-6 h-6" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={file.url} download={file.name} className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-dark-elevated rounded">
                      <Icon name="download" className="w-4 h-4" />
                    </a>
                  </div>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-white text-sm truncate mb-1" title={file.name}>{file.name}</h4>
                <div className="mt-auto pt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{file.authorName}</span>
                  <span>{file.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Links Section */}
      {showLinks && linkEntries.length > 0 && (
        <div className="animate-fade-in">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4 flex items-center">
            <Icon name="link" className="w-4 h-4 mr-2" /> Links ({linkEntries.length})
          </h3>
          <div className="space-y-2">
            {linkEntries.map((link) => (
              <div key={link.id} className="flex items-center p-3 bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-elevated hover:shadow-sm transition-all group">
                <div className="w-8 h-8 rounded bg-gray-100 dark:bg-dark-elevated flex items-center justify-center mr-3 flex-shrink-0">
                  <img
                    src={`https://www.google.com/s2/favicons?sz=32&domain=${link.domain}`}
                    className="w-4 h-4"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
                <div className="flex-grow min-w-0 mr-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">{link.text || link.domain}</h4>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate block">{link.url}</a>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => copyToClipboard(link.url)} className="p-2 text-gray-400 hover:text-primary rounded-full hover:bg-gray-100 dark:hover:bg-dark-elevated" title="Copy">
                    <Icon name="copy" className="w-4 h-4" />
                  </button>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-primary rounded-full hover:bg-gray-100 dark:hover:bg-dark-elevated" title="Open">
                    <Icon name="external-link" className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLightboxOpen && (
        <ImageGalleryModal
          items={galleryItems}
          initialIndex={selectedItemIndex}
          onExit={() => setIsLightboxOpen(false)}
        />
      )}
    </div>
  );
};

export default ReferencesView;
