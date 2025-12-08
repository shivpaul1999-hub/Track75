

export enum EntryType {
  OPPORTUNITY = 'Opportunity',
  TASK = 'Task',
  COMMENT = 'Comment',
  FILES = 'Files',
  ROADMAP_UPDATE = 'Roadmap Update',
  CLIENT_UPDATE = 'Client Update',
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
}

export interface Client {
  id: number;
  name: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  organizationId: number;
  trackIds?: number[];
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
}

export type TrackPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Track {
  id: number;
  name:string;
  clientName?: string;
  clientId?: number;
  lifecycle: TrackLifecycle;
  progress: number; // 0-100
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

export type View = 'FEED' | 'TRACKS' | 'TRACK_DETAIL' | 'USERS' | 'USER_DETAIL' | 'DASHBOARD' | 'SETTINGS' | 'TRACK_REVIEW' | 'ORGANIZATIONS' | 'KANBAN' | 'CLIENTS' | 'CLIENT_DETAIL';
