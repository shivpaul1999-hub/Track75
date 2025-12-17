
import { User, Track, FeedEntry, Organization, Client, UserRole, UserStatus, OrganizationStatus, TrackLifecycle, EntryType } from './types';

export const MOCK_ORGANIZATIONS: Organization[] = [
  { id: 1, name: "Acme Corp", description: "Global leader in widgets and innovation", status: OrganizationStatus.ACTIVE },
  { id: 2, name: "Stark Industries", description: "Advanced defense and technology", status: OrganizationStatus.ACTIVE }
];

export const MOCK_CLIENTS: Client[] = [
  { id: 1, name: "Globex Corporation", contactPerson: "Hank Scorpio", contactEmail: "hank@globex.com", contactPhone: "555-0199", organizationId: 1 },
  { id: 2, name: "Soylent Corp", contactPerson: "Richard Wilkins", contactEmail: "richard@soylent.com", contactPhone: "555-0123", organizationId: 1 },
  { id: 3, name: "Massive Dynamic", contactPerson: "Nina Sharp", contactEmail: "nina@massivedynamic.com", contactPhone: "555-0999", organizationId: 1 },
  { id: 4, name: "Umbrella Corp", contactPerson: "Albert Wesker", contactEmail: "albert@umbrella.com", contactPhone: "555-0666", organizationId: 2 }
];

export const MOCK_USERS: User[] = [
  { id: 1, name: "Alex Johnson", email: "alex@acme.com", role: UserRole.SUPER_ADMIN, status: UserStatus.ACTIVE, initials: "AJ", organizationId: 1, avatarUrl: "https://i.pravatar.cc/150?u=1" },
  { id: 2, name: "Sarah Smith", email: "sarah@acme.com", role: UserRole.MANAGER, status: UserStatus.ACTIVE, initials: "SS", organizationId: 1, avatarUrl: "https://i.pravatar.cc/150?u=5" },
  { id: 3, name: "Mike Brown", email: "mike@acme.com", role: UserRole.MEMBER, status: UserStatus.ACTIVE, initials: "MB", organizationId: 1, avatarUrl: "https://i.pravatar.cc/150?u=3" },
  { id: 4, name: "Emily Davis", email: "emily@acme.com", role: UserRole.ADMIN, status: UserStatus.ACTIVE, initials: "ED", organizationId: 1, avatarUrl: "https://i.pravatar.cc/150?u=9" },
  { id: 5, name: "Tony Stark", email: "tony@stark.com", role: UserRole.ADMIN, status: UserStatus.ACTIVE, initials: "TS", organizationId: 2, avatarUrl: "https://i.pravatar.cc/150?u=4" }
];

