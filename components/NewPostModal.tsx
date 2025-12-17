
import React, { useState, useRef, useMemo } from 'react';
import { Track } from '../types';
import Icon from './Icon';
import { TEMPLATE_CONFIG } from '../constants';

interface NewEntryModalProps {
    track: Pick<Track, 'id' | 'name' | 'template' | 'customTags' | 'description'>;
    entryTags: string[];
    onAddTag: (tag: string) => void;
    onClose: () => void;
    onSave: (entryData: {
        content: string;
        type: string;
        visibleToUserIds: number[];
        attachments: { name: string; url: string; type: string }[];
        chips: string[];
    }) => void;
    onUpdateTrack?: (track: Track) => void;
    triggerUpload?: boolean;
}

const NewEntryModal: React.FC<NewEntryModalProps> = ({ track, entryTags, onAddTag, onClose, onSave, onUpdateTrack, triggerUpload = false }) => {
    const [content, setContent] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [customTags, setCustomTags] = useState<string[]>([]);
    const [files, setFiles] = useState<File[]>([]);

    // Task specific state
    const [workflowStage, setWorkflowStage] = useState<string>('To Do');
    const [priorityLevel, setPriorityLevel] = useState<string>('Medium');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Logic to detect template from description if track.template is missing
    const getTemplateFromDescription = (desc: string) => {
        const match = desc?.match(/^\[Template: (.*?)\]/);
        return match ? match[1] : null;
    };

    const templateName = useMemo(() => {
        let t = track.template;
        // Fallback: check description for [Template: ...] pattern if explicit template is missing
        if (!t && track.description) {
            t = getTemplateFromDescription(track.description);
        }

        // Ensure the detected template actually exists in our config, otherwise default to Custom
        if (t && TEMPLATE_CONFIG[t]) {
            return t;
        }
        return 'Custom Template';
    }, [track]);

    const availableTags = useMemo(() => {
        const baseTags = TEMPLATE_CONFIG[templateName] || [];
        return [...baseTags, ...(track.customTags || []), ...customTags];
    }, [templateName, track.customTags, customTags]);

    const showTaskFields = useMemo(() => {
        const triggerTags = ['Priority Task', 'Checklist / To-Do', 'Task'];
        return selectedTags.some(tag => triggerTags.includes(tag));
    }, [selectedTags]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(Array.from(e.target.files));
            if (!selectedTags.includes('Files')) setSelectedTags(prev => [...prev, 'Files']);
        }
    };

    const handleTagToggle = (tag: string) => {
        setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    const handleSubmit = () => {
        const primaryType = selectedTags[0] || 'Note';
        const attachments = files.map(file => ({
            name: file.name,
            type: file.type,
            url: URL.createObjectURL(file)
        }));

        let finalChips = [...selectedTags];
        if (showTaskFields) {
            finalChips.push(workflowStage);
            finalChips.push(priorityLevel);
        }

        onSave({
            content,
            type: primaryType,
            visibleToUserIds: [], // Logic simplified
            attachments,
            chips: finalChips
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-dark-popup rounded-2xl shadow-2xl w-full max-w-md animate-scale-in overflow-hidden flex flex-col transition-all duration-300 max-h-[90vh]" onClick={e => e.stopPropagation()}>

                <div className="px-6 pt-6 pb-2 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Entry</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Posting to: {track.name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-dark-elevated">
                        <Icon name="close" className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 py-4 overflow-y-auto flex-grow custom-scrollbar">
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-bold text-gray-800 dark:text-gray-200">Tags ({templateName}) <span className="text-red-500">*</span></label>
                            </div>
                            <div className="flex overflow-x-auto space-x-2 pb-2 -mx-1 px-1 custom-scrollbar select-none items-center">
                                {availableTags.map(tag => (
                                    <button key={tag} type="button" onClick={() => handleTagToggle(tag)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border shadow-sm ${selectedTags.includes(tag) ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-dark-elevated text-gray-700 dark:text-gray-300 border-gray-200 dark:border-dark-elevated'}`}>
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {showTaskFields && (
                            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                <div>
                                    <label className="block text-xs font-bold text-blue-800 dark:text-blue-300 mb-1.5 uppercase tracking-wider">Workflow Stage</label>
                                    <select value={workflowStage} onChange={e => setWorkflowStage(e.target.value)} className="block w-full bg-white dark:bg-dark-card border border-blue-200 dark:border-blue-800 rounded-lg shadow-sm sm:text-sm py-2 px-3 text-gray-900 dark:text-white">
                                        <option value="To Do">To Do</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Done">Done</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-800 dark:text-blue-300 mb-1.5 uppercase tracking-wider">Priority Level</label>
                                    <select value={priorityLevel} onChange={e => setPriorityLevel(e.target.value)} className="block w-full bg-white dark:bg-dark-card border border-blue-200 dark:border-blue-800 rounded-lg shadow-sm sm:text-sm py-2 px-3 text-gray-900 dark:text-white">
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-1.5">Description</label>
                            <textarea className="block w-full bg-white dark:bg-dark-elevated border border-gray-300 dark:border-dark-elevated rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm py-2.5 px-3 resize-none text-gray-900 dark:text-white" rows={4} placeholder="What's new?" value={content} onChange={e => setContent(e.target.value)}></textarea>
                        </div>

                        <div>
                            <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-dark-elevated rounded-lg text-gray-600 dark:text-gray-400 hover:border-primary hover:text-primary bg-gray-50/50 dark:bg-dark-elevated">
                                <Icon name="files" className="w-5 h-5" />
                                <span className="font-semibold text-sm">Upload attachments</span>
                            </button>
                            {files.length > 0 && (
                                <div className="mt-2 text-xs text-gray-500">{files.length} files selected</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-dark-elevated bg-gray-50/50 dark:bg-dark-elevated flex justify-end space-x-3 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-elevated rounded-lg text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-elevated">Cancel</button>
                    <button onClick={handleSubmit} className="px-6 py-2 bg-primary border border-transparent rounded-lg text-sm font-bold text-white hover:bg-primary-hover disabled:bg-gray-300 dark:disabled:bg-gray-600" disabled={!content && files.length === 0}>Post</button>
                </div>
            </div>
        </div>
    );
};

export default NewEntryModal;
