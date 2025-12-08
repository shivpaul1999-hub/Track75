
// --- TEMPLATE CONFIGURATION ---
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
    'Opportunity', 'Task', 'Comment', 'Files', 'Roadmap Update', 'Client Update', 
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
