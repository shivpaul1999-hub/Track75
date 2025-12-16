import React, { useState, useMemo } from 'react';
import { FeedEntry, EntryType, User, TrackPriority } from '../types';
import Icon from './Icon';

interface TasksKanbanViewProps {
    entries: FeedEntry[];
    onUpdateEntry: (entry: FeedEntry) => void;
    users: User[];
}

const WORKFLOW_STAGES = ['Backlog', 'To Do', 'In Progress', 'In Review', 'In QA', 'Done'];
const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const getPriorityDetails = (chips: string[] = []): { name: string; badgeClasses: string; } => {
    // Try to find explicit priority chip first, otherwise check if chip matches one of our priorities
    const priority = chips.find(chip => TASK_PRIORITIES.includes(chip)) || 'Low';

    switch (priority) {
        case 'Critical': return { name: priority, badgeClasses: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900' };
        case 'High': return { name: priority, badgeClasses: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-900' };
        case 'Medium': return { name: priority, badgeClasses: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-900' };
        case 'Low': return { name: priority, badgeClasses: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-900' };
        default: return { name: 'Low', badgeClasses: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700' };
    }
};

const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    return `${month} ${day}`;
};

const KanbanCard: React.FC<{ entry: FeedEntry; onDragStart: (e: React.DragEvent<HTMLDivElement>, entryId: number) => void; onUpdateEntry: (entry: FeedEntry) => void; users: User[] }> = ({ entry, onDragStart, onUpdateEntry, users }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    // Use optional chaining for safety
    const assignee = entry.taskAssigneeId ? users?.find(u => u.id === entry.taskAssigneeId) : null;

    const { badgeClasses: priorityBadgeClasses, name: priorityName } = getPriorityDetails(entry.chips);

    const [title, ...descriptionParts] = entry.content.split('\n');
    const description = descriptionParts.join('\n').trim();

    const handleSubtaskToggle = (subtaskId: number) => {
        const updatedSubtasks = entry.subtasks?.map(subtask =>
            subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
        );
        onUpdateEntry({ ...entry, subtasks: updatedSubtasks });
    };

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, entry.id)}
            className="group relative bg-white dark:bg-dark-card p-3 rounded-xl border border-gray-200 dark:border-dark-elevated shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing mb-3 transition-all duration-200 hover:-translate-y-0.5"
        >
            {/* Drag Handle Indicator */}
            {/* Drag Handle Indicator */}
            <div className="absolute top-3 right-3 text-gray-300 dark:text-gray-600 cursor-grab active:cursor-grabbing hover:text-gray-500 dark:hover:text-gray-400">
                <Icon name="dots-vertical" className="w-5 h-5" />
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${priorityBadgeClasses}`}>{priorityName}</span>
                </div>

                <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-snug">{title}</h4>

                {description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{description}</p>
                )}
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-dark-elevated">
                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                    {entry.dueDate && (
                        <div className={`flex items-center gap-1 ${new Date(entry.dueDate) < new Date() ? 'text-red-500 font-medium' : ''}`}>
                            <Icon name="task" className="w-3.5 h-3.5" />
                            {formatDate(entry.dueDate)}
                        </div>
                    )}
                    <div className="flex items-center gap-1">
                        <Icon name="comment" className="w-3.5 h-3.5" />
                        {entry.comments?.length || 0}
                    </div>
                </div>

                {/* Assignee Avatar */}
                <div className="flex -space-x-2">
                    {assignee ? (
                        assignee.avatarUrl ? (
                            <img src={assignee.avatarUrl} alt={assignee.name} className="w-6 h-6 rounded-full border-2 border-white dark:border-dark-card object-cover" title={assignee.name} />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-primary text-white border-2 border-white dark:border-dark-card flex items-center justify-center text-[10px] font-bold" title={assignee.name}>{assignee.initials}</div>
                        )
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-dark-elevated border-2 border-white dark:border-dark-card flex items-center justify-center text-gray-400">
                            <Icon name="user" className="w-3 h-3" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


const TasksKanbanView: React.FC<TasksKanbanViewProps> = ({ entries, onUpdateEntry, users }) => {
    const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);

    const columns = useMemo(() => {
        const grouped: { [key: string]: FeedEntry[] } = {};
        WORKFLOW_STAGES.forEach(stage => {
            grouped[stage] = [];
        });
        entries.forEach(entry => {
            // Find existing stage chip or default to Backlog
            const stage = entry.chips?.find(chip => WORKFLOW_STAGES.includes(chip));
            if (stage && grouped[stage]) {
                grouped[stage].push(entry);
            } else {
                // If it's a task type but has no stage chip, put it in Backlog
                grouped['Backlog'].push(entry);
            }
        });
        return grouped;
    }, [entries]);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, entryId: number) => {
        e.dataTransfer.setData('entryId', entryId.toString());
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, stage: string) => {
        e.preventDefault();
        setDraggedOverColumn(stage);
    };

    const handleDragLeave = () => {
        setDraggedOverColumn(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, destinationStage: string) => {
        e.preventDefault();
        setDraggedOverColumn(null);
        const entryId = parseInt(e.dataTransfer.getData('entryId'), 10);
        const entryToMove = entries.find(p => p.id === entryId);

        if (entryToMove) {
            const currentStage = entryToMove.chips?.find(chip => WORKFLOW_STAGES.includes(chip)) || 'Backlog';

            if (currentStage !== destinationStage) {
                // Remove old stage chip and add new one provided it's not Backlog (implied default)
                // Actually, explicit chips are better for stability.
                const otherChips = entryToMove.chips?.filter(chip => !WORKFLOW_STAGES.includes(chip)) || [];

                // Keep priority if it exists
                const newChips = [...otherChips, destinationStage];

                onUpdateEntry({
                    ...entryToMove,
                    chips: newChips
                });
            }
        }
    };

    if (entries.length === 0) {
        return <div className="text-center py-20 bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-dark-elevated"><p className="text-gray-500 dark:text-gray-400">No tasks found. Create a new task to get started.</p></div>;
    }

    return (
        <div className="flex overflow-x-auto pb-4 gap-4 h-[calc(100vh-280px)] custom-scrollbar">
            {WORKFLOW_STAGES.map(stage => (
                <div
                    key={stage}
                    className="flex flex-col min-w-[280px] w-[280px] bg-gray-50 dark:bg-dark-elevated rounded-lg border border-gray-200 dark:border-dark-elevated max-h-full"
                >
                    <div className="p-3 border-b border-gray-200 dark:border-dark-elevated bg-gray-100/50 dark:bg-dark-elevated/50 rounded-t-lg z-10 flex items-center justify-between sticky top-0">
                        <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm flex items-center">
                            {stage}
                        </h3>
                        <span className="text-xs font-bold bg-white dark:bg-dark-card text-gray-500 dark:text-gray-400 rounded-full px-2 py-0.5 border border-gray-200 dark:border-dark-elevated shadow-sm">
                            {columns[stage]?.length || 0}
                        </span>
                    </div>

                    <div
                        className={`p-2 flex-1 overflow-y-auto custom-scrollbar transition-colors duration-200 ${draggedOverColumn === stage ? 'bg-primary/5 dark:bg-primary/10 ring-2 ring-inset ring-primary/20' : ''}`}
                        onDragOver={(e) => handleDragOver(e, stage)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, stage)}
                    >
                        {columns[stage] && columns[stage].length > 0 ? (
                            columns[stage].map(entry => (
                                <KanbanCard key={entry.id} entry={entry} onDragStart={handleDragStart} onUpdateEntry={onUpdateEntry} users={users} />
                            ))
                        ) : (
                            <div className="h-full flex items-center justify-center text-center p-4">
                                <p className="text-xs text-gray-400 dark:text-gray-600 italic dashed-border">Drop tasks</p>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TasksKanbanView;