// 26 Tracks: 2 for each of the 13 templates
export const MOCK_TRACKS: Track[] = [
  // 1. To-Do List / Tasks Tracker
  { id: 1, name: "Office Relocation", clientName: "Internal", clientId: 1, lifecycle: TrackLifecycle.OPEN, progress: 35, description: "[Template: To-Do List / Tasks Tracker]\nCoordinating the move to the new downtown office.", collaboratorIds: [1, 2], startDate: "2024-01-10T00:00:00Z", endDate: "2024-04-01T00:00:00Z", ownerId: 1, priority: "High", organizationId: 1, template: "To-Do List / Tasks Tracker" },
  { id: 2, name: "Q4 Compliance Audit", clientName: "Internal", clientId: 1, lifecycle: TrackLifecycle.OPEN, progress: 15, description: "[Template: To-Do List / Tasks Tracker]\nEnsuring all departments meet new safety regulations.", collaboratorIds: [3], startDate: "2024-09-01T00:00:00Z", endDate: "2024-10-30T00:00:00Z", ownerId: 3, priority: "Medium", organizationId: 1, template: "To-Do List / Tasks Tracker" },

  // 2. Project Management
  { id: 3, name: "Website Redesign v3", clientName: "Globex Corporation", clientId: 1, lifecycle: TrackLifecycle.OPEN, progress: 60, description: "[Template: Project Management]\nComplete overhaul of the corporate website using Next.js.", collaboratorIds: [1, 2, 3], startDate: "2023-11-01T00:00:00Z", endDate: "2024-03-31T00:00:00Z", ownerId: 2, priority: "Critical", organizationId: 1, template: "Project Management" },
  { id: 4, name: "Mobile App Launch", clientName: "Soylent Corp", clientId: 2, lifecycle: TrackLifecycle.OPEN, progress: 85, description: "[Template: Project Management]\nLaunch of the new nutritional tracking app.", collaboratorIds: [2, 4], startDate: "2023-08-15T00:00:00Z", endDate: "2024-02-15T00:00:00Z", ownerId: 2, priority: "High", organizationId: 1, template: "Project Management" },

  // 3. CRM / Relationship Tracker
  { id: 5, name: "Enterprise Sales Pipeline", clientName: "Massive Dynamic", clientId: 3, lifecycle: TrackLifecycle.OPEN, progress: 40, description: "[Template: CRM / Relationship Tracker]\nTracking enterprise leads for Q1 and Q2.", collaboratorIds: [1, 4], startDate: "2024-01-01T00:00:00Z", endDate: "2024-06-30T00:00:00Z", ownerId: 4, priority: "High", organizationId: 1, template: "CRM / Relationship Tracker" },
  { id: 6, name: "Partner Outreach", clientName: "Various", clientId: 3, lifecycle: TrackLifecycle.OPEN, progress: 20, description: "[Template: CRM / Relationship Tracker]\nEstablishing relationships with potential integration partners.", collaboratorIds: [4], startDate: "2024-02-01T00:00:00Z", endDate: "2024-12-31T00:00:00Z", ownerId: 4, priority: "Medium", organizationId: 1, template: "CRM / Relationship Tracker" },

  // 4. Personal Goals & Habits
  { id: 7, name: "Marathon Training", clientName: "Personal", clientId: undefined, lifecycle: TrackLifecycle.OPEN, progress: 50, description: "[Template: Personal Goals & Habits]\nPreparing for the NYC Marathon in November.", collaboratorIds: [1], startDate: "2024-01-01T00:00:00Z", endDate: "2024-11-05T00:00:00Z", ownerId: 1, priority: "High", organizationId: 1, template: "Personal Goals & Habits" },
  { id: 8, name: "Reading List 2024", clientName: "Personal", clientId: undefined, lifecycle: TrackLifecycle.OPEN, progress: 10, description: "[Template: Personal Goals & Habits]\nRead 24 books this year.", collaboratorIds: [2], startDate: "2024-01-01T00:00:00Z", endDate: "2024-12-31T00:00:00Z", ownerId: 2, priority: "Low", organizationId: 1, template: "Personal Goals & Habits" },

  // 5. Learning & Study Organizer
  { id: 9, name: "React Native Mastery", clientName: "Self", clientId: undefined, lifecycle: TrackLifecycle.OPEN, progress: 25, description: "[Template: Learning & Study Organizer]\nCompleting advanced certification for mobile dev.", collaboratorIds: [3], startDate: "2024-03-01T00:00:00Z", endDate: "2024-06-01T00:00:00Z", ownerId: 3, priority: "Medium", organizationId: 1, template: "Learning & Study Organizer" },
  { id: 10, name: "Spanish Language", clientName: "Self", clientId: undefined, lifecycle: TrackLifecycle.OPEN, progress: 5, description: "[Template: Learning & Study Organizer]\nAchieve B2 fluency level.", collaboratorIds: [1], startDate: "2024-01-01T00:00:00Z", endDate: "2025-01-01T00:00:00Z", ownerId: 1, priority: "Low", organizationId: 1, template: "Learning & Study Organizer" },

  // 6. Finance & Budget Tracker
  { id: 11, name: "Q1 Department Budget", clientName: "Internal", clientId: 1, lifecycle: TrackLifecycle.CLOSED, progress: 100, description: "[Template: Finance & Budget Tracker]\nTracking expenses against the Q1 allocation.", collaboratorIds: [1, 2], startDate: "2024-01-01T00:00:00Z", endDate: "2024-03-31T00:00:00Z", ownerId: 1, priority: "Critical", organizationId: 1, template: "Finance & Budget Tracker" },
  { id: 12, name: "Investment Portfolio", clientName: "Personal", clientId: undefined, lifecycle: TrackLifecycle.OPEN, progress: 70, description: "[Template: Finance & Budget Tracker]\nTracking stock and crypto assets.", collaboratorIds: [5], startDate: "2023-01-01T00:00:00Z", endDate: "2025-01-01T00:00:00Z", ownerId: 5, priority: "High", organizationId: 2, template: "Finance & Budget Tracker" },

  // 7. Health & Wellness Log
  { id: 13, name: "Ironman Prep Nutrition", clientName: "Personal", clientId: undefined, lifecycle: TrackLifecycle.OPEN, progress: 80, description: "[Template: Health & Wellness Log]\nMacro tracking and meal planning.", collaboratorIds: [5], startDate: "2024-02-01T00:00:00Z", endDate: "2024-08-01T00:00:00Z", ownerId: 5, priority: "High", organizationId: 2, template: "Health & Wellness Log" },
  { id: 14, name: "Mindfulness Journey", clientName: "Personal", clientId: undefined, lifecycle: TrackLifecycle.OPEN, progress: 30, description: "[Template: Health & Wellness Log]\nDaily meditation and mood logging.", collaboratorIds: [4], startDate: "2024-01-01T00:00:00Z", endDate: "2024-12-31T00:00:00Z", ownerId: 4, priority: "Low", organizationId: 1, template: "Health & Wellness Log" },

  // 8. Event & Planning Tracker
  { id: 15, name: "Annual Tech Conference", clientName: "Acme Corp", clientId: 1, lifecycle: TrackLifecycle.OPEN, progress: 45, description: "[Template: Event & Planning Tracker]\nPlanning the 2024 Innovation Summit.", collaboratorIds: [1, 2, 3, 4], startDate: "2024-05-01T00:00:00Z", endDate: "2024-09-15T00:00:00Z", ownerId: 2, priority: "Critical", organizationId: 1, template: "Event & Planning Tracker" },
  { id: 16, name: "Team Retreat", clientName: "Internal", clientId: 1, lifecycle: TrackLifecycle.OPEN, progress: 10, description: "[Template: Event & Planning Tracker]\nBooking venue and activities for summer retreat.", collaboratorIds: [2], startDate: "2024-06-01T00:00:00Z", endDate: "2024-07-20T00:00:00Z", ownerId: 2, priority: "Medium", organizationId: 1, template: "Event & Planning Tracker" },

  // 9. Content Creation / Social Media
  { id: 17, name: "YouTube Channel Launch", clientName: "Stark Industries", clientId: 4, lifecycle: TrackLifecycle.OPEN, progress: 55, description: "[Template: Content Creation / Social Media]\nVideo production schedule for the new tech vlog.", collaboratorIds: [5], startDate: "2024-03-01T00:00:00Z", endDate: "2024-12-31T00:00:00Z", ownerId: 5, priority: "High", organizationId: 2, template: "Content Creation / Social Media" },
  { id: 18, name: "Company Blog Q2", clientName: "Acme Corp", clientId: 1, lifecycle: TrackLifecycle.OPEN, progress: 25, description: "[Template: Content Creation / Social Media]\nDrafting and scheduling blog posts for Q2.", collaboratorIds: [3], startDate: "2024-04-01T00:00:00Z", endDate: "2024-06-30T00:00:00Z", ownerId: 3, priority: "Medium", organizationId: 1, template: "Content Creation / Social Media" },

  // 10. Home Management
  { id: 19, name: "Kitchen Renovation", clientName: "Personal", clientId: undefined, lifecycle: TrackLifecycle.OPEN, progress: 15, description: "[Template: Home Management]\nContractors, materials, and timeline for kitchen remodel.", collaboratorIds: [1], startDate: "2024-05-01T00:00:00Z", endDate: "2024-08-30T00:00:00Z", ownerId: 1, priority: "High", organizationId: 1, template: "Home Management" },
  { id: 20, name: "Garden Landscaping", clientName: "Personal", clientId: undefined, lifecycle: TrackLifecycle.OPEN, progress: 60, description: "[Template: Home Management]\nSpring planting and hardscaping.", collaboratorIds: [4], startDate: "2024-03-15T00:00:00Z", endDate: "2024-06-01T00:00:00Z", ownerId: 4, priority: "Low", organizationId: 1, template: "Home Management" },

  // 11. Bug / Issue Tracking
  { id: 21, name: "Platform V2 Stability", clientName: "Globex Corporation", clientId: 1, lifecycle: TrackLifecycle.OPEN, progress: 90, description: "[Template: Bug / Issue Tracking]\nResolving critical bugs before V2 release.", collaboratorIds: [2, 3], startDate: "2024-02-01T00:00:00Z", endDate: "2024-04-15T00:00:00Z", ownerId: 3, priority: "Critical", organizationId: 1, template: "Bug / Issue Tracking" },
  { id: 22, name: "Security Audit 2024", clientName: "Internal", clientId: 1, lifecycle: TrackLifecycle.OPEN, progress: 30, description: "[Template: Bug / Issue Tracking]\nTracking vulnerabilities found during annual pentest.", collaboratorIds: [1, 5], startDate: "2024-01-15T00:00:00Z", endDate: "2024-05-30T00:00:00Z", ownerId: 1, priority: "High", organizationId: 1, template: "Bug / Issue Tracking" },

  // 12. Creative Projects
  { id: 23, name: "Sci-Fi Novel Draft", clientName: "Personal", clientId: undefined, lifecycle: TrackLifecycle.OPEN, progress: 10, description: "[Template: Creative Projects]\nWriting first draft of 'The Last Algorithm'.", collaboratorIds: [2], startDate: "2023-01-01T00:00:00Z", endDate: "2025-01-01T00:00:00Z", ownerId: 2, priority: "Low", organizationId: 1, template: "Creative Projects" },
  { id: 24, name: "Digital Art Portfolio", clientName: "Personal", clientId: undefined, lifecycle: TrackLifecycle.OPEN, progress: 75, description: "[Template: Creative Projects]\nCompiling works for online gallery.", collaboratorIds: [3], startDate: "2024-01-01T00:00:00Z", endDate: "2024-06-01T00:00:00Z", ownerId: 3, priority: "Medium", organizationId: 1, template: "Creative Projects" },

  // 13. Custom Template
  { id: 25, name: "Miscellaneous Research", clientName: "Internal", clientId: 1, lifecycle: TrackLifecycle.OPEN, progress: 50, description: "[Template: Custom Template]\nGeneral research tasks.", collaboratorIds: [1, 3], startDate: "2024-01-01T00:00:00Z", endDate: "2024-12-31T00:00:00Z", ownerId: 1, priority: "Low", organizationId: 1, template: "Custom Template" },
  { id: 26, name: "Team Building Ideas", clientName: "Internal", clientId: 1, lifecycle: TrackLifecycle.OPEN, progress: 20, description: "[Template: Custom Template]\nCollection of ideas for team bonding.", collaboratorIds: [2, 4], startDate: "2024-02-01T00:00:00Z", endDate: "2024-05-01T00:00:00Z", ownerId: 4, priority: "Low", organizationId: 1, template: "Custom Template" },
];

