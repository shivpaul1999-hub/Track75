import React from 'react';
import { Organization } from '../types';
import Icon from './Icon';

interface DeactivateOrganizationModalProps {
  organization: Organization;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeactivateOrganizationModal: React.FC<DeactivateOrganizationModalProps> = ({ organization, onCancel, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4 transition-opacity" onClick={onCancel}>
      <div className="bg-white dark:bg-dark-popup rounded-lg shadow-xl w-full max-w-md animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/20 sm:mx-0 sm:h-10 sm:w-10">
              <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                Deactivate Organization
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Are you sure you want to deactivate <span className="font-semibold">{organization.name}</span>?
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-dark-elevated rounded-b-lg flex justify-end space-x-3">
          <button onClick={onCancel} type="button" className="px-4 py-2 bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-elevated rounded-md text-sm font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-dark-elevated">
            Cancel
          </button>
          <button onClick={onConfirm} type="button" className="px-4 py-2 bg-yellow-500 border border-transparent rounded-md text-sm font-medium text-white hover:bg-yellow-600">
            Deactivate
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeactivateOrganizationModal;