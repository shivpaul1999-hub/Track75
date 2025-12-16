
import {
  MOCK_USERS,
  MOCK_TRACKS,
  MOCK_FEED_ENTRIES,
  MOCK_ORGANIZATIONS,
  DEV_ADMIN_INDIVIDUAL,
  DEV_ADMIN_ORG,
  DEV_V75INC_ORG,
  DEV_V75INC_ADMIN
} from '../mockData';
import { TEMPLATE_CONFIG, TEMPLATE_OPTIONS, TEMPLATE_COLORS } from '../constants';
import { User, Track, FeedEntry, Organization, UserRole, UserStatus, OrganizationStatus, TrackLifecycle, EntryType, AccessLevel, Notification } from '../types';

// In-memory "Database" seeded with mock data (initially empty for fresh signups)
let dbUsers: User[] = [...MOCK_USERS];
let dbTracks: Track[] = [...MOCK_TRACKS];
let dbFeedEntries: FeedEntry[] = [...MOCK_FEED_ENTRIES];
let dbOrganizations: Organization[] = [...MOCK_ORGANIZATIONS];
let dbNotifications: any[] = []; // Typed as Notification[] in implementation
let dbPendingShares: { email: string, trackId: number, accessLevel: string }[] = [];

// --- DUMMY DATA GENERATOR ---
const REALISTIC_COMMENTS = [
  "Great progress on this!",
  "Can we discuss this in our next sync?",
  "I've updated the related documentation.",
  "This looks good to me. Approved!",
  "Let's prioritize this for next sprint.",
  "Nice work! The team will love this.",
  "I have some concerns about the timeline.",
  "Could you provide more details here?",
  "This is exactly what we needed.",
  "Perfect execution on this task!",
];

const REALISTIC_TITLES: Record<string, string[]> = {
  "To-Do List / Tasks Tracker": ["Daily standup prep", "Review quarterly goals", "Update project timeline", "Organize workspace", "Schedule team meetings"],
  "Project Management": ["Sprint planning session", "Design review meeting", "Code review backlog", "Stakeholder presentation", "Resource allocation"],
  "CRM / Relationship Tracker": ["Follow up with lead", "Proposal revision needed", "Contract negotiation update", "Client feedback review", "Partnership outreach"],
  "Personal Goals & Habits": ["Morning routine check-in", "Weekly reflection", "Habit streak update", "Goal milestone reached", "New habit started"],
  "Learning & Study Organizer": ["Course module completed", "Study notes review", "Practice quiz results", "Research paper summary", "Learning resource found"],
  "Finance & Budget Tracker": ["Monthly budget review", "Expense categorization", "Investment portfolio check", "Bill payment reminder", "Savings goal update"],
  "Health & Wellness Log": ["Workout completed", "Meal prep for the week", "Sleep quality analysis", "Hydration tracking", "Wellness check-in"],
  "Event & Planning Tracker": ["Venue confirmed", "Guest list finalized", "Catering arrangements", "Schedule published", "Vendor contracts signed"],
  "Content Creation / Social Media": ["Content calendar update", "Post performance analysis", "New content idea", "Engagement metrics review", "Story scheduled"],
  "Home Management": ["Maintenance scheduled", "Grocery list updated", "Home project started", "Bill payment complete", "Cleaning routine done"],
  "Bug / Issue Tracking": ["Critical bug identified", "Fix deployed to staging", "Regression testing done", "Feature request logged", "Release notes prepared"],
  "Creative Projects": ["New design iteration", "Creative brainstorm session", "Artwork completed", "Feedback incorporated", "Project milestone"],
  "Custom Template": ["General update", "Progress report", "Notes added", "Task completed", "New item logged"],
};

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomTimestamp(daysBack: number = 30): string {
  const now = new Date();
  const randomMs = Math.random() * daysBack * 24 * 60 * 60 * 1000;
  return new Date(now.getTime() - randomMs).toISOString();
}

