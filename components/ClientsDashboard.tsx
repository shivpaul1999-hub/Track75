
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Client, Track, View } from '../types';
import Icon from './Icon';
import AddClientModal from './AddClientModal';
import DeleteClientConfirmationModal from './DeleteClientConfirmationModal';
import { getClients, createClient, deleteClient } from '../api/clientsApi';
import { getTracks } from '../api/tracksApi';

const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void; }> = ({ children, className, onClick }) => (
  <div className={`bg-white p-6 rounded-lg border border-gray-200 shadow-sm ${className}`} onClick={onClick}>
    {children}
  </div>
);

interface ClientsDashboardProps {
    onNavigate: (view: View, id?: number) => void;
}

const ClientsDashboard: React.FC<ClientsDashboardProps> = ({ onNavigate }) => {
    const [clients, setClients] = useState<Client[]>([]);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);

    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [deletingClient, setDeletingClient] = useState<Client | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [fetchedClients, fetchedTracks] = await Promise.all([
                    getClients(),
                    getTracks()
                ]);
                setClients(fetchedClients);
                setTracks(fetchedTracks);
            } catch (error) {
                console.error("Error fetching clients data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    
    const filteredClients = useMemo(() => {
        return clients
            .filter(client => client.name.toLowerCase().includes(searchTerm.toLowerCase()) || client.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [clients, searchTerm]);

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

    const handleAddClient = async (clientData: Omit<Client, 'id' | 'trackIds' | 'organizationId'>) => {
        try {
            // Assuming organizationId is handled by backend or we use a default. 
            // In a real app we'd pass currentUser.organizationId. 
            // Here mock service assigns Org 1 or we need to pass it.
            // Let's assume organizationId 1 for simplicity if not available, or update the API signature.
            // Ideally onSave in AddClientModal should not require us to add organizationId manually if API handles it,
            // but for MockService we might need to.
            // Let's just pass organizationId: 1 for now or rely on mock service defaults.
            const newClient = await createClient({ ...clientData, organizationId: 1, trackIds: [] });
            setClients(prev => [...prev, newClient]);
            setIsAddModalOpen(false);
        } catch (error) {
            console.error("Failed to create client", error);
        }
    };

    const handleDeleteClient = async () => {
        if (!deletingClient) return;
        try {
            await deleteClient(deletingClient.id);
            setClients(prev => prev.filter(c => c.id !== deletingClient.id));
            setDeletingClient(null);
        } catch (error) {
            console.error("Failed to delete client", error);
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
                <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center justify-center px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-hover transition-colors font-semibold shadow-sm"
                >
                    <Icon name="plus" className="w-5 h-5 mr-2" />
                    Add Client
                </button>
            </div>
            {clients.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <h1 className="text-2xl font-bold text-gray-700">No Clients Found.</h1>
                    <p className="text-gray-500 mt-2">Create a new client to get started.</p>
                    <button onClick={() => setIsAddModalOpen(true)} className="mt-6 flex items-center justify-center px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-hover transition-colors font-semibold shadow-sm mx-auto">
                        <Icon name="plus" className="w-5 h-5 mr-2" />
                        Add Client
                    </button>
                </div>
            ) : (
                <Card>
                    <div className="mb-4">
                        <div className="relative">
                            <input type="text" placeholder="Search clients..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-72 pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-focus focus:border-primary" />
                            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracks</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredClients.map(client => {
                                    const trackCount = tracks.filter(p => p.clientId === client.id).length;
                                    return (
                                        <tr key={client.id} className="hover:bg-gray-50 group">
                                            <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => onNavigate('CLIENT_DETAIL', client.id)}>
                                                <div className="text-sm font-medium text-gray-900 group-hover:text-primary">{client.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => onNavigate('CLIENT_DETAIL', client.id)}>
                                                <div className="text-sm text-gray-800">{client.contactPerson}</div>
                                                <div className="text-sm text-gray-500">{client.contactEmail}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trackCount}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="relative inline-block text-left" ref={openMenuId === client.id ? menuRef : null}>
                                                    <button onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === client.id ? null : client.id); }} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                                                        <Icon name="dots-vertical" className="w-5 h-5" />
                                                    </button>
                                                    {openMenuId === client.id && (
                                                        <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                                            <div className="py-1" role="menu" aria-orientation="vertical">
                                                                <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('CLIENT_DETAIL', client.id); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">View Details</a>
                                                                <a href="#" onClick={(e) => { e.preventDefault(); setDeletingClient(client); setOpenMenuId(null); }} className="block px-4 py-2 text-sm text-red-700 hover:bg-red-50" role="menuitem">Delete</a>
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
            )}
            
            {isAddModalOpen && <AddClientModal onClose={() => setIsAddModalOpen(false)} onSave={handleAddClient} />}
            {deletingClient && <DeleteClientConfirmationModal client={deletingClient} onCancel={() => setDeletingClient(null)} onConfirm={handleDeleteClient} />}
        </>
    );
};

export default ClientsDashboard;
