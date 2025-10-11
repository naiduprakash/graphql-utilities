'use client';

import { cn } from '@/lib/utils';

interface ToggleSwitchProps {
  leftLabel: string;
  rightLabel: string;
  isRight: boolean;
  onToggle: () => void;
  className?: string;
}

export function ToggleSwitch({ 
  leftLabel, 
  rightLabel, 
  isRight, 
  onToggle, 
  className 
}: ToggleSwitchProps) {
  return (
    <div className={cn('flex items-center', className)}>
      <button
        onClick={onToggle}
        className="relative inline-flex h-8 sm:h-9 items-center rounded-lg border border-gray-200 bg-gray-50 p-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:bg-gray-100 min-w-fit"
        style={{ minWidth: 'max-content' }}
      >
        {/* Background slider */}
        <div
          className={cn(
            'absolute top-0.5 bottom-0.5 rounded-md bg-white shadow-sm border border-gray-200 transition-all duration-200 ease-in-out',
            isRight ? 'translate-x-full' : 'translate-x-0'
          )}
          style={{ 
            width: 'calc(50% - 2px)',
            left: '2px'
          }}
        />

        {/* Left option */}
        <div className="relative z-10 flex items-center justify-center py-1 px-1 sm:px-2 min-w-0">
          <span
            className={cn(
              'text-xs font-medium transition-colors duration-200 whitespace-nowrap',
              !isRight ? 'text-gray-900' : 'text-gray-500'
            )}
          >
            {leftLabel}
          </span>
        </div>

        {/* Right option */}
        <div className="relative z-10 flex items-center justify-center py-1 px-1 sm:px-2 min-w-0">
          <span
            className={cn(
              'text-xs font-medium transition-colors duration-200 whitespace-nowrap',
              isRight ? 'text-gray-900' : 'text-gray-500'
            )}
          >
            {rightLabel}
          </span>
        </div>
      </button>
    </div>
  );
}
