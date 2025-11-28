import React from 'react';
import { SavedVersion } from '../types';

interface VersionHistoryProps {
  versions: SavedVersion[];
  onLoad: (version: SavedVersion) => void;
  onDelete: (id: string) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({ versions, onLoad, onDelete }) => {
  if (versions.length === 0) {
    return (
      <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg">
        <p className="text-slate-400 text-xs italic">No saved versions yet.</p>
        <p className="text-slate-300 text-[10px] mt-1">Snapshots appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
      {versions.map((v) => (
        <div key={v.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-md bg-white hover:bg-slate-50 transition-colors shadow-sm">
          <div className="overflow-hidden flex-1 mr-2">
            <h4 className="text-sm font-semibold text-slate-700 truncate" title={v.name}>{v.name}</h4>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500">
                {new Date(v.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {v.files.length} files • {v.projectSettings.estType}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onLoad(v)}
              className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1.5 rounded hover:bg-indigo-100 font-medium transition-colors"
              title="Restore this version"
            >
              Restore
            </button>
            <button
              onClick={() => onDelete(v.id)}
              className="text-slate-400 hover:text-red-500 p-1 transition-colors"
              title="Delete"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};