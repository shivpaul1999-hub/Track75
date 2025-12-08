
import React, { useState, useEffect, useRef } from 'react';
import { Organization, OrganizationStatus, Track, User, View } from '../types';
import Icon from './Icon';
import AddOrganizationModal from './AddOrganizationModal';
import EditOrganizationModal from './EditOrganizationModal';
import DeactivateOrganizationModal from './DeactivateOrganizationModal';
import { getOrganizations, createOrganization, updateOrganization } from '../api/organizationsApi';
import { getTracks } from '../api/tracksApi';
import { getUsers } from '../api/usersApi';

interface OrganizationsDashboardProps {
  currentUser: User;
  onNavigate: (view: View, id?: number) => void;
}

const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void; }> = ({ children, className, onClick }) => (
  <div className={`bg-white p-6 rounded-lg border border-gray-200 shadow-sm ${className}`} onClick={onClick}>
    {children}
  </div>
);

const OrganizationsDashboard: React.FC<OrganizationsDashboardProps> = ({ currentUser, onNavigate }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [deactivatingOrg, setDeactivatingOrg] = useState<Organization | null>(null);

  useEffect(() => {
    const fetchData = async () => {
        try {
            setLoading(true);
            const [orgs, trks, usrs] = await Promise.all([
                getOrganizations(),
                getTracks(),
                getUsers()
            ]);
            setOrganizations(orgs);
            setTracks(trks);
            setUsers(usrs);
        } catch (error) {
            console.error("Error fetching organization data", error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAddOrganization = async (orgData: Omit<Organization, 'id'>) => {
      try {
          const newOrg = await createOrganization(orgData);
          setOrganizations(prev => [...prev, newOrg]);
          setIsAddModalOpen(false);
      } catch (error) {
          console.error("Failed to create organization", error);
      }
  };

  const handleEditOrganization = async (org: Organization) => {
      try {
          const updatedOrg = await updateOrganization(org.id, org);
          setOrganizations(prev => prev.map(o => o.id === updatedOrg.id ? updatedOrg : o));
          setEditingOrg(null);
      } catch (error) {
          console.error("Failed to update organization", error);
      }
  };

  const handleDeactivateOrganization = async (org: Organization) => {
      try {
          const updatedOrg = await updateOrganization(org.id, { ...org, status: OrganizationStatus.DEACTIVATED });
          setOrganizations(prev => prev.map(o => o.id === updatedOrg.id ? updatedOrg : o));
          setDeactivatingOrg(null);
      } catch (error) {
          console.error("Failed to deactivate organization", error);
      }
  };

  const handleReactivateOrganization = async (org: Organization) => {
      try {
          const updatedOrg = await updateOrganization(org.id, { ...org, status: OrganizationStatus.ACTIVE });
          setOrganizations(prev => prev.map(o => o.id === updatedOrg.id ? updatedOrg : o));
          setOpenMenuId(null);
      } catch (error) {
          console.error("Failed to reactivate organization", error);
      }
  };

  if (loading) {
      return (
          <div className="flex justify-center items-center h-64">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
      );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Organizations</h1>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-hover transition-colors font-semibold shadow-sm"
        >
          <Icon name="plus" className="w-5 h-5 mr-2" />
          Add Organization
        </button>
      </div>
      <Card>
        <div className="overflow-x-auto pb-10">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tracks</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {organizations.map(org => {
                const trackCount = tracks.filter(p => p.organizationId === org.id).length;
                const userCount = users.filter(u => u.organizationId === org.id).length;
                return (
                  <tr key={org.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => {/* onSelectOrganization(org.id) - Currently no detail view for Org */}}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{org.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-sm truncate" title={org.description}>{org.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{trackCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{userCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${org.status === OrganizationStatus.ACTIVE ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{org.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative inline-block text-left" ref={openMenuId === org.id ? menuRef : null}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === org.id ? null : org.id); }} 
                          className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
                        >
                          <Icon name="dots-vertical" className="w-5 h-5" />
                        </button>
                        {openMenuId === org.id && (
                          <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                            <div className="py-1" role="menu" aria-orientation="vertical">
                              <a href="#" 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingOrg(org); setOpenMenuId(null); }} 
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
                                role="menuitem"
                              >
                                Edit Organization
                              </a>
                              {org.status === OrganizationStatus.ACTIVE && (
                                <a href="#" 
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeactivatingOrg(org); setOpenMenuId(null); }} 
                                  className="block px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50" 
                                  role="menuitem"
                                >
                                  Deactivate Organization
                                </a>
                              )}
                              {org.status === OrganizationStatus.DEACTIVATED && (
                                <a href="#" 
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleReactivateOrganization(org); }} 
                                  className="block px-4 py-2 text-sm text-green-700 hover:bg-green-50" 
                                  role="menuitem"
                                >
                                  Reactivate Organization
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      
      {isAddModalOpen && <AddOrganizationModal onClose={() => setIsAddModalOpen(false)} onSave={handleAddOrganization} />}
      {editingOrg && <EditOrganizationModal organization={editingOrg} onClose={() => setEditingOrg(null)} onSave={handleEditOrganization} />}
      {deactivatingOrg && <DeactivateOrganizationModal organization={deactivatingOrg} onCancel={() => setDeactivatingOrg(null)} onConfirm={() => handleDeactivateOrganization(deactivatingOrg)} />}
    </>
  );
};

export default OrganizationsDashboard;
