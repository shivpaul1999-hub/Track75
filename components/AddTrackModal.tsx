
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Track, User, TrackLifecycle, TrackPriority, FeedEntry } from '../types';
import { TEMPLATE_OPTIONS, TEMPLATE_CONFIG } from '../constants';
import Icon from './Icon';

interface AddTrackModalProps {
  owners: User[];
  users: User[];
  entryTags: string[];
  onAddTag: (tag: string) => void;
  onClose: () => void;
  onSave: (
    track: Omit<Track, 'id' | 'progress' | 'collaboratorIds' | 'organizationId'>,
    entryData?: Omit<FeedEntry, 'id' | 'trackId' | 'authorId' | 'timestamp' | 'reactions' | 'comments'>
  ) => void;
}

const AddTrackModal: React.FC<AddTrackModalProps> = ({ owners, users, entryTags, onAddTag, onClose, onSave }) => {
  const [step, setStep] = useState<1 | 2>(1);

  // --- STEP 1: Track Data ---
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState<string>('Custom Template'); 
  const [priority, setPriority] = useState<TrackPriority>('Medium');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string>('');
  
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);

  // --- STEP 2: Entry Data ---
  const [entryContent, setEntryContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]); 
  const [visibleToUserIds, setVisibleToUserIds] = useState<number[]>([]);
  const [entryFiles, setEntryFiles] = useState<File[]>([]);

  // Task Specific
  const [workflowStage, setWorkflowStage] = useState<string>('To Do');
  const [priorityLevel, setPriorityLevel] = useState<string>('Medium');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableTags = useMemo(() => {
      const baseTags = TEMPLATE_CONFIG[template] || [];
      return [...baseTags, ...customTags];
  }, [template, customTags]);

  const showTaskFields = useMemo(() => {
      const triggerTags = ['Priority Task', 'Checklist / To-Do', 'Task'];
      return selectedTags.some(tag => triggerTags.includes(tag));
  }, [selectedTags]);

  const isTrackValid = !!name.trim();

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setEntryFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => setAvatar(event.target?.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleFinish = () => {
    if (!name.trim()) return;

    const newTrackData: Omit<Track, 'id' | 'progress' | 'collaboratorIds' | 'organizationId'> = {
      name,
      description,
      lifecycle: TrackLifecycle.OPEN,
      priority,
      template,
      customTags,
      avatarUrl: avatar || undefined,
      startDate: new Date().toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      ownerId: owners.length > 0 ? owners[0].id : undefined, // Default to first owner or handle selection
    };

    let entryData = undefined;
    const primaryType = selectedTags.length > 0 ? selectedTags[0] : null;
    
    if (primaryType) {
        const finalContent = entryContent.trim() || (entryFiles.length > 0 ? entryFiles.map(f => f.name).join(', ') : 'New entry');
        const attachments = entryFiles.map(file => ({
            name: file.name,
            type: file.type,
            url: URL.createObjectURL(file) 
        }));

        let finalChips = [...selectedTags];
        if (showTaskFields) {
            finalChips.push(workflowStage);
            finalChips.push(priorityLevel);
        }

        entryData = {
            content: finalContent,
            type: primaryType,
            visibleToUserIds: visibleToUserIds.length > 0 ? visibleToUserIds : undefined,
            attachments: attachments.length > 0 ? attachments : undefined,
            chips: finalChips,
        };
    }

    onSave(newTrackData, entryData);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in overflow-hidden flex flex-col transition-all duration-300 max-h-[90vh]" onClick={e => e.stopPropagation()}>
        
        <div className="px-6 pt-6 pb-2 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{step === 1 ? 'New Track' : 'First Entry'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{step === 1 ? 'Step 1 of 2' : `Step 2 of 2: ${name}`}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
            <Icon name="close" className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto flex-grow custom-scrollbar">
            {step === 1 ? (
                <div className="space-y-5 animate-fade-in">
                    <div>
                        <label className="block text-sm font-bold text-gray-800 mb-1.5">Track Name <span className="text-red-500">*</span></label>
                        <input type="text" autoFocus value={name} onChange={e => setName(e.target.value)} className="block w-full bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm py-2.5 px-3 text-gray-900 placeholder-gray-400" placeholder="e.g. Website Redesign" />
                    </div>
                    <div>
                      <button type="button" onClick={() => setIsMoreOptionsOpen(!isMoreOptionsOpen)} className="flex items-center text-sm text-gray-500 hover:text-primary font-medium">
                        {isMoreOptionsOpen ? <Icon name="chevron-down" className="w-4 h-4 mr-1" /> : <Icon name="chevron-right" className="w-4 h-4 mr-1" />}
                        More Options
                      </button>
                    </div>
                    {isMoreOptionsOpen && (
                      <div className="space-y-4 pt-2 animate-fade-in bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div className="flex items-center space-x-4">
                            <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-300">
                                {avatar ? <img src={avatar} alt="Avatar" className="w-full h-full object-cover" /> : <Icon name="photo" className="w-6 h-6 text-gray-400" />}
                            </div>
                            <label htmlFor="track-avatar-upload" className="cursor-pointer text-xs font-semibold text-primary hover:text-primary-hover bg-white border border-primary/20 px-3 py-1.5 rounded-md shadow-sm">
                                Upload Track Avatar
                                <input id="track-avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                            </label>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Overview</label>
                            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="block w-full bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm py-2.5 px-3" placeholder="Brief description..." />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Template</label>
                            <select value={template} onChange={e => setTemplate(e.target.value)} className="block w-full bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm py-2.5 px-3">
                                {TEMPLATE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Target End Date</label>
                              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="block w-full bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm py-2.5 px-3" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wider">Priority</label>
                              <select value={priority} onChange={e => setPriority(e.target.value as TrackPriority)} className="block w-full bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm py-2.5 px-3">
                                  <option value="Low">Low</option>
                                  <option value="Medium">Medium</option>
                                  <option value="High">High</option>
                                  <option value="Critical">Critical</option>
                              </select>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6 animate-fade-in">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-bold text-gray-800">Tags <span className="text-red-500">*</span></label>
                        </div>
                        <div className="flex overflow-x-auto space-x-2 pb-2 -mx-1 px-1 custom-scrollbar select-none items-center">
                            {availableTags.map(tag => (
                                <button key={tag} type="button" onClick={() => handleTagToggle(tag)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border shadow-sm ${selectedTags.includes(tag) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200'}`}>
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                    {showTaskFields && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                            <div>
                                <label className="block text-xs font-bold text-blue-800 mb-1.5 uppercase tracking-wider">Workflow Stage</label>
                                <select value={workflowStage} onChange={e => setWorkflowStage(e.target.value)} className="block w-full bg-white border border-blue-200 rounded-lg shadow-sm sm:text-sm py-2 px-3">
                                    <option value="To Do">To Do</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Done">Done</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-blue-800 mb-1.5 uppercase tracking-wider">Priority Level</label>
                                <select value={priorityLevel} onChange={e => setPriorityLevel(e.target.value)} className="block w-full bg-white border border-blue-200 rounded-lg shadow-sm sm:text-sm py-2 px-3">
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>
                        </div>
                    )}
                    <div>
                         <label className="block text-sm font-bold text-gray-800 mb-1.5">Description</label>
                         <textarea className="block w-full bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm py-2.5 px-3 resize-none" rows={3} placeholder="What's the first update?" value={entryContent} onChange={e => setEntryContent(e.target.value)}></textarea>
                    </div>
                    <div>
                        <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary hover:text-primary bg-gray-50/50">
                            <Icon name="files" className="w-5 h-5" />
                            <span className="font-semibold text-sm">Upload attachments</span>
                        </button>
                        {entryFiles.length > 0 && (
                            <div className="mt-2 text-xs text-gray-500">{entryFiles.length} files selected</div>
                        )}
                    </div>
                </div>
            )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end space-x-3 flex-shrink-0">
            {step === 1 ? (
                <>
                    <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button onClick={() => isTrackValid && setStep(2)} disabled={!isTrackValid} className="px-6 py-2 bg-primary border border-transparent rounded-lg text-sm font-bold text-white hover:bg-primary-hover disabled:bg-gray-300">Create Track & Continue</button>
                </>
            ) : (
                <>
                   <button onClick={() => setStep(1)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Back</button>
                   <button onClick={handleFinish} className="px-6 py-2 bg-primary border border-transparent rounded-lg text-sm font-bold text-white hover:bg-primary-hover disabled:bg-gray-300">
                       Create Entry & Finish
                   </button>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default AddTrackModal;