function generateDummyDataForUser(userId: number, orgId: number, userName: string, teamMembers: User[] = []): void {
  const baseTrackId = userId * 1000;
  const baseEntryId = userId * 100000;
  let entryCounter = 0;

  // Include admin in the pool of potential authors
  const potentialAuthors = [userId, ...teamMembers.map(m => m.id)];

  TEMPLATE_OPTIONS.forEach((templateName, templateIndex) => {
    // Generate 2 tracks per template
    for (let trackNum = 0; trackNum < 2; trackNum++) {
      const trackId = baseTrackId + templateIndex * 10 + trackNum;
      const titles = REALISTIC_TITLES[templateName] || REALISTIC_TITLES["Custom Template"];
      const trackName = `${titles[trackNum % titles.length]} - ${templateName.split('/')[0].trim()}`;

      // Track owner is always the requestor (admin) for simplicity, or could be random
      const trackOwnerId = userId;

      const newTrack: Track = {
        id: trackId,
        name: trackName,
        lifecycle: Math.random() > 0.2 ? TrackLifecycle.OPEN : TrackLifecycle.CLOSED,
        progress: getRandomInt(5, 95),
        description: `[Template: ${templateName}]\nAuto-generated track for ${userName}.`,
        collaboratorIds: [userId, ...teamMembers.map(m => m.id)], // Add all team to track for visibility
        startDate: getRandomTimestamp(60),
        endDate: getRandomTimestamp(-30), // Future date
        ownerId: trackOwnerId,
        priority: ["Low", "Medium", "High", "Critical"][getRandomInt(0, 3)] as any,
        organizationId: orgId,
        template: templateName,
        sharedWith: teamMembers.map(m => ({ type: 'user', id: m.id, accessLevel: AccessLevel.EDIT }))
      };
      dbTracks.push(newTrack);

      // Generate 25 entries per track
      const tags = TEMPLATE_CONFIG[templateName] || ['Note'];
      for (let entryNum = 0; entryNum < 25; entryNum++) {
        const entryId = baseEntryId + entryCounter++;
        const tag = tags[getRandomInt(0, tags.length - 1)];
        const title = titles[getRandomInt(0, titles.length - 1)];

        // Random author for entry
        const entryAuthorId = potentialAuthors[getRandomInt(0, potentialAuthors.length - 1)];

        const comments = [];
        const numComments = getRandomInt(0, 5);
        for (let c = 0; c < numComments; c++) {
          // Random author for comment
          const commentAuthorId = potentialAuthors[getRandomInt(0, potentialAuthors.length - 1)];
          comments.push({
            id: Date.now() + c + entryId, // unique enough
            authorId: commentAuthorId,
            timestamp: getRandomTimestamp(7),
            content: REALISTIC_COMMENTS[getRandomInt(0, REALISTIC_COMMENTS.length - 1)],
            replies: []
          });
        }

        const newEntry: FeedEntry = {
          id: entryId,
          authorId: entryAuthorId,
          timestamp: getRandomTimestamp(30),
          type: tag as EntryType,
          content: `${title}: ${tag} entry for ${templateName}. This is auto-generated content with realistic context for testing purposes.`,
          trackId: trackId,
          chips: [tag],
          reactions: Math.random() > 0.7 ? { "👍": [potentialAuthors[getRandomInt(0, potentialAuthors.length - 1)]] } : {},
          comments: comments,
          attachments: []
        };

        // Generate Attachments based on Type
        if (tag === 'Image') {
          const numImages = getRandomInt(3, 5);
          for (let i = 0; i < numImages; i++) {
            newEntry.attachments?.push({
              name: `Design Mockup ${i + 1}.jpg`,
              url: `https://picsum.photos/seed/${entryId + i}/800/600`, // Random consistent image
              type: 'image/jpeg'
            });
          }
        } else if (tag === 'Video') {
          newEntry.attachments?.push({
            name: 'Project Demo.mp4',
            url: 'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4', // Safe dummy video
            type: 'video/mp4'
          });
        } else if (tag === 'Files') {
          const numFiles = getRandomInt(2, 4);
          const fileTypes = ['pdf', 'docx', 'xlsx'];
          for (let i = 0; i < numFiles; i++) {
            const fType = fileTypes[getRandomInt(0, 2)];
            newEntry.attachments?.push({
              name: `Document_${i + 1}_${title.substring(0, 5).replace(/\s+/g, '')}.${fType}`,
              url: '#', // Dummy link
              type: 'application/octet-stream' // Generic
            });
          }
        }

        dbFeedEntries.push(newEntry);
      }
    }
  });
}

