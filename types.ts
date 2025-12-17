

export enum EntryType {
  OPPORTUNITY = 'Opportunity',
  TASK = 'Task',
  COMMENT = 'Comment',
  FILES = 'Files',
  ROADMAP_UPDATE = 'Roadmap Update',

  META_DATA_TRACK_INFO = 'Meta Data / Track Info',
  MEETING_NOTES = 'Meeting Notes',
  QUICK_NOTE = 'Quick Note',
  URL_LINK = 'URL / Link',
  BUG_ISSUE = 'Bug / Issue',
  IDEA_BRAINSTORM = 'Idea / Brainstorm',
  ANNOUNCEMENT = 'Announcement',
  DEPLOYMENT_RELEASE = 'Deployment / Release',
  APPROVAL_SIGNOFF = 'Approval / Sign-off',
  PRIORITY_TASK = 'Priority Task',
  CHECKLIST_TODO = 'Checklist / To-Do',
  // New Template Specific Types
  GOAL = 'Goal',
  TRANSACTION = 'Transaction',
  LOG = 'Log',
  EVENT = 'Event',
  CONTENT = 'Content',
  CHORE = 'Chore',
  CREATIVE = 'Creative',
  ITEM = 'Item',
  TRIP = 'Trip',
  IMAGE = 'Image',
  VIDEO = 'Video',
}

export enum TrackLifecycle {
  OPEN = 'Open',
  CLOSED = 'Closed',
}

export enum UserRole {
  SUPER_ADMIN = 'Super Admin',
  ORGANIZATION_OWNER = 'Organization Owner',
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  MEMBER = 'Member',
}

export enum UserStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export enum OrganizationStatus {
  ACTIVE = 'Active',
  DEACTIVATED = 'Deactivated',
}

export interface Organization {
  id: number;
  name: string;
  description: string;
  status: OrganizationStatus;
  brandColor?: string; // Hex code
  accentColor?: string; // Hex code
  logoUrl?: string;
  useBranding?: boolean;
  billingContactEmail?: string;
  defaultTemplate?: string;
  subscriptionDetails?: SubscriptionDetails;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  initials: string;
  status: UserStatus;
  organizationId: number;
  themePreference?: 'light' | 'dark';
  notificationPreferences?: NotificationPreferences;
}

export interface NotificationPreferences {
  accountChanges: boolean;
  newTeamMembers: boolean;
  trackUpdates: boolean;
  expiringSubscriptions: boolean;
  deliveryMethod: 'in-app' | 'email' | 'both';
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'open';
  pdfUrl: string;
}

export interface SubscriptionDetails {
  plan: 'Individual' | 'Organization';
  status: 'active' | 'past_due' | 'canceled';
  billingInterval: 'monthly' | 'yearly';
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  nextBillingDate: string;
  paymentMethod: {
    last4: string;
    brand: string;
  };
  invoices: Invoice[];
}

export type TrackPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export enum AccessLevel {
  VIEW = 'view',
  EDIT = 'edit',
}

// ... existing code ...
export enum ShareType {
  USER = 'user',
  ORGANIZATION = 'organization',
  EMAIL = 'email' // For pending invites
}

export interface ShareEntry {
  type: ShareType | 'user' | 'organization'; // Keep string literals for backward compat if needed, or switch to Enum
  id?: number; // Optional for email type
  email?: string; // For email type
  accessLevel: AccessLevel;
}

export interface PendingShare {
  id: number;
  trackId: number;
  email: string;
  accessLevel: AccessLevel;
  invitedBy: number;
  timestamp: string;
}

export interface Track {
  // ... existing fields ...
  id: number;
  name: string;
  lifecycle: TrackLifecycle;
  progress: number;
  description: string;
  collaboratorIds: number[];
  startDate?: string;
  endDate?: string;
  ownerId?: number;
  priority: TrackPriority;
  organizationId: number;
  template?: string;
  customTags?: string[];
  avatarUrl?: string;
  sharedWith?: ShareEntry[];
  // pendingShares is likely stored separately in mock DB, but good to have if we return it
}
export interface Reaction {
  [emoji: string]: number[]; // emoji: list of user IDs
}

export interface Comment {
  id: number;
  authorId: number;
  timestamp: string;
  content: string;
  replies?: Comment[];
}

export interface Notification {
  id: number;
  userId: number;
  type: 'invite' | 'update' | 'system';
  content: string;
  read: boolean;
  timestamp: string;
  actionUrl?: string;
  metadata?: any;
}

export interface FeedEntry {
  id: number;
  authorId: number;
  timestamp: string;
  type: string;
  content: string;
  trackId?: number;
  documentUrl?: string;
  attachments?: { name: string; url: string; type: string }[];
  taskAssigneeId?: number;
  reactions?: Reaction;
  comments?: Comment[];
  visibleToUserIds?: number[];
  chips?: string[];
  dueDate?: string;
  subtasks?: { id: number; text: string; completed: boolean }[];
}

export type View = 'FEED' | 'TRACKS' | 'TRACK_DETAIL' | 'USERS' | 'USER_DETAIL' | 'DASHBOARD' | 'SETTINGS' | 'TRACK_REVIEW' | 'ORGANIZATIONS' | 'KANBAN' | 'BILLING';

