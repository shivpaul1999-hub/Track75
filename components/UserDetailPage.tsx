
import React, { useMemo, useState, useEffect } from 'react';
import { User, Track, FeedEntry, View, TrackLifecycle } from '../types';
import Icon from './Icon';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { getUsers, createUser, updateUser, deleteUser } from '../api/usersApi';
import { getTracks } from '../api/tracksApi';
import { getFeedEntries } from '../api/feedApi';

const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void; }> = ({ children, className, onClick }) => (
  <div className={`bg-white p-6 rounded-lg border border-gray-200 shadow-sm ${className}`} onClick={onClick}>
    {children}
  </div>
);

const getLifecycleColor = (lifecycle: TrackLifecycle) => {
    switch (lifecycle) {
      case TrackLifecycle.OPEN: return 'bg-blue-100 text-blue-800';
      case TrackLifecycle.CLOSED: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
};

interface UserDetailPageProps {
  userId?: number;
  currentUser: User;
  onNavigate: (view: View, id?: number) => void;
}

const UserDetailPage: React.FC<UserDetailPageProps> = ({ userId, currentUser, onNavigate }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [feedEntries, setFeedEntries] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // User List State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals for Actions
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  useEffect(() => {
      const fetchData = async () => {
          try {
              setLoading(true);
              const [fetchedUsers, fetchedTracks, fetchedEntries] = await Promise.all([
                  getUsers(),
                  getTracks(),
                  getFeedEntries()
              ]);
              setUsers(fetchedUsers);
              setTracks(fetchedTracks);
              setFeedEntries(fetchedEntries);
          } catch (error) {
              console.error("Error loading user data", error);
          } finally {
              setLoading(false);
          }
      };
      fetchData();
  }, []);

  const handleAddUser = async (userData: Omit<User, 'id' | 'initials' | 'organizationId'>) => {
      try {
          const initials = userData.name.substring(0, 2).toUpperCase();
          const newUser = await createUser({ ...userData, initials, organizationId: currentUser.organizationId });
          setUsers([...users, newUser]);
          setIsAddUserModalOpen(false);
      } catch (error) {
          console.error("Failed to create user", error);
      }
  };

  const handleUpdateUser = async (user: User) => {
      try {
          const updated = await updateUser(user.id, user);
          setUsers(users.map(u => u.id === updated.id ? updated : u));
          setEditingUser(null);
      } catch (error) {
          console.error("Failed to update user", error);
      }
  };

  const handleDeleteUser = async () => {
      if (!deletingUser) return;
      try {
          await deleteUser(deletingUser.id);
          setUsers(users.filter(u => u.id !== deletingUser.id));
          setDeletingUser(null);
          if (userId === deletingUser.id) onNavigate('USERS');
      } catch (error) {
          console.error("Failed to delete user", error);
      }
  };

  if (loading) return <div className="flex justify-center h-64 items-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>;

  // --- LIST VIEW ---
  if (!userId) {
      const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return (
          <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Team Members</h1>
                <button
                    onClick={() => setIsAddUserModalOpen(true)}
                    className="flex items-center justify-center px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-hover transition-colors font-semibold shadow-sm"
                >
                    <Icon name="plus" className="w-5 h-5 mr-2" />
                    Add User
                </button>
            </div>
            <Card>
                <div className="mb-4">
                    <div className="relative">
                        <input type="text" placeholder="Search team members..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-72 pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-focus focus:border-primary" />
                        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onNavigate('USER_DETAIL', user.id)}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                {user.avatarUrl ? <img className="h-10 w-10 rounded-full" src={user.avatarUrl} alt="" /> : <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">{user.initials}</div>}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.status}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={(e) => { e.stopPropagation(); setEditingUser(user); }} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                                        <button onClick={(e) => { e.stopPropagation(); setDeletingUser(user); }} className="text-red-600 hover:text-red-900">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
            {isAddUserModalOpen && <AddUserModal onClose={() => setIsAddUserModalOpen(false)} onSave={handleAddUser} />}
            {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleUpdateUser} />}
            {deletingUser && <DeleteConfirmationModal user={deletingUser} onCancel={() => setDeletingUser(null)} onConfirm={handleDeleteUser} />}
          </>
      );
  }

  // --- DETAIL VIEW ---
  const user = users.find(u => u.id === userId);

  const userTracks = tracks
    .filter(t => t.collaboratorIds.includes(userId))
    .sort((a, b) => a.name.localeCompare(b.name));

  const userEntriesCount = feedEntries.filter(p => p.authorId === userId).length;

  if (!user) {
    return (
      <Card>
        <h1 className="text-2xl font-bold">User not found</h1>
        <button onClick={() => onNavigate('USERS')} className="mt-4 text-primary hover:underline">
          &larr; Back to all users
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <button onClick={() => onNavigate('USERS')} className="flex items-center text-sm text-gray-600 hover:text-primary font-medium transition-colors">
            <Icon name="chevron-left" className="w-5 h-5 mr-1" />
            Back to Users
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        <aside className="lg:col-span-1">
            <Card className="flex flex-col items-center text-center">
                <div className="mb-4 relative">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-32 h-32 rounded-full border-4 border-gray-100 object-cover" />
                    ) : (
                        <div className="w-32 h-32 rounded-full bg-primary text-white flex items-center justify-center font-bold text-4xl border-4 border-gray-100">
                            {user.initials}
                        </div>
                    )}
                    <span className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-white ${user.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                </div>

                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <p className="text-sm text-gray-500 font-medium mt-1 mb-2">{user.role}</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.status}
                </span>

                <div className="w-full border-t border-gray-100 my-6"></div>

                <div className="w-full space-y-4 text-left">
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
                        <div className="flex items-center text-sm text-gray-800">
                            <Icon name="comment" className="w-4 h-4 mr-2 text-gray-400" />
                            <a href={`mailto:${user.email}`} className="hover:text-primary transition-colors truncate">{user.email}</a>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Phone Number</label>
                        <div className="flex items-center text-sm text-gray-800">
                            <Icon name="profile" className="w-4 h-4 mr-2 text-gray-400" />
                            <span>{user.phone || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="w-full border-t border-gray-100 my-6"></div>

                <div className="w-full grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p className="text-2xl font-bold text-gray-900">{userTracks.length}</p>
                        <p className="text-xs font-medium text-gray-500 uppercase mt-1">Tracks</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <p className="text-2xl font-bold text-gray-900">{userEntriesCount}</p>
                        <p className="text-xs font-medium text-gray-500 uppercase mt-1">Entries</p>
                    </div>
                </div>
            </Card>
        </aside>

        <main className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Assigned Tracks</h2>
                <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full">{userTracks.length}</span>
            </div>
            
            <Card className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Track Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Action</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {userTracks.length > 0 ? (
                                userTracks.map(track => (
                                    <tr key={track.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className={`w-2 h-2 rounded-full mr-3 ${track.lifecycle === TrackLifecycle.OPEN ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                <span className="text-sm font-medium text-gray-900">{track.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getLifecycleColor(track.lifecycle)}`}>
                                                {track.lifecycle}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {track.ownerId === user.id ? (
                                                <span className="text-amber-600 font-medium flex items-center">
                                                    <Icon name="crown" className="w-3 h-3 mr-1" /> Owner
                                                </span>
                                            ) : (
                                                'Collaborator'
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button 
                                                onClick={() => onNavigate('TRACK_DETAIL', track.id)} 
                                                className="text-primary hover:text-primary-hover font-semibold flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                View <Icon name="chevron-right" className="w-4 h-4 ml-1" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 text-sm">
                                        No tracks assigned to this user.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </main>
      </div>
    </div>
  );
};

export default UserDetailPage;