// Helper to generate dates relative to now
const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

// 50 Feed Entries distributed across the 26 tracks
export const MOCK_FEED_ENTRIES: FeedEntry[] = [
  // Track 1 (To-Do)
  { id: 1, authorId: 1, timestamp: hoursAgo(2), type: EntryType.TASK, content: "Confirm moving truck reservation.", trackId: 1, chips: ["Priority"], reactions: {}, comments: [] },
  { id: 2, authorId: 2, timestamp: daysAgo(1), type: EntryType.CHECKLIST_TODO, content: "Pack IT equipment:\n- Servers\n- Monitors\n- Cables", trackId: 1, chips: ["Checklist"], reactions: { "👍": [1] }, comments: [] },
  
  // Track 3 (Website Redesign - PM) - Files
  { 
    id: 3, authorId: 2, timestamp: hoursAgo(5), type: EntryType.FILES, content: "Uploaded latest wireframes and design specs.", trackId: 3, 
    chips: ["Design Assets"], 
    attachments: [
      { name: "Homepage_Wireframe_v2.pdf", url: "#", type: "application/pdf" },
      { name: "Style_Guide_2024.pdf", url: "#", type: "application/pdf" },
      { name: "Icon_Set.zip", url: "#", type: "application/zip" }
    ], 
    reactions: { "🔥": [3] }, comments: [] 
  },
  { id: 4, authorId: 3, timestamp: daysAgo(2), type: EntryType.COMMENT, content: "The new navigation structure looks much cleaner.", trackId: 3, chips: [], reactions: {}, comments: [] },

  // Track 17 (YouTube - Content) - Video
  {
    id: 5, authorId: 5, timestamp: hoursAgo(1), type: EntryType.VIDEO, content: "Rough cut of the unboxing video. Please review audio levels.", trackId: 17,
    chips: ["Draft", "Review"],
    attachments: [
      { name: "Unboxing_Edit_v1.mp4", url: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4", type: "video/mp4" }
    ],
    reactions: { "👀": [1] }, comments: []
  },
  
  // Track 24 (Art Portfolio) - Images
  {
    id: 6, authorId: 3, timestamp: daysAgo(3), type: EntryType.IMAGE, content: "Concept art for the 'Neon City' series. Trying a new color palette.", trackId: 24,
    chips: ["Concept Art"],
    attachments: [
      { name: "neon_city_1.png", url: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=800&q=80", type: "image/png" },
      { name: "neon_city_2.png", url: "https://images.unsplash.com/photo-1565626424177-8798cd36e89c?auto=format&fit=crop&w=800&q=80", type: "image/png" },
      { name: "neon_city_3.png", url: "https://images.unsplash.com/photo-1542259681-d262296f63e5?auto=format&fit=crop&w=800&q=80", type: "image/png" },
      { name: "neon_city_4.png", url: "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80", type: "image/png" }
    ],
    reactions: { "❤️": [1, 2, 4] }, comments: []
  },

  // Track 5 (CRM)
  { id: 7, authorId: 4, timestamp: daysAgo(4), type: EntryType.OPPORTUNITY, content: "Meeting with VP of Sales at Massive Dynamic went well. They are interested in the premium tier.", trackId: 5, chips: ["Proposal Sent"], reactions: { "🚀": [1] }, comments: [] },
  { id: 8, authorId: 4, timestamp: daysAgo(6), type: "Contract Signed", content: "Signed NDA. Proceeding to technical discovery.", trackId: 5, chips: [], reactions: {}, comments: [] },

  // Track 11 (Finance) - Files
  { 
    id: 9, authorId: 1, timestamp: daysAgo(10), type: EntryType.FILES, content: "Q1 Final Budget Report attached.", trackId: 11,
    chips: ["Report"], 
    attachments: [
      { name: "Q1_Budget_Final.xlsx", url: "#", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
      { name: "Variance_Analysis.docx", url: "#", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }
    ],
    reactions: {}, comments: [] 
  },

  // Track 21 (Bug Tracking)
  { id: 10, authorId: 2, timestamp: hoursAgo(12), type: EntryType.BUG_ISSUE, content: "Critical: API timeout on large payloads.", trackId: 21, chips: ["Critical", "Backend"], reactions: {}, comments: [] },
  { id: 11, authorId: 3, timestamp: hoursAgo(4), type: "Fixed", content: "Deployed fix for timeout issue to staging.", trackId: 21, chips: ["Release"], reactions: { "👍": [2] }, comments: [] },

  // Track 15 (Event)
  { id: 12, authorId: 2, timestamp: daysAgo(5), type: "Venue", content: "Booked the Grand Ballroom for Sept 15th.", trackId: 15, chips: [], reactions: {}, comments: [] },
  
  // Track 7 (Health)
  { id: 13, authorId: 1, timestamp: hoursAgo(1), type: "Workout", content: "15k run at 5:00/km pace. Felt strong.", trackId: 7, chips: ["Cardio"], reactions: {}, comments: [] },
  
  // Track 9 (Learning) - Video
  { 
    id: 14, authorId: 3, timestamp: daysAgo(2), type: EntryType.VIDEO, content: "Recorded a demo of the new React Native gesture handler.", trackId: 9, 
    chips: ["Demo"],
    attachments: [
      { name: "gesture_demo.mov", url: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4", type: "video/quicktime" }
    ],
    reactions: {}, comments: [] 
  },

  // More mixed entries to reach 50
  { id: 15, authorId: 5, timestamp: daysAgo(1), type: EntryType.IDEA_BRAINSTORM, content: "What if we added AR features to the catalog?", trackId: 4, chips: ["Feature Request"], reactions: {}, comments: [] },
  { id: 16, authorId: 2, timestamp: daysAgo(3), type: EntryType.MEETING_NOTES, content: "Weekly sync: On track for Q2 goals.", trackId: 2, chips: [], reactions: {}, comments: [] },
  { id: 17, authorId: 4, timestamp: daysAgo(8), type: "Journal", content: "Reflection: Need to focus more on deep work in the mornings.", trackId: 8, chips: [], reactions: {}, comments: [] },
  { id: 18, authorId: 3, timestamp: daysAgo(2), type: "Resource", content: "Found a great tutorial on animated styles.", trackId: 9, chips: [], reactions: {}, comments: [] },
  { id: 19, authorId: 1, timestamp: daysAgo(12), type: "Bill", content: "Paid annual server hosting.", trackId: 11, chips: [], reactions: {}, comments: [] },
  { id: 20, authorId: 5, timestamp: daysAgo(4), type: "Meal", content: "High protein breakfast: Eggs, avocado, toast.", trackId: 13, chips: [], reactions: {}, comments: [] },
  { id: 21, authorId: 4, timestamp: daysAgo(1), type: "Mood", content: "Feeling energized after the retreat planning session.", trackId: 14, chips: [], reactions: {}, comments: [] },
  { id: 22, authorId: 2, timestamp: daysAgo(7), type: "Vendor", content: "Catering quote received: $50/head.", trackId: 15, chips: [], reactions: {}, comments: [] },
  { id: 23, authorId: 5, timestamp: daysAgo(3), type: "Post Idea", content: "Tech review: New VR headset unboxing.", trackId: 17, chips: [], reactions: {}, comments: [] },
  { id: 24, authorId: 3, timestamp: daysAgo(5), type: "Draft", content: "Blog post draft: 'The future of widgets' is ready for review.", trackId: 18, chips: [], reactions: {}, comments: [] },
  { id: 25, authorId: 1, timestamp: daysAgo(2), type: "Project", content: "Selected tile patterns for the backsplash.", trackId: 19, chips: [], reactions: {}, comments: [] },
  
  // Images for Home Management
  { 
    id: 26, authorId: 4, timestamp: daysAgo(6), type: EntryType.IMAGE, content: "Garden layout inspiration.", trackId: 20, 
    chips: ["Inspiration"],
    attachments: [
      { name: "garden_1.jpg", url: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80", type: "image/jpeg" },
      { name: "garden_2.jpg", url: "https://images.unsplash.com/photo-1598902168918-64c45ae272c2?auto=format&fit=crop&w=800&q=80", type: "image/jpeg" },
      { name: "garden_3.jpg", url: "https://images.unsplash.com/photo-1599629958294-6024d30c9d72?auto=format&fit=crop&w=800&q=80", type: "image/jpeg" }
    ],
    reactions: { "🌻": [1] }, comments: [] 
  },

  { id: 27, authorId: 2, timestamp: daysAgo(1), type: "Feature Request", content: "Users want dark mode support.", trackId: 21, chips: ["UI/UX"], reactions: {}, comments: [] },
  { id: 28, authorId: 1, timestamp: daysAgo(10), type: "In Progress", content: "Scanning container images for vulnerabilities.", trackId: 22, chips: [], reactions: {}, comments: [] },
  { id: 29, authorId: 2, timestamp: daysAgo(15), type: "Writing", content: "Finished Chapter 3. Word count: 12,000.", trackId: 23, chips: [], reactions: {}, comments: [] },
  { id: 30, authorId: 1, timestamp: daysAgo(1), type: EntryType.TASK, content: "Order new ergonomic chairs.", trackId: 1, chips: ["Purchasing"], reactions: {}, comments: [] },
  
  // Files for Research
  { 
    id: 31, authorId: 1, timestamp: daysAgo(8), type: EntryType.FILES, content: "Competitor analysis data.", trackId: 25,
    chips: ["Research"],
    attachments: [
      { name: "Competitors_2024.pdf", url: "#", type: "application/pdf" },
      { name: "Market_Share.xlsx", url: "#", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }
    ],
    reactions: {}, comments: [] 
  },

  { id: 32, authorId: 4, timestamp: daysAgo(2), type: EntryType.IDEA_BRAINSTORM, content: "Escape room challenge for the team?", trackId: 26, chips: [], reactions: { "👍": [2, 3] }, comments: [] },
  { id: 33, authorId: 3, timestamp: hoursAgo(3), type: "Maintenance", content: "Updated dependencies for the compliance dashboard.", trackId: 2, chips: [], reactions: {}, comments: [] },
  { id: 34, authorId: 2, timestamp: daysAgo(4), type: EntryType.CLIENT_UPDATE, content: "Client approved the new color scheme.", trackId: 3, chips: [], reactions: {}, comments: [] },
  { id: 35, authorId: 4, timestamp: daysAgo(7), type: "Lead Identified", content: "New lead from TechCrunch conference.", trackId: 5, chips: [], reactions: {}, comments: [] },
  { id: 36, authorId: 4, timestamp: daysAgo(9), type: "Reminder", content: "Follow up with Stark Industries on integration API keys.", trackId: 6, chips: [], reactions: {}, comments: [] },
  { id: 37, authorId: 1, timestamp: daysAgo(14), type: "Milestone", content: "Completed half marathon training block.", trackId: 7, chips: [], reactions: { "🔥": [5] }, comments: [] },
  { id: 38, authorId: 5, timestamp: daysAgo(2), type: "Investment", content: "Rebalanced portfolio: +5% in tech stocks.", trackId: 12, chips: [], reactions: {}, comments: [] },
  
  // Images for Creative
  { 
    id: 39, authorId: 3, timestamp: daysAgo(1), type: EntryType.IMAGE, content: "Character sketches for the protagonist.", trackId: 24, 
    chips: ["Sketch"],
    attachments: [
      { name: "char_sketch_1.jpg", url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80", type: "image/jpeg" },
      { name: "char_sketch_2.jpg", url: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&w=800&q=80", type: "image/jpeg" },
      { name: "char_sketch_3.jpg", url: "https://images.unsplash.com/photo-1620663484277-2264c399a9a3?auto=format&fit=crop&w=800&q=80", type: "image/jpeg" },
      { name: "char_sketch_4.jpg", url: "https://images.unsplash.com/photo-1569172131007-479eb4632832?auto=format&fit=crop&w=800&q=80", type: "image/jpeg" },
      { name: "char_sketch_5.jpg", url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=800&q=80", type: "image/jpeg" },
      { name: "char_sketch_6.jpg", url: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=800&q=80", type: "image/jpeg" }
    ],
    reactions: { "🎨": [2, 4] }, comments: [] 
  },

  { id: 40, authorId: 2, timestamp: daysAgo(3), type: "Guest List", content: "VIP invites sent out.", trackId: 15, chips: [], reactions: {}, comments: [] },
  { id: 41, authorId: 5, timestamp: daysAgo(1), type: "Analytics", content: "Video reached 10k views in 24 hours!", trackId: 17, chips: ["Milestone"], reactions: { "🎉": [1, 2, 3, 4] }, comments: [] },
  { id: 42, authorId: 1, timestamp: daysAgo(5), type: "Repair", content: "Fixed leaky faucet in the utility room.", trackId: 19, chips: [], reactions: {}, comments: [] },
  { id: 43, authorId: 2, timestamp: daysAgo(8), type: "Testing", content: "Running regression tests on the staging environment.", trackId: 21, chips: [], reactions: {}, comments: [] },
  { id: 44, authorId: 1, timestamp: daysAgo(20), type: "Other", content: "Set up GitHub repository structure.", trackId: 25, chips: [], reactions: {}, comments: [] },
  
  // Track 4 (Mobile App Launch) - Video
  {
    id: 45, authorId: 2, timestamp: daysAgo(4), type: EntryType.VIDEO, content: "Walkthrough of the onboarding flow.", trackId: 4,
    chips: ["UX Review"],
    attachments: [
      { name: "onboarding_flow.mp4", url: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4", type: "video/mp4" }
    ],
    reactions: {}, comments: []
  },

  { id: 46, authorId: 3, timestamp: daysAgo(2), type: "Assignment", content: "Completed module 4 quiz: 95%.", trackId: 9, chips: [], reactions: {}, comments: [] },
  { id: 47, authorId: 1, timestamp: daysAgo(6), type: "Sleep", content: "7.5 hours. Good quality.", trackId: 14, chips: [], reactions: {}, comments: [] },
  { id: 48, authorId: 4, timestamp: daysAgo(3), type: "Feedback Received", content: "Partner requested changes to the API documentation.", trackId: 6, chips: [], reactions: {}, comments: [] },
  { id: 49, authorId: 2, timestamp: daysAgo(1), type: "Shopping List", content: "Buy paint samples: Swiss Coffee and Chantilly Lace.", trackId: 19, chips: [], reactions: {}, comments: [] },
  
  // Track 16 (Team Retreat) - Images
  { 
    id: 50, authorId: 2, timestamp: daysAgo(10), type: EntryType.IMAGE, content: "Potential venue locations for the retreat.", trackId: 16, 
    chips: ["Venue"],
    attachments: [
      { name: "venue_1.jpg", url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80", type: "image/jpeg" },
      { name: "venue_2.jpg", url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80", type: "image/jpeg" },
      { name: "venue_3.jpg", url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80", type: "image/jpeg" }
    ],
    reactions: { "😍": [1, 3, 4] }, comments: [] 
  }
];
