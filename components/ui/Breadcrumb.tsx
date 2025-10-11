'use client';

import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center space-x-1 text-sm text-gray-600', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const Icon = item.icon;

        return (
          <div key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-1 text-gray-400" />
            )}
            
            {item.href && !isLast ? (
              <a
                href={item.href}
                className="flex items-center space-x-1 hover:text-gray-900 transition-colors"
              >
                {Icon && <Icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </a>
            ) : (
              <span className={cn(
                'flex items-center space-x-1',
                isLast ? 'text-gray-900 font-medium' : 'text-gray-600'
              )}>
                {Icon && <Icon className="h-4 w-4" />}
                <span>{item.label}</span>
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
