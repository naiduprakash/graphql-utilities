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
    <div className={cn('inline-flex items-center', className)}>
      <button
        onClick={onToggle}
        className="relative inline-flex h-8 items-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 hover:border-gray-400 dark:hover:border-gray-500 shadow-sm flex-shrink-0"
        type="button"
      >
        {/* Background slider - positioned behind active option */}
        <div
          className={cn(
            'absolute top-0.5 bottom-0.5 left-0.5 rounded-md bg-primary-600 dark:bg-primary-500 shadow-sm transition-all duration-200 ease-in-out pointer-events-none'
          )}
          style={{
            transform: isRight ? 'translateX(100%)' : 'translateX(0)',
            width: isRight ? 'calc(50% - 2px)' : 'calc(50% - 2px)'
          }}
        />

        {/* Left option */}
        <div className="relative z-10 px-4 py-1">
          <span
            className={cn(
              'text-xs font-semibold transition-colors duration-200 whitespace-nowrap',
              !isRight ? 'text-white' : 'text-gray-600 dark:text-gray-400'
            )}
          >
            {leftLabel}
          </span>
        </div>

        {/* Right option */}
        <div className="relative z-10 px-4 py-1">
          <span
            className={cn(
              'text-xs font-semibold transition-colors duration-200 whitespace-nowrap',
              isRight ? 'text-white' : 'text-gray-600 dark:text-gray-400'
            )}
          >
            {rightLabel}
          </span>
        </div>
      </button>
    </div>
  );
}
