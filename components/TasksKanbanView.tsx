
import React, { useState, useMemo } from 'react';
import { FeedEntry, EntryType, User } from '../types';
import Icon from './Icon';

interface TasksKanbanViewProps {
  entries: FeedEntry[];
  onUpdateEntry: (entry: FeedEntry) => void;
  users: User[];
}

const WORKFLOW_STAGES = ['Backlog', 'To Do', 'In Progress', 'In Review', 'In QA', 'Done'];
const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const getPriorityDetails = (chips: string[] = []): { name: string; badgeClasses: string; } => {
  const priority = chips.find(chip => TASK_PRIORITIES.includes(chip)) || 'Low';
  switch (priority) {
    case 'Critical': return { name: priority, badgeClasses: 'bg-red-100 text-red-800' };
    case 'High': return { name: priority, badgeClasses: 'bg-orange-100 text-orange-800' };
    case 'Medium': return { name: priority, badgeClasses: 'bg-yellow-100 text-yellow-800' };
    case 'Low': return { name: priority, badgeClasses: 'bg-green-100 text-green-800' };
    default: return { name: 'Low', badgeClasses: 'bg-green-100 text-green-800' };
  }
};

const getEntryTypeDetails = (type: string): { name: string; badgeClasses: string; } => {
    switch(type) {
        case EntryType.TASK: return { name: 'Task', badgeClasses: 'bg-sky-100 text-sky-800' };
        case EntryType.PRIORITY_TASK: return { name: 'Priority Task', badgeClasses: 'bg-purple-100 text-purple-800' };
        case EntryType.CHECKLIST_TODO: return { name: 'Checklist', badgeClasses: 'bg-teal-100 text-teal-800' };
        default: return { name: 'Task', badgeClasses: 'bg-sky-100 text-sky-800' };
    }
}

const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    return `${month} ${day}`;
};

const KanbanCard: React.FC<{ entry: FeedEntry; onDragStart: (e: React.DragEvent<HTMLDivElement>, entryId: number) => void; onUpdateEntry: (entry: FeedEntry) => void; users: User[] }> = ({ entry, onDragStart, onUpdateEntry, users }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const assignee = entry.taskAssigneeId ? users.find(u => u.id === entry.taskAssigneeId) : null;
    
    const { badgeClasses: priorityBadgeClasses, name: priorityName } = getPriorityDetails(entry.chips);
    const { badgeClasses: typeBadgeClasses, name: typeName } = getEntryTypeDetails(entry.type);

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
            className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing mb-3"
        >
            <div className="flex flex-wrap gap-2 mb-2">
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${typeBadgeClasses}`}>{typeName}</span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${priorityBadgeClasses}`}>{priorityName}</span>
            </div>

            <h4 className="font-bold text-gray-800 text-sm leading-tight mb-1">{title}</h4>
            {description && <p className="text-xs text-gray-600 mt-1 line-clamp-2">{description}</p>}
            
            {entry.subtasks && entry.subtasks.length > 0 && (
                <div className="mt-3">
                    <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex justify-between items-center text-xs text-gray-500 font-semibold">
                        <span>Subtasks ({entry.subtasks.filter(s => s.completed).length}/{entry.subtasks.length})</span>
                        <Icon name="chevron-down" className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                    {isExpanded && (
                        <div className="mt-2 space-y-1.5 pl-1 animate-fade-in">
                            {entry.subtasks.map(subtask => (
                                <div key={subtask.id} className="flex items-center">
                                    <input 
                                        type="checkbox" 
                                        checked={subtask.completed}
                                        onChange={() => handleSubtaskToggle(subtask.id)}
                                        className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary-focus"
                                    />
                                    <label className={`ml-2 text-xs ${subtask.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                        {subtask.text}
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                    {entry.dueDate && (
                        <span className="flex items-center font-medium">
                            <Icon name="task" className="w-4 h-4 mr-1"/>{formatDate(entry.dueDate)}
                        </span>
                    )}
                     <span className="flex items-center"><Icon name="comment" className="w-4 h-4 mr-1"/>{entry.comments?.length || 0}</span>
                </div>
                {assignee && (
                     <div title={assignee.name}>
                        {assignee.avatarUrl ? (
                            <img src={assignee.avatarUrl} alt={assignee.name} className="w-6 h-6 rounded-full" />
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[10px]">{assignee.initials}</div>
                        )}
                    </div>
                )}
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
        const stage = entry.chips?.find(chip => WORKFLOW_STAGES.includes(chip));
        if (stage && grouped[stage]) {
            grouped[stage].push(entry);
        } else {
            grouped['Backlog'].push(entry);
        }
    });
    return grouped;
  }, [entries]);
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, entryId: number) => {
    e.dataTransfer.setData('entryId', entryId.toString());
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
        const oldStage = entryToMove.chips?.find(chip => WORKFLOW_STAGES.includes(chip));

        if(oldStage !== destinationStage){
             const priorityChip = entryToMove.chips?.find(chip => TASK_PRIORITIES.includes(chip));
             
             const newChips = [destinationStage];
             if(priorityChip) {
                newChips.push(priorityChip);
             } else {
                newChips.push(entryToMove.type === EntryType.PRIORITY_TASK ? 'High' : 'Medium');
             }

             onUpdateEntry({
                 ...entryToMove,
                 chips: newChips
             });
        }
    }
  };

  const totalTasks = entries.length;

  if (totalTasks === 0) {
    return <div className="text-center py-12"><p className="text-gray-500">No tasks available.</p></div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {WORKFLOW_STAGES.map(stage => (
        <div 
            key={stage} 
            className="flex flex-col bg-slate-50 rounded-lg border border-slate-200"
        >
          <div className="p-3 border-b border-slate-200 sticky top-0 bg-slate-50 rounded-t-lg z-10 flex-shrink-0">
            <h3 className="font-bold text-gray-800 text-sm flex items-center">
              {stage}
              <span className="ml-2 text-xs font-semibold bg-slate-200 text-slate-600 rounded-full px-2 py-0.5">
                {columns[stage]?.length || 0}
              </span>
            </h3>
          </div>
          <div 
              className={`p-2 flex-grow overflow-y-auto transition-colors duration-300 min-h-[150px] ${draggedOverColumn === stage ? 'bg-primary-light' : ''}`}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage)}
          >
             {columns[stage] && columns[stage].length > 0 ? (
                columns[stage].map(entry => (
                    <KanbanCard key={entry.id} entry={entry} onDragStart={handleDragStart} onUpdateEntry={onUpdateEntry} users={users} />
                ))
            ) : (
                <div className="p-4 text-center text-xs text-gray-400">
                    Drop tasks here
                </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TasksKanbanView;
