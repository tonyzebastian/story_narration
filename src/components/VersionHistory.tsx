'use client';

import type { StoryVersion } from '@/types';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface VersionHistoryProps {
  versions: StoryVersion[];
  currentVersionId?: string;
  onRevert: (versionId: string) => void;
}

export default function VersionHistory({ versions, currentVersionId, onRevert }: VersionHistoryProps) {
  // Group versions by date
  const groupedVersions = versions
    .slice()
    .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
    .reduce((groups, version) => {
      const date = new Date(version.timestamp);
      const dateKey = date.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(version);
      return groups;
    }, {} as Record<string, StoryVersion[]>);

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('en-GB', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="space-y-4">
      {versions.length === 0 ? (
        <div className="text-sm text-gray-500">No versions yet. Edits will appear here.</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedVersions).map(([date, dateVersions]) => (
            <div key={date} className="space-y-2">
              <div className="text-xs font-medium text-gray-600 border-b border-gray-200 pb-1">
                {date}
              </div>
              <div className="space-y-1">
                {dateVersions.map((version) => (
                  <div 
                    key={version.id} 
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 group transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-900">
                        {formatTime(version.timestamp)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {version.editType}
                      </div>
                    </div>
                    
                    {currentVersionId !== version.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRevert(version.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                        title="Revert to this version"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {currentVersionId === version.id && (
                      <div className="text-xs text-blue-600 font-medium">
                        Current
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


