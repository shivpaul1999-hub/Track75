
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { FeedEntry, EntryType } from '../types';
import Icon from './Icon';

interface IssuesApprovalsViewProps {
  entries: FeedEntry[];
}

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const IssuesApprovalsView: React.FC<IssuesApprovalsViewProps> = ({ entries }) => {
  const [filter, setFilter] = useState<'all' | 'open' | 'pending'>('all');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const { openIssuesCount, pendingApprovalsCount } = useMemo(() => {
    const openIssues = entries.filter(e => e.type === EntryType.BUG_ISSUE && !['Verified / Resolved', 'Deferred'].some(s => e.chips?.includes(s))).length;
    // Count all Approval / Sign-off entries as pending approvals regardless of status
    const pendingApprovals = entries.filter(e => e.type === EntryType.APPROVAL_SIGNOFF).length;
    return { openIssuesCount: openIssues, pendingApprovalsCount: pendingApprovals };
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const isIssue = entry.type === EntryType.BUG_ISSUE;
      const isApproval = entry.type === EntryType.APPROVAL_SIGNOFF;
      const statusChips = entry.chips || [];

      const isOpen = isIssue && !['Verified / Resolved', 'Deferred'].some(s => statusChips.includes(s));
      const isPending = isApproval && statusChips.includes('Pending Review');

      switch (filter) {
        case 'open': return isOpen;
        case 'pending': return isPending;
        case 'all':
        default: return true;
      }
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [entries, filter]);

  const filters: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open Issues' },
    { key: 'pending', label: 'Pending Approvals' },
  ];

  if (entries.length === 0) {
    return <div className="text-center py-12"><p className="text-gray-500">No issues or approvals have been logged for this project.</p></div>;
  }

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-900/40">
          <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-300">Open Issues</h4>
          <p className="text-3xl font-bold text-orange-700 dark:text-orange-400 mt-1">{openIssuesCount}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900/40">
          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300">Pending Approvals</h4>
          <p className="text-3xl font-bold text-blue-700 dark:text-blue-400 mt-1">{pendingApprovalsCount}</p>
        </div>
      </div>

      {/* Filters and Table */}
      <div className="bg-white dark:bg-dark-card p-4 sm:p-0 rounded-lg border border-gray-200 dark:border-dark-elevated shadow-sm">
        <div className="p-4 flex items-center border-b border-gray-200 dark:border-dark-elevated">
          <div className="flex items-center rounded-md border border-gray-300 dark:border-dark-elevated p-0.5">
            {filters.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${filter === key ? 'bg-primary text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-elevated'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-dark-elevated">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-elevated">
              {filteredEntries.map(entry => {
                const titleParts = entry.content ? entry.content.split('\n') : ['Untitled'];
                return (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-dark-elevated transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{titleParts[0]}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{entry.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(entry.timestamp)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="relative inline-block text-left" ref={openMenuId === entry.id ? menuRef : null}>
                        <button
                          type="button"
                          className="inline-flex justify-center w-full rounded-md border border-gray-300 dark:border-dark-elevated shadow-sm px-4 py-2 bg-white dark:bg-dark-elevated text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-card focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-dark-card focus:ring-primary"
                          onClick={() => setOpenMenuId(openMenuId === entry.id ? null : entry.id)}
                        >
                          Actions
                          <Icon name="chevron-down" className="-mr-1 ml-2 h-5 w-5" />
                        </button>
                        {openMenuId === entry.id && (
                          <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white dark:bg-dark-popup ring-1 ring-black ring-opacity-5 z-20">
                            <div className="py-1" role="menu" aria-orientation="vertical">
                              {entry.type === EntryType.BUG_ISSUE && (
                                <>
                                  <a href="#" onClick={(e) => { e.preventDefault(); setOpenMenuId(null); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-elevated" role="menuitem">Approve</a>
                                  <a href="#" onClick={(e) => { e.preventDefault(); setOpenMenuId(null); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-elevated" role="menuitem">Decline</a>
                                </>
                              )}
                              {entry.type === EntryType.APPROVAL_SIGNOFF && (
                                <>
                                  <a href="#" onClick={(e) => { e.preventDefault(); setOpenMenuId(null); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-elevated" role="menuitem">Sign-off</a>
                                  <a href="#" onClick={(e) => { e.preventDefault(); setOpenMenuId(null); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-elevated" role="menuitem">Reject</a>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredEntries.length === 0 && (
            <p className="text-center text-gray-500 py-8">No items match the selected filter.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default IssuesApprovalsView;
