'use client';

import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900">
            GraphQL Utilities
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            onClick={() => window.location.href = '/query-generation'}
          >
            <span className="text-sm font-medium">Query Generation</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
