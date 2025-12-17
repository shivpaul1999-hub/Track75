
import React, { useState, useMemo, useEffect } from 'react';
import { Client, Track, TrackLifecycle, View, FeedEntry, EntryType, User } from '../types';
import Icon from './Icon';
import EntryItem from './FeedItem';
import { getClients } from '../api/clientsApi';
import { getTracks } from '../api/tracksApi';
import { getFeedEntries, updateFeedEntry } from '../api/feedApi';
import { getUsers } from '../api/usersApi';

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-white p-6 rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);

interface ClientDetailPageProps {
  clientId: number;
  onNavigate: (view: View, id?: number) => void;
  currentUser: User;
}

const getLifecycleColor = (lifecycle: TrackLifecycle) => {
    switch (lifecycle) {
      case TrackLifecycle.OPEN: return 'bg-blue-100 text-blue-800';
      case TrackLifecycle.CLOSED: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
};

const formatRelativeTime = (dateString?: string) => {
    if(!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
};

const ClientDetailPage: React.FC<ClientDetailPageProps> = ({ clientId, onNavigate, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'TRACKS' | 'NOTES' | 'ACTIVITY'>('TRACKS');
  const [searchTerm, setSearchTerm] = useState('');
  const [lifecycleFilter, setLifecycleFilter] = useState<TrackLifecycle | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [client, setClient] = useState<Client | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [feedEntries, setFeedEntries] = useState<FeedEntry[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
      const fetchData = async () => {
          try {
              setLoading(true);
              const [allClients, allTracks, allEntries, allUsers] = await Promise.all([
                  getClients(),
                  getTracks(),
                  getFeedEntries(),
                  getUsers()
              ]);
              const foundClient = allClients.find(c => c.id === clientId) || null;
              setClient(foundClient);
              setTracks(allTracks);
              setFeedEntries(allEntries);
              setUsers(allUsers);
          } catch (error) {
              console.error("Error loading client data", error);
          } finally {
              setLoading(false);
          }
      };
      fetchData();
  }, [clientId]);

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

  const clientTracks = useMemo(() => tracks.filter(p => p.clientId === clientId), [tracks, clientId]);

  const tracksWithLastUpdate = useMemo(() => {
    return clientTracks.map(track => {
      const trackEntries = feedEntries.filter(e => e.trackId === track.id);
      if (trackEntries.length === 0) {
        return { ...track, lastUpdate: track.startDate };
      }
      const lastEntry = trackEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      return { ...track, lastUpdate: lastEntry.timestamp };
    });
  }, [clientTracks, feedEntries]);

  const filteredTracks = useMemo(() => {
    return tracksWithLastUpdate
      .filter(p => lifecycleFilter === 'ALL' || p.lifecycle === lifecycleFilter)
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [tracksWithLastUpdate, lifecycleFilter, searchTerm]);

  const paginatedTracks = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTracks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredTracks, currentPage]);

  const totalPages = Math.ceil(filteredTracks.length / ITEMS_PER_PAGE);

  const noteEntries = useMemo(() => {
    const clientTrackIds = new Set(clientTracks.map(p => p.id));
    const noteTypes = [EntryType.MEETING_NOTES, EntryType.QUICK_NOTE, EntryType.IDEA_BRAINSTORM];
    return feedEntries
        .filter(e => e.trackId && clientTrackIds.has(e.trackId) && noteTypes.includes(e.type as EntryType))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [feedEntries, clientTracks]);

  const activityEntries = useMemo(() => {
    const clientTrackIds = new Set(clientTracks.map(p => p.id));
    return feedEntries
        .filter(e => e.trackId && clientTrackIds.has(e.trackId))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [feedEntries, clientTracks]);
  
  const openTracksCount = useMemo(() => clientTracks.filter(p => p.lifecycle === TrackLifecycle.OPEN).length, [clientTracks]);
  const closedTracksCount = useMemo(() => clientTracks.filter(p => p.lifecycle === TrackLifecycle.CLOSED).length, [clientTracks]);

  if (loading) return <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>;

  if (!client) {
    return (
      <Card>
        <h1 className="text-2xl font-bold">Client not found</h1>
        <button onClick={() => onNavigate('CLIENTS')} className="mt-4 text-primary hover:underline">
          &larr; Back to all clients
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => onNavigate('CLIENTS')} className="flex items-center text-sm text-gray-600 hover:text-primary font-medium">
          <Icon name="chevron-left" className="w-5 h-5 mr-1" />
          Back to Clients
      </button>

      <Card>
        <div className="flex flex-wrap justify-between items-start gap-4 pb-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
            </div>
            <div className="text-sm text-gray-600 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                <div className="flex items-center"><Icon name="profile" className="w-4 h-4 mr-2 text-gray-400"/><strong>Contact:</strong><span className="ml-2">{client.contactPerson}</span></div>
                <div className="flex items-center"><Icon name="comment" className="w-4 h-4 mr-2 text-gray-400"/><strong>Email:</strong><a href={`mailto:${client.contactEmail}`} className="ml-2 text-primary hover:underline truncate">{client.contactEmail}</a></div>
                <div className="flex items-center"><Icon name="users" className="w-4 h-4 mr-2 text-gray-400"/><strong>Phone:</strong><span className="ml-2">{client.contactPhone}</span></div>
            </div>
        </div>
        <div className="border-t border-gray-200 pt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
                <div>
                    <p className="text-sm font-semibold text-gray-600">Total Tracks</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{clientTracks.length}</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-600">Open Tracks</p>
                    <p className="text-3xl font-bold text-primary mt-1">{openTracksCount}</p>
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-600">Closed Tracks</p>
                    <p className="text-3xl font-bold text-gray-500 mt-1">{closedTracksCount}</p>
                </div>
            </div>
        </div>
      </Card>
      
      <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              {(['TRACKS', 'NOTES', 'ACTIVITY'] as const).map(tab => (
                  <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors capitalize ${
                          activeTab === tab
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                      {tab.toLowerCase().replace('_', ' ')}
                  </button>
              ))}
          </nav>
      </div>

      <div className="animate-fade-in">
        {activeTab === 'TRACKS' && (
            <Card>
                <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                    <div className="relative">
                        <input type="text" placeholder="Search tracks..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-focus focus:border-primary" />
                        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700">Status:</label>
                        <select value={lifecycleFilter} onChange={e => setLifecycleFilter(e.target.value as any)} className="border-gray-300 rounded-md shadow-sm text-sm focus:ring-primary focus:border-primary">
                            <option value="ALL">All</option>
                            {Object.values(TrackLifecycle).map(lifecycle => (
                                <option key={lifecycle} value={lifecycle}>{lifecycle}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Track Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Action</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedTracks.map(track => (
                                <tr key={track.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{track.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getLifecycleColor(track.lifecycle)}`}>{track.lifecycle}</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatRelativeTime(track.lastUpdate)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => onNavigate('TRACK_DETAIL', track.id)} className="text-primary hover:text-primary-hover font-semibold">View</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">Previous</button>
                        <span className="text-sm text-gray-700">Page {currentPage} of {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">Next</button>
                    </div>
                )}
            </Card>
        )}
        {activeTab === 'NOTES' && (
            <div className="space-y-4">
                {noteEntries.length > 0 ? noteEntries.map(entry => (
                    <Card key={entry.id}>
                        <p className="text-sm font-semibold text-gray-800">{entry.content.split('\n')[0]}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatRelativeTime(entry.timestamp)}</p>
                    </Card>
                )) : <Card><p className="text-center text-gray-500">No notes found for this client's tracks.</p></Card>}
            </div>
        )}
        {activeTab === 'ACTIVITY' && (
            <div className="space-y-4">
                {activityEntries.length > 0 ? activityEntries.map(entry => (
                    <EntryItem key={entry.id} entry={entry} onAddComment={handleAddComment} users={users} tracks={tracks} />
                )) : <Card><p className="text-center text-gray-500">No activity found for this client's tracks.</p></Card>}
            </div>
        )}
      </div>
    </div>
  );
};

export default ClientDetailPage;
