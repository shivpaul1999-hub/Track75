
import { 
  MOCK_USERS, 
  MOCK_TRACKS, 
  MOCK_FEED_ENTRIES, 
  MOCK_ORGANIZATIONS, 
  MOCK_CLIENTS 
} from '../mockData';
import { User, Track, FeedEntry, Organization, Client, UserRole, UserStatus } from '../types';

// In-memory "Database" seeded with mock data
let dbUsers = [...MOCK_USERS];
let dbTracks = [...MOCK_TRACKS];
let dbFeedEntries = [...MOCK_FEED_ENTRIES];
let dbOrganizations = [...MOCK_ORGANIZATIONS];
let dbClients = [...MOCK_CLIENTS];

// Helper to parse ID from URL (e.g. /users/1 -> 1)
const getIdFromUrl = (url: string): number | null => {
  const parts = url.split('/');
  const lastPart = parts[parts.length - 1];
  const id = parseInt(lastPart, 10);
  return isNaN(id) ? null : id;
};

// Router
export async function handleMockRequest<T>(url: string, method: string, body?: BodyInit | null): Promise<T> {
  const parsedBody = body ? JSON.parse(body as string) : null;

  // --- AUTH ---
  if (url === '/auth/login' && method === 'POST') {
    const { email, password } = parsedBody;
    const user = dbUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    // For mock purposes, accept any password if user exists, or specific test users
    if (!user) throw new Error('Invalid credentials');
    
    const token = `mock-jwt-token-${user.id}-${Date.now()}`;
    return { token, user } as unknown as T;
  }

  if (url === '/auth/register' && method === 'POST') {
    const { name, email, password } = parsedBody;
    if (dbUsers.find(u => u.email === email)) throw new Error('User already exists');
    
    const newUser: User = {
      id: Math.floor(Math.random() * 10000) + 100,
      name,
      email,
      role: UserRole.MEMBER,
      status: UserStatus.ACTIVE,
      organizationId: 1, // Default org
      initials: name.substring(0, 2).toUpperCase(),
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    };
    dbUsers.push(newUser);
    const token = `mock-jwt-token-${newUser.id}-${Date.now()}`;
    return { token, user: newUser } as unknown as T;
  }

  if (url === '/auth/me' && method === 'GET') {
    // In a real app, we decode the token header. Here we assume the first user or based on token structure
    // For simplicity, return the first user (Super Admin) if no specific logic
    // Or we could parse the ID from our mock token `mock-jwt-token-{ID}-{DATE}`
    const token = localStorage.getItem('authToken');
    if (token && token.startsWith('mock-jwt-token-')) {
        const parts = token.split('-');
        const userId = parseInt(parts[3]);
        const user = dbUsers.find(u => u.id === userId);
        if (user) return user as unknown as T;
    }
    
    // Fallback
    return dbUsers[0] as unknown as T; 
  }

  // --- USERS ---
  if (url === '/users' && method === 'GET') return dbUsers as unknown as T;
  if (url === '/users' && method === 'POST') {
    const newUser = { ...parsedBody, id: Date.now() };
    dbUsers.unshift(newUser);
    return newUser as unknown as T;
  }
  if (url.match(/\/users\/\d+/) && method === 'PUT') {
    const id = getIdFromUrl(url);
    const index = dbUsers.findIndex(u => u.id === id);
    if (index > -1) {
      dbUsers[index] = { ...dbUsers[index], ...parsedBody };
      return dbUsers[index] as unknown as T;
    }
  }
  if (url.match(/\/users\/\d+/) && method === 'DELETE') {
    const id = getIdFromUrl(url);
    dbUsers = dbUsers.filter(u => u.id !== id);
    return {} as unknown as T;
  }

  // --- TRACKS ---
  if (url === '/tracks' && method === 'GET') return dbTracks as unknown as T;
  if (url === '/tracks' && method === 'POST') {
    const newTrack = { ...parsedBody, id: Date.now() };
    dbTracks.unshift(newTrack);
    return newTrack as unknown as T;
  }
  if (url.match(/\/tracks\/\d+/) && method === 'PUT') {
    const id = getIdFromUrl(url);
    const index = dbTracks.findIndex(t => t.id === id);
    if (index > -1) {
      dbTracks[index] = { ...dbTracks[index], ...parsedBody };
      return dbTracks[index] as unknown as T;
    }
  }
  if (url.match(/\/tracks\/\d+/) && method === 'DELETE') {
    const id = getIdFromUrl(url);
    dbTracks = dbTracks.filter(t => t.id !== id);
    return {} as unknown as T;
  }

  // --- FEED ---
  if (url === '/feed_entries' && method === 'GET') return dbFeedEntries as unknown as T;
  if (url === '/feed_entries' && method === 'POST') {
    const newEntry = { ...parsedBody, id: Date.now() };
    dbFeedEntries.unshift(newEntry);
    return newEntry as unknown as T;
  }
  if (url.match(/\/feed_entries\/\d+/) && method === 'PUT') {
    const id = getIdFromUrl(url);
    const index = dbFeedEntries.findIndex(e => e.id === id);
    if (index > -1) {
      dbFeedEntries[index] = { ...dbFeedEntries[index], ...parsedBody };
      return dbFeedEntries[index] as unknown as T;
    }
  }
  if (url.match(/\/feed_entries\/\d+/) && method === 'DELETE') {
    const id = getIdFromUrl(url);
    dbFeedEntries = dbFeedEntries.filter(e => e.id !== id);
    return {} as unknown as T;
  }

  // --- ORGANIZATIONS ---
  if (url === '/organizations' && method === 'GET') return dbOrganizations as unknown as T;
  if (url === '/organizations' && method === 'POST') {
    const newOrg = { ...parsedBody, id: Date.now() };
    dbOrganizations.push(newOrg);
    return newOrg as unknown as T;
  }
  if (url.match(/\/organizations\/\d+/) && method === 'PUT') {
    const id = getIdFromUrl(url);
    const index = dbOrganizations.findIndex(o => o.id === id);
    if (index > -1) {
      dbOrganizations[index] = { ...dbOrganizations[index], ...parsedBody };
      return dbOrganizations[index] as unknown as T;
    }
  }

  // --- CLIENTS ---
  if (url === '/clients' && method === 'GET') return dbClients as unknown as T;
  if (url === '/clients' && method === 'POST') {
    const newClient = { ...parsedBody, id: Date.now() };
    dbClients.push(newClient);
    return newClient as unknown as T;
  }
  if (url.match(/\/clients\/\d+/) && method === 'PUT') {
    const id = getIdFromUrl(url);
    const index = dbClients.findIndex(c => c.id === id);
    if (index > -1) {
      dbClients[index] = { ...dbClients[index], ...parsedBody };
      return dbClients[index] as unknown as T;
    }
  }
  if (url.match(/\/clients\/\d+/) && method === 'DELETE') {
    const id = getIdFromUrl(url);
    dbClients = dbClients.filter(c => c.id !== id);
    return {} as unknown as T;
  }

  throw new Error(`Mock endpoint not found: ${method} ${url}`);
}