// Helper to resolving pending shares on signup
const resolvePendingShares = (newUserEmail: string, newUserId: number, newOrgId: number) => {
  const pending = dbPendingShares.filter(p => p.email.toLowerCase() === newUserEmail.toLowerCase());
  pending.forEach(p => {
    const trackIndex = dbTracks.findIndex(t => t.id === p.trackId);
    if (trackIndex > -1) {
      const track = dbTracks[trackIndex];
      const newShare = { type: 'user', id: newUserId, accessLevel: p.accessLevel };
      const currentShares = track.sharedWith || [];
      if (!currentShares.some(s => s.type === 'user' && s.id === newUserId)) {
        dbTracks[trackIndex] = { ...track, sharedWith: [...currentShares, newShare] as any };
      }
    }
  });
  dbPendingShares = dbPendingShares.filter(p => p.email.toLowerCase() !== newUserEmail.toLowerCase());
};

// Helper to parse ID from URL
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

    // Dev Shortcut: Admin Individual
    if (email === 'admin@example.com') {
      let user = dbUsers.find(u => u.email === 'admin@example.com');
      if (!user) {
        // Create dev org and user
        if (!dbOrganizations.find(o => o.id === DEV_ADMIN_ORG.id)) {
          dbOrganizations.push(DEV_ADMIN_ORG);
        }
        user = { ...DEV_ADMIN_INDIVIDUAL } as User;
        dbUsers.push(user);
        // Generate dummy data
        generateDummyDataForUser(user.id, user.organizationId, user.name);
      }
      const token = `mock-jwt-token-${user.id}-${Date.now()}`;
      return { token, user } as unknown as T;
    }

    // Dev Shortcut: V75INC Org
    if (email === 'admin@v75inc.com') {
      let user = dbUsers.find(u => u.email === 'admin@v75inc.com');
      if (!user) {
        if (!dbOrganizations.find(o => o.id === DEV_V75INC_ORG.id)) {
          dbOrganizations.push({
            ...DEV_V75INC_ORG,
            subscriptionDetails: {
              plan: 'Organization',
              status: 'active',
              billingInterval: 'monthly',
              currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
              currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
              nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
              paymentMethod: {
                brand: 'Visa',
                last4: '4242'
              },
              invoices: [
                {
                  id: 'inv_mock_1',
                  date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
                  amount: 9999,
                  status: 'paid',
                  pdfUrl: '#'
                },
                {
                  id: 'inv_mock_2',
                  date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                  amount: 9999,
                  status: 'paid',
                  pdfUrl: '#'
                }
              ]
            }
          });
        }

        // Create Admin
        user = { ...DEV_V75INC_ADMIN } as User;
        dbUsers.push(user);

        // Generate Team Members
        const teamMembers: User[] = [];
        for (let i = 1; i <= 10; i++) {
          const teamMember: User = {
            id: DEV_V75INC_ORG.id * 100 + i, // 900201...
            name: `Team Member ${i}`,
            email: `member${i}@v75inc.com`,
            role: UserRole.MEMBER,
            status: UserStatus.ACTIVE,
            initials: `TM${i}`,
            organizationId: DEV_V75INC_ORG.id,
            avatarUrl: `https://ui-avatars.com/api/?name=Team+Member+${i}&background=random`
          };
          dbUsers.push(teamMember);
          teamMembers.push(teamMember);
        }

        // Generate dummy data (with team members)
        generateDummyDataForUser(user.id, user.organizationId, user.name, teamMembers);
      }
      const token = `mock-jwt-token-${user.id}-${Date.now()}`;
      return { token, user } as unknown as T;
    }

    // Regular login
    const user = dbUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error('Invalid credentials');
    const token = `mock-jwt-token-${user.id}-${Date.now()}`;
    return { token, user } as unknown as T;
  }

  if (url === '/auth/register' && method === 'POST') {
    const { name, email, password, organizationName } = parsedBody;
    if (dbUsers.find(u => u.email === email)) throw new Error('User already exists');

    let orgId = Date.now(); // New org for everyone
    let role = UserRole.MEMBER;

    if (organizationName) {
      // Organization Sign Up
      const newOrg: Organization = {
        id: orgId,
        name: organizationName,
        description: 'New Organization',
        status: OrganizationStatus.ACTIVE,
        brandColor: '#0080FE',
        accentColor: '#475569',
        useBranding: false,
        billingContactEmail: email,
        defaultTemplate: 'General',
      };
      dbOrganizations.push(newOrg);
      role = UserRole.ORGANIZATION_OWNER;
    } else {
      // Individual Sign Up - create personal workspace
      const personalOrg: Organization = {
        id: orgId,
        name: `${name}'s Workspace`,
        description: 'Personal workspace',
        status: OrganizationStatus.ACTIVE,
        brandColor: '#0080FE',
        accentColor: '#475569',
        useBranding: false,
      };
      dbOrganizations.push(personalOrg);
      role = UserRole.ORGANIZATION_OWNER;
    }

    const newUser: User = {
      id: Math.floor(Math.random() * 10000) + 100,
      name,
      email,
      role,
      status: UserStatus.ACTIVE,
      organizationId: orgId,
      initials: name.substring(0, 2).toUpperCase(),
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    };
    dbUsers.push(newUser);

    // Check for pending shares
    resolvePendingShares(email, newUser.id, orgId);

    // NO dummy data generation - fresh signup sees empty workspace
    const token = `mock-jwt-token-${newUser.id}-${Date.now()}`;
    return { token, user: newUser } as unknown as T;
  }

  if (url === '/auth/me' && method === 'GET') {
    const token = localStorage.getItem('authToken');
    if (token && token.startsWith('mock-jwt-token-')) {
      const parts = token.split('-');
      const userId = parseInt(parts[3]);
      const user = dbUsers.find(u => u.id === userId);
      if (user) return user as unknown as T;
    }
    throw new Error('Not authenticated');
  }

  // --- USERS ---
  if (url === '/users' && method === 'GET') {
    // Filter by current user's org
    const token = localStorage.getItem('authToken');
    if (token && token.startsWith('mock-jwt-token-')) {
      const parts = token.split('-');
      const userId = parseInt(parts[3]);
      const currentUser = dbUsers.find(u => u.id === userId);
      if (currentUser) {
        return dbUsers.filter(u => u.organizationId === currentUser.organizationId) as unknown as T;
      }
    }
    return [] as unknown as T;
  }
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

  // --- TRACKS (FILTERED BY USER/ORG) ---
  if (url === '/tracks' && method === 'GET') {
    const token = localStorage.getItem('authToken');
    if (token && token.startsWith('mock-jwt-token-')) {
      const parts = token.split('-');
      const userId = parseInt(parts[3]);
      const currentUser = dbUsers.find(u => u.id === userId);
      if (currentUser) {
        // Return tracks user owns OR is shared with
        return dbTracks.filter(t =>
          t.ownerId === currentUser.id ||
          t.organizationId === currentUser.organizationId ||
          t.collaboratorIds?.includes(currentUser.id) ||
          t.sharedWith?.some(s =>
            (s.type === 'user' && s.id === currentUser.id) ||
            (s.type === 'organization' && s.id === currentUser.organizationId)
          )
        ) as unknown as T;
      }
    }
    return [] as unknown as T;
  }
  if (url === '/tracks' && method === 'POST') {
    const newTrack = { ...parsedBody, id: Date.now() };
    dbTracks.unshift(newTrack);
    return newTrack as unknown as T;
  }
  if (url.match(/\/tracks\/\d+/) && method === 'PUT') {
    const id = getIdFromUrl(url);
    const index = dbTracks.findIndex(t => t.id === id);
    if (index > -1) {
      const updatedTrack = { ...dbTracks[index], ...parsedBody };
      if (parsedBody.sharedWith) {
        updatedTrack.sharedWith = parsedBody.sharedWith;
      }
      dbTracks[index] = updatedTrack;
      return dbTracks[index] as unknown as T;
    }
  }
  if (url.match(/\/tracks\/\d+/) && method === 'DELETE') {
    const id = getIdFromUrl(url);
    dbTracks = dbTracks.filter(t => t.id !== id);
    dbFeedEntries = dbFeedEntries.filter(e => e.trackId !== id);
    return {} as unknown as T;
  }

  // --- FEED (FILTERED BY USER'S TRACKS) ---
  if (url === '/feed_entries' && method === 'GET') {
    const token = localStorage.getItem('authToken');
    if (token && token.startsWith('mock-jwt-token-')) {
      const parts = token.split('-');
      const userId = parseInt(parts[3]);
      const currentUser = dbUsers.find(u => u.id === userId);
      if (currentUser) {
        // Get user's track IDs
        const userTrackIds = dbTracks.filter(t =>
          t.ownerId === currentUser.id ||
          t.organizationId === currentUser.organizationId ||
          t.collaboratorIds?.includes(currentUser.id) ||
          t.sharedWith?.some(s =>
            (s.type === 'user' && s.id === currentUser.id) ||
            (s.type === 'organization' && s.id === currentUser.organizationId)
          )
        ).map(t => t.id);
        return dbFeedEntries.filter(e => userTrackIds.includes(e.trackId)) as unknown as T;
      }
    }
    return [] as unknown as T;
  }
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
  if (url === '/organizations' && method === 'GET') {
    const token = localStorage.getItem('authToken');
    if (token && token.startsWith('mock-jwt-token-')) {
      const parts = token.split('-');
      const userId = parseInt(parts[3]);
      const currentUser = dbUsers.find(u => u.id === userId);
      if (currentUser) {
        return dbOrganizations.filter(o => o.id === currentUser.organizationId) as unknown as T;
      }
    }
    return [] as unknown as T;
  }

  if (url.match(/\/organizations\/\d+$/) && method === 'GET') {
    const id = getIdFromUrl(url);
    const org = dbOrganizations.find(o => o.id === id);
    if (org) return org as unknown as T;
    throw new Error('Organization not found');
  }

  if (url === '/organizations' && method === 'POST') {
    const newOrg = { ...parsedBody, id: Date.now() };
    dbOrganizations.push(newOrg);
    return newOrg as unknown as T;
  }
  if (url.match(/\/organizations\/\d+/) && method === 'PUT') {
    const id = getIdFromUrl(url);
    const index = dbOrganizations.findIndex(o => o.id === id);
    if (index > -1) {
      const existingOrg = dbOrganizations[index];
      const updates = parsedBody;

      // If upgrading (detecting name change or explicit upgrade flag if we had one, 
      // but here we just rely on the PUT containing new info typically sent during upgrade)

      // Logic for Upgrade Plan:
      // If we receive subscriptionDetails, we assume it's an upgrade or update to billing.
      let updatedOrg = { ...existingOrg, ...updates };

      if (updates.subscriptionDetails && !existingOrg.subscriptionDetails) {
        // It's a fresh upgrade
        updatedOrg.subscriptionDetails = {
          ...updates.subscriptionDetails,
          status: 'active',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };

        // Generate a mock invoice
        if (!updatedOrg.subscriptionDetails.invoices) {
          updatedOrg.subscriptionDetails.invoices = [];
        }
        updatedOrg.subscriptionDetails.invoices.push({
          id: `inv_${Date.now()}`,
          date: new Date().toISOString(),
          amount: 9999, // $99.99
          status: 'paid',
          pdfUrl: '#'
        });

        // Ensure User is Organization Owner
        // The request doesn't explicitly pass the user ID, but in this mock environment 
        // we might assume the current user (via token) should be upgraded if they are the one acting.
        // However, strict REST would separate this. 
        // Let's rely on the frontend to refresh or the user already being owner of their personal org.
        // By default, a user is OWNER of their personal org (created at signup).
      }

      dbOrganizations[index] = updatedOrg;
      return dbOrganizations[index] as unknown as T;
    }
  }

  // --- NOTIFICATIONS ---
  if (url === '/notifications' && method === 'GET') {
    const token = localStorage.getItem('authToken');
    if (token && token.startsWith('mock-jwt-token-')) {
      const parts = token.split('-');
      const userId = parseInt(parts[3]);
      return dbNotifications.filter(n => n.userId === userId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) as unknown as T;
    }
    return [] as unknown as T;
  }

  if (url.match(/\/notifications\/\d+\/read/) && method === 'PUT') {
    const id = getIdFromUrl(url.replace('/read', ''));
    const index = dbNotifications.findIndex(n => n.id === id);
    if (index > -1) {
      dbNotifications[index] = { ...dbNotifications[index], read: true };
      return dbNotifications[index] as unknown as T;
    }
  }

  // --- META ---
  if (url === '/meta/templates' && method === 'GET') {
    const templates = TEMPLATE_OPTIONS.map((name, index) => ({
      name,
      tags: TEMPLATE_CONFIG[name] || [],
      colors: TEMPLATE_COLORS[index % TEMPLATE_COLORS.length]
    }));
    return templates as unknown as T;
  }

  if (url.match(/\/tracks\/\d+\/invite/) && method === 'POST') {
    const id = getIdFromUrl(url.replace('/invite', ''));
    const { email, accessLevel } = parsedBody;

    const existingUser = dbUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    const trackIndex = dbTracks.findIndex(t => t.id === id);
    if (trackIndex === -1) throw new Error("Track not found");

    const track = dbTracks[trackIndex];

    if (existingUser) {
      // 1. Check if already shared
      const sharedWith = track.sharedWith || [];
      const alreadyShared = sharedWith.find(s => s.type === 'user' && s.id === existingUser.id);

      if (alreadyShared) {
        return { status: 'already_shared', user: existingUser } as unknown as T;
      }

      // 2. Create Invite Notification (Pending)
      dbNotifications.push({
        id: Date.now(),
        userId: existingUser.id,
        type: 'invite',
        content: `You have been invited to collaborate on "${track.name}"`,
        read: false,
        timestamp: new Date().toISOString(),
        // actionUrl: `/tracks/${track.id}`, // Don't give URL yet if we want strictly accept flow, but visibility wise maybe okay.
        // Better to stay consistent with requirement: "Prompt to accept/decline"
        metadata: {
          trackId: track.id,
          role: accessLevel,
          status: 'pending',
          trackName: track.name // useful for UI
        }
      });

      return { status: 'invited_pending_acceptance', user: existingUser } as unknown as T;

    } else {
      // ... non-existing user flow ...
      dbPendingShares.push({ email, trackId: id!, accessLevel });
      console.log(`[Mock Email Service] Sending SIGNUP invite to ${email} for track ${track.name}`);
      return { status: 'invited', email } as unknown as T;
    }
  }

  // --- NOTIFICATIONS ACTIONS ---
  if (url.match(/\/notifications\/\d+\/respond/) && method === 'POST') {
    const id = getIdFromUrl(url.replace('/respond', ''));
    const { action } = parsedBody; // 'accept' | 'decline'

    const notifIndex = dbNotifications.findIndex(n => n.id === id);
    if (notifIndex > -1) {
      const notification = dbNotifications[notifIndex];

      if (notification.type === 'invite' && notification.metadata?.status === 'pending') {
        if (action === 'accept') {
          // Add user to track
          const trackIndex = dbTracks.findIndex(t => t.id === notification.metadata.trackId);
          if (trackIndex > -1) {
            const track = dbTracks[trackIndex];
            const newShare = { type: 'user', id: notification.userId, accessLevel: notification.metadata.role };
            const currentShares = track.sharedWith || [];

            if (!currentShares.some(s => s.type === 'user' && s.id === notification.userId)) {
              dbTracks[trackIndex] = { ...track, sharedWith: [...currentShares, newShare] as any };
            }
          }
          // Update notification
          dbNotifications[notifIndex] = {
            ...notification,
            read: true,
            content: `You accepted the invitation to "${notification.metadata.trackName}"`,
            metadata: { ...notification.metadata, status: 'accepted' },
            actionUrl: `/tracks/${notification.metadata.trackId}` // Now they can click to view
          };
        } else if (action === 'decline') {
          // Update notification
          dbNotifications[notifIndex] = {
            ...notification,
            read: true,
            content: `You declined the invitation to "${notification.metadata.trackName}"`,
            metadata: { ...notification.metadata, status: 'declined' }
          };
        }
      }
      return dbNotifications[notifIndex] as unknown as T;
    }
    throw new Error('Notification not found');
  }

  if (url === '/notifications/mark-all-read' && method === 'PUT') {
    const token = localStorage.getItem('authToken');
    if (token && token.startsWith('mock-jwt-token-')) {
      const parts = token.split('-');
      const userId = parseInt(parts[3]);

      dbNotifications = dbNotifications.map(n => {
        if (n.userId === userId && !n.read) {
          return { ...n, read: true };
        }
        return n;
      });
      return { success: true } as unknown as T;
    }
    throw new Error('Not authenticated');
  }

  throw new Error(`Mock endpoint not found: ${method} ${url}`);
}
