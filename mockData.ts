
import { User, Track, FeedEntry, Organization, UserRole, UserStatus, OrganizationStatus, TrackLifecycle, EntryType } from './types';

// --- EMPTY INITIAL DATA ---
// Fresh signups see zero data. Dev shortcuts generate isolated data on-demand.
export const MOCK_ORGANIZATIONS: Organization[] = [];
export const MOCK_USERS: User[] = [];
export const MOCK_TRACKS: Track[] = [];
export const MOCK_FEED_ENTRIES: FeedEntry[] = [];

// --- DEV ACCOUNT DEFINITIONS (used by shortcuts) ---
export const DEV_ADMIN_INDIVIDUAL = {
  id: 9001,
  name: "Admin User",
  email: "admin@example.com",
  role: UserRole.SUPER_ADMIN,
  status: UserStatus.ACTIVE,
  initials: "AU",
  organizationId: 9001,
  avatarUrl: "https://ui-avatars.com/api/?name=Admin+User&background=0080FE&color=fff"
};

export const DEV_ADMIN_ORG: Organization = {
  id: 9001,
  name: "Admin Personal Workspace",
  description: "Personal workspace for admin individual account",
  status: OrganizationStatus.ACTIVE,
  brandColor: '#0080FE',
  accentColor: '#475569',
  useBranding: false,
};

export const DEV_V75INC_ORG: Organization = {
  id: 9002,
  name: "V75INC",
  description: "Demo organization for testing org features",
  status: OrganizationStatus.ACTIVE,
  brandColor: '#7C3AED',
  accentColor: '#475569',
  useBranding: true,
};

export const DEV_V75INC_ADMIN = {
  id: 9002,
  name: "V75 Admin",
  email: "admin@v75inc.com",
  role: UserRole.ORGANIZATION_OWNER,
  status: UserStatus.ACTIVE,
  initials: "VA",
  organizationId: 9002,
  avatarUrl: "https://ui-avatars.com/api/?name=V75+Admin&background=7C3AED&color=fff"
};
