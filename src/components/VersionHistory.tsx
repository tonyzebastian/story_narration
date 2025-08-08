'use client';

import type { StoryVersion } from '@/types';
import { formatDate } from '@/lib/utils';

interface VersionHistoryProps {
  versions: StoryVersion[];
  currentVersionId?: string;
  onRevert: (versionId: string) => void;
}

export default function VersionHistory({ versions, currentVersionId, onRevert }: VersionHistoryProps) {
  return (
    <div className="border rounded p-4 space-y-3">
      <div className="text-sm font-medium">Version History</div>
      <div className="space-y-2 max-h-64 overflow-auto">
        {versions.length === 0 && (
          <div className="text-sm text-gray-500">No versions yet. Edits will appear here.</div>
        )}
        {versions
          .slice()
          .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
          .map((v) => (
            <div key={v.id} className="flex items-center justify-between gap-2 border rounded p-2">
              <div className="text-sm">
                <div className="font-medium">{v.editType}</div>
                <div className="text-gray-600" suppressHydrationWarning>
                  {formatDate(v.timestamp)}
                </div>
              </div>
              <button
                className="border rounded px-2 py-1 text-xs disabled:opacity-50"
                onClick={() => onRevert(v.id)}
                disabled={currentVersionId === v.id}
              >
                {currentVersionId === v.id ? 'Current' : 'Revert'}
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}


