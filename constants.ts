
// --- TEMPLATE CONFIGURATION ---
// NOTE: These are now used as the data source for the Mock API (api/mockService.ts) called via api/metaApi.ts
// In a real application, this data would reside in a database.
export const TEMPLATE_OPTIONS = [
  "To-Do List / Tasks Tracker",
  "Project Management",
  "CRM / Relationship Tracker",
  "Personal Goals & Habits",
  "Learning & Study Organizer",
  "Finance & Budget Tracker",
  "Health & Wellness Log",
  "Event & Planning Tracker",
  "Content Creation / Social Media",
  "Home Management",
  "Bug / Issue Tracking",
  "Creative Projects",
  "Custom Template"
];

export const TEMPLATE_CONFIG: Record<string, string[]> = {
  "To-Do List / Tasks Tracker": [
    'Task', 'Priority', 'Reminder', 'Idea', 'Done', 'Checklist'
  ],
  "Project Management": [
    'Opportunity', 'Task', 'Comment', 'Files', 'Roadmap Update',
    'Meta Data / Track Info', 'Meeting Notes', 'Quick Note', 'URL / Link', 'Bug / Issue',
    'Idea / Brainstorm', 'Announcement', 'Deployment / Release', 'Approval / Sign-off',
    'Priority Task', 'Checklist / To-Do', 'Image', 'Video'
  ],
  "CRM / Relationship Tracker": [
    'Lead Identified', 'Proposal Sent', 'Negotiation', 'Contract Signed', 'Rejected / Closed',
    'Status Report', 'Progress Summary', 'Change Request', 'Feedback Received', 'Reminder',
    'Idea Draft', 'Follow-up', 'Files', 'Image', 'Video'
  ],
  "Personal Goals & Habits": [
    'Goal', 'Habit', 'Milestone', 'Journal', 'Reflection', 'Achievement', 'Files'
  ],
  "Learning & Study Organizer": [
    'Note', 'Resource', 'Assignment', 'Exam', 'Flashcard', 'Research', 'Files'
  ],
  "Finance & Budget Tracker": [
    'Income', 'Expense', 'Budget', 'Savings', 'Investment', 'Bill', 'Receipt'
  ],
  "Health & Wellness Log": [
    'Meal', 'Workout', 'Medication', 'Mood', 'Sleep', 'Water', 'Files', 'Image', 'Video'
  ],
  "Event & Planning Tracker": [
    'Venue', 'Guest List', 'Schedule', 'Task', 'Vendor', 'Budget', 'Idea'
  ],
  "Content Creation / Social Media": [
    'Post Idea', 'Draft', 'Published', 'Story', 'Video', 'Analytics', 'Image', 'Hashtags'
  ],
  "Home Management": [
    'Chore', 'Maintenance', 'Shopping List', 'Bill', 'Project', 'Repair'
  ],
  "Bug / Issue Tracking": [
    'Bug Report', 'Feature Request', 'In Progress', 'Fixed', 'Release', 'Testing'
  ],
  "Creative Projects": [
    'Writing', 'Painting', 'Music', 'Design', 'Other', 'New Feature Idea',
    'Improvement Suggestion', 'Design Concept', 'Process Optimization', 'Files', 'Image', 'Video'
  ],
  "Custom Template": ['Files', 'Image', 'Video'], // Allows custom tags
};

export const TEMPLATE_COLORS = [
  { text: '#7E22CF', bg: '#FAF5FF' }, // 1
  { text: '#D43B39', bg: '#FFF5F5' }, // 2
  { text: '#D46A39', bg: '#FFF8F5' }, // 3
  { text: '#D4A739', bg: '#FFFBF5' }, // 4
  { text: '#C9D439', bg: '#FDFFF5' }, // 5
  { text: '#7FD439', bg: '#F6FFF5' }, // 6
  { text: '#39D44C', bg: '#F5FFF7' }, // 7
  { text: '#39D48F', bg: '#F5FFFB' }, // 8
  { text: '#39C7D4', bg: '#F5FDFF' }, // 9
  { text: '#3994D4', bg: '#F5FAFF' }, // 10
  { text: '#395FD4', bg: '#F5F8FF' }, // 11
  { text: '#5A39D4', bg: '#F7F5FF' }, // 12
  { text: '#D439B7', bg: '#FFF5FA' }, // 13
  { text: '#D43975', bg: '#FFF5F8' }, // 14
  { text: '#D4394F', bg: '#FFF5F6' }, // 15
];
